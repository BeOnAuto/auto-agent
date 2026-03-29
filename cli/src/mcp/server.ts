import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { join } from 'node:path';
import { readConfig } from '../config.js';
import { ConnectionManager } from '../connection.js';
import { ModelPersistence } from '../persistence.js';
import { registerTools, type ToolDependencies } from './tools.js';

export async function startMcpServer(): Promise<void> {
  const deps: ToolDependencies = {};

  const config = readConfig();
  if (config) {
    const modelPath = join(process.cwd(), '.auto-agent', 'model.json');
    const persistence = new ModelPersistence(modelPath);
    const connection = new ConnectionManager({
      serverUrl: config.serverUrl,
      apiKey: config.apiKey,
      workspaceId: config.workspaceId,
      onModel: (model) => persistence.update(model),
    });
    deps.connection = connection;

    try {
      await connection.connect();
    } catch {
      void 0;
    }
  }

  const server = createMcpServer(deps);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

export function createMcpServer(deps: ToolDependencies = {}): McpServer {
  const server = new McpServer({
    name: 'auto-agent',
    version: '0.1.0',
  });
  registerTools(server, deps);
  return server;
}
