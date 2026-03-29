import type { Command } from 'commander';
import { writeConfig } from '../config.js';
import { parseApiKey } from '../utils.js';

export function registerConfigureCommand(program: Command): void {
  program
    .command('configure')
    .description('Configure the agent CLI with an API key')
    .requiredOption('--key <api-key>', 'API key (format: ak_<workspaceId>_<secret>)')
    .action((opts: { key: string }) => {
      const { key } = opts;
      const result = parseApiKey(key);

      if (!result) {
        throw new Error('Invalid API key format. Expected format: ak_<workspaceId>_<secret>');
      }

      const { workspaceId } = result;

      writeConfig({
        apiKey: key,
        serverUrl: 'https://collaboration-server.on-auto.workers.dev',
        workspaceId,
      });

      console.log(`Configuration saved. Workspace: ${workspaceId}`);
    });
}
