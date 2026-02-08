import { describe, expect, it } from 'vitest';
import { isJobFailure, parseCorrelationId } from './handle-job-event';

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
