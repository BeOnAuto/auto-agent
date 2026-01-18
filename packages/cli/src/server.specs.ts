import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { type Socket as ClientSocket, io as ioClient } from 'socket.io-client';
import { afterEach, describe, expect, it } from 'vitest';
import { type ServerHandle, startServer } from './server.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.join(__dirname, '__fixtures__');

describe('startServer', () => {
  let handle: ServerHandle | null = null;
  let clientSocket: ClientSocket | null = null;

  afterEach(async () => {
    if (clientSocket) {
      clientSocket.disconnect();
      clientSocket = null;
    }
    if (handle) {
      await handle.stop();
      handle = null;
    }
  });

  it('onPreSuspend sends worker:suspending to connected clients', async () => {
    const configPath = path.join(fixturesDir, 'auto.config.ts');

    handle = await startServer({
      port: 0,
      configPath,
    });

    const receivedEvents: string[] = [];
    clientSocket = ioClient(`http://localhost:${handle.actualPort}`, {
      path: '/file-sync',
      autoConnect: true,
    });

    await new Promise<void>((resolve) => {
      clientSocket.on('connect', resolve);
    });

    clientSocket.on('worker:suspending', () => {
      receivedEvents.push('worker:suspending');
    });

    handle.onPreSuspend();

    await new Promise((r) => setTimeout(r, 50));

    expect(receivedEvents).toEqual(['worker:suspending']);
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

  it('exposes messageBus that receives events from command handlers', async () => {
    const configPath = path.join(fixturesDir, 'auto-with-commands.config.ts');
    const events: { type: string }[] = [];

    handle = await startServer({
      port: 0,
      configPath,
    });

    handle.messageBus.subscribeAll({
      name: 'TestSubscriber',
      handle: async (event) => {
        events.push({ type: event.type });
      },
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

    expect(events).toContainEqual({ type: 'ConfigCommandDone' });
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
