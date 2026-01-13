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
