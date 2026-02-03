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

  it('onPreShutdown sends worker:shutdown to connected clients', async () => {
    const configPath = path.join(fixturesDir, 'auto.config.ts');

    handle = await startServer({
      port: 0,
      configPath,
    });

    const receivedEvents: string[] = [];
    const socket = ioClient(`http://localhost:${handle.actualPort}`, {
      path: '/file-sync',
      autoConnect: true,
    });
    clientSocket = socket;

    await new Promise<void>((resolve) => {
      socket.on('connect', resolve);
    });

    socket.on('worker:shutdown', () => {
      receivedEvents.push('worker:shutdown');
    });

    handle.onPreShutdown();

    await new Promise((r) => setTimeout(r, 50));

    expect(receivedEvents).toEqual(['worker:shutdown']);
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

  it('defaults watchDir to narratives subdirectory', async () => {
    const configPath = path.join(fixturesDir, 'auto.config.ts');

    handle = await startServer({
      port: 0,
      configPath,
    });

    const socket = ioClient(`http://localhost:${handle.actualPort}`, {
      path: '/file-sync',
      autoConnect: true,
    });
    clientSocket = socket;

    const initialSync = await new Promise<{ directory: string }>((resolve) => {
      socket.on('initial-sync', resolve);
    });

    expect(initialSync.directory).toBe(path.join(fixturesDir, 'narratives'));
  });

  it('uses fileSync.dir from config when specified', async () => {
    const configPath = path.join(fixturesDir, 'auto-with-custom-sync-dir.config.ts');

    handle = await startServer({
      port: 0,
      configPath,
    });

    const socket = ioClient(`http://localhost:${handle.actualPort}`, {
      path: '/file-sync',
      autoConnect: true,
    });
    clientSocket = socket;

    const initialSync = await new Promise<{ directory: string }>((resolve) => {
      socket.on('initial-sync', resolve);
    });

    expect(initialSync.directory).toBe(path.join(fixturesDir, 'custom-sync-dir'));
  });

  it('resetFileSyncer creates a fresh FileSyncer instance without handler accumulation', async () => {
    const configPath = path.join(fixturesDir, 'auto.config.ts');

    handle = await startServer({
      port: 0,
      configPath,
    });

    const originalFileSyncer = handle.fileSyncer;

    const newFileSyncer = await handle.resetFileSyncer();

    expect(newFileSyncer).not.toBe(originalFileSyncer);
    expect(handle.fileSyncer).toBe(newFileSyncer);

    const socket = ioClient(`http://localhost:${handle.actualPort}`, {
      path: '/file-sync',
      autoConnect: true,
      reconnection: false,
      timeout: 2000,
    });
    clientSocket = socket;

    socket.on('connect_error', (err) => {
      console.error('Connect error:', err.message);
    });

    const initialSync = await new Promise<{ directory: string }>((resolve, reject) => {
      socket.on('connect_error', reject);
      socket.on('initial-sync', resolve);
    });

    expect(initialSync.directory).toBe(path.join(fixturesDir, 'narratives'));
  });
});
