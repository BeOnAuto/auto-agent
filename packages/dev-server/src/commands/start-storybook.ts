import { access } from 'node:fs/promises';
import path from 'node:path';
import { type Command, defineCommandHandler, type Event } from '@auto-engineer/message-bus';
import createDebug from 'debug';
import { execa } from 'execa';
import { ensureInstalled } from '../ensure-installed.js';

const debug = createDebug('auto:dev-server:start-storybook');

export type StartStorybookCommand = Command<
  'StartStorybook',
  {
    storybookDirectory: string;
    command?: string;
    port?: number;
  }
>;

export type StorybookStartedEvent = Event<
  'StorybookStarted',
  {
    storybookDirectory: string;
    pid: number;
    port: number;
  }
>;

export type StorybookStartFailedEvent = Event<
  'StorybookStartFailed',
  {
    storybookDirectory: string;
    error: string;
  }
>;

export type StartStorybookEvents = StorybookStartedEvent | StorybookStartFailedEvent;

export const commandHandler = defineCommandHandler<
  StartStorybookCommand,
  (command: StartStorybookCommand) => Promise<StorybookStartedEvent | StorybookStartFailedEvent>
>({
  name: 'StartStorybook',
  displayName: 'Start Storybook',
  alias: 'start:storybook',
  description: 'Start the Storybook development server',
  category: 'dev',
  icon: 'book-open',
  fields: {
    storybookDirectory: {
      description: 'Directory containing the Storybook configuration',
      required: true,
    },
    command: {
      description: 'Command to run (default: pnpm storybook)',
      required: false,
    },
    port: {
      description: 'Port to run Storybook on (default: 6006)',
      required: false,
    },
  },
  examples: [
    '$ auto start:storybook --storybook-directory=./client',
    '$ auto start:storybook --storybook-directory=./client --port=6007',
    '$ auto start:storybook --storybook-directory=./client --command="pnpm storybook"',
  ],
  events: [
    { name: 'StorybookStarted', displayName: 'Storybook Started' },
    { name: 'StorybookStartFailed', displayName: 'Storybook Start Failed' },
  ],
  handle: async (command: Command): Promise<StorybookStartedEvent | StorybookStartFailedEvent> => {
    const typedCommand = command as StartStorybookCommand;
    debug('CommandHandler executing for StartStorybook');
    const { storybookDirectory, command: customCommand, port = 6006 } = typedCommand.data;

    debug('Handling StartStorybookCommand');
    debug('  Storybook directory: %s', storybookDirectory);
    debug('  Command: %s', customCommand ?? 'pnpm storybook');
    debug('  Port: %d', port);
    debug('  Request ID: %s', typedCommand.requestId);
    debug('  Correlation ID: %s', typedCommand.correlationId ?? 'none');

    try {
      const storybookDir = path.resolve(storybookDirectory);

      debug('Resolved paths:');
      debug('  Storybook directory: %s', storybookDir);

      await access(path.join(storybookDir, 'package.json'));
      debug('package.json found in storybook directory');

      await ensureInstalled(storybookDir, debug);

      const cmd = customCommand ?? 'pnpm storybook';
      const [executable, ...args] = cmd.split(' ');
      args.push('--no-open');

      debug('Starting Storybook...');
      debug('Executable: %s', executable);
      debug('Args: %o', args);

      const subprocess = execa(executable, args, {
        cwd: storybookDir,
        stdio: 'inherit',
        reject: false,
        detached: false,
      });

      const pid = subprocess.pid;

      if (pid === undefined) {
        throw new Error('Failed to start Storybook process');
      }

      debug('Storybook process started with PID: %d', pid);

      subprocess.catch((error) => {
        debug('Storybook process error: %O', error);
      });

      return {
        type: 'StorybookStarted',
        data: {
          storybookDirectory,
          pid,
          port,
        },
        timestamp: new Date(),
        requestId: typedCommand.requestId,
        correlationId: typedCommand.correlationId,
      };
    } catch (error) {
      debug('ERROR: Exception caught: %O', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      return {
        type: 'StorybookStartFailed',
        data: {
          storybookDirectory,
          error: errorMessage,
        },
        timestamp: new Date(),
        requestId: typedCommand.requestId,
        correlationId: typedCommand.correlationId,
      };
    }
  },
});

export default commandHandler;
