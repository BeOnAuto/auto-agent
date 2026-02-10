import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import createDebug from 'debug';

const debug = createDebug('auto:generate-react-client:builder');

export class StarterBuilder {
  private files: Map<string, Buffer> = new Map();

  async cloneStarter(starterDir: string): Promise<this> {
    debug('Cloning starter from: %s', starterDir);
    const resolved = path.isAbsolute(starterDir) ? starterDir : path.resolve(process.cwd(), starterDir);
    await this.collectFiles(resolved, '');
    debug('Collected %d files', this.files.size);
    return this;
  }

  private async collectFiles(dir: string, relative: string) {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const absPath = path.join(dir, entry.name);
      const relPath = path.join(relative, entry.name);

      if (entry.name === 'node_modules' || entry.name === 'pnpm-lock.yaml') {
        continue;
      }

      if (entry.isDirectory()) {
        await this.collectFiles(absPath, relPath);
      } else if (entry.isFile()) {
        const content = await fs.readFile(absPath);
        this.files.set(relPath, content);
      }
    }
  }

  async build(outputDir: string): Promise<void> {
    debug('Building to: %s', outputDir);

    if (!this.files.size) {
      throw new Error('No starter files loaded. Call cloneStarter() first.');
    }

    await fs.rm(outputDir, { recursive: true, force: true });
    await fs.mkdir(outputDir, { recursive: true });

    for (const [relPath, content] of this.files.entries()) {
      const outPath = path.join(outputDir, relPath);
      await fs.mkdir(path.dirname(outPath), { recursive: true });
      await fs.writeFile(outPath, content);
    }

    debug('Wrote %d files to %s', this.files.size, outputDir);
  }
}
