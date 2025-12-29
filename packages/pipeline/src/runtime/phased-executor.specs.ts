import type { Event } from '@auto-engineer/message-bus';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { ForEachPhasedDescriptor } from '../core/descriptors';
import type { PhasedExecutionEvent } from '../projections/phased-execution-projection';
import type { PipelineEventStoreContext } from '../store/pipeline-event-store';
import { createPipelineEventStore } from '../store/pipeline-event-store';
import { PhasedExecutor } from './phased-executor';

interface TestItem {
  id: string;
  type: 'molecule' | 'organism' | 'page';
}

function createHandler(_items: TestItem[]): ForEachPhasedDescriptor {
  return {
    type: 'foreach-phased',
    eventType: 'ClientGenerated',
    itemsSelector: (e: Event) => (e.data as { components: TestItem[] }).components,
    phases: ['molecule', 'organism', 'page'],
    classifier: (item: unknown) => (item as TestItem).type,
    stopOnFailure: false,
    emitFactory: (item: unknown, _phase: string, _event: Event) => ({
      commandType: 'ImplementComponent',
      data: { filePath: (item as TestItem).id },
    }),
    completion: {
      successEvent: { name: 'AllComponentsImplemented' },
      failureEvent: { name: 'ComponentsFailed' },
      itemKey: (e: Event) => (e.data as { filePath?: string; id?: string }).filePath ?? (e.data as TestItem).id,
    },
  };
}

interface ESExecutorOptions {
  onEventEmit?: (event: PhasedExecutionEvent) => void;
}

function createESExecutor(
  ctx: PipelineEventStoreContext,
  dispatched: Array<{ commandType: string; data: unknown; correlationId: string }>,
  completed: Event[],
  options: ESExecutorOptions = {},
): PhasedExecutor {
  return new PhasedExecutor({
    readModel: ctx.readModel,
    onDispatch: (commandType, data, correlationId) => {
      dispatched.push({ commandType, data, correlationId });
    },
    onComplete: (event) => {
      completed.push(event);
    },
    onEventEmit: async (event) => {
      const data = event.data as Record<string, unknown>;
      const correlationId = (data.correlationId as string) ?? (data.executionId as string)?.split('-')[1] ?? 'default';
      await ctx.eventStore.appendToStream(`phased-${correlationId}`, [{ type: event.type, data: event.data }]);
      options.onEventEmit?.(event);
    },
  });
}

