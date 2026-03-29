import { EventEmitter } from 'node:events';
import { describe, expect, it, vi } from 'vitest';
import { ConnectionManager } from './connection.js';

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

function createManager(overrides: Partial<ConstructorParameters<typeof ConnectionManager>[0]> = {}) {
  return new ConnectionManager({
    serverUrl: 'https://example.com',
    apiKey: 'ak_ws1_abc123',
    workspaceId: 'ws1',
    ...overrides,
  });
}

function tick() {
  return new Promise<void>((r) => {
    setImmediate(r);
  });
}

describe('ConnectionManager', () => {
  it('starts disconnected', () => {
    const manager = createManager();
    expect(manager.isConnected()).toBe(false);
  });

  it('starts with null model', () => {
    const manager = createManager();
    expect(manager.getModel()).toBe(null);
  });

  it('starts with empty changes', () => {
    const manager = createManager();
    expect(manager.getChanges()).toEqual([]);
  });

  it('processMessage sets model on full message', () => {
    const manager = createManager();
    const model = { scenes: [{ id: 's1', name: 'Login' }], messages: [] };
    manager.processMessage({ type: 'full', model });
    expect(manager.getModel()).toEqual(model);
  });

  it('processMessage accumulates changes', () => {
    const manager = createManager();
    manager.processMessage({
      type: 'changes',
      changes: [
        { action: 'added', entityType: 'scene', id: 's1', name: 'Login' },
        { action: 'updated', entityType: 'message', id: 'm1', name: 'CreateUser' },
      ],
    });
    expect(manager.getChanges()).toEqual([
      { action: 'added', entityType: 'scene', id: 's1', name: 'Login' },
      { action: 'updated', entityType: 'message', id: 'm1', name: 'CreateUser' },
    ]);
  });

  it('getChanges resets cursor after retrieval', () => {
    const manager = createManager();
    manager.processMessage({
      type: 'changes',
      changes: [{ action: 'added', entityType: 'scene', id: 's1', name: 'Login' }],
    });
    manager.getChanges();
    expect(manager.getChanges()).toEqual([]);
  });

  it('processMessage calls onModel callback', () => {
    const models: unknown[] = [];
    const manager = createManager({ onModel: (m) => models.push(m) });
    const model = { scenes: [], messages: [] };
    manager.processMessage({ type: 'full', model });
    expect(models).toEqual([model]);
  });

  it('processMessage calls onChange callback', () => {
    const received: unknown[] = [];
    const manager = createManager({ onChange: (c) => received.push(c) });
    manager.processMessage({
      type: 'changes',
      changes: [{ action: 'added', entityType: 'scene', id: 's1', name: 'Flow' }],
    });
    expect(received).toEqual([{ action: 'added', entityType: 'scene', id: 's1', name: 'Flow' }]);
  });

  it('processMessage emits connected on first full message when not yet connected', () => {
    const manager = createManager();
    const events: string[] = [];
    manager.on('connected', () => events.push('connected'));
    manager.processMessage({ type: 'full', model: { x: 1 } });
    expect(events).toEqual(['connected']);
  });

  it('processMessage ignores unknown message types', () => {
    const manager = createManager();
    manager.processMessage({ type: 'unknown' });
    expect(manager.getModel()).toBe(null);
    expect(manager.getChanges()).toEqual([]);
  });

  it('connect resolves when a full model message arrives', async () => {
    const manager = createManager();
    const connectPromise = manager.connect(5000);
    await tick();
    lastFakeWs.emit('open');
    lastFakeWs.emit('message', Buffer.from(JSON.stringify({ type: 'full', model: { scenes: [] } })));
    await connectPromise;
    expect(manager.isConnected()).toBe(true);
    expect(manager.getModel()).toEqual({ scenes: [] });
  });

  it('connect rejects on timeout', async () => {
    const manager = createManager();
    const connectPromise = manager.connect(1);
    await expect(connectPromise).rejects.toThrow('Connection timeout after 1ms');
    expect(manager.isConnected()).toBe(false);
  });

  it('connect rejects on WebSocket error', async () => {
    const manager = createManager();
    const errors: unknown[] = [];
    manager.on('error', (e) => errors.push(e));
    const connectPromise = manager.connect(5000);
    await tick();
    lastFakeWs.emit('error', new Error('ECONNREFUSED'));
    await expect(connectPromise).rejects.toThrow('ECONNREFUSED');
  });

  it('connect emits error on invalid JSON message', async () => {
    const manager = createManager();
    const errors: unknown[] = [];
    manager.on('error', (e) => errors.push(e));
    const connectPromise = manager.connect(5000);
    await tick();
    lastFakeWs.emit('message', Buffer.from('not json'));
    lastFakeWs.emit('message', Buffer.from(JSON.stringify({ type: 'full', model: {} })));
    await connectPromise;
    expect(errors.length).toBe(1);
    expect(errors[0]).toBeInstanceOf(SyntaxError);
  });

  it('connect emits disconnected on WebSocket close', async () => {
    const manager = createManager();
    const connectPromise = manager.connect(5000);
    await tick();
    lastFakeWs.emit('message', Buffer.from(JSON.stringify({ type: 'full', model: {} })));
    await connectPromise;
    const events: string[] = [];
    manager.on('disconnected', () => events.push('disconnected'));
    lastFakeWs.emit('close');
    expect(manager.isConnected()).toBe(false);
    expect(events).toEqual(['disconnected']);
  });

  it('disconnect closes WebSocket and resets state', async () => {
    const manager = createManager();
    const connectPromise = manager.connect(5000);
    await tick();
    lastFakeWs.emit('message', Buffer.from(JSON.stringify({ type: 'full', model: { x: 1 } })));
    await connectPromise;
    manager.disconnect();
    expect(manager.isConnected()).toBe(false);
    expect(manager.getModel()).toBe(null);
    expect(lastFakeWs.close).toHaveBeenCalled();
  });

  it('disconnect is safe when no WebSocket exists', () => {
    const manager = createManager();
    manager.disconnect();
    expect(manager.isConnected()).toBe(false);
  });
});
