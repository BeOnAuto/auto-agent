import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { readConfig, writeConfig, getConfigDir } from '../config.js';
import { AgentClient } from '../client.js';
import { parseApiKey } from '../utils.js';
import { getLogger } from '../logger.js';
import { startDaemon, type Daemon } from './daemon.js';
import type { AgentEndpoint } from '../connection.js';

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
      const log = getLogger();
      log.info('tools', 'auto_configure called');
      const result = parseApiKey(key);
      if (!result) {
        log.warn('tools', 'auto_configure: invalid key format');
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
        log.info('tools', `auto_configure: connected to workspace ${workspaceId}`);
        return { content: [{ type: 'text' as const, text: `Connected to workspace ${workspaceId} (server: ${url})` }] };
      } catch (err) {
        log.error('tools', 'auto_configure: connection failed', err instanceof Error ? err : new Error(String(err)));
        return { content: [{ type: 'text' as const, text: `Configured for workspace ${workspaceId} but connection failed: ${err instanceof Error ? err.message : 'Unknown error'}. Tools will use HTTP fallback.` }] };
      }
    }
  );

  server.tool(
    'auto_get_model',
    'Fetch the workspace model as JSON',
    {},
    async () => {
      const log = getLogger();
      log.info('tools', 'auto_get_model called');
      if (deps.daemon) {
        const model = deps.daemon.persistence.readModel();
        if (model) {
          log.info('tools', 'auto_get_model: returning cached model');
          return { content: [{ type: 'text' as const, text: JSON.stringify(model, null, 2) }] };
        }
      }
      const config = readConfig();
      if (!config) {
        log.warn('tools', 'auto_get_model: not configured');
        return { content: [{ type: 'text' as const, text: 'Not configured. Run /auto-agent:connect first.' }] };
      }
      try {
        log.info('tools', 'auto_get_model: fetching via HTTP');
        const client = new AgentClient(config.serverUrl, config.apiKey);
        const model = await client.getModel(config.workspaceId);
        return { content: [{ type: 'text' as const, text: JSON.stringify(model, null, 2) }] };
      } catch (err) {
        log.error('tools', 'auto_get_model: HTTP fetch failed', err instanceof Error ? err : new Error(String(err)));
        return { content: [{ type: 'text' as const, text: `Error fetching model: ${err instanceof Error ? err.message : 'Unknown error'}` }] };
      }
    }
  );

  server.tool(
    'auto_send_model',
    'Send a model to the server for correction and sync',
    { model: z.string().describe('Model as JSON string') },
    async ({ model }) => {
      const log = getLogger();
      log.info('tools', 'auto_send_model called');
      const config = readConfig();
      if (!config) {
        log.warn('tools', 'auto_send_model: not configured');
        return { content: [{ type: 'text' as const, text: 'Not configured. Run /auto-agent:connect first.' }] };
      }
      let parsed: unknown;
      try {
        parsed = JSON.parse(model);
      } catch {
        log.warn('tools', 'auto_send_model: invalid JSON');
        return { content: [{ type: 'text' as const, text: 'Error: Invalid JSON in model parameter' }] };
      }
      try {
        const client = new AgentClient(config.serverUrl, config.apiKey);
        const result = await client.sendModel(config.workspaceId, parsed);
        log.info('tools', `auto_send_model: success, ${result.correctionCount} corrections`);
        const summary = result.correctionCount > 0
          ? `Applied ${result.correctionCount} corrections:\n${result.corrections.map(c => `- ${c}`).join('\n')}\n\n`
          : 'No corrections needed.\n\n';
        return { content: [{ type: 'text' as const, text: summary + JSON.stringify(result.model, null, 2) }] };
      } catch (err) {
        log.error('tools', 'auto_send_model: failed', err instanceof Error ? err : new Error(String(err)));
        return { content: [{ type: 'text' as const, text: `Error sending model: ${err instanceof Error ? err.message : 'Unknown error'}` }] };
      }
    }
  );

  server.tool(
    'auto_get_changes',
    'Get model changes since last check. Returns structural diffs (added/removed/updated scenes, messages, moments). Clears the list after reading.',
    {},
    async () => {
      const log = getLogger();
      log.info('tools', 'auto_get_changes called');
      if (deps.daemon) {
        const changes = deps.daemon.persistence.readAndClearChanges();
        log.info('tools', `auto_get_changes: returning ${changes.length} changes`);
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({ changes, count: changes.length }),
          }],
        };
      }
      log.warn('tools', 'auto_get_changes: no active connection');
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({ changes: [], message: 'No active connection. Run /auto-agent:connect first.' }),
        }],
      };
    }
  );

  server.tool(
    'auto_update_endpoints',
    'Report dev server endpoints (Frontend, Backend, Storybook, etc.) to the collaboration server. Call this after starting a dev server. Each call replaces all previous endpoints.',
    {
      endpoints: z.array(z.object({
        label: z.string().describe('Display label for the endpoint (e.g. "Frontend", "Backend")'),
        url: z.string().describe('URL of the endpoint (e.g. "http://localhost:5173")'),
      })).describe('List of endpoints this agent currently exposes'),
    },
    async ({ endpoints }) => {
      const log = getLogger();
      log.info('tools', 'auto_update_endpoints called', { count: endpoints.length });
      if (!deps.daemon) {
        log.warn('tools', 'auto_update_endpoints: no daemon');
        return { content: [{ type: 'text' as const, text: 'Not connected. Run auto_configure first.' }] };
      }
      if (!deps.daemon.connection.isConnected()) {
        log.warn('tools', 'auto_update_endpoints: websocket disconnected');
        return { content: [{ type: 'text' as const, text: 'WebSocket not connected. Endpoint update not sent.' }] };
      }
      const typedEndpoints: AgentEndpoint[] = endpoints;
      deps.daemon.connection.updateEndpoints(typedEndpoints);

      const config = readConfig();
      const workspaceId = config?.workspaceId ?? '';
      const sessionId = deps.daemon.connection.sessionId;
      const baseAppUrl = 'https://app.on.auto';

      const lines = endpoints.map((e: AgentEndpoint) => {
        const loopbackUrl = `${baseAppUrl}/${workspaceId}/agent/${sessionId}/${encodeURIComponent(e.label)}`;
        return `${e.label}: ${loopbackUrl}`;
      });
      return { content: [{ type: 'text' as const, text: `Updated ${endpoints.length} endpoint(s):\n${lines.join('\n')}` }] };
    }
  );
}
