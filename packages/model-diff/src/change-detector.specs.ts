import { describe, expect, it } from 'vitest';
import { computeChangeSet } from './change-detector';
import type { SliceSnapshot } from './fingerprint';
import type { GenerationState } from './generation-state';

const makeSnapshot = (name: string): SliceSnapshot => ({
  slice: { name, type: 'command', client: { specs: [] }, server: { description: '', specs: [] } },
  flowName: 'Flow',
  referencedMessages: [],
  eventSources: {},
  commandSources: {},
  referencedIntegrations: undefined,
});

const makeState = (
  fingerprints: Record<string, string>,
  snapshots: Record<string, SliceSnapshot>,
): GenerationState => ({
  version: 1,
  timestamp: '2024-01-01T00:00:00.000Z',
  sliceFingerprints: fingerprints,
  sliceSnapshots: snapshots,
  sharedTypesHash: 'hash1',
});

describe('computeChangeSet', () => {
  it('marks all slices as added when no previous state', () => {
    const snapA = makeSnapshot('A');
    const result = computeChangeSet(null, { 'f/a': 'h1' }, { 'f/a': snapA }, 'hash1');

    expect(result).toEqual({
      added: ['f/a'],
      removed: [],
      changed: [],
      sharedTypesChanged: true,
      allAffected: ['f/a'],
      deltas: { 'f/a': { type: 'added', current: snapA } },
    });
  });

  it('detects added slices', () => {
    const snapA = makeSnapshot('A');
    const snapB = makeSnapshot('B');
    const prev = makeState({ 'f/a': 'h1' }, { 'f/a': snapA });
    const result = computeChangeSet(prev, { 'f/a': 'h1', 'f/b': 'h2' }, { 'f/a': snapA, 'f/b': snapB }, 'hash1');

    expect(result).toEqual({
      added: ['f/b'],
      removed: [],
      changed: [],
      sharedTypesChanged: false,
      allAffected: ['f/b'],
      deltas: { 'f/b': { type: 'added', current: snapB } },
    });
  });

  it('detects removed slices', () => {
    const snapA = makeSnapshot('A');
    const snapB = makeSnapshot('B');
    const prev = makeState({ 'f/a': 'h1', 'f/b': 'h2' }, { 'f/a': snapA, 'f/b': snapB });
    const result = computeChangeSet(prev, { 'f/a': 'h1' }, { 'f/a': snapA }, 'hash1');

    expect(result).toEqual({
      added: [],
      removed: ['f/b'],
      changed: [],
      sharedTypesChanged: false,
      allAffected: [],
      deltas: { 'f/b': { type: 'removed', previous: snapB } },
    });
  });

  it('detects changed slices via different fingerprints', () => {
    const prevSnap = makeSnapshot('A');
    const currSnap = makeSnapshot('A-updated');
    const prev = makeState({ 'f/a': 'h1' }, { 'f/a': prevSnap });
    const result = computeChangeSet(prev, { 'f/a': 'h2' }, { 'f/a': currSnap }, 'hash1');

    expect(result).toEqual({
      added: [],
      removed: [],
      changed: ['f/a'],
      sharedTypesChanged: false,
      allAffected: ['f/a'],
      deltas: { 'f/a': { type: 'changed', previous: prevSnap, current: currSnap } },
    });
  });

  it('marks all current slices as affected when shared types change', () => {
    const snapA = makeSnapshot('A');
    const snapB = makeSnapshot('B');
    const prev = makeState({ 'f/a': 'h1', 'f/b': 'h2' }, { 'f/a': snapA, 'f/b': snapB });
    const result = computeChangeSet(
      prev,
      { 'f/a': 'h1', 'f/b': 'h2' },
      { 'f/a': snapA, 'f/b': snapB },
      'different-hash',
    );

    expect(result).toEqual({
      added: [],
      removed: [],
      changed: [],
      sharedTypesChanged: true,
      allAffected: ['f/a', 'f/b'],
      deltas: {},
    });
  });

  it('returns empty change set when nothing changed', () => {
    const prev = makeState({ 'f/a': 'h1' }, { 'f/a': makeSnapshot('A') });
    const result = computeChangeSet(prev, { 'f/a': 'h1' }, { 'f/a': makeSnapshot('A') }, 'hash1');

    expect(result).toEqual({
      added: [],
      removed: [],
      changed: [],
      sharedTypesChanged: false,
      allAffected: [],
      deltas: {},
    });
  });

  it('does not create deltas for unchanged slices even when shared types change', () => {
    const snapA = makeSnapshot('A');
    const prev = makeState({ 'f/a': 'h1' }, { 'f/a': snapA });
    const result = computeChangeSet(prev, { 'f/a': 'h1' }, { 'f/a': snapA }, 'different-hash');

    expect(result).toEqual({
      added: [],
      removed: [],
      changed: [],
      sharedTypesChanged: true,
      allAffected: ['f/a'],
      deltas: {},
    });
  });
});
