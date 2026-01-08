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

  it('returns a ServerHandle with single port for both HTTP and WebSocket', async () => {
    const configPath = path.join(fixturesDir, 'auto.config.ts');

    handle = await startServer({
      port: 0,
      configPath,
    });

    expect(handle.actualPort).toBeGreaterThan(0);
    expect(handle.stop).toBeTypeOf('function');
    expect(handle.fileSyncer.stop).toBeTypeOf('function');
    expect(handle.httpServer.close).toBeTypeOf('function');
  });
});
