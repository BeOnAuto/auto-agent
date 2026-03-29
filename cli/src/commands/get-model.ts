import type { Command } from 'commander';
import { AgentClient } from '../client.js';
import { readConfig } from '../config.js';

export function registerGetModelCommand(program: Command): void {
  program
    .command('get-model')
    .description('Fetch the workspace model as JSON')
    .action(async () => {
      const config = readConfig();
      if (!config) {
        process.stderr.write('No configuration found. Run "auto-agent configure --key <api-key>" first.\n');
        process.exitCode = 1;
        return;
      }
      const client = new AgentClient(config.serverUrl, config.apiKey);
      const model = await client.getModel(config.workspaceId);
      process.stdout.write(JSON.stringify(model, null, 2) + '\n');
    });
}
