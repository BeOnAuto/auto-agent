import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createMcpServer } from './server.js';
import { readConfig, setConfigDir, writeConfig } from '../config.js';
import { ConnectionManager, type ModelChange } from '../connection.js';

function createFakeConnection(opts: { connected: boolean; model?: unknown; changes?: ModelChange[]; throwOnGetModel?: boolean }) {
  const connection = new ConnectionManager({
    serverUrl: 'https://example.com',
    apiKey: 'ak_ws1_abc123',
    workspaceId: 'ws1',
  });
  const isConnected = () => opts.connected;
  const getModel = () => {
    if (opts.throwOnGetModel) throw new Error('WebSocket error');
    return opts.model ?? null;
  };
  const getChanges = () => {
    const result = [...(opts.changes ?? [])];
    opts.changes = [];
    return result;
  };
  connection.isConnected = isConnected;
  connection.getModel = getModel;
  connection.getChanges = getChanges;
  return connection;
}

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

  it('registerTools registers the expected tools', async () => {
    const server = createMcpServer();
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    const client = new Client({ name: 'test-client', version: '0.1.0' });
    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
    const tools = await client.listTools();
    const toolNames = tools.tools.map((t) => t.name).sort();
    expect(toolNames).toEqual(['auto_configure', 'auto_get_changes', 'auto_get_model', 'auto_send_model']);
    await client.close();
  });

  // ── auto_configure ──────────────────────────────────────────────

  it('auto_configure writes config via MCP call with valid key', async () => {
    const server = createMcpServer();
    const result = await callTool(server, 'auto_configure', { key: 'ak_ws123_secret' });
    expect(getText(result)).toBe('Configured for workspace ws123');
    const config = readConfig();
    expect(config).toEqual({
      apiKey: 'ak_ws123_secret',
      serverUrl: 'https://collaboration-server.on-auto.workers.dev',
      workspaceId: 'ws123',
    });
  });

  it('auto_configure returns error for invalid key', async () => {
    const server = createMcpServer();
    const result = await callTool(server, 'auto_configure', { key: 'bad-key' });
    expect(getText(result)).toBe('Invalid key format. Expected: ak_<workspaceId>_<random>');
  });

  // ── auto_get_model ──────────────────────────────────────────────

  it('auto_get_model returns model from a live connection', async () => {
    const testModel = { scenes: [{ id: 's1', name: 'Login' }], messages: [] };
    const connection = createFakeConnection({ connected: true, model: testModel });
    const server = createMcpServer({ connection });

    const result = await callTool(server, 'auto_get_model');
    const parsed = JSON.parse(getText(result));
    expect(parsed).toEqual(testModel);
  });

  it('auto_get_model falls through to HTTP when connection model is null', async () => {
    const connection = createFakeConnection({ connected: true, model: null });
    const httpModel = { scenes: [], messages: [{ id: 'm1' }] };

    writeConfig({
      apiKey: 'ak_ws1_abc123',
      serverUrl: 'https://example.com',
      workspaceId: 'ws1',
    });

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ model: httpModel }),
    });

    const server = createMcpServer({ connection });
    const result = await callTool(server, 'auto_get_model');
    const parsed = JSON.parse(getText(result));
    expect(parsed).toEqual(httpModel);
  });

  it('auto_get_model returns error when connection.getModel() throws an Error', async () => {
    const connection = createFakeConnection({ connected: true, throwOnGetModel: true });
    const server = createMcpServer({ connection });

    const result = await callTool(server, 'auto_get_model');
    expect(getText(result)).toBe('Error fetching model: WebSocket error');
  });

  it('auto_get_model returns Unknown error when connection.getModel() throws non-Error', async () => {
    const connection = createFakeConnection({ connected: true });
    connection.getModel = () => {
      throw 'string-thrown'; // eslint-disable-line no-throw-literal
    };
    const server = createMcpServer({ connection });

    const result = await callTool(server, 'auto_get_model');
    expect(getText(result)).toBe('Error fetching model: Unknown error');
  });

  it('auto_get_model returns not-configured when no config exists', async () => {
    const server = createMcpServer();
    const result = await callTool(server, 'auto_get_model');
    expect(getText(result)).toBe('Not configured. Call auto_configure first.');
  });

  it('auto_get_model HTTP fallback success', async () => {
    const httpModel = { scenes: [{ id: 's2', name: 'Checkout' }] };

    writeConfig({
      apiKey: 'ak_ws1_abc123',
      serverUrl: 'https://example.com',
      workspaceId: 'ws1',
    });

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ model: httpModel }),
    });

    const server = createMcpServer(); // no connection
    const result = await callTool(server, 'auto_get_model');
    const parsed = JSON.parse(getText(result));
    expect(parsed).toEqual(httpModel);
  });

  it('auto_get_model HTTP fallback error', async () => {
    writeConfig({
      apiKey: 'ak_ws1_abc123',
      serverUrl: 'https://example.com',
      workspaceId: 'ws1',
    });

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    const server = createMcpServer();
    const result = await callTool(server, 'auto_get_model');
    expect(getText(result)).toBe('Error fetching model: Failed to get model: 500 Internal Server Error');
  });

  it('auto_get_model HTTP fallback with non-Error throw', async () => {
    writeConfig({
      apiKey: 'ak_ws1_abc123',
      serverUrl: 'https://example.com',
      workspaceId: 'ws1',
    });

    globalThis.fetch = vi.fn().mockRejectedValue('string error');

    const server = createMcpServer();
    const result = await callTool(server, 'auto_get_model');
    expect(getText(result)).toBe('Error fetching model: Unknown error');
  });

  // ── auto_send_model ─────────────────────────────────────────────

  it('auto_send_model returns not-configured when no config exists', async () => {
    const server = createMcpServer();
    const result = await callTool(server, 'auto_send_model', { model: '{}' });
    expect(getText(result)).toBe('Not configured. Call auto_configure first.');
  });

  it('auto_send_model returns error for invalid JSON', async () => {
    writeConfig({
      apiKey: 'ak_ws1_abc123',
      serverUrl: 'https://example.com',
      workspaceId: 'ws1',
    });

    const server = createMcpServer();
    const result = await callTool(server, 'auto_send_model', { model: '{not valid json' });
    expect(getText(result)).toBe('Error: Invalid JSON in model parameter');
  });

  it('auto_send_model success with no corrections', async () => {
    writeConfig({
      apiKey: 'ak_ws1_abc123',
      serverUrl: 'https://example.com',
      workspaceId: 'ws1',
    });

    const responseModel = { scenes: [] };
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ model: responseModel, corrections: [], correctionCount: 0 }),
    });

    const server = createMcpServer();
    const result = await callTool(server, 'auto_send_model', { model: '{"scenes":[]}' });
    const text = getText(result);
    expect(text).toContain('No corrections needed.');
    expect(text).toContain(JSON.stringify(responseModel, null, 2));
  });

  it('auto_send_model success with corrections', async () => {
    writeConfig({
      apiKey: 'ak_ws1_abc123',
      serverUrl: 'https://example.com',
      workspaceId: 'ws1',
    });

    const responseModel = { scenes: [{ id: 's1' }] };
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        model: responseModel,
        corrections: ['Fixed scene name', 'Added missing id'],
        correctionCount: 2,
      }),
    });

    const server = createMcpServer();
    const result = await callTool(server, 'auto_send_model', { model: '{"scenes":[]}' });
    const text = getText(result);
    expect(text).toContain('Applied 2 corrections:');
    expect(text).toContain('- Fixed scene name');
    expect(text).toContain('- Added missing id');
    expect(text).toContain(JSON.stringify(responseModel, null, 2));
  });

  it('auto_send_model HTTP error', async () => {
    writeConfig({
      apiKey: 'ak_ws1_abc123',
      serverUrl: 'https://example.com',
      workspaceId: 'ws1',
    });

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
    });

    const server = createMcpServer();
    const result = await callTool(server, 'auto_send_model', { model: '{}' });
    expect(getText(result)).toBe('Error sending model: Failed to send model: 400 Bad Request');
  });

  it('auto_send_model with non-Error throw', async () => {
    writeConfig({
      apiKey: 'ak_ws1_abc123',
      serverUrl: 'https://example.com',
      workspaceId: 'ws1',
    });

    globalThis.fetch = vi.fn().mockRejectedValue('string error');

    const server = createMcpServer();
    const result = await callTool(server, 'auto_send_model', { model: '{}' });
    expect(getText(result)).toBe('Error sending model: Unknown error');
  });

  // ── auto_get_changes ────────────────────────────────────────────

  it('auto_get_changes returns changes from a live connection', async () => {
    const connection = createFakeConnection({
      connected: true,
      changes: [
        { action: 'added', entityType: 'scene', id: 's1', name: 'Login' },
        { action: 'updated', entityType: 'message', id: 'm1', name: 'CreateUser' },
      ],
    });
    const server = createMcpServer({ connection });

    const result = await callTool(server, 'auto_get_changes');
    const parsed = JSON.parse(getText(result));

    expect(parsed).toEqual({
      count: 2,
      changes: [
        { action: 'added', entityType: 'scene', id: 's1', name: 'Login' },
        { action: 'updated', entityType: 'message', id: 'm1', name: 'CreateUser' },
      ],
    });
  });

  it('auto_get_changes drains changes after retrieval', async () => {
    const connection = createFakeConnection({
      connected: true,
      changes: [{ action: 'added', entityType: 'scene', id: 's1', name: 'Login' }],
    });
    const server = createMcpServer({ connection });

    await callTool(server, 'auto_get_changes');

    const server2 = createMcpServer({ connection });
    const result = await callTool(server2, 'auto_get_changes');
    const parsed = JSON.parse(getText(result));

    expect(parsed).toEqual({ count: 0, changes: [] });
  });

  it('auto_get_changes returns no-connection message when disconnected', async () => {
    const server = createMcpServer();

    const result = await callTool(server, 'auto_get_changes');
    const parsed = JSON.parse(getText(result));

    expect(parsed).toEqual({ changes: [], message: 'No active connection.' });
  });
});
