import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { type Command, defineCommandHandler, type Event } from '@auto-engineer/message-bus';
import type { Model } from '@auto-engineer/narrative';
import type { ChangeSet } from '../change-detector';
import { computeChangeSet } from '../change-detector';
import { computeAllFingerprints, computeAllSnapshots } from '../fingerprint';
import type { GenerationState } from '../generation-state';
import { loadGenerationState } from '../generation-state';
import { computeSharedTypesHash } from '../model-dependencies';

type DetectChangesCommand = Command<
  'DetectChanges',
  {
    modelPath: string;
    destination: string;
    force?: boolean;
  }
>;

type ChangesDetectedEvent = Event<
  'ChangesDetected',
  {
    modelPath: string;
    destination: string;
    changeSet: ChangeSet;
    isFirstRun: boolean;
    newState: GenerationState;
  }
>;

type ChangeDetectionFailedEvent = Event<
  'ChangeDetectionFailed',
  {
    modelPath: string;
    destination: string;
    error: string;
  }
>;

type DetectChangesEvents = ChangesDetectedEvent | ChangeDetectionFailedEvent;

export const commandHandler = defineCommandHandler({
  name: 'DetectChanges',
  displayName: 'Detect Changes',
  alias: 'detect:changes',
  description: 'Detect model-level changes between pipeline runs',
  category: 'generate',
  icon: 'diff',
  events: [
    { name: 'ChangesDetected', displayName: 'Changes Detected' },
    { name: 'ChangeDetectionFailed', displayName: 'Change Detection Failed' },
  ],
  fields: {
    modelPath: { description: 'Path to the JSON model file', required: true },
    destination: { description: 'Project root directory', required: true },
    force: { description: 'Force full regeneration (treat as first run)' },
  },
  examples: ['$ auto detect:changes --model-path=.context/schema.json --destination=.'],
  handle: async (command: Command): Promise<DetectChangesEvents> => {
    const typed = command as DetectChangesCommand;
    const { modelPath, destination, force } = typed.data;

    try {
      const absModel = resolve(modelPath);
      const absDest = resolve(destination);

      const content = await readFile(absModel, 'utf8');
      const model = JSON.parse(content) as Model;

      const previousState = force ? null : await loadGenerationState(absDest);
      const isFirstRun = previousState === null;

      const snapshots = computeAllSnapshots(model);
      const fingerprints = computeAllFingerprints(snapshots);
      const sharedTypesHash = computeSharedTypesHash(model.messages);
      const changeSet = computeChangeSet(previousState, fingerprints, snapshots, sharedTypesHash);

      const newState: GenerationState = {
        version: 1,
        timestamp: new Date().toISOString(),
        sliceFingerprints: fingerprints,
        sliceSnapshots: snapshots,
        sharedTypesHash,
      };

      const contextDir = join(absDest, '.context');
      await mkdir(contextDir, { recursive: true });
      await writeFile(join(contextDir, '.change-set.json'), JSON.stringify(changeSet, null, 2), 'utf8');

      return {
        type: 'ChangesDetected',
        data: { modelPath, destination, changeSet, isFirstRun, newState },
        timestamp: new Date(),
        requestId: typed.requestId,
        correlationId: typed.correlationId,
      };
    } catch (error) {
      return {
        type: 'ChangeDetectionFailed',
        data: {
          modelPath,
          destination,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        timestamp: new Date(),
        requestId: typed.requestId,
        correlationId: typed.correlationId,
      };
    }
  },
});
