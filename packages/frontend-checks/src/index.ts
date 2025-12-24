// Barrel exports
export {
  BrowserManager,
  closeBrowser,
  getBuildErrors,
  getConsoleErrors,
  getPageScreenshot,
  getTsErrors,
} from './browser-manager.js';

// Export CLI manifest
import { checkClientCommandHandler } from './commands/check-client';
export const COMMANDS = [checkClientCommandHandler];
export {
  type CheckClientCommand,
  type CheckClientEvents,
  type ClientCheckedEvent,
  type ClientCheckFailedEvent,
  checkClientCommandHandler,
} from './commands/check-client';
