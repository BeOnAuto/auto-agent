import { access } from 'node:fs/promises';
import path from 'node:path';
import { execa } from 'execa';

const inflightInstalls = new Map<string, Promise<void>>();

export async function ensureInstalled(dir: string, debug: (...args: unknown[]) => void): Promise<void> {
  const resolved = path.resolve(dir);

  try {
    await access(path.join(resolved, 'node_modules'));
    debug('node_modules already exists in %s', resolved);
    return;
  } catch {
    // node_modules missing, need to install
  }

  const existing = inflightInstalls.get(resolved);
  if (existing) {
    debug('pnpm install already in progress for %s, waiting...', resolved);
    await existing;
    return;
  }

  const installPromise = (async () => {
    debug('node_modules missing, running pnpm install --ignore-workspace in %s', resolved);
    await execa('pnpm', ['install', '--ignore-workspace'], { cwd: resolved, stdio: 'inherit' });
    debug('pnpm install completed for %s', resolved);
  })();

  inflightInstalls.set(resolved, installPromise);

  try {
    await installPromise;
  } finally {
    inflightInstalls.delete(resolved);
  }
}
