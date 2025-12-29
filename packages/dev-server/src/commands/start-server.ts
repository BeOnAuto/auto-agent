import { access } from 'node:fs/promises';
import path from 'node:path';

import { type Command, defineCommandHandler, type Event } from '@auto-engineer/message-bus';
import { type FSWatcher, watch } from 'chokidar';
import createDebug from 'debug';
import { execa, type ResultPromise } from 'execa';

const debug = createDebug('auto:dev-server:start-server');

const DEFAULT_DEBOUNCE_MS = 2000;
const IGNORED_PATTERNS = ['**/node_modules/**', '**/.git/**', '**/.DS_Store'];

export type StartServerCommand = Command<
  'StartServer',
  {
    serverDirectory: string;
    command?: string;
    watch?: boolean;
    watchDirectories?: string[];
    debounceMs?: number;
  }
>;

export type ServerStartedEvent = Event<
  'ServerStarted',
  {
    serverDirectory: string;
    pid: number;
    port?: number;
    watching: boolean;
  }
>;

export type ServerStartFailedEvent = Event<
  'ServerStartFailed',
  {
    serverDirectory: string;
    error: string;
  }
>;

export type ServerRestartingEvent = Event<
  'ServerRestarting',
  {
    serverDirectory: string;
    changedPath: string;
  }
>;

export type ServerRestartedEvent = Event<
  'ServerRestarted',
  {
    serverDirectory: string;
    pid: number;
  }
>;

export type StartServerEvents =
  | ServerStartedEvent
  | ServerStartFailedEvent
  | ServerRestartingEvent
  | ServerRestartedEvent;

interface ServerProcess {
  subprocess: ResultPromise;
  pid: number;
}

function parseCommand(cmd: string): { executable: string; args: string[] } {
  const [executable, ...args] = cmd.split(' ');
  return { executable, args };
}

async function startProcess(executable: string, args: string[], cwd: string): Promise<ServerProcess> {
  debug('Starting server process...');
  debug('  Executable: %s', executable);
  debug('  Args: %o', args);
  debug('  CWD: %s', cwd);

  const subprocess = execa(executable, args, {
    cwd,
    stdio: 'inherit',
    reject: false,
    detached: false,
  });

  const pid = subprocess.pid;

  if (pid === undefined) {
    throw new Error('Failed to start server process');
  }

  debug('Server process started with PID: %d', pid);

  subprocess.catch((error) => {
    debug('Server process error: %O', error);
  });

  return { subprocess, pid };
}

function killProcess(process: ServerProcess): Promise<void> {
  return new Promise((resolve) => {
    debug('Killing server process PID: %d', process.pid);

    process.subprocess.kill('SIGTERM');

    const timeout = setTimeout(() => {
      debug('Process did not exit gracefully, sending SIGKILL');
      process.subprocess.kill('SIGKILL');
      resolve();
    }, 5000);

    process.subprocess.finally(() => {
      clearTimeout(timeout);
      debug('Server process terminated');
      resolve();
    });
  });
}

function createFileWatcher(directories: string[], onFileChange: (changedPath: string) => void): FSWatcher {
  debug('Creating file watcher for directories: %o', directories);

  const watcher = watch(directories, {
    ignoreInitial: true,
    persistent: true,
    ignored: IGNORED_PATTERNS,
    awaitWriteFinish: {
      stabilityThreshold: 200,
      pollInterval: 50,
    },
  });

  watcher.on('add', (filePath) => {
    debug('File added: %s', filePath);
    onFileChange(filePath);
  });

  watcher.on('change', (filePath) => {
    debug('File changed: %s', filePath);
    onFileChange(filePath);
  });

  watcher.on('unlink', (filePath) => {
    debug('File removed: %s', filePath);
    onFileChange(filePath);
  });

  watcher.on('error', (error) => {
    debug('Watcher error: %O', error);
  });

  return watcher;
}

export const commandHandler = defineCommandHandler<
  StartServerCommand,
  (command: StartServerCommand) => Promise<ServerStartedEvent | ServerStartFailedEvent>
