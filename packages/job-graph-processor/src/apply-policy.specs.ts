import { describe, expect, it } from 'vitest';
import { applyPolicy } from './apply-policy';
import { evolve, initialState } from './evolve';

describe('applyPolicy', () => {
  it('returns empty array before graph submission', () => {
    const events = applyPolicy(initialState(), 'a');

    expect(events).toEqual([]);
  });

  it('halt policy skips all pending jobs when a job fails', () => {
    let state = evolve(initialState(), {
      type: 'GraphSubmitted',
      data: {
        graphId: 'g1',
        jobs: [
          { id: 'a', dependsOn: [], target: 'build', payload: {} },
          { id: 'b', dependsOn: ['a'], target: 'test', payload: {} },
          { id: 'c', dependsOn: ['a'], target: 'lint', payload: {} },
        ],
        failurePolicy: 'halt',
      },
    });
    state = evolve(state, {
      type: 'JobDispatched',
      data: { jobId: 'a', target: 'build', correlationId: 'graph:g1:a' },
    });
    state = evolve(state, { type: 'JobFailed', data: { jobId: 'a', error: 'build error' } });

    const events = applyPolicy(state, 'a');

    expect(events).toEqual([
      { type: 'JobSkipped', data: { jobId: 'b', reason: 'halt policy' } },
      { type: 'JobSkipped', data: { jobId: 'c', reason: 'halt policy' } },
    ]);
  });
});
