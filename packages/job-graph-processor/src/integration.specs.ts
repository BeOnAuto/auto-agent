import { describe, expect, it, vi } from 'vitest';
import { evolve, getReadyJobs, initialState } from './evolve';
import { handleJobEvent } from './handle-job-event';
import { createTimeoutManager } from './timeout-manager';

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

describe('failure policies integration', () => {
  it('halt policy skips all pending and completes graph on failure', () => {
    let state = evolve(initialState(), {
      type: 'GraphSubmitted',
      data: {
        graphId: 'g1',
        jobs: [
          { id: 'a', dependsOn: [], target: 'build', payload: {} },
          { id: 'b', dependsOn: ['a'], target: 'test', payload: {} },
          { id: 'c', dependsOn: [], target: 'lint', payload: {} },
        ],
        failurePolicy: 'halt',
      },
    });
    state = evolve(state, {
      type: 'JobDispatched',
      data: { jobId: 'a', target: 'build', correlationId: 'graph:g1:a' },
    });

    const result = handleJobEvent(state, {
      type: 'BuildFailed',
      data: { error: 'compile error' },
      correlationId: 'graph:g1:a',
    });

    expect(result).toEqual({
      events: [
        { type: 'JobFailed', data: { jobId: 'a', error: 'compile error' } },
        { type: 'JobSkipped', data: { jobId: 'b', reason: 'halt policy' } },
        { type: 'JobSkipped', data: { jobId: 'c', reason: 'halt policy' } },
      ],
      readyJobs: [],
      graphComplete: true,
    });
  });

  it('skip-dependents policy skips only dependents and allows others to continue', () => {
    let state = evolve(initialState(), {
      type: 'GraphSubmitted',
      data: {
        graphId: 'g1',
        jobs: [
          { id: 'a', dependsOn: [], target: 'build', payload: {} },
          { id: 'b', dependsOn: ['a'], target: 'test', payload: {} },
          { id: 'c', dependsOn: [], target: 'lint', payload: {} },
        ],
        failurePolicy: 'skip-dependents',
      },
    });
    state = evolve(state, {
      type: 'JobDispatched',
      data: { jobId: 'a', target: 'build', correlationId: 'graph:g1:a' },
    });

    const result = handleJobEvent(state, {
      type: 'BuildFailed',
      data: { error: 'compile error' },
      correlationId: 'graph:g1:a',
    });

    expect(result).toEqual({
      events: [
        { type: 'JobFailed', data: { jobId: 'a', error: 'compile error' } },
        { type: 'JobSkipped', data: { jobId: 'b', reason: 'dependency failed' } },
      ],
      readyJobs: ['c'],
      graphComplete: false,
    });
  });

  it('continue policy unlocks dependents after failure', () => {
    let state = evolve(initialState(), {
      type: 'GraphSubmitted',
      data: {
        graphId: 'g1',
        jobs: [
          { id: 'a', dependsOn: [], target: 'build', payload: {} },
          { id: 'b', dependsOn: ['a'], target: 'test', payload: {} },
        ],
        failurePolicy: 'continue',
      },
    });
    state = evolve(state, {
      type: 'JobDispatched',
      data: { jobId: 'a', target: 'build', correlationId: 'graph:g1:a' },
    });

    const result = handleJobEvent(state, {
      type: 'BuildFailed',
      data: { error: 'compile error' },
      correlationId: 'graph:g1:a',
    });

    expect(result).toEqual({
      events: [{ type: 'JobFailed', data: { jobId: 'a', error: 'compile error' } }],
      readyJobs: ['b'],
      graphComplete: false,
    });
  });
});

describe('timeout integration', () => {
  it('fires timeout callback after elapsed time and evolve treats it as terminal', () => {
    vi.useFakeTimers();
    const timedOut: string[] = [];
    const manager = createTimeoutManager((jobId) => timedOut.push(jobId));

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

    manager.start('a', 5000);
    vi.advanceTimersByTime(5000);

    expect(timedOut).toEqual(['a']);

    state = evolve(state, { type: 'JobTimedOut', data: { jobId: 'a', timeoutMs: 5000 } });
    expect(getReadyJobs(state)).toEqual([]);

    vi.useRealTimers();
  });
});
