import { describe, expect, it } from 'vitest';
import { evolve, getReadyJobs, initialState } from './evolve';
import { handleJobEvent } from './handle-job-event';

describe('diamond dependency graph', () => {
  it('processes a→(b,c)→d diamond graph to completion', () => {
    let state = evolve(initialState(), {
      type: 'GraphSubmitted',
      data: {
        graphId: 'g1',
        jobs: [
          { id: 'a', dependsOn: [], target: 'build', payload: {} },
          { id: 'b', dependsOn: ['a'], target: 'test', payload: {} },
          { id: 'c', dependsOn: ['a'], target: 'lint', payload: {} },
          { id: 'd', dependsOn: ['b', 'c'], target: 'deploy', payload: {} },
        ],
        failurePolicy: 'halt',
      },
    });

    expect(getReadyJobs(state)).toEqual(['a']);
    state = evolve(state, {
      type: 'JobDispatched',
      data: { jobId: 'a', target: 'build', correlationId: 'graph:g1:a' },
    });

    const r1 = handleJobEvent(state, {
      type: 'BuildCompleted',
      data: { output: 'ok' },
      correlationId: 'graph:g1:a',
    });
    expect(r1).toEqual({
      events: [{ type: 'JobSucceeded', data: { jobId: 'a', result: { output: 'ok' } } }],
      readyJobs: ['b', 'c'],
      graphComplete: false,
    });
    for (const e of r1!.events) state = evolve(state, e);

    state = evolve(state, {
      type: 'JobDispatched',
      data: { jobId: 'b', target: 'test', correlationId: 'graph:g1:b' },
    });
    state = evolve(state, {
      type: 'JobDispatched',
      data: { jobId: 'c', target: 'lint', correlationId: 'graph:g1:c' },
    });

    const r2 = handleJobEvent(state, {
      type: 'TestPassed',
      data: {},
      correlationId: 'graph:g1:b',
    });
    expect(r2).toEqual({
      events: [{ type: 'JobSucceeded', data: { jobId: 'b', result: {} } }],
      readyJobs: [],
      graphComplete: false,
    });
    for (const e of r2!.events) state = evolve(state, e);

    const r3 = handleJobEvent(state, {
      type: 'LintPassed',
      data: {},
      correlationId: 'graph:g1:c',
    });
    expect(r3).toEqual({
      events: [{ type: 'JobSucceeded', data: { jobId: 'c', result: {} } }],
      readyJobs: ['d'],
      graphComplete: false,
    });
    for (const e of r3!.events) state = evolve(state, e);

    state = evolve(state, {
      type: 'JobDispatched',
      data: { jobId: 'd', target: 'deploy', correlationId: 'graph:g1:d' },
    });

    const r4 = handleJobEvent(state, {
      type: 'Deployed',
      data: {},
      correlationId: 'graph:g1:d',
    });
    expect(r4).toEqual({
      events: [{ type: 'JobSucceeded', data: { jobId: 'd', result: {} } }],
      readyJobs: [],
      graphComplete: true,
    });
  });
});
