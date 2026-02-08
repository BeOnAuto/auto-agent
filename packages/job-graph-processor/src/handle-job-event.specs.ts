import { describe, expect, it } from 'vitest';
import { classifyJobEvent, isJobFailure, parseCorrelationId } from './handle-job-event';

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