>({
  name: 'StartServer',
  displayName: 'Start Server',
  alias: 'start:server',
  description: 'Start the development server with optional watch mode for auto-restart',
  category: 'dev',
  icon: 'server',
  fields: {
    serverDirectory: {
      description: 'Directory containing the server',
      required: true,
    },
    command: {
      description: 'Command to run (default: pnpm start)',
      required: false,
    },
    watch: {
      description: 'Enable watch mode to auto-restart on file changes (default: true)',
      required: false,
    },
    watchDirectories: {
      description: 'Directories to watch for changes (default: serverDirectory)',
      required: false,
    },
    debounceMs: {
      description: 'Debounce delay in milliseconds before restart (default: 2000)',
      required: false,
    },
  },
  examples: [
    '$ auto start:server --server-directory=./server',
    '$ auto start:server --server-directory=./server --command="pnpm dev"',
    '$ auto start:server --server-directory=./server --watch',
    '$ auto start:server --server-directory=./server --watch --watch-directories=./server,./shared',
  ],
  events: [
    { name: 'ServerStarted', displayName: 'Server Started' },
    { name: 'ServerStartFailed', displayName: 'Server Start Failed' },
    { name: 'ServerRestarting', displayName: 'Server Restarting' },
    { name: 'ServerRestarted', displayName: 'Server Restarted' },
  ],
  handle: async (command: Command): Promise<ServerStartedEvent | ServerStartFailedEvent> => {
    const typedCommand = command as StartServerCommand;
    debug('CommandHandler executing for StartServer');

    const {
      serverDirectory,
      command: customCommand,
      watch: watchEnabled = true,
      watchDirectories,
      debounceMs = DEFAULT_DEBOUNCE_MS,
    } = typedCommand.data;

    debug('Handling StartServerCommand');
    debug('  Server directory: %s', serverDirectory);
    debug('  Command: %s', customCommand ?? 'pnpm start');
    debug('  Watch enabled: %s', watchEnabled);
    debug('  Watch directories: %o', watchDirectories);
    debug('  Debounce: %dms', debounceMs);
    debug('  Request ID: %s', typedCommand.requestId);
    debug('  Correlation ID: %s', typedCommand.correlationId ?? 'none');

    try {
      const serverDir = path.resolve(serverDirectory);

      debug('Resolved paths:');
      debug('  Server directory: %s', serverDir);

      await access(path.join(serverDir, 'package.json'));
      debug('package.json found in server directory');

      const cmd = customCommand ?? 'pnpm start';
      const { executable, args } = parseCommand(cmd);

      let currentProcess = await startProcess(executable, args, serverDir);

      if (watchEnabled) {
        const dirsToWatch = watchDirectories?.map((d) => path.resolve(d)) ?? [serverDir];
        let debounceTimeout: NodeJS.Timeout | null = null;
        let isRestarting = false;
        let lastRestartTime = 0;
        const restartCooldownMs = debounceMs;

        const handleFileChange = (changedPath: string): void => {
          if (isRestarting) {
            debug('Already restarting, ignoring change: %s', changedPath);
            return;
          }

          const timeSinceLastRestart = Date.now() - lastRestartTime;
          if (timeSinceLastRestart < restartCooldownMs) {
            debug(
              'In cooldown period (%dms remaining), ignoring: %s',
              restartCooldownMs - timeSinceLastRestart,
              changedPath,
            );
            return;
          }

          if (debounceTimeout) {
            clearTimeout(debounceTimeout);
          }

          debug('File change detected, will restart in %dms: %s', debounceMs, changedPath);

          debounceTimeout = setTimeout(() => {
            debounceTimeout = null;
            isRestarting = true;
            debug('Restarting server due to file change: %s', changedPath);

            killProcess(currentProcess)
              .then(() => startProcess(executable, args, serverDir))
              .then((newProcess) => {
                currentProcess = newProcess;
                lastRestartTime = Date.now();
                debug('Server restarted with new PID: %d', newProcess.pid);
                isRestarting = false;
              })
              .catch((error) => {
                debug('Failed to restart server: %O', error);
                isRestarting = false;
              });
          }, debounceMs);
        };

        createFileWatcher(dirsToWatch, handleFileChange);
        debug('File watcher started for directories: %o', dirsToWatch);
      }

      return {
        type: 'ServerStarted',
        data: {
          serverDirectory,
          pid: currentProcess.pid,
          watching: watchEnabled,
        },
        timestamp: new Date(),
        requestId: typedCommand.requestId,
        correlationId: typedCommand.correlationId,
      };
    } catch (error) {
      debug('ERROR: Exception caught: %O', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      return {
        type: 'ServerStartFailed',
        data: {
          serverDirectory,
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
