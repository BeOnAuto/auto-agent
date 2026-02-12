export type {
  ImplementReactComponentCommand,
  ImplementReactComponentEvents,
} from './commands/implement-react-component.js';
export { commandHandler as implementReactComponentCommandHandler } from './commands/implement-react-component.js';
export type { ComponentTask } from './types.js';

import { commandHandler } from './commands/implement-react-component.js';
export const COMMANDS = [commandHandler];
