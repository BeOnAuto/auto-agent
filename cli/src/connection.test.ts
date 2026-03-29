import { EventEmitter } from 'node:events';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ConnectionManager } from './connection.js';
import { ModelPersistence } from './persistence.js';

let lastFakeWs: EventEmitter & { close: ReturnType<typeof vi.fn>; send: ReturnType<typeof vi.fn> };

vi.mock('ws', () => ({
  default: class extends EventEmitter {
    close = vi.fn();
    send = vi.fn();
    constructor(_url: string) {
      super();
      lastFakeWs = this as unknown as typeof lastFakeWs;
    }
  },
}));

function tick() {
  return new Promise<void>((r) => setImmediate(r));
}

describe('ConnectionManager', () => {
  let tempDir: string;
  let persistence: ModelPersistence;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'conn-test-'));
    persistence = new ModelPersistence(join(tempDir, '.auto-agent', 'model.json'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  function createManager() {
    return new ConnectionManager({
      serverUrl: 'https://example.com',
      apiKey: 'ak_ws1_abc123',
      workspaceId: 'ws1',
      persistence,
    });
  }

  it('starts disconnected', () => {
    expect(createManager().isConnected()).toBe(false);
  });

  it('processMessage writes model to disk on full message', () => {
    const manager = createManager();
    const model = { scenes: [{ id: 's1', name: 'Login' }] };

    manager.processMessage({ type: 'full', model });
    persistence.flush();

    expect(persistence.readModel()).toEqual(model);
  });

  it('processMessage appends changes to disk', () => {
    const manager = createManager();

    manager.processMessage({
      type: 'changes',
      changes: [
        { action: 'added', entityType: 'scene', id: 's1', name: 'Login' },
        { action: 'updated', entityType: 'message', id: 'm1', name: 'CreateUser' },
      ],
    });

    expect(persistence.readAndClearChanges()).toEqual([
      { action: 'added', entityType: 'scene', id: 's1', name: 'Login' },
      { action: 'updated', entityType: 'message', id: 'm1', name: 'CreateUser' },
    ]);
  });

  it('processMessage emits connected on first full message', () => {
    const manager = createManager();
    const events: string[] = [];
    manager.on('connected', () => events.push('connected'));

    manager.processMessage({ type: 'full', model: { x: 1 } });

    expect(events).toEqual(['connected']);
  });

  it('processMessage ignores unknown message types', () => {
    const manager = createManager();

    manager.processMessage({ type: 'unknown' });

    expect(persistence.readModel()).toEqual(null);
    expect(persistence.readAndClearChanges()).toEqual([]);
  });

  it('connect resolves when a full model message arrives', async () => {
    const manager = createManager();
    const connectPromise = manager.connect(5000);
    await tick();

    lastFakeWs.emit('open');
    lastFakeWs.emit('message', Buffer.from(JSON.stringify({ type: 'full', model: { scenes: [] } })));
    await connectPromise;

    expect(manager.isConnected()).toBe(true);
  });

  it('connect rejects on timeout', async () => {
    const manager = createManager();

    await expect(manager.connect(1)).rejects.toThrow('Connection timeout after 1ms');
    expect(manager.isConnected()).toBe(false);
  });

  it('connect rejects on WebSocket error', async () => {
    const manager = createManager();
    manager.on('error', () => {});
    const connectPromise = manager.connect(5000);
    await tick();

    lastFakeWs.emit('error', new Error('ECONNREFUSED'));

    await expect(connectPromise).rejects.toThrow('ECONNREFUSED');
  });

  it('sends hello message with sessionId and name on open', async () => {
    const manager = createManager();
    const connectPromise = manager.connect(5000);
    await tick();

    lastFakeWs.emit('open');
    lastFakeWs.emit('message', Buffer.from(JSON.stringify({ type: 'full', model: {} })));
    await connectPromise;

    const sent = JSON.parse(lastFakeWs.send.mock.calls[0][0] as string);
    expect(sent.type).toBe('hello');
    expect(sent.sessionId).toBe(manager.sessionId);
    expect(sent.name).toBe(manager.name);
  });

  it('has a stable sessionId per instance', () => {
    const manager = createManager();
    expect(manager.sessionId).toMatch(/^[0-9a-f]{24}$/);
    expect(manager.sessionId).toBe(manager.sessionId);
  });

  it('generates unique sessionIds across instances', () => {
    const a = createManager();
    const b = createManager();
    expect(a.sessionId).not.toBe(b.sessionId);
  });

  it('updateEndpoints sends update message when connected', async () => {
    const manager = createManager();
    const connectPromise = manager.connect(5000);
    await tick();

    lastFakeWs.emit('open');
    lastFakeWs.emit('message', Buffer.from(JSON.stringify({ type: 'full', model: {} })));
    await connectPromise;

    lastFakeWs.send.mockClear();
    manager.updateEndpoints([{ label: 'Frontend', url: 'http://localhost:5173' }]);

    const sent = JSON.parse(lastFakeWs.send.mock.calls[0][0] as string);
    expect(sent).toEqual({
      type: 'update',
      endpoints: [{ label: 'Frontend', url: 'http://localhost:5173' }],
    });
  });

  it('updateEndpoints stores endpoints even when not connected', () => {
    const manager = createManager();
    manager.updateEndpoints([{ label: 'Frontend', url: 'http://localhost:5173' }]);
    expect(manager.getEndpoints()).toEqual([{ label: 'Frontend', url: 'http://localhost:5173' }]);
  });

  it('getEndpoints returns current endpoints', async () => {
    const manager = createManager();
    expect(manager.getEndpoints()).toEqual([]);

    const connectPromise = manager.connect(5000);
    await tick();
    lastFakeWs.emit('open');
    lastFakeWs.emit('message', Buffer.from(JSON.stringify({ type: 'full', model: {} })));
    await connectPromise;

    manager.updateEndpoints([
      { label: 'Frontend', url: 'http://localhost:5173' },
      { label: 'Backend', url: 'http://localhost:3000' },
    ]);
    expect(manager.getEndpoints()).toEqual([
      { label: 'Frontend', url: 'http://localhost:5173' },
      { label: 'Backend', url: 'http://localhost:3000' },
    ]);
  });

  it('re-sends endpoints on reconnect', async () => {
    const manager = createManager();
    manager.updateEndpoints([{ label: 'Frontend', url: 'http://localhost:5173' }]);

    const connectPromise = manager.connect(5000);
    await tick();
    lastFakeWs.emit('open');

    const openSendCalls = lastFakeWs.send.mock.calls.map((c: unknown[]) => JSON.parse(c[0] as string));
    expect(openSendCalls).toEqual([
      { type: 'hello', sessionId: manager.sessionId, name: manager.name },
      { type: 'update', endpoints: [{ label: 'Frontend', url: 'http://localhost:5173' }] },
    ]);

    lastFakeWs.emit('message', Buffer.from(JSON.stringify({ type: 'full', model: {} })));
    await connectPromise;
  });

  it('disconnect closes WebSocket and flushes persistence', async () => {
    const manager = createManager();
    const connectPromise = manager.connect(5000);
    await tick();
    lastFakeWs.emit('message', Buffer.from(JSON.stringify({ type: 'full', model: { x: 1 } })));
    await connectPromise;

    manager.disconnect();

    expect(manager.isConnected()).toBe(false);
    expect(lastFakeWs.close).toHaveBeenCalled();
  });
});
