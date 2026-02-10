export type {
  GenerateReactClientCommand,
  GenerateReactClientEvents,
} from './commands/generate-react-client.js';
export { commandHandler as generateReactClientCommandHandler } from './commands/generate-react-client.js';

import { commandHandler } from './commands/generate-react-client.js';
export const COMMANDS = [commandHandler];
