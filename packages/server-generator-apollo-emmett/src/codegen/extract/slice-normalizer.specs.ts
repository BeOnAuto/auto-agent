import type { Slice, Spec } from '@auto-engineer/narrative';
import { describe, expect, it } from 'vitest';
import type { MessageDefinition } from '../types';
import { normalizeSliceForTemplate } from './slice-normalizer';

function createReactSlice(specs: Spec[]): Slice {
  return {
    type: 'react',
    name: 'NotifyUpcomingWorkout',
    client: { specs: [] },
    server: { description: '', specs },
  } as unknown as Slice;
}

describe('slice-normalizer', () => {
  describe('normalizeReactPatternB — typical pattern preserves command in then', () => {
    it('should move trigger event to when and place original command in then', () => {
      const specs: Spec[] = [
        {
          type: 'gherkin',
          feature: 'Notify upcoming workout',
          rules: [
            {
              name: 'When workout is scheduled, notify user',
              examples: [
                {
                  name: 'should notify user of upcoming workout',
                  steps: [
                    {
                      keyword: 'Given',
                      text: 'WorkoutScheduled',
                      docString: { workoutId: 'wrk_001', scheduledAt: '2030-01-01T09:00:00Z' },
                    },
                    {
                      keyword: 'When',
                      text: 'UpdateWorkoutProgress',
                      docString: { workoutId: 'wrk_001', progress: 50 },
                    },
                    {
                      keyword: 'Then',
                      text: 'WorkoutProgressUpdated',
                      docString: { workoutId: 'wrk_001', progress: 50 },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ];

      const allMessages: MessageDefinition[] = [
        {
          type: 'event',
          name: 'WorkoutScheduled',
          fields: [
            { name: 'workoutId', type: 'string', required: true },
            { name: 'scheduledAt', type: 'Date', required: true },
          ],
        },
        {
          type: 'command',
          name: 'UpdateWorkoutProgress',
          fields: [
            { name: 'workoutId', type: 'string', required: true },
            { name: 'progress', type: 'number', required: true },
          ],
        },
        {
          type: 'event',
          name: 'WorkoutProgressUpdated',
          fields: [
            { name: 'workoutId', type: 'string', required: true },
            { name: 'progress', type: 'number', required: true },
          ],
        },
      ];

      const slice = createReactSlice(specs);
      const result = normalizeSliceForTemplate(slice, allMessages);
      const normalizedSpecs = result.server?.specs;
      const example = normalizedSpecs?.rules[0].examples[0];

      expect(example?.when).toEqual([
        { eventRef: 'WorkoutScheduled', exampleData: { workoutId: 'wrk_001', scheduledAt: '2030-01-01T09:00:00Z' } },
      ]);

      expect(example?.then).toEqual([
        { commandRef: 'UpdateWorkoutProgress', exampleData: { workoutId: 'wrk_001', progress: 50 } },
      ]);
    });
  });
});
