import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createMcpServer } from './server.js';
import { readConfig, setConfigDir, writeConfig } from '../config.js';
import { ModelPersistence } from '../persistence.js';
import type { ToolDependencies } from './tools.js';

async function callTool(server: ReturnType<typeof createMcpServer>, toolName: string, args: Record<string, unknown> = {}) {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: 'test-client', version: '0.1.0' });
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  const result = await client.callTool({ name: toolName, arguments: args });
  await client.close();
  return result;
}

function getText(result: Awaited<ReturnType<typeof callTool>>): string {
  return (result.content as Array<{ text: string }>)[0].text;
}

describe('MCP tools', () => {
  let originalCwd: string;
  let tempDir: string;
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalCwd = process.cwd();
    tempDir = mkdtempSync(join(tmpdir(), 'auto-agent-tools-test-'));
    process.chdir(tempDir);
    setConfigDir(join(tempDir, '.auto-agent'));
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(tempDir, { recursive: true, force: true });
    globalThis.fetch = originalFetch;
  });

  function createDepsWithPersistence(): ToolDependencies {
    const persistence = new ModelPersistence(join(tempDir, '.auto-agent', 'model.json'));
    return {
      daemon: {
        persistence,
        connection: { disconnect: vi.fn(), isConnected: () => true } as any,
      },
    };
  }

  it('registers the expected tools', async () => {
    const server = createMcpServer();
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    const client = new Client({ name: 'test-client', version: '0.1.0' });
    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
    const tools = await client.listTools();
    const toolNames = tools.tools.map((t) => t.name).sort();
    expect(toolNames).toEqual(['auto_configure', 'auto_get_changes', 'auto_get_model', 'auto_send_model', 'auto_update_endpoints']);
    await client.close();
  });

  it('auto_configure returns error for invalid key', async () => {
    const server = createMcpServer();
    const result = await callTool(server, 'auto_configure', { key: 'bad-key' });
    expect(getText(result)).toBe('Invalid key format. Expected: ak_<workspaceId>_<random>');
  });

  it('auto_get_model reads model from disk when daemon is running', async () => {
    const deps = createDepsWithPersistence();
    const model = { scenes: [{ id: 's1', name: 'Login' }] };
    deps.daemon!.persistence.update(model);
    deps.daemon!.persistence.flush();

    const server = createMcpServer(deps);
    const result = await callTool(server, 'auto_get_model');
    expect(JSON.parse(getText(result))).toEqual(model);
  });

  it('auto_get_model falls back to HTTP when no daemon and config exists', async () => {
    writeConfig({ apiKey: 'ak_ws1_abc', serverUrl: 'https://example.com', workspaceId: 'ws1' });
    const httpModel = { scenes: [], messages: [{ id: 'm1' }] };
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ model: httpModel }),
    });

    const server = createMcpServer();
    const result = await callTool(server, 'auto_get_model');
    expect(JSON.parse(getText(result))).toEqual(httpModel);
  });

  it('auto_get_model returns not-configured when no config and no daemon', async () => {
    const server = createMcpServer();
    const result = await callTool(server, 'auto_get_model');
    expect(getText(result)).toBe('Not configured. Run /auto-agent:connect first.');
  });

  it('auto_get_changes reads and truncates changes from disk', async () => {
    const deps = createDepsWithPersistence();
    deps.daemon!.persistence.appendChange({ action: 'added', entityType: 'scene', id: 's1', name: 'Login' });
    deps.daemon!.persistence.appendChange({ action: 'updated', entityType: 'message', id: 'm1', name: 'CreateUser' });

    const server = createMcpServer(deps);
    const result = await callTool(server, 'auto_get_changes');
    const parsed = JSON.parse(getText(result));
    expect(parsed).toEqual({
      count: 2,
      changes: [
        { action: 'added', entityType: 'scene', id: 's1', name: 'Login' },
        { action: 'updated', entityType: 'message', id: 'm1', name: 'CreateUser' },
      ],
    });

    const server2 = createMcpServer(deps);
    const result2 = await callTool(server2, 'auto_get_changes');
    expect(JSON.parse(getText(result2))).toEqual({ count: 0, changes: [] });
  });

  it('auto_get_changes returns no-connection when no daemon', async () => {
    const server = createMcpServer();
    const result = await callTool(server, 'auto_get_changes');
    const parsed = JSON.parse(getText(result));
    expect(parsed).toEqual({ changes: [], message: 'No active connection. Run /auto-agent:connect first.' });
  });

  it('auto_send_model returns not-configured when no config', async () => {
    const server = createMcpServer();
    const result = await callTool(server, 'auto_send_model', { model: '{}' });
    expect(getText(result)).toBe('Not configured. Run /auto-agent:connect first.');
  });

  it('auto_send_model returns error for invalid JSON', async () => {
    writeConfig({ apiKey: 'ak_ws1_abc', serverUrl: 'https://example.com', workspaceId: 'ws1' });
    const server = createMcpServer();
    const result = await callTool(server, 'auto_send_model', { model: 'bad json' });
    expect(getText(result)).toBe('Error: Invalid JSON in model parameter');
  });

  it('auto_update_endpoints returns not-connected when no daemon', async () => {
    const server = createMcpServer();
    const result = await callTool(server, 'auto_update_endpoints', {
      endpoints: [{ label: 'Frontend', url: 'http://localhost:5173' }],
    });
    expect(getText(result)).toBe('Not connected. Run auto_configure first.');
  });

  it('auto_update_endpoints returns error when websocket disconnected', async () => {
    const deps = createDepsWithPersistence();
    (deps.daemon!.connection as Record<string, unknown>).isConnected = () => false;
    const server = createMcpServer(deps);
    const result = await callTool(server, 'auto_update_endpoints', {
      endpoints: [{ label: 'Frontend', url: 'http://localhost:5173' }],
    });
    expect(getText(result)).toBe('WebSocket not connected. Endpoint update not sent.');
  });

  it('auto_update_endpoints calls updateEndpoints on daemon connection', async () => {
    const deps = createDepsWithPersistence();
    const updateEndpointsFn = vi.fn();
    (deps.daemon!.connection as Record<string, unknown>).updateEndpoints = updateEndpointsFn;
    const server = createMcpServer(deps);
    const endpoints = [
      { label: 'Frontend', url: 'http://localhost:5173' },
      { label: 'Backend', url: 'http://localhost:3000' },
    ];
    const result = await callTool(server, 'auto_update_endpoints', { endpoints });
    expect(getText(result)).toBe('Updated 2 endpoint(s).');
    expect(updateEndpointsFn).toHaveBeenCalledWith(endpoints);
  });
});
