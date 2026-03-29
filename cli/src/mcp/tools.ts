import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { readConfig, writeConfig, getConfigDir } from '../config.js';
import { AgentClient } from '../client.js';
import { parseApiKey } from '../utils.js';
import { startDaemon, type Daemon } from './daemon.js';

export interface ToolDependencies {
  daemon?: Daemon;
  onDaemonStarted?: (daemon: Daemon) => void;
}

export function registerTools(server: McpServer, deps: ToolDependencies = {}): void {
  server.tool(
    'auto_configure',
    'Configure the Auto agent CLI with an API key and start the sync daemon',
    {
      key: z.string().describe('API key in format ak_<workspaceId>_<random>'),
      server: z.string().optional().describe('Server URL (defaults to production)'),
    },
    async ({ key, server: serverUrl }) => {
      const result = parseApiKey(key);
      if (!result) {
        return { content: [{ type: 'text' as const, text: 'Invalid key format. Expected: ak_<workspaceId>_<random>' }] };
      }
      const { workspaceId } = result;
      const url = serverUrl || 'https://collaboration-server.on-auto.workers.dev';
      writeConfig({ apiKey: key, serverUrl: url, workspaceId });

      if (deps.daemon) {
        deps.daemon.connection.disconnect();
      }

      try {
        const daemon = await startDaemon({ apiKey: key, serverUrl: url, workspaceId });
        deps.daemon = daemon;
        deps.onDaemonStarted?.(daemon);
        return { content: [{ type: 'text' as const, text: `Connected to workspace ${workspaceId} (server: ${url})` }] };
      } catch (err) {
        return { content: [{ type: 'text' as const, text: `Configured for workspace ${workspaceId} but connection failed: ${err instanceof Error ? err.message : 'Unknown error'}. Tools will use HTTP fallback.` }] };
      }
    }
  );

  server.tool(
    'auto_get_model',
    'Fetch the workspace model as JSON',
    {},
    async () => {
      if (deps.daemon) {
        const model = deps.daemon.persistence.readModel();
        if (model) {
          return { content: [{ type: 'text' as const, text: JSON.stringify(model, null, 2) }] };
        }
      }
      const config = readConfig();
      if (!config) {
        return { content: [{ type: 'text' as const, text: 'Not configured. Run /auto-agent:connect first.' }] };
      }
      try {
        const client = new AgentClient(config.serverUrl, config.apiKey);
        const model = await client.getModel(config.workspaceId);
        return { content: [{ type: 'text' as const, text: JSON.stringify(model, null, 2) }] };
      } catch (err) {
        return { content: [{ type: 'text' as const, text: `Error fetching model: ${err instanceof Error ? err.message : 'Unknown error'}` }] };
      }
    }
  );

  server.tool(
    'auto_send_model',
    'Send a model to the server for correction and sync',
    { model: z.string().describe('Model as JSON string') },
    async ({ model }) => {
      const config = readConfig();
      if (!config) {
        return { content: [{ type: 'text' as const, text: 'Not configured. Run /auto-agent:connect first.' }] };
      }
      let parsed: unknown;
      try {
        parsed = JSON.parse(model);
      } catch {
        return { content: [{ type: 'text' as const, text: 'Error: Invalid JSON in model parameter' }] };
      }
      try {
        const client = new AgentClient(config.serverUrl, config.apiKey);
        const result = await client.sendModel(config.workspaceId, parsed);
        const summary = result.correctionCount > 0
          ? `Applied ${result.correctionCount} corrections:\n${result.corrections.map(c => `- ${c}`).join('\n')}\n\n`
          : 'No corrections needed.\n\n';
        return { content: [{ type: 'text' as const, text: summary + JSON.stringify(result.model, null, 2) }] };
      } catch (err) {
        return { content: [{ type: 'text' as const, text: `Error sending model: ${err instanceof Error ? err.message : 'Unknown error'}` }] };
      }
    }
  );

  server.tool(
    'auto_get_changes',
    'Get model changes since last check. Returns structural diffs (added/removed/updated scenes, messages, moments). Clears the list after reading.',
    {},
    async () => {
      if (deps.daemon) {
        const changes = deps.daemon.persistence.readAndClearChanges();
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({ changes, count: changes.length }),
          }],
        };
      }
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({ changes: [], message: 'No active connection. Run /auto-agent:connect first.' }),
        }],
      };
    }
  );
}
