import { commandHandler as startClientHandler } from './commands/start-client';
import { commandHandler as startServerHandler } from './commands/start-server';
import { commandHandler as startStorybookHandler } from './commands/start-storybook';

export const COMMANDS = [startServerHandler, startClientHandler, startStorybookHandler];

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
export {
  commandHandler as startStorybookCommandHandler,
  type StartStorybookCommand,
  type StartStorybookEvents,
  type StorybookStartedEvent,
  type StorybookStartFailedEvent,
} from './commands/start-storybook';
