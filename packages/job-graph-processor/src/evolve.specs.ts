import { describe, expect, it } from 'vitest';
import { evolve, getReadyJobs, initialState, isGraphComplete } from './evolve';

describe('getReadyJobs', () => {
  it('returns empty array before graph submission', () => {
    expect(getReadyJobs(initialState())).toEqual([]);
  });

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

  it('unlocks dependent jobs after dependency succeeds', () => {
    let state = evolve(initialState(), {
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
    state = evolve(state, {
      type: 'JobDispatched',
      data: { jobId: 'a', target: 'build', correlationId: 'graph:g1:a' },
    });
    state = evolve(state, { type: 'JobSucceeded', data: { jobId: 'a' } });

    expect(getReadyJobs(state)).toEqual(['b']);
  });
});

describe('isGraphComplete', () => {
  it('returns false before graph submission', () => {
    expect(isGraphComplete(initialState())).toBe(false);
  });

  it('returns false when some jobs are still pending', () => {
    let state = evolve(initialState(), {
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
    state = evolve(state, {
      type: 'JobDispatched',
      data: { jobId: 'a', target: 'build', correlationId: 'graph:g1:a' },
    });
    state = evolve(state, { type: 'JobSucceeded', data: { jobId: 'a' } });

    expect(isGraphComplete(state)).toBe(false);
  });

  it('returns true when all jobs have succeeded', () => {
    let state = evolve(initialState(), {
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
    state = evolve(state, {
      type: 'JobDispatched',
      data: { jobId: 'a', target: 'build', correlationId: 'graph:g1:a' },
    });
    state = evolve(state, { type: 'JobSucceeded', data: { jobId: 'a' } });
    state = evolve(state, {
      type: 'JobDispatched',
      data: { jobId: 'b', target: 'test', correlationId: 'graph:g1:b' },
    });
    state = evolve(state, { type: 'JobSucceeded', data: { jobId: 'b' } });

    expect(isGraphComplete(state)).toBe(true);
  });
});