describe('PhasedExecutor', () => {
  let executor: PhasedExecutor;
  let dispatched: Array<{ commandType: string; data: unknown; correlationId: string }>;
  let completed: Event[];
  let ctx: PipelineEventStoreContext;

  beforeEach(() => {
    dispatched = [];
    completed = [];
    ctx = createPipelineEventStore();
    executor = createESExecutor(ctx, dispatched, completed);
  });

  afterEach(async () => {
    await ctx.close();
  });

  describe('phase gating', () => {
    it('should dispatch only first phase items initially', async () => {
      const items: TestItem[] = [
        { id: 'm1', type: 'molecule' },
        { id: 'm2', type: 'molecule' },
        { id: 'o1', type: 'organism' },
        { id: 'p1', type: 'page' },
      ];
      const handler = createHandler(items);
      const event: Event = { type: 'ClientGenerated', correlationId: 'c1', data: { components: items } };

      await executor.startPhased(handler, event, 'c1');

      expect(dispatched).toHaveLength(2);
      expect(dispatched.map((d) => (d.data as { filePath: string }).filePath)).toEqual(['m1', 'm2']);
    });

    it('should wait for all items in phase to complete before next phase', async () => {
      const items: TestItem[] = [
        { id: 'm1', type: 'molecule' },
        { id: 'm2', type: 'molecule' },
        { id: 'o1', type: 'organism' },
      ];
      const handler = createHandler(items);
      executor.registerHandler(handler);
      const event: Event = { type: 'ClientGenerated', correlationId: 'c1', data: { components: items } };

      await executor.startPhased(handler, event, 'c1');

      expect(dispatched).toHaveLength(2);

      await executor.onEventReceived(
        { type: 'ComponentImplemented', correlationId: 'c1', data: { filePath: 'm1' } },
        'm1',
      );

      expect(dispatched).toHaveLength(2);

      await executor.onEventReceived(
        { type: 'ComponentImplemented', correlationId: 'c1', data: { filePath: 'm2' } },
        'm2',
      );

      expect(dispatched).toHaveLength(3);
      expect((dispatched[2].data as { filePath: string }).filePath).toBe('o1');
    });

    it('should skip empty phases', async () => {
      const items: TestItem[] = [
        { id: 'm1', type: 'molecule' },
        { id: 'p1', type: 'page' },
      ];
      const handler = createHandler(items);
      executor.registerHandler(handler);
      const event: Event = { type: 'ClientGenerated', correlationId: 'c1', data: { components: items } };

      await executor.startPhased(handler, event, 'c1');

      expect(dispatched).toHaveLength(1);
      expect((dispatched[0].data as { filePath: string }).filePath).toBe('m1');

      await executor.onEventReceived(
        { type: 'ComponentImplemented', correlationId: 'c1', data: { filePath: 'm1' } },
        'm1',
      );

      expect(dispatched).toHaveLength(2);
      expect((dispatched[1].data as { filePath: string }).filePath).toBe('p1');
    });
  });

  describe('completion tracking', () => {
    it('should emit success event when all phases complete', async () => {
      const items: TestItem[] = [
        { id: 'm1', type: 'molecule' },
        { id: 'o1', type: 'organism' },
      ];
      const handler = createHandler(items);
      executor.registerHandler(handler);
      const event: Event = { type: 'ClientGenerated', correlationId: 'c1', data: { components: items } };

      await executor.startPhased(handler, event, 'c1');

      await executor.onEventReceived(
        { type: 'ComponentImplemented', correlationId: 'c1', data: { filePath: 'm1' } },
        'm1',
      );
      await executor.onEventReceived(
        { type: 'ComponentImplemented', correlationId: 'c1', data: { filePath: 'o1' } },
        'o1',
      );

      expect(completed).toHaveLength(1);
      expect(completed[0].type).toBe('AllComponentsImplemented');
      expect(completed[0].correlationId).toBe('c1');
    });

    it('should cleanup session after completion allowing new session with same correlationId', async () => {
      const items: TestItem[] = [{ id: 'm1', type: 'molecule' }];
      const handler = createHandler(items);
      executor.registerHandler(handler);
      const event: Event = { type: 'ClientGenerated', correlationId: 'c1', data: { components: items } };

      await executor.startPhased(handler, event, 'c1');
      await executor.onEventReceived(
        { type: 'ComponentImplemented', correlationId: 'c1', data: { filePath: 'm1' } },
        'm1',
      );

      expect(completed).toHaveLength(1);

      dispatched.length = 0;
      completed.length = 0;

      await executor.startPhased(handler, event, 'c1');
      expect(dispatched).toHaveLength(1);
      expect((dispatched[0].data as { filePath: string }).filePath).toBe('m1');
    });
  });

  describe('state queries', () => {
    it('should report phase completion status', async () => {
      const items: TestItem[] = [
        { id: 'm1', type: 'molecule' },
        { id: 'o1', type: 'organism' },
      ];
      const handler = createHandler(items);
      executor.registerHandler(handler);
      const event: Event = { type: 'ClientGenerated', correlationId: 'c1', data: { components: items } };

      await executor.startPhased(handler, event, 'c1');

      expect(await executor.isPhaseComplete('c1', 'molecule')).toBe(false);
      expect(await executor.isPhaseComplete('c1', 'organism')).toBe(false);

      await executor.onEventReceived(
        { type: 'ComponentImplemented', correlationId: 'c1', data: { filePath: 'm1' } },
        'm1',
      );

      expect(await executor.isPhaseComplete('c1', 'molecule')).toBe(true);
      expect(await executor.isPhaseComplete('c1', 'organism')).toBe(false);
    });

    it('should return false for unknown correlationId', async () => {
      expect(await executor.isPhaseComplete('unknown', 'molecule')).toBe(false);
    });

    it('should return false for unknown phase name', async () => {
      const items: TestItem[] = [{ id: 'm1', type: 'molecule' }];
      const handler = createHandler(items);
      const event: Event = { type: 'ClientGenerated', correlationId: 'c1', data: { components: items } };

      await executor.startPhased(handler, event, 'c1');

      expect(await executor.isPhaseComplete('c1', 'nonexistent-phase')).toBe(false);
    });

    it('should return false for future phase when current phase is earlier', async () => {
      const items: TestItem[] = [
        { id: 'm1', type: 'molecule' },
        { id: 'p1', type: 'page' },
      ];
      const handler = createHandler(items);
      const event: Event = { type: 'ClientGenerated', correlationId: 'c1', data: { components: items } };

      await executor.startPhased(handler, event, 'c1');

      expect(await executor.isPhaseComplete('c1', 'page')).toBe(false);
    });

    it('should check correct session when multiple sessions exist with different correlationIds', async () => {
      const items1: TestItem[] = [
        { id: 'm1', type: 'molecule' },
        { id: 'o1', type: 'organism' },
      ];
      const items2: TestItem[] = [
        { id: 'm2', type: 'molecule' },
        { id: 'o2', type: 'organism' },
      ];
      const handler1 = createHandler(items1);
      const handler2 = createHandler(items2);
      executor.registerHandler(handler1);
      executor.registerHandler(handler2);

      await executor.startPhased(
        handler1,
        { type: 'ClientGenerated', correlationId: 'c1', data: { components: items1 } },
        'c1',
      );
      await executor.startPhased(
        handler2,
        { type: 'ClientGenerated', correlationId: 'c2', data: { components: items2 } },
        'c2',
      );

      await executor.onEventReceived(
        { type: 'ComponentImplemented', correlationId: 'c1', data: { filePath: 'm1' } },
        'm1',
      );

      expect(await executor.isPhaseComplete('c1', 'molecule')).toBe(true);
      expect(await executor.isPhaseComplete('c2', 'molecule')).toBe(false);
    });
  });

  describe('failure handling', () => {
    it('should stop on failure when stopOnFailure is true and emit failure event', async () => {
      const items: TestItem[] = [
        { id: 'm1', type: 'molecule' },
        { id: 'm2', type: 'molecule' },
        { id: 'o1', type: 'organism' },
      ];
      const handler: ForEachPhasedDescriptor = {
        ...createHandler(items),
        stopOnFailure: true,
      };
      executor.registerHandler(handler);
      const event: Event = { type: 'ClientGenerated', correlationId: 'c1', data: { components: items } };

      await executor.startPhased(handler, event, 'c1');

      await executor.onEventReceived({ type: 'ComponentsFailed', correlationId: 'c1', data: { filePath: 'm1' } }, 'm1');

      expect(completed).toHaveLength(1);
      expect(completed[0].type).toBe('ComponentsFailed');
    });

    it('should continue on failure when stopOnFailure is false', async () => {
      const items: TestItem[] = [
        { id: 'm1', type: 'molecule' },
        { id: 'm2', type: 'molecule' },
        { id: 'o1', type: 'organism' },
      ];
      const handler = createHandler(items);
      executor.registerHandler(handler);
      const event: Event = { type: 'ClientGenerated', correlationId: 'c1', data: { components: items } };

      await executor.startPhased(handler, event, 'c1');

      await executor.onEventReceived({ type: 'ComponentsFailed', correlationId: 'c1', data: { filePath: 'm1' } }, 'm1');

      expect(completed).toHaveLength(0);

      await executor.onEventReceived(
        { type: 'ComponentImplemented', correlationId: 'c1', data: { filePath: 'm2' } },
        'm2',
      );

      expect(dispatched).toHaveLength(3);
    });

    it('should cleanup session after stopOnFailure allowing new session with same correlationId', async () => {
      const items: TestItem[] = [
        { id: 'm1', type: 'molecule' },
        { id: 'o1', type: 'organism' },
      ];
      const handler: ForEachPhasedDescriptor = {
        ...createHandler(items),
        stopOnFailure: true,
      };
      executor.registerHandler(handler);
      const event: Event = { type: 'ClientGenerated', correlationId: 'c1', data: { components: items } };

      await executor.startPhased(handler, event, 'c1');
      await executor.onEventReceived({ type: 'ComponentsFailed', correlationId: 'c1', data: { filePath: 'm1' } }, 'm1');

      expect(completed).toHaveLength(1);
      expect(completed[0].type).toBe('ComponentsFailed');

      dispatched.length = 0;
      completed.length = 0;

      await executor.startPhased(handler, event, 'c1');
      expect(dispatched).toHaveLength(1);
    });
  });

  describe('concurrent sessions', () => {
    it('should track sessions independently by correlationId', async () => {
      const items: TestItem[] = [{ id: 'm1', type: 'molecule' }];
      const handler = createHandler(items);
      executor.registerHandler(handler);

      await executor.startPhased(
        handler,
        { type: 'ClientGenerated', correlationId: 'c1', data: { components: items } },
        'c1',
      );
      await executor.startPhased(
        handler,
        { type: 'ClientGenerated', correlationId: 'c2', data: { components: items } },
        'c2',
      );

      expect(dispatched).toHaveLength(2);
      expect(dispatched[0].correlationId).toBe('c1');
      expect(dispatched[1].correlationId).toBe('c2');

      await executor.onEventReceived(
        { type: 'ComponentImplemented', correlationId: 'c1', data: { filePath: 'm1' } },
        'm1',
      );

      expect(completed).toHaveLength(1);
      expect(completed[0].correlationId).toBe('c1');

      await executor.onEventReceived(
        { type: 'ComponentImplemented', correlationId: 'c2', data: { filePath: 'm1' } },
        'm1',
      );

      expect(completed).toHaveLength(2);
      expect(completed[1].correlationId).toBe('c2');
    });

    it('should not interfere between concurrent sessions with different items', async () => {
      const items1: TestItem[] = [
        { id: 'a1', type: 'molecule' },
        { id: 'a2', type: 'organism' },
      ];
      const items2: TestItem[] = [
        { id: 'b1', type: 'molecule' },
        { id: 'b2', type: 'page' },
      ];
      const handler1 = createHandler(items1);
      const handler2 = createHandler(items2);
      executor.registerHandler(handler1);
      executor.registerHandler(handler2);

      await executor.startPhased(
        handler1,
        { type: 'ClientGenerated', correlationId: 'c1', data: { components: items1 } },
        'c1',
      );
      await executor.startPhased(
        handler2,
        { type: 'ClientGenerated', correlationId: 'c2', data: { components: items2 } },
        'c2',
      );

      expect(dispatched).toHaveLength(2);

      await executor.onEventReceived(
        { type: 'ComponentImplemented', correlationId: 'c1', data: { filePath: 'a1' } },
        'a1',
      );

      expect(dispatched).toHaveLength(3);
      expect((dispatched[2].data as { filePath: string }).filePath).toBe('a2');
      expect(dispatched[2].correlationId).toBe('c1');

      await executor.onEventReceived(
        { type: 'ComponentImplemented', correlationId: 'c2', data: { filePath: 'b1' } },
        'b1',
      );

      expect(dispatched).toHaveLength(4);
      expect((dispatched[3].data as { filePath: string }).filePath).toBe('b2');
      expect(dispatched[3].correlationId).toBe('c2');
    });
  });

  describe('event deduplication', () => {
    it('should ignore duplicate events for already completed items', async () => {
      const items: TestItem[] = [
        { id: 'm1', type: 'molecule' },
        { id: 'm2', type: 'molecule' },
        { id: 'o1', type: 'organism' },
      ];
      const handler = createHandler(items);
      executor.registerHandler(handler);
      const event: Event = { type: 'ClientGenerated', correlationId: 'c1', data: { components: items } };

      await executor.startPhased(handler, event, 'c1');

      await executor.onEventReceived(
        { type: 'ComponentImplemented', correlationId: 'c1', data: { filePath: 'm1' } },
        'm1',
      );

      expect(dispatched).toHaveLength(2);

      await executor.onEventReceived(
        { type: 'ComponentImplemented', correlationId: 'c1', data: { filePath: 'm1' } },
        'm1',
      );

      expect(dispatched).toHaveLength(2);
    });
  });

  describe('event edge cases', () => {
    it('should ignore events with undefined correlationId', async () => {
      const items: TestItem[] = [{ id: 'm1', type: 'molecule' }];
      const handler = createHandler(items);
      const event: Event = { type: 'ClientGenerated', correlationId: 'c1', data: { components: items } };

      await executor.startPhased(handler, event, 'c1');

      expect(dispatched).toHaveLength(1);

      await executor.onEventReceived({ type: 'ComponentImplemented', data: { filePath: 'm1' } }, 'm1');

      expect(dispatched).toHaveLength(1);
      expect(completed).toHaveLength(0);
    });

    it('should ignore events with empty correlationId', async () => {
      const items: TestItem[] = [{ id: 'm1', type: 'molecule' }];
      const handler = createHandler(items);
      const event: Event = { type: 'ClientGenerated', correlationId: 'c1', data: { components: items } };

      await executor.startPhased(handler, event, 'c1');

      expect(dispatched).toHaveLength(1);

      await executor.onEventReceived(
        { type: 'ComponentImplemented', correlationId: '', data: { filePath: 'm1' } },
        'm1',
      );

      expect(dispatched).toHaveLength(1);
      expect(completed).toHaveLength(0);
    });

    it('should ignore events with unknown itemKey', async () => {
      const items: TestItem[] = [{ id: 'm1', type: 'molecule' }];
      const handler = createHandler(items);
      const event: Event = { type: 'ClientGenerated', correlationId: 'c1', data: { components: items } };

      await executor.startPhased(handler, event, 'c1');

      await executor.onEventReceived(
        { type: 'ComponentImplemented', correlationId: 'c1', data: { filePath: 'unknown' } },
        'unknown',
      );

      expect(dispatched).toHaveLength(1);
      expect(completed).toHaveLength(0);
    });
  });

  describe('event emission', () => {
    let emittedEvents: PhasedExecutionEvent[];

    beforeEach(() => {
      emittedEvents = [];
      executor = createESExecutor(ctx, dispatched, completed, {
        onEventEmit: (event) => {
          emittedEvents.push(event);
        },
      });
    });

    it('should emit PhasedExecutionStarted when starting', async () => {
      const items: TestItem[] = [{ id: 'm1', type: 'molecule' }];
      const handler = createHandler(items);
      const event: Event = { type: 'ClientGenerated', correlationId: 'c1', data: { components: items } };

      await executor.startPhased(handler, event, 'c1');

      const startEvent = emittedEvents.find((e) => e.type === 'PhasedExecutionStarted');
      expect(startEvent).toBeDefined();
      expect(startEvent?.data.correlationId).toBe('c1');
      expect(startEvent?.data.items).toHaveLength(1);
    });

    it('should emit PhasedItemDispatched when dispatching items', async () => {
      const items: TestItem[] = [{ id: 'm1', type: 'molecule' }];
      const handler = createHandler(items);
      const event: Event = { type: 'ClientGenerated', correlationId: 'c1', data: { components: items } };

      await executor.startPhased(handler, event, 'c1');

      const dispatchEvents = emittedEvents.filter((e) => e.type === 'PhasedItemDispatched');
      expect(dispatchEvents).toHaveLength(1);
      expect(dispatchEvents[0].data.itemKey).toBe('m1');
    });

    it('should emit PhasedItemCompleted when item completes', async () => {
      const items: TestItem[] = [{ id: 'm1', type: 'molecule' }];
      const handler = createHandler(items);
      executor.registerHandler(handler);
      const event: Event = { type: 'ClientGenerated', correlationId: 'c1', data: { components: items } };

      await executor.startPhased(handler, event, 'c1');
      await executor.onEventReceived(
        { type: 'ComponentImplemented', correlationId: 'c1', data: { filePath: 'm1' } },
        'm1',
      );

      const completeEvents = emittedEvents.filter((e) => e.type === 'PhasedItemCompleted');
      expect(completeEvents).toHaveLength(1);
      expect(completeEvents[0].data.itemKey).toBe('m1');
    });

    it('should emit PhasedPhaseAdvanced when advancing phases', async () => {
      const items: TestItem[] = [
        { id: 'm1', type: 'molecule' },
        { id: 'o1', type: 'organism' },
      ];
      const handler = createHandler(items);
      executor.registerHandler(handler);
      const event: Event = { type: 'ClientGenerated', correlationId: 'c1', data: { components: items } };

      await executor.startPhased(handler, event, 'c1');
      await executor.onEventReceived(
        { type: 'ComponentImplemented', correlationId: 'c1', data: { filePath: 'm1' } },
        'm1',
      );

      const advanceEvents = emittedEvents.filter((e) => e.type === 'PhasedPhaseAdvanced');
      expect(advanceEvents).toHaveLength(1);
      expect(advanceEvents[0].data.fromPhase).toBe(0);
      expect(advanceEvents[0].data.toPhase).toBe(1);
    });

    it('should emit PhasedExecutionCompleted on success', async () => {
      const items: TestItem[] = [{ id: 'm1', type: 'molecule' }];
      const handler = createHandler(items);
      executor.registerHandler(handler);
      const event: Event = { type: 'ClientGenerated', correlationId: 'c1', data: { components: items } };

      await executor.startPhased(handler, event, 'c1');
      await executor.onEventReceived(
        { type: 'ComponentImplemented', correlationId: 'c1', data: { filePath: 'm1' } },
        'm1',
      );

      const completedEvents = emittedEvents.filter((e) => e.type === 'PhasedExecutionCompleted');
      expect(completedEvents).toHaveLength(1);
      expect(completedEvents[0].data.success).toBe(true);
    });

    it('should emit PhasedItemFailed and PhasedExecutionCompleted on failure', async () => {
      const items: TestItem[] = [{ id: 'm1', type: 'molecule' }];
      const handler: ForEachPhasedDescriptor = {
        ...createHandler(items),
        stopOnFailure: true,
      };
      executor.registerHandler(handler);
      const event: Event = { type: 'ClientGenerated', correlationId: 'c1', data: { components: items } };

      await executor.startPhased(handler, event, 'c1');
      await executor.onEventReceived({ type: 'ComponentsFailed', correlationId: 'c1', data: { filePath: 'm1' } }, 'm1');

      const failedEvents = emittedEvents.filter((e) => e.type === 'PhasedItemFailed');
      expect(failedEvents).toHaveLength(1);
      expect(failedEvents[0].data.itemKey).toBe('m1');

      const completedEvents = emittedEvents.filter((e) => e.type === 'PhasedExecutionCompleted');
      expect(completedEvents).toHaveLength(1);
      expect(completedEvents[0].data.success).toBe(false);
    });
  });
});
