import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { createMcpServer } from './server.js';

// Mock StdioServerTransport to avoid stdin/stdout issues
vi.mock('@modelcontextprotocol/sdk/server/stdio.js', () => {
  return {
    StdioServerTransport: class FakeStdioTransport {
      constructor() {
        const [, serverTransport] = InMemoryTransport.createLinkedPair();
        Object.assign(this, serverTransport);
        // Copy prototype methods
        const proto = Object.getPrototypeOf(serverTransport);
        for (const key of Object.getOwnPropertyNames(proto)) {
          if (key !== 'constructor') {
            (this as Record<string, unknown>)[key] = (serverTransport as Record<string, unknown>)[key];
          }
        }
      }
    },
  };
});

// Mock ws module to avoid real WebSocket connections
vi.mock('ws', () => ({
  default: vi.fn(),
}));

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
    expect(toolNames).toContain('auto_configure');
    expect(toolNames).toContain('auto_get_model');
    expect(toolNames).toContain('auto_send_model');
    expect(toolNames).toContain('auto_get_changes');
    await client.close();
  });

  it('createMcpServer accepts deps and passes them to registerTools', async () => {
    const server = createMcpServer({ connection: undefined });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    const client = new Client({ name: 'test-client', version: '0.1.0' });
    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
    const tools = await client.listTools();
    expect(tools.tools.length).toBe(4);
    await client.close();
  });

  it('startMcpServer without config skips connection setup', async () => {
    // No config file exists, so startMcpServer should skip connection setup
    const { setConfigDir } = await import('../config.js');
    setConfigDir(join(tempDir, '.auto-agent'));

    const { startMcpServer } = await import('./server.js');
    // Should complete without error even though no config exists
    await startMcpServer();
  });

  it('startMcpServer with config creates connection and connects', async () => {
    const { setConfigDir, writeConfig } = await import('../config.js');
    setConfigDir(join(tempDir, '.auto-agent'));
    writeConfig({
      apiKey: 'ak_ws1_abc123',
      serverUrl: 'https://example.com',
      workspaceId: 'ws1',
    });

    const { ConnectionManager } = await import('../connection.js');
    const connectSpy = vi.spyOn(ConnectionManager.prototype, 'connect').mockResolvedValue();

    const { startMcpServer } = await import('./server.js');
    await startMcpServer();

    expect(connectSpy).toHaveBeenCalled();
    connectSpy.mockRestore();
  });

  it('startMcpServer onModel callback persists the model', async () => {
    const { setConfigDir, writeConfig } = await import('../config.js');
    setConfigDir(join(tempDir, '.auto-agent'));
    writeConfig({
      apiKey: 'ak_ws1_abc123',
      serverUrl: 'https://example.com',
      workspaceId: 'ws1',
    });

    const { ConnectionManager } = await import('../connection.js');
    const { ModelPersistence } = await import('../persistence.js');

    const updateSpy = vi.spyOn(ModelPersistence.prototype, 'update').mockImplementation(() => {});

    // Mock connect to simulate receiving a full model, which triggers the onModel callback
    const connectSpy = vi.spyOn(ConnectionManager.prototype, 'connect').mockImplementation(async function (this: InstanceType<typeof ConnectionManager>) {
      this.processMessage({ type: 'full', model: { scenes: [] } });
    });

    const { startMcpServer } = await import('./server.js');
    await startMcpServer();

    expect(updateSpy).toHaveBeenCalledWith({ scenes: [] });

    connectSpy.mockRestore();
    updateSpy.mockRestore();
  });

  it('startMcpServer silently catches connection.connect() errors', async () => {
    const { setConfigDir, writeConfig } = await import('../config.js');
    setConfigDir(join(tempDir, '.auto-agent'));
    writeConfig({
      apiKey: 'ak_ws1_abc123',
      serverUrl: 'https://example.com',
      workspaceId: 'ws1',
    });

    const { ConnectionManager } = await import('../connection.js');
    const connectSpy = vi.spyOn(ConnectionManager.prototype, 'connect').mockRejectedValue(new Error('Connection failed'));

    const { startMcpServer } = await import('./server.js');
    // Should NOT throw even though connect fails
    await startMcpServer();

    expect(connectSpy).toHaveBeenCalled();
    connectSpy.mockRestore();
  });
});
