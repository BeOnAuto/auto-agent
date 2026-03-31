import type { Command } from 'commander';
import { readConfig } from '../config.js';
import { getLogger } from '../logger.js';
import { startDaemon } from '../mcp/daemon.js';

export function registerConnectCommand(program: Command): void {
  program
    .command('connect')
    .description('Connect to the collaboration server and sync model in real-time')
    .action(async () => {
      const log = getLogger();
      log.info('cli', 'connect command invoked');
      const config = readConfig();
      if (!config) {
        log.warn('cli', 'connect: no configuration found');
        process.stderr.write('No configuration found. Run "auto-agent configure --key <api-key>" first.\n');
        process.exitCode = 1;
        return;
      }

      log.info('cli', `connect: connecting to ${config.serverUrl} for workspace ${config.workspaceId}`);
      process.stderr.write(`Connecting to ${config.serverUrl} for workspace ${config.workspaceId}...\n`);

      try {
        const daemon = await startDaemon(config);
        log.info('cli', 'connect: daemon started successfully');

        process.stderr.write('Connected. Syncing model to disk. Press Ctrl+C to stop.\n');

        process.on('SIGINT', () => {
          log.info('cli', 'connect: received SIGINT, disconnecting');
          daemon.connection.disconnect();
          process.exit(0);
        });

        process.on('SIGTERM', () => {
          log.info('cli', 'connect: received SIGTERM, disconnecting');
          daemon.connection.disconnect();
          process.exit(0);
        });
      } catch (err) {
        log.error('cli', 'connect: failed', err instanceof Error ? err : new Error(String(err)));
        process.stderr.write(`Error: ${err instanceof Error ? err.message : 'Connection failed'}\n`);
        process.exitCode = 1;
      }
    });
}
