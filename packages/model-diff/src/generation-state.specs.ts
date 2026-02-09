import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { SliceSnapshot } from './fingerprint';
import type { GenerationState } from './generation-state';
import { loadGenerationState, saveGenerationState } from './generation-state';

const stubSnapshot: SliceSnapshot = {
  slice: {
    name: 'AddTodo',
    type: 'command',
    client: { specs: [] },
    server: { description: '', specs: [] },
  },
  flowName: 'Todo',
  referencedMessages: [],
  eventSources: {},
  commandSources: {},
  referencedIntegrations: undefined,
};

describe('generation state persistence', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = join(tmpdir(), `model-diff-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  const validState: GenerationState = {
    version: 1,
    timestamp: '2024-01-01T00:00:00.000Z',
    sliceFingerprints: { 'todo/add-todo': 'abc123' },
    sliceSnapshots: { 'todo/add-todo': stubSnapshot },
    sharedTypesHash: 'hash123',
  };

  describe('saveGenerationState', () => {
    it('writes state to .context/.generation-state.json', async () => {
      await saveGenerationState(testDir, validState);

      const content = await readFile(join(testDir, '.context', '.generation-state.json'), 'utf8');
      const parsed = JSON.parse(content);
      expect(parsed).toEqual(validState);
    });

    it('creates .context directory if it does not exist', async () => {
      await saveGenerationState(testDir, validState);

      const content = await readFile(join(testDir, '.context', '.generation-state.json'), 'utf8');
      expect(JSON.parse(content)).toEqual(validState);
    });
  });

  describe('loadGenerationState', () => {
    it('loads previously saved state', async () => {
      await saveGenerationState(testDir, validState);
      const loaded = await loadGenerationState(testDir);
      expect(loaded).toEqual(validState);
    });

    it('returns null when file does not exist', async () => {
      const loaded = await loadGenerationState(testDir);
      expect(loaded).toBeNull();
    });

    it('returns null when file has wrong version', async () => {
      const badState = { ...validState, version: 999 };
      await mkdir(join(testDir, '.context'), { recursive: true });
      await writeFile(join(testDir, '.context', '.generation-state.json'), JSON.stringify(badState), 'utf8');

      const loaded = await loadGenerationState(testDir);
      expect(loaded).toBeNull();
    });

    it('returns null when file contains invalid JSON', async () => {
      await mkdir(join(testDir, '.context'), { recursive: true });
      await writeFile(join(testDir, '.context', '.generation-state.json'), 'not json', 'utf8');

      const loaded = await loadGenerationState(testDir);
      expect(loaded).toBeNull();
    });
  });
});
