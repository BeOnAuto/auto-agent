import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { readConfig, writeConfig } from '../config.js';
import { AgentClient } from '../client.js';
import type { ConnectionManager } from '../connection.js';
import { parseApiKey } from '../utils.js';

export interface ToolDependencies {
  connection?: ConnectionManager;
}

export function registerTools(server: McpServer, deps: ToolDependencies = {}): void {
  server.tool(
    'auto_configure',
    'Configure the Auto agent CLI with an API key',
    { key: z.string().describe('API key in format ak_<workspaceId>_<random>') },
    async ({ key }) => {
      const result = parseApiKey(key);
      if (!result) {
        return { content: [{ type: 'text' as const, text: 'Invalid key format. Expected: ak_<workspaceId>_<random>' }] };
      }
      const { workspaceId } = result;
      writeConfig({
        apiKey: key,
        serverUrl: 'https://collaboration-server.on-auto.workers.dev',
        workspaceId,
      });
      return { content: [{ type: 'text' as const, text: `Configured for workspace ${workspaceId}` }] };
    }
  );

  server.tool(
    'auto_get_model',
    'Fetch the workspace model as JSON',
    {},
    async () => {
      if (deps.connection?.isConnected()) {
        try {
          const model = deps.connection.getModel();
          if (model) {
            return { content: [{ type: 'text' as const, text: JSON.stringify(model, null, 2) }] };
          }
        } catch (err) {
          return { content: [{ type: 'text' as const, text: `Error fetching model: ${err instanceof Error ? err.message : 'Unknown error'}` }] };
        }
      }
      const config = readConfig();
      if (!config) {
        return { content: [{ type: 'text' as const, text: 'Not configured. Call auto_configure first.' }] };
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
        return { content: [{ type: 'text' as const, text: 'Not configured. Call auto_configure first.' }] };
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
    'Get model changes since last check. Returns structural diffs (added/removed/updated scenes, messages, moments).',
    {},
    async () => {
      if (!deps.connection?.isConnected()) {
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({ changes: [], message: 'No active connection.' }),
          }],
        };
      }
      const changes = deps.connection.getChanges();
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({ changes, count: changes.length }),
        }],
      };
    }
  );
}
