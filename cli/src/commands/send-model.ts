import type { Command } from 'commander';
import { readFileSync } from 'node:fs';
import { readConfig } from '../config.js';
import { AgentClient } from '../client.js';

export function registerSendModelCommand(program: Command): void {
  program
    .command('send-model')
    .description('Send a model to the server for correction')
    .argument('<file>', 'Path to model JSON file')
    .action(async (file: string) => {
      const config = readConfig();
      if (!config) {
        process.stderr.write('No configuration found. Run "auto-agent configure --key <api-key>" first.\n');
        process.exitCode = 1;
        return;
      }
      let modelJson: string;
      try {
        modelJson = readFileSync(file, 'utf-8');
      } catch {
        process.stderr.write(`Error: Could not read file "${file}"\n`);
        process.exitCode = 1;
        return;
      }

      let model: unknown;
      try {
        model = JSON.parse(modelJson);
      } catch {
        process.stderr.write(`Error: File "${file}" contains invalid JSON\n`);
        process.exitCode = 1;
        return;
      }

      const client = new AgentClient(config.serverUrl, config.apiKey);
      const result = await client.sendModel(config.workspaceId, model);

      if (result.correctionCount > 0) {
        process.stderr.write(`Corrections applied (${result.correctionCount}):\n`);
        for (const correction of result.corrections) {
          process.stderr.write(`  - ${correction}\n`);
        }
      }
      process.stdout.write(JSON.stringify(result.model, null, 2) + '\n');
    });
}
