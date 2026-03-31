import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { readConfig } from '../config.js';
import { getLogger } from '../logger.js';
import { registerTools, type ToolDependencies } from './tools.js';
import { startDaemon } from './daemon.js';

export async function startMcpServer(): Promise<void> {
  const log = getLogger();
  log.info('server', 'MCP server starting');

  process.on('uncaughtException', (err) => {
    log.error('server', 'uncaught exception', err);
  });
  process.on('unhandledRejection', (reason) => {
    log.error('server', 'unhandled rejection', reason instanceof Error ? reason : new Error(String(reason)));
  });

  const deps: ToolDependencies = {};

  const config = readConfig();
  if (config) {
    log.info('server', 'config found, starting daemon', { workspaceId: config.workspaceId, serverUrl: config.serverUrl });
    try {
      deps.daemon = await startDaemon(config);
      log.info('server', 'daemon started');
    } catch (err) {
      log.error('server', 'daemon startup failed', err instanceof Error ? err : new Error(String(err)));
    }
  } else {
    log.info('server', 'no config found, skipping daemon');
  }

  const server = createMcpServer(deps);
  const transport = new StdioServerTransport();
  await server.connect(transport);
  log.info('server', 'MCP server connected to transport');
}

export function createMcpServer(deps: ToolDependencies = {}): McpServer {
  const server = new McpServer({
    name: 'auto-agent',
    version: '0.1.0',
  });
  registerTools(server, deps);
  return server;
}
