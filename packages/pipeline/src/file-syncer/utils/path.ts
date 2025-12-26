import path from 'node:path';

export const posix = (p: string): string => p.split(path.sep).join('/');

const wirePathToAbsCache = new Map<string, string>();

function cacheWireMapping(wirePath: string, absPath: string): void {
  if (wirePath.startsWith('/.external/')) {
    wirePathToAbsCache.set(wirePath, absPath);
  }
}

export function rebuildWirePathCache(files: Array<{ abs: string; projectRoot: string }>): void {
  wirePathToAbsCache.clear();
  for (const { abs, projectRoot } of files) {
    toWirePath(abs, projectRoot);
  }
}

export function toWirePath(abs: string, projectRoot: string): string {
  const rel = path.relative(projectRoot, abs);
  if (rel.startsWith('..')) {
    const nodeModulesMatch = abs.match(/.*\/node_modules\/(.*)/);
    if (nodeModulesMatch) {
      let modulePath = nodeModulesMatch[1];
      modulePath = modulePath.replace(/\/\.\//g, '/').replace(/^\.\//, '');
      const wire = `/.external/node_modules/${modulePath}`.split(path.sep).join('/');
      cacheWireMapping(wire, abs);
      return wire;
    }

    const hash = Buffer.from(abs)
      .toString('base64')
      .replace(/[^a-zA-Z0-9]/g, '')
      .substring(0, 16);
    const fileName = path.basename(abs);
    const wire = `/.external/other/${hash}_${fileName}`;
    cacheWireMapping(wire, abs);
    return wire;
  }

  return `/${rel}`.split(path.sep).join('/');
}

export function fromWirePath(wirePath: string, projectRoot: string): string {
  if (wirePath.startsWith('/.external/')) {
    const cached = wirePathToAbsCache.get(wirePath);
    if (cached !== undefined) {
      return cached;
    }
    return path.join(projectRoot, wirePath.substring(1));
  }

  const relativePath = wirePath.startsWith('/') ? wirePath.substring(1) : wirePath;
  return path.join(projectRoot, relativePath);
}

export function sample<T>(arr: T[], n = 5): T[] {
  return arr.slice(0, n);
}

export function uniq<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}

export function dirOf(p: string): string {
  const norm = p.replace(/\\/g, '/');
  return norm.slice(0, norm.lastIndexOf('/')) || '/';
}

export function pkgNameFromPath(p: string): string | null {
  const m = p.replace(/\\/g, '/').match(/\/node_modules\/((@[^/]+\/)?[^/]+)/);
  return m ? m[1] : null;
}

export function scorePathForDedupe(p: string): number {
  let s = 0;
  const pathPosix = p.replace(/\\/g, '/');
  if (pathPosix.includes('/server/node_modules/')) s -= 10;
  if (!pathPosix.includes('/.pnpm/')) s -= 3;
  if (pathPosix.includes('/node_modules/')) s -= 1;
  s += pathPosix.length / 1000;
  return s;
}
