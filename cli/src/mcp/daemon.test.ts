import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setConfigDir } from '../config.js';

let mockConnectFn: ReturnType<typeof vi.fn>;

vi.mock('../connection.js', () => ({
  ConnectionManager: class {
    connect = mockConnectFn;
    disconnect = vi.fn();
    isConnected = () => true;
  },
}));

describe('startDaemon', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'daemon-test-'));
    setConfigDir(join(tempDir, '.auto-agent'));
    mockConnectFn = vi.fn().mockResolvedValue(undefined);
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('creates a ConnectionManager and calls connect', async () => {
    const { startDaemon } = await import('./daemon.js');

    const daemon = await startDaemon({
      apiKey: 'ak_ws1_secret',
      serverUrl: 'https://example.com',
      workspaceId: 'ws1',
    });

    expect(mockConnectFn).toHaveBeenCalled();
    expect(daemon.connection).toBeDefined();
    expect(daemon.persistence).toBeDefined();
  });

  it('rejects when connection fails', async () => {
    mockConnectFn.mockRejectedValue(new Error('timeout'));
    const { startDaemon } = await import('./daemon.js');

    await expect(
      startDaemon({ apiKey: 'ak_ws1_secret', serverUrl: 'https://example.com', workspaceId: 'ws1' }),
    ).rejects.toThrow('timeout');
  });
});
