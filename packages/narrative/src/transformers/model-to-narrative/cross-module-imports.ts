import type { Model, Module } from '../../index';
import { basename, dirname, extname, join, relative } from '../../loader/fs-path';
import { parseMessageKey, sortImportsBySource, toMessageKey } from './ordering';
import { collectMessageKeysFromNarratives } from './spec-traversal';
import type { CrossModuleImport } from './types';

export type { CrossModuleImport };

export function computeCrossModuleImports(module: Module, allModules: Module[], model: Model): CrossModuleImport[] {
  if (module.isDerived) {
    return [];
  }

  const declaredKeys = new Set(module.declares.messages.map((m) => toMessageKey(m.kind, m.name)));
  const usedKeys = collectUsedMessageKeysForModule(module, model);
  const neededKeys = new Set([...usedKeys].filter((k) => !declaredKeys.has(k)));

  if (neededKeys.size === 0) {
    return [];
  }

  const importsByModule = new Map<string, string[]>();

  for (const msgKey of neededKeys) {
    const { name } = parseMessageKey(msgKey);
    const declaringModule = findDeclaringModule(msgKey, allModules, module);

    if (declaringModule) {
      const modulePath = declaringModule.sourceFile;
      if (!importsByModule.has(modulePath)) {
        importsByModule.set(modulePath, []);
      }
      importsByModule.get(modulePath)!.push(name);
    }
  }

  const imports: CrossModuleImport[] = [];
  for (const [modulePath, typeNames] of importsByModule) {
    const relativePath = resolveRelativeImport(module.sourceFile, modulePath);
    imports.push({ fromPath: relativePath, typeNames });
  }

  return sortImportsBySource(imports);
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
