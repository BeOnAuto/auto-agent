import { commandHandler as detectChangesHandler } from './commands/detect-changes';

export const COMMANDS = [detectChangesHandler];
export type { ChangeSet, SliceDelta } from './change-detector';
export type { SliceSnapshot } from './fingerprint';
export type { GenerationState } from './generation-state';
export { saveGenerationState } from './generation-state';
