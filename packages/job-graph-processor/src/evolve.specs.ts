import { describe, expect, it } from 'vitest';
import { evolve, getReadyJobs, initialState } from './evolve';

describe('getReadyJobs', () => {
  it('returns root jobs after graph submission', () => {
    const state = evolve(initialState(), {
      type: 'GraphSubmitted',
      data: {
        graphId: 'g1',
        jobs: [
          { id: 'a', dependsOn: [], target: 'build', payload: {} },
          { id: 'b', dependsOn: ['a'], target: 'test', payload: {} },
        ],
        failurePolicy: 'halt',
      },
    });

    expect(getReadyJobs(state)).toEqual(['a']);
  });
});
