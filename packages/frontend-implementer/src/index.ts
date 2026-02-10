// Command exports
import { commandHandler as implementClientHandler } from './commands/implement-client.js';
export const COMMANDS = [implementClientHandler];

// Test exports
export {
  type ChildComponent,
  getChildrenFromScheme,
  readChildrenSources,
  type Scheme,
} from './agent.js';
export type {
  ClientImplementationFailedEvent,
  ClientImplementedEvent,
  ImplementClientCommand,
  ImplementClientEvents,
} from './commands/implement-client.js';
