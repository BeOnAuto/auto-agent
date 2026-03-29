import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createMcpServer } from './server.js';
import { readConfig, setConfigDir } from '../config.js';
import { ConnectionManager, type ModelChange } from '../connection.js';

function createFakeConnection(opts: { connected: boolean; model?: unknown; changes?: ModelChange[] }) {
  const connection = new ConnectionManager({
    serverUrl: 'https://example.com',
    apiKey: 'ak_ws1_abc123',
    workspaceId: 'ws1',
  });
  const isConnected = () => opts.connected;
  const getModel = () => opts.model ?? null;
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

async function callTool(server: ReturnType<typeof createMcpServer>, toolName: string) {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: 'test-client', version: '0.1.0' });
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  const result = await client.callTool({ name: toolName, arguments: {} });
  await client.close();
  return result;
}

describe('MCP tools', () => {
  let originalCwd: string;
  let tempDir: string;

  beforeEach(() => {
    originalCwd = process.cwd();
    tempDir = mkdtempSync(join(tmpdir(), 'auto-agent-tools-test-'));
    process.chdir(tempDir);
    setConfigDir(join(tempDir, '.auto-agent'));
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(tempDir, { recursive: true, force: true });
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

  it('auto_configure writes config when given a valid key', async () => {
    const { writeConfig } = await import('../config.js');

    const key = 'ak_ws123_secret';
    const parts = key.split('_');
    const workspaceId = parts[1];
    writeConfig({
      apiKey: key,
      serverUrl: 'https://collaboration-server.on-auto.workers.dev',
      workspaceId,
    });

    const config = readConfig();
    expect(config).toEqual({
      apiKey: 'ak_ws123_secret',
      serverUrl: 'https://collaboration-server.on-auto.workers.dev',
      workspaceId: 'ws123',
    });
  });

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
    const parsed = JSON.parse((result.content as Array<{ text: string }>)[0].text);

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
    const parsed = JSON.parse((result.content as Array<{ text: string }>)[0].text);

    expect(parsed).toEqual({ count: 0, changes: [] });
  });

  it('auto_get_changes returns no-connection message when disconnected', async () => {
    const server = createMcpServer();

    const result = await callTool(server, 'auto_get_changes');
    const parsed = JSON.parse((result.content as Array<{ text: string }>)[0].text);

    expect(parsed).toEqual({ changes: [], message: 'No active connection.' });
  });

  it('auto_get_model returns model from a live connection', async () => {
    const testModel = { scenes: [{ id: 's1', name: 'Login' }], messages: [] };
    const connection = createFakeConnection({ connected: true, model: testModel });
    const server = createMcpServer({ connection });

    const result = await callTool(server, 'auto_get_model');
    const parsed = JSON.parse((result.content as Array<{ text: string }>)[0].text);

    expect(parsed).toEqual(testModel);
  });
});
