import { commandHandler as checkLintHandler } from './commands/check-lint';
import { commandHandler as checkTestsHandler } from './commands/check-tests';
import { commandHandler as checkTypesHandler } from './commands/check-types';

export const COMMANDS = [checkTypesHandler, checkLintHandler, checkTestsHandler];
export {
  type CheckLintCommand,
  type CheckLintEvents,
  commandHandler as checkLintCommandHandler,
  type LintCheckFailedEvent,
  type LintCheckPassedEvent,
} from './commands/check-lint';
export {
  type CheckTestsCommand,
  type CheckTestsEvents,
  commandHandler as checkTestsCommandHandler,
  type TestsCheckFailedEvent,
  type TestsCheckPassedEvent,
} from './commands/check-tests';
export {
  type CheckTypesCommand,
  type CheckTypesEvents,
  commandHandler as checkTypesCommandHandler,
  type TypeCheckFailedEvent,
  type TypeCheckPassedEvent,
} from './commands/check-types';
