import type { Command } from 'commander';
import { writeConfig } from '../config.js';
import { getLogger } from '../logger.js';
import { parseApiKey } from '../utils.js';

export function registerConfigureCommand(program: Command): void {
  program
    .command('configure')
    .description('Configure the agent CLI with an API key')
    .requiredOption('--key <api-key>', 'API key (format: ak_<workspaceId>_<secret>)')
    .option('--server <url>', 'Server URL', 'https://collaboration-server.on-auto.workers.dev')
    .action((opts: { key: string; server: string }) => {
      const log = getLogger();
      log.info('cli', 'configure command invoked');
      const { key, server } = opts;
      const result = parseApiKey(key);

      if (!result) {
        log.error('cli', 'configure: invalid API key format');
        throw new Error('Invalid API key format. Expected format: ak_<workspaceId>_<secret>');
      }

      const { workspaceId } = result;

      writeConfig({
        apiKey: key,
        serverUrl: server,
        workspaceId,
      });

      log.info('cli', `configure: saved config for workspace ${workspaceId}`);
      console.log(`Configuration saved. Workspace: ${workspaceId}, Server: ${server}`);
    });
}
