import type { CommandSlice, Narrative } from '@auto-engineer/narrative';
import { describe, expect, it } from 'vitest';
import type { GenerateServerCommand } from './generate-server';
import { createSliceGeneratedEvent } from './generate-server';

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
    const command: GenerateServerCommand = {
      type: 'GenerateServer',
      data: { modelPath: '.context/schema.json', destination: '.' },
      requestId: 'req-1',
      correlationId: 'cor-1',
    };

    const event = createSliceGeneratedEvent(flow, slice, command);

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
