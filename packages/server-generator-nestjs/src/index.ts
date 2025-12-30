import { commandHandler as generateServerHandler } from './commands/generate-server.js';

export const COMMANDS = [generateServerHandler];
export type {
  GenerateServerCommand,
  GenerateServerEvents,
  ServerGeneratedEvent,
  ServerGenerationFailedEvent,
  SliceGeneratedEvent,
} from './commands/generate-server.js';
