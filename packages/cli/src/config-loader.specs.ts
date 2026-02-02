import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { type AutoConfig, loadAutoConfig } from './config-loader.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.join(__dirname, '__fixtures__');

describe('loadAutoConfig', () => {
  it('loads config with root field', async () => {
    const configPath = path.join(fixturesDir, 'auto.config.ts');

    const config = await loadAutoConfig(configPath);

    expect(config).toMatchObject({
      plugins: expect.any(Array),
    });
  });

  it('defaults fileSync.dir to narratives when not specified', async () => {
    const configPath = path.join(fixturesDir, 'auto.config.ts');

    const config = await loadAutoConfig(configPath);

    expect(config.fileSync.dir).toBe('narratives');
  });

  it('uses fileSync.dir from config when specified', async () => {
    const configPath = path.join(fixturesDir, 'auto-with-custom-sync-dir.config.ts');

    const config = await loadAutoConfig(configPath);

    expect(config.fileSync.dir).toBe('./custom-sync-dir');
  });
});

describe('AutoConfig interface', () => {
  it('accepts root field', () => {
    const config: AutoConfig = {
      fileId: 'test',
      plugins: [],
      root: '.',
    };

    expect(config.root).toBe('.');
  });
});
