import { Command } from 'commander';
import { resolve } from 'node:path';
import { setConfigDir } from './config.js';
import { registerConfigureCommand } from './commands/configure.js';
import { registerGetModelCommand } from './commands/get-model.js';
import { registerSendModelCommand } from './commands/send-model.js';
import { registerConnectCommand } from './commands/connect.js';

export function createProgram(): Command {
  const program = new Command();

  program
    .name('auto-agent')
    .description('CLI for connecting coding agents to the Auto collaboration server')
    .version('0.1.0')
    .option('--config <dir>', 'Configuration directory', '.auto-agent')
    .hook('preAction', (thisCommand) => {
      const opts = thisCommand.opts();
      if (opts.config) {
        setConfigDir(resolve(opts.config));
      }
    });

  registerConfigureCommand(program);
  registerGetModelCommand(program);
  registerSendModelCommand(program);
  registerConnectCommand(program);

  program
    .command('mcp')
    .description('Start MCP stdio server for Claude Code integration')
    .action(async () => {
      const { startMcpServer } = await import('./mcp/server.js');
      await startMcpServer();
    });

  return program;
}
