import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type { SliceSnapshot } from './fingerprint';

export type GenerationState = {
  version: 1;
  timestamp: string;
  sliceFingerprints: Record<string, string>;
  sliceSnapshots: Record<string, SliceSnapshot>;
  sharedTypesHash: string;
};

const STATE_VERSION = 1;

function statePath(destination: string): string {
  return join(destination, '.context', '.generation-state.json');
}

function isGenerationState(value: Record<string, unknown>): value is GenerationState {
  return (
    value.version === STATE_VERSION &&
    typeof value.timestamp === 'string' &&
    typeof value.sliceFingerprints === 'object' &&
    value.sliceFingerprints !== null &&
    typeof value.sliceSnapshots === 'object' &&
    value.sliceSnapshots !== null &&
    typeof value.sharedTypesHash === 'string'
  );
}

export async function loadGenerationState(destination: string): Promise<GenerationState | null> {
  try {
    const content = await readFile(statePath(destination), 'utf8');
    const parsed = JSON.parse(content) as Record<string, unknown>;
    if (!isGenerationState(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function saveGenerationState(destination: string, state: GenerationState): Promise<void> {
  const filePath = statePath(destination);
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(state, null, 2), 'utf8');
}
