import { Command } from 'commander';
import { join } from 'node:path';
import { readConfig } from '../config.js';
import { ConnectionManager } from '../connection.js';
import { ModelPersistence } from '../persistence.js';

export function registerConnectCommand(program: Command): void {
  program
    .command('connect')
    .description('Connect to the collaboration server and sync model in real-time')
    .option('--dir <path>', 'Directory for model files', '.auto-agent')
    .action(async (options: { dir: string }) => {
      const config = readConfig();
      if (!config) {
        process.stderr.write('No configuration found. Run "auto-agent configure --key <api-key>" first.\n');
        process.exitCode = 1;
        return;
      }

      const modelPath = join(options.dir, 'model.json');
      const persistence = new ModelPersistence(modelPath);

      const manager = new ConnectionManager({
        serverUrl: config.serverUrl,
        apiKey: config.apiKey,
        workspaceId: config.workspaceId,
        onModel: (model) => persistence.update(model),
        onChange: (change) => {
          process.stderr.write(`[${change.action}] ${change.entityType}: ${change.name}\n`);
        },
      });

      manager.on('connected', () => {
        process.stderr.write('Connected to collaboration server.\n');
        persistence.update(manager.getModel());
      });

      manager.on('disconnected', () => {
        process.stderr.write('Disconnected from collaboration server. Reconnecting...\n');
      });

      process.on('SIGINT', () => {
        manager.disconnect();
        persistence.destroy();
        process.exit(0);
      });

      process.on('SIGTERM', () => {
        manager.disconnect();
        persistence.destroy();
        process.exit(0);
      });

      process.stderr.write(`Connecting to ${config.serverUrl} for workspace ${config.workspaceId}...\n`);
      process.stderr.write(`Model will be written to ${modelPath}\n`);

      try {
        await manager.connect();
      } catch (err) {
        process.stderr.write(`Error: ${err instanceof Error ? err.message : 'Connection failed'}\n`);
        persistence.destroy();
        process.exitCode = 1;
      }
    });
}
