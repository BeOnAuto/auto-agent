import { describe, expect, it } from 'vitest';
import { evolve, getReadyJobs, getTransitiveDependents, initialState, isGraphComplete } from './evolve';

describe('evolve', () => {
  it('ignores job events before graph submission', () => {
    const state = evolve(initialState(), { type: 'JobSucceeded', data: { jobId: 'a' } });

    expect(getReadyJobs(state)).toEqual([]);
    expect(isGraphComplete(state)).toBe(false);
  });

  it('ignores job events for unknown job IDs', () => {
    const state = evolve(initialState(), {
      type: 'GraphSubmitted',
      data: {
        graphId: 'g1',
        jobs: [{ id: 'a', dependsOn: [], target: 'build', payload: {} }],
        failurePolicy: 'halt',
      },
    });
    const after = evolve(state, { type: 'JobSucceeded', data: { jobId: 'unknown' } });

    expect(getReadyJobs(after)).toEqual(['a']);
  });
});

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

describe('getTransitiveDependents', () => {
  it('returns empty array before graph submission', () => {
    expect(getTransitiveDependents(initialState(), 'a')).toEqual([]);
  });

  it('returns direct and transitive dependents of a job', () => {
    const state = evolve(initialState(), {
      type: 'GraphSubmitted',
      data: {
        graphId: 'g1',
        jobs: [
          { id: 'a', dependsOn: [], target: 'build', payload: {} },
          { id: 'b', dependsOn: ['a'], target: 'test', payload: {} },
          { id: 'c', dependsOn: ['b'], target: 'deploy', payload: {} },
        ],
        failurePolicy: 'halt',
      },
    });

    expect(getTransitiveDependents(state, 'a').sort()).toEqual(['b', 'c']);
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

  it('returns true when a job has been skipped', () => {
    let state = evolve(initialState(), {
      type: 'GraphSubmitted',
      data: {
        graphId: 'g1',
        jobs: [{ id: 'a', dependsOn: [], target: 'build', payload: {} }],
        failurePolicy: 'halt',
      },
    });
    state = evolve(state, { type: 'JobSkipped', data: { jobId: 'a', reason: 'dependency failed' } });

    expect(isGraphComplete(state)).toBe(true);
  });

  it('returns true when a job has timed out', () => {
    let state = evolve(initialState(), {
      type: 'GraphSubmitted',
      data: {
        graphId: 'g1',
        jobs: [{ id: 'a', dependsOn: [], target: 'build', payload: {} }],
        failurePolicy: 'halt',
      },
    });
    state = evolve(state, {
      type: 'JobDispatched',
      data: { jobId: 'a', target: 'build', correlationId: 'graph:g1:a' },
    });
    state = evolve(state, { type: 'JobTimedOut', data: { jobId: 'a', timeoutMs: 5000 } });

    expect(isGraphComplete(state)).toBe(true);
  });

  it('returns true when a job has failed', () => {
    let state = evolve(initialState(), {
      type: 'GraphSubmitted',
      data: {
        graphId: 'g1',
        jobs: [{ id: 'a', dependsOn: [], target: 'build', payload: {} }],
        failurePolicy: 'halt',
      },
    });
    state = evolve(state, {
      type: 'JobDispatched',
      data: { jobId: 'a', target: 'build', correlationId: 'graph:g1:a' },
    });
    state = evolve(state, { type: 'JobFailed', data: { jobId: 'a', error: 'build error' } });

    expect(isGraphComplete(state)).toBe(true);
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
