import { describe, expect, it } from 'vitest';
import { evolve, initialState } from './evolve';
import { classifyJobEvent, handleJobEvent, isJobFailure, parseCorrelationId } from './handle-job-event';

describe('parseCorrelationId', () => {
  it('extracts graphId and jobId from graph correlation format', () => {
    expect(parseCorrelationId('graph:g1:job-a')).toEqual({ graphId: 'g1', jobId: 'job-a' });
  });
});

describe('isJobFailure', () => {
  it('returns true when event data contains error field', () => {
    expect(isJobFailure({ type: 'BuildFailed', data: { error: 'compile error' } })).toBe(true);
  });
});

describe('classifyJobEvent', () => {
  it('returns null for events without graph correlation', () => {
    expect(classifyJobEvent({ type: 'Unrelated', data: {} })).toBe(null);
  });

  it('returns JobFailed when event has error field', () => {
    const result = classifyJobEvent({
      type: 'BuildFailed',
      data: { error: 'compile error' },
      correlationId: 'graph:g1:job-a',
    });

    expect(result).toEqual({
      type: 'JobFailed',
      data: { jobId: 'job-a', error: 'compile error' },
    });
  });

  it('returns JobSucceeded when event has no error', () => {
    const result = classifyJobEvent({
      type: 'BuildCompleted',
      data: { output: 'success' },
      correlationId: 'graph:g1:job-a',
    });

    expect(result).toEqual({
      type: 'JobSucceeded',
      data: { jobId: 'job-a', result: { output: 'success' } },
    });
  });
});

describe('handleJobEvent', () => {
  it('returns null for events without graph correlation', () => {
    const state = evolve(initialState(), {
      type: 'GraphSubmitted',
      data: {
        graphId: 'g1',
        jobs: [{ id: 'a', dependsOn: [], target: 'build', payload: {} }],
        failurePolicy: 'halt',
      },
    });

    const result = handleJobEvent(state, { type: 'Unrelated', data: {} });

    expect(result).toBe(null);
  });

  it('emits JobSucceeded and dispatches ready dependents', () => {
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

    const result = handleJobEvent(state, {
      type: 'BuildCompleted',
      data: { output: 'ok' },
      correlationId: 'graph:g1:a',
    });

    expect(result).toEqual({
      events: [{ type: 'JobSucceeded', data: { jobId: 'a', result: { output: 'ok' } } }],
      readyJobs: ['b'],
      graphComplete: false,
    });
  });

  it('marks graph complete when last job succeeds', () => {
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

    const result = handleJobEvent(state, {
      type: 'BuildCompleted',
      data: { output: 'ok' },
      correlationId: 'graph:g1:a',
    });

    expect(result).toEqual({
      events: [{ type: 'JobSucceeded', data: { jobId: 'a', result: { output: 'ok' } } }],
      readyJobs: [],
      graphComplete: true,
    });
  });

  it('applies halt policy and marks graph complete on failure', () => {
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

    const result = handleJobEvent(state, {
      type: 'BuildFailed',
      data: { error: 'compile error' },
      correlationId: 'graph:g1:a',
    });

    expect(result).toEqual({
      events: [
        { type: 'JobFailed', data: { jobId: 'a', error: 'compile error' } },
        { type: 'JobSkipped', data: { jobId: 'b', reason: 'halt policy' } },
      ],
      readyJobs: [],
      graphComplete: true,
    });
  });
});
