import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import createDebug from 'debug';

const debug = createDebug('auto:generate-react-client:copy-starter');

const SKIP = new Set(['node_modules', 'pnpm-lock.yaml', '.DS_Store']);

async function copyDir(src: string, dest: string): Promise<number> {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  let count = 0;

  for (const entry of entries) {
    if (SKIP.has(entry.name)) continue;

    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      count += await copyDir(srcPath, destPath);
    } else if (entry.isFile()) {
      await fs.copyFile(srcPath, destPath);
      count++;
    }
  }

  return count;
}

export async function copyStarter(starterDir: string, targetDir: string): Promise<number> {
  const src = path.isAbsolute(starterDir) ? starterDir : path.resolve(process.cwd(), starterDir);
  const dest = path.isAbsolute(targetDir) ? targetDir : path.resolve(process.cwd(), targetDir);

  debug('Copying starter from %s to %s', src, dest);

  await fs.rm(dest, { recursive: true, force: true });
  const fileCount = await copyDir(src, dest);

  debug('Copied %d files to %s', fileCount, dest);
  return fileCount;
}
