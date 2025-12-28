import type { Event } from '@auto-engineer/message-bus';
import { beforeEach, describe, expect, it } from 'vitest';
import type { ForEachPhasedDescriptor } from '../core/descriptors';
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

describe('PhasedExecutor', () => {
  let executor: PhasedExecutor;
  let dispatched: Array<{ commandType: string; data: unknown; correlationId: string }>;
  let completed: Event[];

  beforeEach(() => {
    dispatched = [];
    completed = [];
    executor = new PhasedExecutor({
      onDispatch: (commandType, data, correlationId) => {
        dispatched.push({ commandType, data, correlationId });
      },
      onComplete: (event) => {
        completed.push(event);
      },
    });
  });

  describe('phase gating', () => {
    it('should dispatch only first phase items initially', () => {
      const items: TestItem[] = [
        { id: 'm1', type: 'molecule' },
        { id: 'm2', type: 'molecule' },
        { id: 'o1', type: 'organism' },
        { id: 'p1', type: 'page' },
      ];
      const handler = createHandler(items);
      const event: Event = { type: 'ClientGenerated', correlationId: 'c1', data: { components: items } };

      executor.startPhased(handler, event, 'c1');

      expect(dispatched).toHaveLength(2);
      expect(dispatched.map((d) => (d.data as { filePath: string }).filePath)).toEqual(['m1', 'm2']);
    });

    it('should wait for all items in phase to complete before next phase', () => {
      const items: TestItem[] = [
        { id: 'm1', type: 'molecule' },
        { id: 'm2', type: 'molecule' },
        { id: 'o1', type: 'organism' },
      ];
      const handler = createHandler(items);
      const event: Event = { type: 'ClientGenerated', correlationId: 'c1', data: { components: items } };

      executor.startPhased(handler, event, 'c1');

      expect(dispatched).toHaveLength(2);

      executor.onEventReceived({ type: 'ComponentImplemented', correlationId: 'c1', data: { filePath: 'm1' } }, 'm1');

      expect(dispatched).toHaveLength(2);

      executor.onEventReceived({ type: 'ComponentImplemented', correlationId: 'c1', data: { filePath: 'm2' } }, 'm2');

      expect(dispatched).toHaveLength(3);
      expect((dispatched[2].data as { filePath: string }).filePath).toBe('o1');
    });

    it('should skip empty phases', () => {
      const items: TestItem[] = [
        { id: 'm1', type: 'molecule' },
        { id: 'p1', type: 'page' },
      ];
      const handler = createHandler(items);
      const event: Event = { type: 'ClientGenerated', correlationId: 'c1', data: { components: items } };

      executor.startPhased(handler, event, 'c1');

      expect(dispatched).toHaveLength(1);
      expect((dispatched[0].data as { filePath: string }).filePath).toBe('m1');

      executor.onEventReceived({ type: 'ComponentImplemented', correlationId: 'c1', data: { filePath: 'm1' } }, 'm1');

      expect(dispatched).toHaveLength(2);
      expect((dispatched[1].data as { filePath: string }).filePath).toBe('p1');
    });
  });

  describe('completion tracking', () => {
    it('should emit success event when all phases complete', () => {
      const items: TestItem[] = [
        { id: 'm1', type: 'molecule' },
        { id: 'o1', type: 'organism' },
      ];
      const handler = createHandler(items);
      const event: Event = { type: 'ClientGenerated', correlationId: 'c1', data: { components: items } };

      executor.startPhased(handler, event, 'c1');

      executor.onEventReceived({ type: 'ComponentImplemented', correlationId: 'c1', data: { filePath: 'm1' } }, 'm1');
      executor.onEventReceived({ type: 'ComponentImplemented', correlationId: 'c1', data: { filePath: 'o1' } }, 'o1');

      expect(completed).toHaveLength(1);
      expect(completed[0].type).toBe('AllComponentsImplemented');
      expect(completed[0].correlationId).toBe('c1');
    });

    it('should cleanup session after completion', () => {
      const items: TestItem[] = [{ id: 'm1', type: 'molecule' }];
      const handler = createHandler(items);
      const event: Event = { type: 'ClientGenerated', correlationId: 'c1', data: { components: items } };

      executor.startPhased(handler, event, 'c1');
      expect(executor.getActiveSessionCount()).toBe(1);

      executor.onEventReceived({ type: 'ComponentImplemented', correlationId: 'c1', data: { filePath: 'm1' } }, 'm1');

      expect(executor.getActiveSessionCount()).toBe(0);
    });
  });

  describe('state queries', () => {
    it('should report phase completion status', () => {
      const items: TestItem[] = [
        { id: 'm1', type: 'molecule' },
        { id: 'o1', type: 'organism' },
      ];
      const handler = createHandler(items);
      const event: Event = { type: 'ClientGenerated', correlationId: 'c1', data: { components: items } };

      executor.startPhased(handler, event, 'c1');

      expect(executor.isPhaseComplete('c1', 'molecule')).toBe(false);
      expect(executor.isPhaseComplete('c1', 'organism')).toBe(false);

      executor.onEventReceived({ type: 'ComponentImplemented', correlationId: 'c1', data: { filePath: 'm1' } }, 'm1');

      expect(executor.isPhaseComplete('c1', 'molecule')).toBe(true);
      expect(executor.isPhaseComplete('c1', 'organism')).toBe(false);
    });

    it('should return false for unknown correlationId', () => {
      expect(executor.isPhaseComplete('unknown', 'molecule')).toBe(false);
    });

    it('should return false for unknown phase name', () => {
      const items: TestItem[] = [{ id: 'm1', type: 'molecule' }];
      const handler = createHandler(items);
      const event: Event = { type: 'ClientGenerated', correlationId: 'c1', data: { components: items } };

      executor.startPhased(handler, event, 'c1');

      expect(executor.isPhaseComplete('c1', 'nonexistent-phase')).toBe(false);
    });

    it('should return false for future phase when current phase is earlier', () => {
      const items: TestItem[] = [
        { id: 'm1', type: 'molecule' },
        { id: 'p1', type: 'page' },
      ];
      const handler = createHandler(items);
      const event: Event = { type: 'ClientGenerated', correlationId: 'c1', data: { components: items } };

      executor.startPhased(handler, event, 'c1');

      expect(executor.isPhaseComplete('c1', 'page')).toBe(false);
    });

    it('should check correct session when multiple sessions exist with different correlationIds', () => {
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

      executor.startPhased(
        handler1,
        { type: 'ClientGenerated', correlationId: 'c1', data: { components: items1 } },
        'c1',
      );
      executor.startPhased(
        handler2,
        { type: 'ClientGenerated', correlationId: 'c2', data: { components: items2 } },
        'c2',
      );

      executor.onEventReceived({ type: 'ComponentImplemented', correlationId: 'c1', data: { filePath: 'm1' } }, 'm1');

      expect(executor.isPhaseComplete('c1', 'molecule')).toBe(true);
      expect(executor.isPhaseComplete('c2', 'molecule')).toBe(false);
    });
  });

  describe('failure handling', () => {
    it('should stop on failure when stopOnFailure is true', () => {
      const items: TestItem[] = [
        { id: 'm1', type: 'molecule' },
        { id: 'm2', type: 'molecule' },
        { id: 'o1', type: 'organism' },
      ];
      const handler: ForEachPhasedDescriptor = {
        ...createHandler(items),
        stopOnFailure: true,
      };
      const event: Event = { type: 'ClientGenerated', correlationId: 'c1', data: { components: items } };

      executor.startPhased(handler, event, 'c1');

      executor.onEventReceived({ type: 'ComponentsFailed', correlationId: 'c1', data: { filePath: 'm1' } }, 'm1');

      expect(completed).toHaveLength(1);
      expect(completed[0].type).toBe('ComponentsFailed');
      expect(executor.getActiveSessionCount()).toBe(0);
    });

    it('should continue on failure when stopOnFailure is false', () => {
      const items: TestItem[] = [
        { id: 'm1', type: 'molecule' },
        { id: 'm2', type: 'molecule' },
        { id: 'o1', type: 'organism' },
      ];
      const handler = createHandler(items);
      const event: Event = { type: 'ClientGenerated', correlationId: 'c1', data: { components: items } };

      executor.startPhased(handler, event, 'c1');

      executor.onEventReceived({ type: 'ComponentsFailed', correlationId: 'c1', data: { filePath: 'm1' } }, 'm1');

      expect(completed).toHaveLength(0);
      expect(executor.getActiveSessionCount()).toBe(1);

      executor.onEventReceived({ type: 'ComponentImplemented', correlationId: 'c1', data: { filePath: 'm2' } }, 'm2');

      expect(dispatched).toHaveLength(3);
    });
  });

  describe('concurrent sessions', () => {
    it('should track sessions independently by correlationId', () => {
      const items: TestItem[] = [{ id: 'm1', type: 'molecule' }];
      const handler = createHandler(items);

      executor.startPhased(
        handler,
        { type: 'ClientGenerated', correlationId: 'c1', data: { components: items } },
        'c1',
      );
      executor.startPhased(
        handler,
        { type: 'ClientGenerated', correlationId: 'c2', data: { components: items } },
        'c2',
      );

      expect(executor.getActiveSessionCount()).toBe(2);

      executor.onEventReceived({ type: 'ComponentImplemented', correlationId: 'c1', data: { filePath: 'm1' } }, 'm1');

      expect(executor.getActiveSessionCount()).toBe(1);
      expect(completed).toHaveLength(1);
      expect(completed[0].correlationId).toBe('c1');
    });
  });

  describe('event deduplication', () => {
    it('should ignore duplicate events for already completed items', () => {
      const items: TestItem[] = [
        { id: 'm1', type: 'molecule' },
        { id: 'm2', type: 'molecule' },
        { id: 'o1', type: 'organism' },
      ];
      const handler = createHandler(items);
      const event: Event = { type: 'ClientGenerated', correlationId: 'c1', data: { components: items } };

      executor.startPhased(handler, event, 'c1');

      executor.onEventReceived({ type: 'ComponentImplemented', correlationId: 'c1', data: { filePath: 'm1' } }, 'm1');

      expect(dispatched).toHaveLength(2);

      executor.onEventReceived({ type: 'ComponentImplemented', correlationId: 'c1', data: { filePath: 'm1' } }, 'm1');

      expect(dispatched).toHaveLength(2);
    });
  });

  describe('event edge cases', () => {
    it('should ignore events with undefined correlationId', () => {
      const items: TestItem[] = [{ id: 'm1', type: 'molecule' }];
      const handler = createHandler(items);
      const event: Event = { type: 'ClientGenerated', correlationId: 'c1', data: { components: items } };

      executor.startPhased(handler, event, 'c1');

      expect(dispatched).toHaveLength(1);

      executor.onEventReceived({ type: 'ComponentImplemented', data: { filePath: 'm1' } }, 'm1');

      expect(dispatched).toHaveLength(1);
      expect(executor.getActiveSessionCount()).toBe(1);
    });

    it('should ignore events with empty correlationId', () => {
      const items: TestItem[] = [{ id: 'm1', type: 'molecule' }];
      const handler = createHandler(items);
      const event: Event = { type: 'ClientGenerated', correlationId: 'c1', data: { components: items } };

      executor.startPhased(handler, event, 'c1');

      expect(dispatched).toHaveLength(1);

      executor.onEventReceived({ type: 'ComponentImplemented', correlationId: '', data: { filePath: 'm1' } }, 'm1');

      expect(dispatched).toHaveLength(1);
      expect(executor.getActiveSessionCount()).toBe(1);
    });

    it('should ignore events with unknown itemKey', () => {
      const items: TestItem[] = [{ id: 'm1', type: 'molecule' }];
      const handler = createHandler(items);
      const event: Event = { type: 'ClientGenerated', correlationId: 'c1', data: { components: items } };

      executor.startPhased(handler, event, 'c1');

      executor.onEventReceived(
        { type: 'ComponentImplemented', correlationId: 'c1', data: { filePath: 'unknown' } },
        'unknown',
      );

      expect(dispatched).toHaveLength(1);
      expect(executor.getActiveSessionCount()).toBe(1);
    });
  });
});
