import { Command } from 'commander';
import { checkCommand, generateCommand } from './commands/index.js';

const VERSION = '0.22.0';

export async function runCli(argv: string[]): Promise<void> {
  const program = new Command();

  program
    .name('release-automation')
    .description('Automated release management with changesets and conventional commits')
    .version(VERSION);

  // Add commands
  program.addCommand(generateCommand);
  program.addCommand(checkCommand);

  await program.parseAsync(argv);
}
