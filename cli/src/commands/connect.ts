import type { Command } from 'commander';
import { readConfig } from '../config.js';
import { startDaemon } from '../mcp/daemon.js';

export function registerConnectCommand(program: Command): void {
  program
    .command('connect')
    .description('Connect to the collaboration server and sync model in real-time')
    .action(async () => {
      const config = readConfig();
      if (!config) {
        process.stderr.write('No configuration found. Run "auto-agent configure --key <api-key>" first.\n');
        process.exitCode = 1;
        return;
      }

      process.stderr.write(`Connecting to ${config.serverUrl} for workspace ${config.workspaceId}...\n`);

      try {
        const daemon = await startDaemon(config);

        process.stderr.write('Connected. Syncing model to disk. Press Ctrl+C to stop.\n');

        process.on('SIGINT', () => {
          daemon.connection.disconnect();
          process.exit(0);
        });

        process.on('SIGTERM', () => {
          daemon.connection.disconnect();
          process.exit(0);
        });
      } catch (err) {
        process.stderr.write(`Error: ${err instanceof Error ? err.message : 'Connection failed'}\n`);
        process.exitCode = 1;
      }
    });
}
