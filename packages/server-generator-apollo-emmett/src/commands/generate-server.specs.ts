import type { CommandSlice, Model, Narrative } from '@auto-engineer/narrative';
import { describe, expect, it } from 'vitest';
import type { GenerateServerCommand, GenerateServerEvents } from './generate-server';
import { createSliceGeneratedEvent, emitSliceGeneratedForAffected, emitSliceGeneratedForAll } from './generate-server';

const makeCommand = (): GenerateServerCommand => ({
  type: 'GenerateServer',
  data: { modelPath: '.context/schema.json', destination: '.' },
  requestId: 'req-1',
  correlationId: 'cor-1',
});

const makeSlice = (name: string): CommandSlice => ({
  name,
  type: 'command',
  client: { specs: [] },
  server: { description: `Handle ${name}`, specs: [] },
});

const makeModel = (): Model => ({
  variant: 'specs',
  narratives: [
    {
      name: 'Todo',
      slices: [makeSlice('AddTodo'), makeSlice('RemoveTodo')],
    },
  ],
  messages: [],
  modules: [],
});

describe('createSliceGeneratedEvent', () => {
  it('builds SliceGenerated event from flow, slice, and command', () => {
    const flow: Narrative = {
      name: 'PropertyListing',
      slices: [],
    };
    const slice: CommandSlice = {
      name: 'CreateListing',
      type: 'command',
      client: { specs: [] },
      server: { description: 'Create a listing', specs: [] },
    };

    const event = createSliceGeneratedEvent(flow, slice, makeCommand());

    expect(event).toEqual({
      type: 'SliceGenerated',
      data: {
        flowName: 'PropertyListing',
        sliceName: 'CreateListing',
        sliceType: 'command',
        schemaPath: '.context/schema.json',
        slicePath: 'server/src/domain/flows/property-listing/create-listing',
      },
      timestamp: expect.any(Date),
      requestId: 'req-1',
      correlationId: 'cor-1',
    });
  });
});

describe('emitSliceGeneratedForAll', () => {
  it('emits SliceGenerated for every non-experience slice', () => {
    const events: GenerateServerEvents[] = [];
    emitSliceGeneratedForAll(makeModel(), makeCommand(), events);

    expect(events).toEqual([
      expect.objectContaining({ type: 'SliceGenerated', data: expect.objectContaining({ sliceName: 'AddTodo' }) }),
      expect.objectContaining({ type: 'SliceGenerated', data: expect.objectContaining({ sliceName: 'RemoveTodo' }) }),
    ]);
  });

  it('skips experience slices', () => {
    const model: Model = {
      variant: 'specs',
      narratives: [
        {
          name: 'Todo',
          slices: [makeSlice('AddTodo'), { name: 'ViewTodos', type: 'experience', client: { specs: [] } }],
        },
      ],
      messages: [],
      modules: [],
    };
    const events: GenerateServerEvents[] = [];
    emitSliceGeneratedForAll(model, makeCommand(), events);

    expect(events).toEqual([
      expect.objectContaining({ type: 'SliceGenerated', data: expect.objectContaining({ sliceName: 'AddTodo' }) }),
    ]);
  });
});

describe('emitSliceGeneratedForAffected', () => {
  it('emits SliceGenerated only for affected slice IDs', () => {
    const events: GenerateServerEvents[] = [];
    const affectedIds = new Set(['todo/add-todo']);
    emitSliceGeneratedForAffected(makeModel(), affectedIds, makeCommand(), events);

    expect(events).toEqual([
      expect.objectContaining({ type: 'SliceGenerated', data: expect.objectContaining({ sliceName: 'AddTodo' }) }),
    ]);
  });

  it('emits nothing when no slices are affected', () => {
    const events: GenerateServerEvents[] = [];
    emitSliceGeneratedForAffected(makeModel(), new Set(), makeCommand(), events);

    expect(events).toEqual([]);
  });
});
