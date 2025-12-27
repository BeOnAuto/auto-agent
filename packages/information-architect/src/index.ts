// Barrel exports
export {
  InformationArchitectAgent,
  processFlowsWithAI,
  type ValidationError,
  validateCompositionReferences,
} from './ia-agent.js';
export type { AIAgentOutput, UXSchema } from './types.js';

import { commandHandler as generateIAHandler } from './commands/generate-ia';
export const COMMANDS = [generateIAHandler];
export type {
  GenerateIACommand,
  GenerateIAEvents,
  IAGeneratedEvent,
  IAGenerationFailedEvent,
  IAValidationFailedEvent,
} from './commands/generate-ia';
