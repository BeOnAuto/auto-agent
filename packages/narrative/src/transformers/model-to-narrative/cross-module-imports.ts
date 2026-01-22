import type { Model, Module } from '../../index';
import { basename, dirname, extname, join, relative } from '../../loader/fs-path';
import { parseMessageKey, sortImportsBySource, toMessageKey } from './ordering';
import { collectMessageKeysFromNarratives } from './spec-traversal';
import type { CrossModuleImport } from './types';

export type { CrossModuleImport };

/**
 * Computes cross-module imports for a single module.
 * Returns the list of imports needed (with relative paths).
 */
export function computeCrossModuleImports(module: Module, allModules: Module[], model: Model): CrossModuleImport[] {
  const dependencyMap = computeModuleDependencies(module, allModules, model);
  if (!dependencyMap) {
    return [];
  }
  return convertToImports(module.sourceFile, dependencyMap);
}

/**
 * Computes cross-module imports for all modules and derives which types need to be exported.
 * Returns both the imports per module and the exports per module in a single pass.
 */
export function computeAllCrossModuleDependencies(
  modules: Module[],
  model: Model,
): {
  importsPerModule: Map<string, CrossModuleImport[]>;
  exportsPerModule: Map<string, Set<string>>;
} {
  const importsPerModule = new Map<string, CrossModuleImport[]>();
  const exportsPerModule = new Map<string, Set<string>>();

  for (const module of modules) {
    const dependencyMap = computeModuleDependencies(module, modules, model);

    if (!dependencyMap) {
      importsPerModule.set(module.sourceFile, []);
      continue;
    }

    // Convert to imports with relative paths
    importsPerModule.set(module.sourceFile, convertToImports(module.sourceFile, dependencyMap));

    // Track which types need to be exported from each declaring module
    for (const [declaringSourceFile, typeNames] of dependencyMap) {
      if (!exportsPerModule.has(declaringSourceFile)) {
        exportsPerModule.set(declaringSourceFile, new Set());
      }
      for (const typeName of typeNames) {
        exportsPerModule.get(declaringSourceFile)!.add(typeName);
      }
    }
  }

  return { importsPerModule, exportsPerModule };
}

export function resolveRelativeImport(fromPath: string, toPath: string): string {
  const fromDir = dirname(fromPath);
  const toDir = dirname(toPath);
  const toFile = basename(toPath, extname(toPath));

  const relativePath = relative(fromDir, toDir);
  if (relativePath === '') {
    return `./${toFile}`;
  }
  if (!relativePath.startsWith('.')) {
    return `./${relativePath}/${toFile}`;
  }

  return join(relativePath, toFile);
}

/**
 * Core logic: computes which types a module needs from other modules.
 * Returns a map of declaringModuleSourceFile -> typeNames[], or null if no dependencies.
 */
function computeModuleDependencies(module: Module, allModules: Module[], model: Model): Map<string, string[]> | null {
  if (module.isDerived) {
    return null;
  }

  const declaredKeys = new Set(module.declares.messages.map((m) => toMessageKey(m.kind, m.name)));
  const usedKeys = collectUsedMessageKeysForModule(module, model);
  const neededKeys = new Set([...usedKeys].filter((k) => !declaredKeys.has(k)));

  if (neededKeys.size === 0) {
    return null;
  }

  const dependencyMap = new Map<string, string[]>();

  for (const msgKey of neededKeys) {
    const { name } = parseMessageKey(msgKey);
    const declaringModule = findDeclaringModule(msgKey, allModules, module);

    if (declaringModule) {
      const modulePath = declaringModule.sourceFile;
      if (!dependencyMap.has(modulePath)) {
        dependencyMap.set(modulePath, []);
      }
      dependencyMap.get(modulePath)!.push(name);
    }
  }

  return dependencyMap.size > 0 ? dependencyMap : null;
}

/**
 * Converts a dependency map (absolute paths) to CrossModuleImport[] (relative paths).
 */
function convertToImports(fromSourceFile: string, dependencyMap: Map<string, string[]>): CrossModuleImport[] {
  const imports: CrossModuleImport[] = [];

  for (const [modulePath, typeNames] of dependencyMap) {
    const relativePath = resolveRelativeImport(fromSourceFile, modulePath);
    imports.push({ fromPath: relativePath, typeNames });
  }

  return sortImportsBySource(imports);
}

function collectUsedMessageKeysForModule(module: Module, model: Model): Set<string> {
  const narrativeIds = new Set(module.contains.narrativeIds);
  const narratives = model.narratives.filter((n) => n.id && narrativeIds.has(n.id));

  const usedKeys = collectMessageKeysFromNarratives(narratives);

  const modelKeys = new Set(model.messages.map((m) => toMessageKey(m.type, m.name)));
  return new Set([...usedKeys].filter((k) => modelKeys.has(k)));
}

function findDeclaringModule(messageKey: string, allModules: Module[], currentModule: Module): Module | undefined {
  const authoredModules = allModules.filter((m) => !m.isDerived && m.sourceFile !== currentModule.sourceFile);

  for (const mod of authoredModules) {
    const declares = mod.declares.messages.some((m) => toMessageKey(m.kind, m.name) === messageKey);
    if (declares) {
      return mod;
    }
  }

  return undefined;
}
