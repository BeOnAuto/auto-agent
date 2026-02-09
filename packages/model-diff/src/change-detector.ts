import type { SliceSnapshot } from './fingerprint';
import type { GenerationState } from './generation-state';

export type SliceDelta = {
  type: 'added' | 'removed' | 'changed';
  previous?: SliceSnapshot;
  current?: SliceSnapshot;
};

export type ChangeSet = {
  added: string[];
  removed: string[];
  changed: string[];
  sharedTypesChanged: boolean;
  allAffected: string[];
  deltas: Record<string, SliceDelta>;
};

export function computeChangeSet(
  previousState: GenerationState | null,
  currentFingerprints: Record<string, string>,
  currentSnapshots: Record<string, SliceSnapshot>,
  currentSharedTypesHash: string,
): ChangeSet {
  const prevFingerprints = previousState?.sliceFingerprints ?? {};
  const prevSnapshots = previousState?.sliceSnapshots ?? {};
  const prevSharedHash = previousState?.sharedTypesHash ?? '';

  const currentIds = new Set(Object.keys(currentFingerprints));
  const previousIds = new Set(Object.keys(prevFingerprints));

  const added: string[] = [];
  const removed: string[] = [];
  const changed: string[] = [];
  const deltas: Record<string, SliceDelta> = {};

  for (const id of currentIds) {
    if (!previousIds.has(id)) {
      added.push(id);
      deltas[id] = { type: 'added', current: currentSnapshots[id] };
    } else if (currentFingerprints[id] !== prevFingerprints[id]) {
      changed.push(id);
      deltas[id] = { type: 'changed', previous: prevSnapshots[id], current: currentSnapshots[id] };
    }
  }

  for (const id of previousIds) {
    if (!currentIds.has(id)) {
      removed.push(id);
      deltas[id] = { type: 'removed', previous: prevSnapshots[id] };
    }
  }

  const sharedTypesChanged = currentSharedTypesHash !== prevSharedHash;

  const affectedSet = new Set([...added, ...changed]);
  if (sharedTypesChanged) {
    for (const id of currentIds) {
      affectedSet.add(id);
    }
  }
  const allAffected = [...affectedSet];

  return { added, removed, changed, sharedTypesChanged, allAffected, deltas };
}
