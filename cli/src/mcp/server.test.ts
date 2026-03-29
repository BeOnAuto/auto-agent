import { describe, expect, it } from 'vitest';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { createMcpServer } from './server.js';

describe('MCP server', () => {
  it('createMcpServer exposes auto_configure tool', async () => {
    const server = createMcpServer();
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    const client = new Client({ name: 'test-client', version: '0.1.0' });
    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
    const tools = await client.listTools();
    const toolNames = tools.tools.map((t) => t.name);
    expect(toolNames).toContain('auto_configure');
    await client.close();
  });
});
