import type { Command } from 'commander';
import { writeConfig } from '../config.js';
import { parseApiKey } from '../utils.js';

export function registerConfigureCommand(program: Command): void {
  program
    .command('configure')
    .description('Configure the agent CLI with an API key')
    .requiredOption('--key <api-key>', 'API key (format: ak_<workspaceId>_<secret>)')
    .option('--server <url>', 'Server URL', 'https://collaboration-server.on-auto.workers.dev')
    .action((opts: { key: string; server: string }) => {
      const { key, server } = opts;
      const result = parseApiKey(key);

      if (!result) {
        throw new Error('Invalid API key format. Expected format: ak_<workspaceId>_<secret>');
      }

      const { workspaceId } = result;

      writeConfig({
        apiKey: key,
        serverUrl: server,
        workspaceId,
      });

      console.log(`Configuration saved. Workspace: ${workspaceId}, Server: ${server}`);
    });
}
