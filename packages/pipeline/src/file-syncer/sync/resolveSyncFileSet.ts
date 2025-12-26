import type { NodeFileStore } from '@auto-engineer/file-store/node';
import { collectBareImportsFromFiles } from '../discovery/bareImports';
import { nmRootsForBases, probeEntryDtsForPackagesFromRoots } from '../discovery/dts';
import { dirOf, pkgNameFromPath, scorePathForDedupe, uniq } from '../utils/path';

function flattenPaths(x: string[] | Record<string, string[]> | undefined): string[] {
  if (!x) return [];
  if (Array.isArray(x)) return x;
  return Object.values(x).flat();
}

function stableCandidateNmRoots(projectRoot: string): string[] {
  const roots = new Set<string>();
  let cur = projectRoot.replace(/\\/g, '/');

  for (let i = 0; i < 8; i++) {
    roots.add(`${cur}/node_modules`);
    const parent = cur.replace(/\/+$/, '').split('/').slice(0, -1).join('/') || '/';
    if (parent === cur) break;
    cur = parent;
  }
  roots.add(`${projectRoot}/server/node_modules`);
  return [...roots].map((p) => p.replace(/\/+/g, '/'));
}

interface NarrativeResult {
  vfsFiles: string[];
  externals: string[];
  typings: Record<string, string[]>;
}

function isNarrativeModule(mod: unknown): mod is {
  getNarratives: (opts: { vfs: NodeFileStore; root: string }) => Promise<NarrativeResult>;
} {
  if (typeof mod !== 'object' || mod === null) {
    return false;
  }
  if (!('getNarratives' in mod)) {
    return false;
  }
  const modWithMethod = mod as Record<string, unknown>;
  return typeof modWithMethod.getNarratives === 'function';
}

function dedupeTypeDefinitionsByPackage(allDts: string[]): string[] {
  const bestByPkg = new Map<string, string>();
  for (const p of allDts) {
    const pkg = pkgNameFromPath(p);
    if (pkg === null) continue;
    const prev = bestByPkg.get(pkg);
    if (prev === undefined || scorePathForDedupe(p) < scorePathForDedupe(prev)) {
      bestByPkg.set(pkg, p);
    }
  }
  return [...bestByPkg.values()];
}

export async function resolveSyncFileSet(opts: {
  vfs: NodeFileStore;
  watchDir: string;
  projectRoot: string;
}): Promise<Set<string>> {
  const { vfs, watchDir, projectRoot } = opts;
  try {
    let flows: NarrativeResult | null = null;
    try {
      const flowPackage = '@auto-engineer/narrative';
      const flowModule: unknown = await import(flowPackage);
      if (isNarrativeModule(flowModule)) {
        flows = await flowModule.getNarratives({ vfs, root: watchDir });
      }
    } catch {
      // narrative package not available
    }

    const files = flows?.vfsFiles ?? [];
    const baseDirs = uniq([projectRoot, ...files.map(dirOf)]);
    const dynamicRoots = nmRootsForBases(baseDirs);
    const fallbackRoots = stableCandidateNmRoots(projectRoot);
    const nmRoots = uniq([...dynamicRoots, ...fallbackRoots]);

    const externalsFromFlows = flows?.externals ?? [];
    const extraPkgs = await collectBareImportsFromFiles(files, vfs);
    const externals = Array.from(new Set([...externalsFromFlows, ...extraPkgs]));
    const dtsFromGraph = flows !== null ? flattenPaths(flows.typings) : [];
    const dtsFromProbe = await probeEntryDtsForPackagesFromRoots(vfs, nmRoots, externals);

    const allDts = Array.from(new Set([...dtsFromGraph, ...dtsFromProbe]));
    allDts.sort((a, b) => {
      const pa = a.includes('/.pnpm/') ? 1 : 0;
      const pb = b.includes('/.pnpm/') ? 1 : 0;
      if (pa !== pb) return pa - pb;
      return a.length - b.length;
    });

    const dts = dedupeTypeDefinitionsByPackage(allDts);

    return new Set<string>([...files, ...dts]);
  } catch {
    return new Set<string>();
  }
}
