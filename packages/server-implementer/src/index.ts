import { commandHandler as implementServerHandler } from './commands/implement-server';
import { commandHandler as implementSliceHandler } from './commands/implement-slice';

export const COMMANDS = [implementServerHandler, implementSliceHandler];
export { implementServerHandler, implementSliceHandler };
export type {
  ImplementServerCommand,
  ImplementServerEvents,
  ServerImplementationFailedEvent,
  ServerImplementedEvent,
} from './commands/implement-server';
export {
  handleImplementSliceCommand,
  type ImplementSliceCommand,
  type ImplementSliceEvents,
  type SliceImplementationFailedEvent,
  type SliceImplementedEvent,
} from './commands/implement-slice';
