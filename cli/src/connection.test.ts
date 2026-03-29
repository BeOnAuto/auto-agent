import { describe, it, expect } from 'vitest';
import { ConnectionManager } from './connection.js';

function createManager(overrides: Partial<ConstructorParameters<typeof ConnectionManager>[0]> = {}) {
  return new ConnectionManager({
    serverUrl: 'https://example.com',
    apiKey: 'ak_ws1_abc123',
    workspaceId: 'ws1',
    ...overrides,
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
});
