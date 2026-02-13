import { access } from 'node:fs/promises';
import path from 'node:path';
import { type Command, defineCommandHandler, type Event } from '@auto-engineer/message-bus';
import createDebug from 'debug';
import { execa } from 'execa';
import { ensureInstalled } from '../ensure-installed.js';

const debug = createDebug('auto:dev-server:start-client');

export type StartClientCommand = Command<
  'StartClient',
  {
    clientDirectory: string;
    command?: string;
  }
>;

export type ClientStartedEvent = Event<
  'ClientStarted',
  {
    clientDirectory: string;
    pid: number;
    port?: number;
  }
>;

export type ClientStartFailedEvent = Event<
  'ClientStartFailed',
  {
    clientDirectory: string;
    error: string;
  }
>;

export type StartClientEvents = ClientStartedEvent | ClientStartFailedEvent;

export const commandHandler = defineCommandHandler<
  StartClientCommand,
  (command: StartClientCommand) => Promise<ClientStartedEvent | ClientStartFailedEvent>
>({
  name: 'StartClient',
  displayName: 'Start Client',
  alias: 'start:client',
  description: 'Start the development client',
  category: 'dev',
  icon: 'monitor',
  fields: {
    clientDirectory: {
      description: 'Directory containing the client',
      required: true,
    },
    command: {
      description: 'Command to run (default: pnpm start)',
      required: false,
    },
  },
  examples: [
    '$ auto start:client --client-directory=./client',
    '$ auto start:client --client-directory=./client --command="pnpm dev"',
  ],
  events: [
    { name: 'ClientStarted', displayName: 'Client Started' },
    { name: 'ClientStartFailed', displayName: 'Client Start Failed' },
  ],
  handle: async (command: Command): Promise<ClientStartedEvent | ClientStartFailedEvent> => {
    const typedCommand = command as StartClientCommand;
    debug('CommandHandler executing for StartClient');
    const { clientDirectory, command: customCommand } = typedCommand.data;

    debug('Handling StartClientCommand');
    debug('  Client directory: %s', clientDirectory);
    debug('  Command: %s', customCommand ?? 'pnpm start');
    debug('  Request ID: %s', typedCommand.requestId);
    debug('  Correlation ID: %s', typedCommand.correlationId ?? 'none');

    try {
      const clientDir = path.resolve(clientDirectory);

      debug('Resolved paths:');
      debug('  Client directory: %s', clientDir);

      await access(path.join(clientDir, 'package.json'));
      debug('package.json found in client directory');

      await ensureInstalled(clientDir, debug);

      const cmd = customCommand ?? 'pnpm start';
      const [executable, ...args] = cmd.split(' ');

      debug('Starting client...');
      debug('Executable: %s', executable);
      debug('Args: %o', args);

      const subprocess = execa(executable, args, {
        cwd: clientDir,
        stdio: 'inherit',
        reject: false,
        detached: false,
      });

      const pid = subprocess.pid;

      if (pid === undefined) {
        throw new Error('Failed to start client process');
      }

      debug('Client process started with PID: %d', pid);

      subprocess.catch((error) => {
        debug('Client process error: %O', error);
      });

      return {
        type: 'ClientStarted',
        data: {
          clientDirectory,
          pid,
        },
        timestamp: new Date(),
        requestId: typedCommand.requestId,
        correlationId: typedCommand.correlationId,
      };
    } catch (error) {
      debug('ERROR: Exception caught: %O', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      return {
        type: 'ClientStartFailed',
        data: {
          clientDirectory,
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
