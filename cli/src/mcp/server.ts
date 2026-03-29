import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { readConfig } from '../config.js';
import { registerTools, type ToolDependencies } from './tools.js';
import { startDaemon } from './daemon.js';

export async function startMcpServer(): Promise<void> {
  const deps: ToolDependencies = {};

  const config = readConfig();
  if (config) {
    try {
      deps.daemon = await startDaemon(config);
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
