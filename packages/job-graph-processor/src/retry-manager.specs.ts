import { describe, expect, it, vi } from 'vitest';
import { createRetryManager } from './retry-manager';

describe('createRetryManager', () => {
  it('schedules retry with initial backoff on first failure', () => {
    vi.useFakeTimers();
    const onRetry = vi.fn();
    const manager = createRetryManager(onRetry);

    manager.recordFailure('job-a', { maxRetries: 3, backoffMs: 100, maxBackoffMs: 5000 });
    vi.advanceTimersByTime(100);

    expect(onRetry).toHaveBeenCalledWith('job-a', 1);
    vi.useRealTimers();
  });

  it('uses exponential backoff on subsequent failures', () => {
    vi.useFakeTimers();
    const onRetry = vi.fn();
    const manager = createRetryManager(onRetry);
    const config = { maxRetries: 3, backoffMs: 100, maxBackoffMs: 5000 };

    manager.recordFailure('job-a', config);
    vi.advanceTimersByTime(100);
    manager.recordFailure('job-a', config);
    vi.advanceTimersByTime(199);
    expect(onRetry).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1);

    expect(onRetry).toHaveBeenCalledTimes(2);
    expect(onRetry).toHaveBeenLastCalledWith('job-a', 2);
    vi.useRealTimers();
  });

  it('returns true when max retries exhausted', () => {
    vi.useFakeTimers();
    const onRetry = vi.fn();
    const manager = createRetryManager(onRetry);
    const config = { maxRetries: 1, backoffMs: 100, maxBackoffMs: 5000 };

    manager.recordFailure('job-a', config);
    vi.advanceTimersByTime(100);
    const exhausted = manager.recordFailure('job-a', config);

    expect(exhausted).toBe(true);
    expect(onRetry).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it('caps backoff at maxBackoffMs', () => {
    vi.useFakeTimers();
    const onRetry = vi.fn();
    const manager = createRetryManager(onRetry);
    const config = { maxRetries: 10, backoffMs: 1000, maxBackoffMs: 2000 };

    manager.recordFailure('job-a', config);
    vi.advanceTimersByTime(1000);
    manager.recordFailure('job-a', config);
    vi.advanceTimersByTime(2000);
    manager.recordFailure('job-a', config);
    vi.advanceTimersByTime(2000);

    expect(onRetry).toHaveBeenCalledTimes(3);
    vi.useRealTimers();
  });
});
