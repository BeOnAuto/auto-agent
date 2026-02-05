// Command exports
import { commandHandler as implementClientHandler } from './commands/implement-client.js';
export const COMMANDS = [implementClientHandler];
export type {
  ClientImplementationFailedEvent,
  ClientImplementedEvent,
  ImplementClientCommand,
  ImplementClientEvents,
} from './commands/implement-client.js';

// Test exports
export {
  getChildrenFromScheme,
  readChildrenSources,
  type ChildComponent,
  type Scheme,
} from './agent.js';
