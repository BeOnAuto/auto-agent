import { AwaitTracker } from './await-tracker';

describe('AwaitTracker', () => {
  it('should track pending keys', () => {
    const tracker = new AwaitTracker();
    tracker.startAwaiting('corr-1', ['a', 'b']);
    expect(tracker.isPending('corr-1')).toBe(true);
    expect(tracker.getPendingKeys('corr-1')).toEqual(['a', 'b']);
  });

  it('should detect completion', () => {
    const tracker = new AwaitTracker();
    tracker.startAwaiting('c', ['a', 'b']);
    tracker.markComplete('c', 'a', { result: 1 });
    expect(tracker.isComplete('c')).toBe(false);
    tracker.markComplete('c', 'b', { result: 2 });
    expect(tracker.isComplete('c')).toBe(true);
  });

  it('should return false for unknown correlationId', () => {
    const tracker = new AwaitTracker();
    expect(tracker.isPending('unknown')).toBe(false);
    expect(tracker.isComplete('unknown')).toBe(false);
  });

  it('should return empty array for unknown correlationId keys', () => {
    const tracker = new AwaitTracker();
    expect(tracker.getPendingKeys('unknown')).toEqual([]);
  });

  it('should collect results when all keys complete', () => {
    const tracker = new AwaitTracker();
    tracker.startAwaiting('c', ['x', 'y']);
    tracker.markComplete('c', 'x', { val: 1 });
    tracker.markComplete('c', 'y', { val: 2 });
    const results = tracker.getResults('c');
    expect(results).toEqual({ x: { val: 1 }, y: { val: 2 } });
  });

  it('should clear tracking after getting results', () => {
    const tracker = new AwaitTracker();
    tracker.startAwaiting('c', ['a']);
    tracker.markComplete('c', 'a', {});
    tracker.getResults('c');
    expect(tracker.isPending('c')).toBe(false);
  });

  it('should return empty object for unknown correlationId results', () => {
    const tracker = new AwaitTracker();
    expect(tracker.getResults('unknown')).toEqual({});
  });
});
