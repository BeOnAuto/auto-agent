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

  it('calls onEvent callback when command handler emits events', async () => {
    const configPath = path.join(fixturesDir, 'auto-with-commands.config.ts');
    const onEvent = vi.fn();

    handle = await startServer({
      port: 0,
      configPath,
      onEvent,
    });

    await fetch(`http://localhost:${handle.actualPort}/command`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'ConfigCommand',
        data: {},
      }),
    });

    await new Promise((r) => setTimeout(r, 100));

    expect(onEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'ConfigCommandDone',
      }),
    );
  });

  it('loads COMMANDS from config file and registers them as handlers', async () => {
    const configPath = path.join(fixturesDir, 'auto-with-commands.config.ts');

    handle = await startServer({
      port: 0,
      configPath,
    });

    const response = await fetch(`http://localhost:${handle.actualPort}/command`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'ConfigCommand',
        data: {},
      }),
    });

    expect(response.status).toBe(200);
  });
});
