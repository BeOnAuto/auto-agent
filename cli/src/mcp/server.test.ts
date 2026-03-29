import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { createMcpServer } from './server.js';

vi.mock('@modelcontextprotocol/sdk/server/stdio.js', () => ({
  StdioServerTransport: class FakeStdioTransport {
    constructor() {
      const [, serverTransport] = InMemoryTransport.createLinkedPair();
      Object.assign(this, serverTransport);
      const proto = Object.getPrototypeOf(serverTransport);
      for (const key of Object.getOwnPropertyNames(proto)) {
        if (key !== 'constructor') {
          (this as Record<string, unknown>)[key] = (serverTransport as Record<string, unknown>)[key];
        }
      }
    }
  },
}));

vi.mock('ws', () => ({ default: vi.fn() }));

describe('MCP server', () => {
  let originalCwd: string;
  let tempDir: string;

  beforeEach(() => {
    originalCwd = process.cwd();
    tempDir = mkdtempSync(join(tmpdir(), 'auto-agent-server-test-'));
    process.chdir(tempDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('createMcpServer exposes all expected tools', async () => {
    const server = createMcpServer();
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    const client = new Client({ name: 'test-client', version: '0.1.0' });
    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
    const tools = await client.listTools();
    const toolNames = tools.tools.map((t) => t.name).sort();
    expect(toolNames).toEqual(['auto_configure', 'auto_get_changes', 'auto_get_model', 'auto_send_model']);
    await client.close();
  });

  it('startMcpServer without config skips daemon setup', async () => {
    const { setConfigDir } = await import('../config.js');
    setConfigDir(join(tempDir, '.auto-agent'));

    const { startMcpServer } = await import('./server.js');
    await startMcpServer();
  });

  it('startMcpServer with config starts daemon', async () => {
    const { setConfigDir, writeConfig } = await import('../config.js');
    setConfigDir(join(tempDir, '.auto-agent'));
    writeConfig({ apiKey: 'ak_ws1_abc123', serverUrl: 'https://example.com', workspaceId: 'ws1' });

    const { ConnectionManager } = await import('../connection.js');
    const connectSpy = vi.spyOn(ConnectionManager.prototype, 'connect').mockResolvedValue();

    const { startMcpServer } = await import('./server.js');
    await startMcpServer();

    expect(connectSpy).toHaveBeenCalled();
    connectSpy.mockRestore();
  });

  it('startMcpServer silently catches daemon connection errors', async () => {
    const { setConfigDir, writeConfig } = await import('../config.js');
    setConfigDir(join(tempDir, '.auto-agent'));
    writeConfig({ apiKey: 'ak_ws1_abc123', serverUrl: 'https://example.com', workspaceId: 'ws1' });

    const { ConnectionManager } = await import('../connection.js');
    const connectSpy = vi.spyOn(ConnectionManager.prototype, 'connect').mockRejectedValue(new Error('Connection failed'));

    const { startMcpServer } = await import('./server.js');
    await startMcpServer();

    expect(connectSpy).toHaveBeenCalled();
    connectSpy.mockRestore();
  });
});
