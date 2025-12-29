import type { AwaitEvent } from '../projections/await-tracker-projection';
import { createPipelineEventStore, type PipelineEventStoreContext } from '../store/pipeline-event-store';
import { AwaitTracker } from './await-tracker';

function createESTracker(ctx: PipelineEventStoreContext): AwaitTracker {
  return new AwaitTracker({
    readModel: ctx.readModel,
    onEventEmit: async (event: AwaitEvent) => {
      await ctx.eventStore.appendToStream(`await-${event.data.correlationId}`, [
        { type: event.type, data: event.data },
      ]);
    },
  });
}

describe('AwaitTracker', () => {
  let ctx: PipelineEventStoreContext;

  beforeEach(() => {
    ctx = createPipelineEventStore();
  });

  afterEach(async () => {
    await ctx.close();
  });

  it('should track pending keys', async () => {
    const tracker = createESTracker(ctx);
    await tracker.startAwaiting('corr-1', ['a', 'b']);
    expect(await tracker.isPending('corr-1')).toBe(true);
    expect(await tracker.getPendingKeys('corr-1')).toEqual(['a', 'b']);
  });

  it('should detect completion', async () => {
    const tracker = createESTracker(ctx);
    await tracker.startAwaiting('c', ['a', 'b']);
    await tracker.markComplete('c', 'a', { result: 1 });
    expect(await tracker.isComplete('c')).toBe(false);
    await tracker.markComplete('c', 'b', { result: 2 });
    expect(await tracker.isComplete('c')).toBe(true);
  });

  it('should return false for unknown correlationId', async () => {
    const tracker = createESTracker(ctx);
    expect(await tracker.isPending('unknown')).toBe(false);
    expect(await tracker.isComplete('unknown')).toBe(false);
  });

  it('should return empty array for unknown correlationId keys', async () => {
    const tracker = createESTracker(ctx);
    expect(await tracker.getPendingKeys('unknown')).toEqual([]);
  });

  it('should collect results when all keys complete', async () => {
    const tracker = createESTracker(ctx);
    await tracker.startAwaiting('c', ['x', 'y']);
    await tracker.markComplete('c', 'x', { val: 1 });
    await tracker.markComplete('c', 'y', { val: 2 });
    const results = await tracker.getResults('c');
    expect(results).toEqual({ x: { val: 1 }, y: { val: 2 } });
  });

  it('should clear tracking after getting results', async () => {
    const tracker = createESTracker(ctx);
    await tracker.startAwaiting('c', ['a']);
    await tracker.markComplete('c', 'a', {});
    await tracker.getResults('c');
    expect(await tracker.isPending('c')).toBe(false);
  });

  it('should return empty object for unknown correlationId results', async () => {
    const tracker = createESTracker(ctx);
    expect(await tracker.getResults('unknown')).toEqual({});
  });
});
