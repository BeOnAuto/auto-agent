import { commandHandler as startClientHandler } from './commands/start-client';
import { commandHandler as startServerHandler } from './commands/start-server';

export const COMMANDS = [startServerHandler, startClientHandler];

export {
  type ClientStartedEvent,
  type ClientStartFailedEvent,
  commandHandler as startClientCommandHandler,
  type StartClientCommand,
  type StartClientEvents,
} from './commands/start-client';
export {
  commandHandler as startServerCommandHandler,
  type ServerStartedEvent,
  type ServerStartFailedEvent,
  type StartServerCommand,
  type StartServerEvents,
} from './commands/start-server';
