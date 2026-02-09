import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Model } from '@auto-engineer/narrative';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { ChangeSet } from '../change-detector';
import type { GenerationState } from '../generation-state';
import { saveGenerationState } from '../generation-state';
import { commandHandler } from './detect-changes';

const makeSpec = (steps: Array<{ keyword: 'Given' | 'When' | 'Then'; text: string }>) => [
  {
    type: 'gherkin' as const,
    feature: 'test',
    rules: [{ name: 'r1', examples: [{ name: 'e1', steps }] }],
  },
];

const testModel: Model = {
  variant: 'specs',
  narratives: [
    {
      name: 'Todo',
      slices: [
        {
          name: 'AddTodo',
          type: 'command' as const,
          client: { specs: [] },
          server: {
            description: 'Add a todo',
            specs: makeSpec([
              { keyword: 'When', text: 'AddTodo' },
              { keyword: 'Then', text: 'TodoAdded' },
            ]),
          },
        },
      ],
    },
  ],
  messages: [
    { name: 'AddTodo', type: 'command' as const, fields: [{ name: 'title', type: 'string', required: true }] },
    { name: 'TodoAdded', type: 'event' as const, fields: [{ name: 'id', type: 'string', required: true }] },
  ],
  modules: [],
};

describe('DetectChanges command handler', () => {
  let testDir: string;
  let modelPath: string;

  beforeEach(async () => {
    testDir = join(tmpdir(), `detect-changes-test-${Date.now()}`);
    await mkdir(join(testDir, '.context'), { recursive: true });
    modelPath = join(testDir, '.context', 'schema.json');
    await writeFile(modelPath, JSON.stringify(testModel), 'utf8');
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it('emits ChangesDetected with all slices added on first run', async () => {
    const result = await commandHandler.handle({
      type: 'DetectChanges',
      data: { modelPath, destination: testDir },
    });

    const event = result as {
      type: string;
      data: { changeSet: ChangeSet; isFirstRun: boolean; newState: GenerationState };
    };
    expect(event.type).toBe('ChangesDetected');
    expect(event.data.isFirstRun).toBe(true);
    expect(event.data.changeSet.added).toEqual(['todo/add-todo']);
    expect(event.data.changeSet.removed).toEqual([]);
    expect(event.data.changeSet.changed).toEqual([]);
    expect(event.data.changeSet.allAffected).toEqual(['todo/add-todo']);
    expect(event.data.newState.version).toBe(1);
    expect(Object.keys(event.data.newState.sliceFingerprints)).toEqual(['todo/add-todo']);
  });

  it('detects no changes on second run with identical model', async () => {
    const firstResult = await commandHandler.handle({
      type: 'DetectChanges',
      data: { modelPath, destination: testDir },
    });
    const firstEvent = firstResult as { data: { newState: GenerationState } };
    await saveGenerationState(testDir, firstEvent.data.newState);

    const secondResult = await commandHandler.handle({
      type: 'DetectChanges',
      data: { modelPath, destination: testDir },
    });
    const secondEvent = secondResult as { type: string; data: { changeSet: ChangeSet; isFirstRun: boolean } };
    expect(secondEvent.type).toBe('ChangesDetected');
    expect(secondEvent.data.isFirstRun).toBe(false);
    expect(secondEvent.data.changeSet).toEqual({
      added: [],
      removed: [],
      changed: [],
      sharedTypesChanged: false,
      allAffected: [],
      deltas: {},
    });
  });

  it('detects changes when model is modified between runs', async () => {
    const firstResult = await commandHandler.handle({
      type: 'DetectChanges',
      data: { modelPath, destination: testDir },
    });
    const firstEvent = firstResult as { data: { newState: GenerationState } };
    await saveGenerationState(testDir, firstEvent.data.newState);

    const modifiedModel = {
      ...testModel,
      messages: [
        ...testModel.messages,
        { name: 'TodoRemoved', type: 'event' as const, fields: [{ name: 'id', type: 'string', required: true }] },
      ],
      narratives: [
        {
          ...testModel.narratives[0],
          slices: [
            ...testModel.narratives[0].slices,
            {
              name: 'RemoveTodo',
              type: 'command' as const,
              client: { specs: [] },
              server: {
                description: 'Remove a todo',
                specs: makeSpec([
                  { keyword: 'When', text: 'RemoveTodo' },
                  { keyword: 'Then', text: 'TodoRemoved' },
                ]),
              },
            },
          ],
        },
      ],
    };
    await writeFile(modelPath, JSON.stringify(modifiedModel), 'utf8');

    const secondResult = await commandHandler.handle({
      type: 'DetectChanges',
      data: { modelPath, destination: testDir },
    });
    const secondEvent = secondResult as { type: string; data: { changeSet: ChangeSet } };
    expect(secondEvent.data.changeSet.added).toEqual(['todo/remove-todo']);
  });

  it('treats as first run when force is true', async () => {
    const firstResult = await commandHandler.handle({
      type: 'DetectChanges',
      data: { modelPath, destination: testDir },
    });
    const firstEvent = firstResult as { data: { newState: GenerationState } };
    await saveGenerationState(testDir, firstEvent.data.newState);

    const forcedResult = await commandHandler.handle({
      type: 'DetectChanges',
      data: { modelPath, destination: testDir, force: true },
    });
    const forcedEvent = forcedResult as { type: string; data: { isFirstRun: boolean; changeSet: ChangeSet } };
    expect(forcedEvent.data.isFirstRun).toBe(true);
    expect(forcedEvent.data.changeSet.added).toEqual(['todo/add-todo']);
  });

  it('writes change set to .context/.change-set.json', async () => {
    await commandHandler.handle({
      type: 'DetectChanges',
      data: { modelPath, destination: testDir },
    });

    const content = await readFile(join(testDir, '.context', '.change-set.json'), 'utf8');
    const changeSet = JSON.parse(content) as ChangeSet;
    expect(changeSet.added).toEqual(['todo/add-todo']);
  });

  it('emits ChangeDetectionFailed when model file is missing', async () => {
    const result = await commandHandler.handle({
      type: 'DetectChanges',
      data: { modelPath: '/nonexistent/model.json', destination: testDir },
    });

    const event = result as { type: string; data: { error: string } };
    expect(event.type).toBe('ChangeDetectionFailed');
    expect(event.data.error).toContain('ENOENT');
  });
});
