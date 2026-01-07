import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { type ServerHandle, startServer } from './server.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.join(__dirname, '__fixtures__');

describe('startServer', () => {
  let handle: ServerHandle | null = null;

  afterEach(async () => {
    if (handle) {
      await handle.stop();
      handle = null;
    }
  });

  it('returns a ServerHandle with ports and stop function', async () => {
    const configPath = path.join(fixturesDir, 'auto.config.ts');

    handle = await startServer({
      port: 0,
      configPath,
    });

    expect(handle.actualPort).toBeGreaterThan(0);
    expect(handle.syncPort).toBeGreaterThan(0);
    expect(handle.syncPort).not.toBe(handle.actualPort);
    expect(typeof handle.stop).toBe('function');
    expect(handle.fileSyncer).toBeDefined();
    expect(handle.httpServer).toBeDefined();
  });
});
