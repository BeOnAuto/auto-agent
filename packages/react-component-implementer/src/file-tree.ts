import type { Dirent } from 'node:fs';

export interface FileTreeDeps {
  readdir: (path: string, options: { withFileTypes: true }) => Promise<Dirent[]>;
}

export async function scanFileTree(dirPath: string, deps: FileTreeDeps): Promise<string> {
  const entries = await deps.readdir(dirPath, { withFileTypes: true });
  const names = entries
    .filter((e) => {
      if (e.isFile() && e.name.endsWith('.stories.tsx')) return false;
      return true;
    })
    .map((e) => (e.isDirectory() ? `${e.name}/` : e.name))
    .sort();
  return names.join('\n');
}
