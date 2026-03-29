import { EventEmitter } from 'node:events';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ConnectionManager } from './connection.js';
import { ModelPersistence } from './persistence.js';

let lastFakeWs: EventEmitter & { close: ReturnType<typeof vi.fn> };

vi.mock('ws', () => ({
  default: class extends EventEmitter {
    close = vi.fn();
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
