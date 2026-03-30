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

const mockStartDaemon = vi.fn();
vi.mock('./daemon.js', () => ({
  startDaemon: (...args: unknown[]) => mockStartDaemon(...args),
}));

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
    mockStartDaemon.mockReset();
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
    writeConfig({ apiKey: 'ak_ws123_secret', serverUrl: 'http://localhost:8787', workspaceId: 'ws123' });
    const deps = createDepsWithPersistence();
    const updateEndpointsFn = vi.fn();
    (deps.daemon!.connection as Record<string, unknown>).updateEndpoints = updateEndpointsFn;
    (deps.daemon!.connection as Record<string, unknown>).sessionId = 'abc123def456';
    const server = createMcpServer(deps);
    const endpoints = [
      { label: 'Frontend', url: 'http://localhost:5173' },
      { label: 'Backend', url: 'http://localhost:3000' },
    ];
    const result = await callTool(server, 'auto_update_endpoints', { endpoints });
    expect(getText(result)).toBe(
      'Updated 2 endpoint(s):\n' +
      'Frontend: https://app.on.auto/ws123/agent/abc123def456/Frontend\n' +
      'Backend: https://app.on.auto/ws123/agent/abc123def456/Backend'
    );
    expect(updateEndpointsFn).toHaveBeenCalledWith(endpoints);
  });

  it('auto_configure uses default server URL when none provided', async () => {
    const fakeDaemon = {
      persistence: new ModelPersistence(join(tempDir, '.auto-agent', 'model2.json')),
      connection: { disconnect: vi.fn(), isConnected: () => true } as any,
    };
    mockStartDaemon.mockResolvedValue(fakeDaemon);
    const server = createMcpServer();
    const result = await callTool(server, 'auto_configure', { key: 'ak_ws1_secret123' });
    expect(getText(result)).toBe('Connected to workspace ws1 (server: https://collaboration-server.on-auto.workers.dev)');
    const config = readConfig();
    expect(config!.serverUrl).toBe('https://collaboration-server.on-auto.workers.dev');
  });

  it('auto_configure disconnects existing daemon and calls onDaemonStarted', async () => {
    const oldDisconnect = vi.fn();
    const onDaemonStarted = vi.fn();
    const existingDeps: ToolDependencies = {
      daemon: {
        persistence: new ModelPersistence(join(tempDir, '.auto-agent', 'model3.json')),
        connection: { disconnect: oldDisconnect, isConnected: () => true } as any,
      },
      onDaemonStarted,
    };
    const newDaemon = {
      persistence: new ModelPersistence(join(tempDir, '.auto-agent', 'model4.json')),
      connection: { disconnect: vi.fn(), isConnected: () => true } as any,
    };
    mockStartDaemon.mockResolvedValue(newDaemon);
    const server = createMcpServer(existingDeps);
    const result = await callTool(server, 'auto_configure', {
      key: 'ak_ws2_secret456',
      server: 'https://custom.server.com',
    });
    expect(oldDisconnect).toHaveBeenCalled();
    expect(onDaemonStarted).toHaveBeenCalledWith(newDaemon);
    expect(getText(result)).toBe('Connected to workspace ws2 (server: https://custom.server.com)');
  });

  it('auto_configure returns fallback message on connection failure', async () => {
    mockStartDaemon.mockRejectedValue(new Error('Connection refused'));
    const server = createMcpServer();
    const result = await callTool(server, 'auto_configure', {
      key: 'ak_ws3_secret789',
      server: 'https://bad.server.com',
    });
    expect(getText(result)).toBe('Configured for workspace ws3 but connection failed: Connection refused. Tools will use HTTP fallback.');
  });

  it('auto_get_model returns error when HTTP fallback fails', async () => {
    writeConfig({ apiKey: 'ak_ws1_abc', serverUrl: 'https://example.com', workspaceId: 'ws1' });
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
    const server = createMcpServer();
    const result = await callTool(server, 'auto_get_model');
    expect(getText(result)).toBe('Error fetching model: Network error');
  });

  it('auto_send_model succeeds with no corrections', async () => {
    writeConfig({ apiKey: 'ak_ws1_abc', serverUrl: 'https://example.com', workspaceId: 'ws1' });
    const responseModel = { scenes: [] };
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ model: responseModel, correctionCount: 0, corrections: [] }),
    });
    const server = createMcpServer();
    const result = await callTool(server, 'auto_send_model', { model: '{"scenes":[]}' });
    expect(getText(result)).toContain('No corrections needed.');
    expect(getText(result)).toContain(JSON.stringify(responseModel, null, 2));
  });

  it('auto_send_model succeeds with corrections', async () => {
    writeConfig({ apiKey: 'ak_ws1_abc', serverUrl: 'https://example.com', workspaceId: 'ws1' });
    const responseModel = { scenes: [{ id: 's1' }] };
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ model: responseModel, correctionCount: 2, corrections: ['Fixed ID', 'Added name'] }),
    });
    const server = createMcpServer();
    const result = await callTool(server, 'auto_send_model', { model: '{"scenes":[]}' });
    expect(getText(result)).toContain('Applied 2 corrections:');
    expect(getText(result)).toContain('- Fixed ID');
    expect(getText(result)).toContain('- Added name');
  });

  it('auto_send_model returns error when HTTP request fails', async () => {
    writeConfig({ apiKey: 'ak_ws1_abc', serverUrl: 'https://example.com', workspaceId: 'ws1' });
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Server error'));
    const server = createMcpServer();
    const result = await callTool(server, 'auto_send_model', { model: '{}' });
    expect(getText(result)).toBe('Error sending model: Server error');
  });

  it('auto_configure handles non-Error throw with Unknown error', async () => {
    mockStartDaemon.mockRejectedValue('string-error');
    const server = createMcpServer();
    const result = await callTool(server, 'auto_configure', {
      key: 'ak_ws4_secret',
      server: 'https://bad.server.com',
    });
    expect(getText(result)).toContain('Unknown error');
  });

  it('auto_get_model falls through to HTTP when daemon has no model', async () => {
    writeConfig({ apiKey: 'ak_ws1_abc', serverUrl: 'https://example.com', workspaceId: 'ws1' });
    const deps = createDepsWithPersistence();
    // persistence has no model written, so readModel() returns null
    const httpModel = { scenes: [{ id: 's2' }] };
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ model: httpModel }),
    });
    const server = createMcpServer(deps);
    const result = await callTool(server, 'auto_get_model');
    expect(JSON.parse(getText(result))).toEqual(httpModel);
  });

  it('auto_get_model returns Unknown error for non-Error throw', async () => {
    writeConfig({ apiKey: 'ak_ws1_abc', serverUrl: 'https://example.com', workspaceId: 'ws1' });
    globalThis.fetch = vi.fn().mockRejectedValue('string-error');
    const server = createMcpServer();
    const result = await callTool(server, 'auto_get_model');
    expect(getText(result)).toBe('Error fetching model: Unknown error');
  });

  it('auto_send_model returns Unknown error for non-Error throw', async () => {
    writeConfig({ apiKey: 'ak_ws1_abc', serverUrl: 'https://example.com', workspaceId: 'ws1' });
    globalThis.fetch = vi.fn().mockRejectedValue('string-error');
    const server = createMcpServer();
    const result = await callTool(server, 'auto_send_model', { model: '{}' });
    expect(getText(result)).toBe('Error sending model: Unknown error');
  });

  it('auto_update_endpoints uses empty workspaceId when no config', async () => {
    // No config written, but daemon exists
    const deps = createDepsWithPersistence();
    const updateEndpointsFn = vi.fn();
    (deps.daemon!.connection as Record<string, unknown>).updateEndpoints = updateEndpointsFn;
    (deps.daemon!.connection as Record<string, unknown>).sessionId = 'abc123def456';
    const server = createMcpServer(deps);
    const endpoints = [{ label: 'Frontend', url: 'http://localhost:5173' }];
    const result = await callTool(server, 'auto_update_endpoints', { endpoints });
    expect(getText(result)).toContain('https://app.on.auto//agent/abc123def456/Frontend');
  });
});
