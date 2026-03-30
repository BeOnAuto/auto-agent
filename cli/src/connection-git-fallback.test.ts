import { EventEmitter } from 'node:events';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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

const mockExecSync = vi.fn();
vi.mock('node:child_process', () => ({
  execSync: (...args: unknown[]) => mockExecSync(...args),
}));

describe('ConnectionManager with git fallback', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'conn-git-test-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('falls back to OS username when git config throws', async () => {
    mockExecSync.mockImplementation(() => { throw new Error('git not found'); });
    const { ConnectionManager } = await import('./connection.js');
    const persistence = new ModelPersistence(join(tempDir, '.auto-agent', 'model.json'));
    const manager = new ConnectionManager({
      serverUrl: 'https://example.com',
      apiKey: 'ak_ws1_abc123',
      workspaceId: 'ws1',
      persistence,
    });
    expect(manager.name).toMatch(/·[0-9a-f]{4}$/);
    expect(manager.status.user).toBeUndefined();
    expect(manager.status.username).toBeTruthy();
  });

  it('falls back to OS username when git config returns empty string', async () => {
    mockExecSync.mockReturnValue('  \n');
    const { ConnectionManager } = await import('./connection.js');
    const persistence = new ModelPersistence(join(tempDir, '.auto-agent', 'model2.json'));
    const manager = new ConnectionManager({
      serverUrl: 'https://example.com',
      apiKey: 'ak_ws1_abc123',
      workspaceId: 'ws1',
      persistence,
    });
    expect(manager.name).toMatch(/·[0-9a-f]{4}$/);
  });

  it('disconnect is safe when ws is null', async () => {
    mockExecSync.mockReturnValue('TestUser\n');
    const { ConnectionManager } = await import('./connection.js');
    const persistence = new ModelPersistence(join(tempDir, '.auto-agent', 'model3.json'));
    const manager = new ConnectionManager({
      serverUrl: 'https://example.com',
      apiKey: 'ak_ws1_abc123',
      workspaceId: 'ws1',
      persistence,
    });
    // disconnect without ever connecting — ws is null
    manager.disconnect();
    expect(manager.isConnected()).toBe(false);
  });
});
