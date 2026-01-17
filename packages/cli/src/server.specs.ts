import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';
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

  it('calls onPipelineActivity callback when command is dispatched', async () => {
    const configPath = path.join(fixturesDir, 'auto.config.ts');
    const onPipelineActivity = vi.fn();

    handle = await startServer({
      port: 0,
      configPath,
      onPipelineActivity,
    });

    const response = await fetch(`http://localhost:${handle.actualPort}/command`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'TestCommand',
        data: { foo: 'bar' },
      }),
    });

    expect(response.status).toBe(404);
    expect(onPipelineActivity).toHaveBeenCalledWith('pipeline:command:TestCommand');
  });
});
