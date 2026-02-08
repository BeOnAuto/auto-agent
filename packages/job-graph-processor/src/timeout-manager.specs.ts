import { describe, expect, it, vi } from 'vitest';
import { createTimeoutManager } from './timeout-manager';

describe('createTimeoutManager', () => {
  it('fires callback when timer expires', () => {
    vi.useFakeTimers();
    const onTimeout = vi.fn();
    const manager = createTimeoutManager(onTimeout);

    manager.start('job-a', 1000);
    vi.advanceTimersByTime(1000);

    expect(onTimeout).toHaveBeenCalledWith('job-a');
    vi.useRealTimers();
  });

  it('does not fire callback before timeout', () => {
    vi.useFakeTimers();
    const onTimeout = vi.fn();
    const manager = createTimeoutManager(onTimeout);

    manager.start('job-a', 1000);
    vi.advanceTimersByTime(999);

    expect(onTimeout).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('cancels timer and prevents callback', () => {
    vi.useFakeTimers();
    const onTimeout = vi.fn();
    const manager = createTimeoutManager(onTimeout);

    manager.start('job-a', 1000);
    manager.clear('job-a');
    vi.advanceTimersByTime(1000);

    expect(onTimeout).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('clearAll cancels all active timers', () => {
    vi.useFakeTimers();
    const onTimeout = vi.fn();
    const manager = createTimeoutManager(onTimeout);

    manager.start('job-a', 1000);
    manager.start('job-b', 2000);
    manager.clearAll();
    vi.advanceTimersByTime(2000);

    expect(onTimeout).not.toHaveBeenCalled();
    vi.useRealTimers();
  });
});
