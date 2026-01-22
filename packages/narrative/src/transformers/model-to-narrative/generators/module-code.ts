import ts from 'typescript';
import type { Model, Module } from '../../../index';
import { deriveModules } from '../../narrative-to-model/derive-modules';
import { analyzeCodeUsage } from '../analysis/usage';
import { computeAllCrossModuleDependencies } from '../cross-module-imports';
import { sortFilesByPath } from '../ordering';
import type { CrossModuleImport, GeneratedFile } from '../types';
import { extractTypeIntegrationNames } from '../utils/integration-extractor';
import { integrationNameToPascalCase } from '../utils/strings';
import { buildFlowStatements } from './flow';
import { ALL_FLOW_FUNCTION_NAMES, buildImports } from './imports';
import { buildTypeAliases } from './types';

interface GenerateModuleCodeOptions {
  flowImport: string;
  integrationImport: string;
}

export type { GeneratedFile };

export function generateAllModulesCode(model: Model, opts: GenerateModuleCodeOptions): GeneratedFile[] {
  const modules =
    model.modules && model.modules.length > 0 ? model.modules : deriveModules(model.narratives, model.messages);

  // Compute all cross-module dependencies in a single pass
  const { importsPerModule, exportsPerModule } = computeAllCrossModuleDependencies(modules, model);

  const files: GeneratedFile[] = [];

  for (const module of modules) {
    const crossModuleImports = importsPerModule.get(module.sourceFile) ?? [];
    const exportedTypes = exportsPerModule.get(module.sourceFile);
    const code = generateModuleCode(module, model, opts, crossModuleImports, exportedTypes);
    files.push({
      path: module.sourceFile,
      code,
    });
  }

  return sortFilesByPath(files);
}

function getNarrativesForModule(module: Module, model: Model): Model['narratives'] {
  if (module.isDerived) {
    return model.narratives.filter((n) => {
      const narrativeSourceFile = n.sourceFile ?? 'generated.narrative.ts';
      return narrativeSourceFile === module.sourceFile;
    });
  }

  const narrativeIds = new Set(module.contains.narrativeIds);
  return model.narratives.filter((n) => n.id && narrativeIds.has(n.id));
}

function generateModuleCode(
  module: Module,
  model: Model,
  opts: GenerateModuleCodeOptions,
  crossModuleImports: CrossModuleImport[],
  exportedTypes?: Set<string>,
): string {
  const f = ts.factory;

  const narratives = getNarrativesForModule(module, model);
  const declaredMessageKeys = new Set(module.declares.messages.map((m) => `${m.kind}:${m.name}`));
  const messages = model.messages.filter((m) => declaredMessageKeys.has(`${m.type}:${m.name}`));
  const integrations = model.integrations ?? [];

  const allTypeIntegrationNames = extractTypeIntegrationNames(narratives);
  const allValueIntegrationNames = integrations.map((integration) => integrationNameToPascalCase(integration.name));

  const allFlowFunctionNames = [...ALL_FLOW_FUNCTION_NAMES];
  const preliminaryStatements = buildStatements(
    ts,
    opts,
    messages,
    allTypeIntegrationNames,
    allValueIntegrationNames,
    allFlowFunctionNames,
    narratives,
    [],
  );
  const preliminaryFile = f.createSourceFile(
    preliminaryStatements,
    f.createToken(ts.SyntaxKind.EndOfFileToken),
    ts.NodeFlags.None,
  );
  const printer = ts.createPrinter({
    newLine: ts.NewLineKind.LineFeed,
    removeComments: false,
    omitTrailingSemicolon: false,
  });
  const preliminaryCode = printer.printFile(preliminaryFile);

  const allTypeNames = messages.map((msg) => msg.name);
  const usageAnalysis = analyzeCodeUsage(
    preliminaryCode,
    allTypeNames,
    allTypeIntegrationNames,
    allValueIntegrationNames,
    allFlowFunctionNames,
  );

  const usedTypeIntegrationNames = allTypeIntegrationNames.filter((name) => usageAnalysis.usedTypes.has(name));
  const usedValueIntegrationNames = allValueIntegrationNames.filter((name) => usageAnalysis.usedIntegrations.has(name));
  const usedFlowFunctionNames = Array.from(usageAnalysis.usedFlowFunctions);

  const usedMessages = messages.filter((msg) => {
    const isImportedFromIntegration = usedTypeIntegrationNames.includes(msg.name);

    // Don't generate local definitions for types imported from integrations
    if (isImportedFromIntegration) {
      return false;
    }

    // For authored modules, trust the declares list - all declared messages should be generated
    // (messages is already filtered to only include declared messages at line 60-61)
    if (!module.isDerived) {
      return true;
    }

    // For derived modules, only include types that are actually used in flow code
    // or when there's no flow code (hasEmptyFlowSlices)
    const isUsedInFlow = usageAnalysis.usedTypes.has(msg.name);
    const hasEmptyFlowSlices = narratives.length === 0 || narratives.every((flow) => flow.slices.length === 0);
    return isUsedInFlow || hasEmptyFlowSlices;
  });

  const statements = buildStatements(
    ts,
    opts,
    usedMessages,
    usedTypeIntegrationNames,
    usedValueIntegrationNames,
    usedFlowFunctionNames,
    narratives,
    crossModuleImports,
    exportedTypes,
  );

  const file = f.createSourceFile(statements, f.createToken(ts.SyntaxKind.EndOfFileToken), ts.NodeFlags.None);

  return printer.printFile(file);
}

function buildStatements(
  tsModule: typeof ts,
  opts: GenerateModuleCodeOptions,
  messages: Model['messages'],
  typeIntegrationNames: string[],
  valueIntegrationNames: string[],
  usedFlowFunctionNames: string[],
  flows: Model['narratives'],
  crossModuleImports: CrossModuleImport[],
  exportedTypes?: Set<string>,
): ts.Statement[] {
  const f = tsModule.factory;
  const statements: ts.Statement[] = [];

  const imports = buildImports(
    tsModule,
    opts,
    messages,
    typeIntegrationNames,
    valueIntegrationNames,
    usedFlowFunctionNames,
  );
  if (imports.importFlowValues !== null) statements.push(imports.importFlowValues);
  if (imports.importFlowTypes !== null) statements.push(imports.importFlowTypes);
  if (imports.importIntegrationValues !== null) statements.push(imports.importIntegrationValues);
  if (imports.importIntegrationTypes !== null) statements.push(imports.importIntegrationTypes);

  for (const imp of crossModuleImports) {
    const isTypeOnly = true;
    const importClause = f.createImportClause(
      isTypeOnly,
      undefined,
      f.createNamedImports(
        imp.typeNames.map((name) => f.createImportSpecifier(false, undefined, f.createIdentifier(name))),
      ),
    );
    const importDecl = f.createImportDeclaration(undefined, importClause, f.createStringLiteral(imp.fromPath));
    statements.push(importDecl);
  }

  const adaptedMessages = messages.map((msg) => ({
    type: msg.type,
    name: msg.name,
    fields: msg.fields.map((field) => ({
      name: field.name,
      type: field.type,
      required: field.required,
    })),
  }));
  statements.push(...buildTypeAliases(tsModule, adaptedMessages, exportedTypes));

  for (const flow of flows) {
    statements.push(...buildFlowStatements(tsModule, flow, messages));
  }

  return statements;
}
