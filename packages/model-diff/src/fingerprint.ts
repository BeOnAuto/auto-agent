import { createHash } from 'node:crypto';
import type { Message, Model, Slice } from '@auto-engineer/narrative';
import {
  getCommandSourceMap,
  getEventSourceMap,
  getReferencedIntegrations,
  getReferencedMessageNames,
} from './model-dependencies';
import { stableStringify } from './stable-stringify';
import { toKebabCase } from './utils';

type SourceLocation = { flowName: string; sliceName: string };

export type SliceSnapshot = {
  slice: Slice;
  flowName: string;
  referencedMessages: Message[];
  eventSources: Record<string, SourceLocation>;
  commandSources: Record<string, SourceLocation>;
  referencedIntegrations?: Model['integrations'];
};

export function buildSliceSnapshot(slice: Slice, flowName: string, model: Model): SliceSnapshot {
  const messageNames = getReferencedMessageNames(slice);
  const referencedMessages = messageNames
    .map((name) => model.messages.find((m) => m.name === name))
    .filter((m): m is Message => m !== undefined)
    .sort((a, b) => a.name.localeCompare(b.name));
  const eventSources = getEventSourceMap(slice, model.narratives);
  const commandSources = getCommandSourceMap(slice, model.narratives);
  const referencedIntegrations = getReferencedIntegrations(slice, model.integrations);

  return { slice, flowName, referencedMessages, eventSources, commandSources, referencedIntegrations };
}

export function computeFingerprintFromSnapshot(snapshot: SliceSnapshot): string {
  const hash = createHash('sha256');
  hash.update(stableStringify(snapshot));
  return hash.digest('hex');
}

export function computeAllSnapshots(model: Model): Record<string, SliceSnapshot> {
  const snapshots: Record<string, SliceSnapshot> = {};
  for (const narrative of model.narratives) {
    for (const slice of narrative.slices) {
      const sliceId = `${toKebabCase(narrative.name)}/${toKebabCase(slice.name)}`;
      snapshots[sliceId] = buildSliceSnapshot(slice, narrative.name, model);
    }
  }
  return snapshots;
}

export function computeAllFingerprints(snapshots: Record<string, SliceSnapshot>): Record<string, string> {
  const fingerprints: Record<string, string> = {};
  for (const [sliceId, snapshot] of Object.entries(snapshots)) {
    fingerprints[sliceId] = computeFingerprintFromSnapshot(snapshot);
  }
  return fingerprints;
}
