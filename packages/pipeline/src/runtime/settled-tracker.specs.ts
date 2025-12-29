import type { Command, Event } from '@auto-engineer/message-bus';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SettledEvent } from '../projections/settled-instance-projection';
import type { PipelineEventStoreContext } from '../store/pipeline-event-store';
import { createPipelineEventStore } from '../store/pipeline-event-store';
import { SettledTracker } from './settled-tracker';

function createESTracker(ctx: PipelineEventStoreContext): SettledTracker {
  return new SettledTracker({
    readModel: ctx.readModel,
    onEventEmit: async (event) => {
      await ctx.eventStore.appendToStream(`settled-${event.data.correlationId}`, [
        { type: event.type, data: event.data },
      ]);
    },
  });
}

describe('SettledTracker', () => {
  let tracker: SettledTracker;
  let ctx: PipelineEventStoreContext;

  beforeEach(() => {
    ctx = createPipelineEventStore();
    tracker = createESTracker(ctx);
  });

  afterEach(async () => {
    await ctx.close();
  });

  describe('handler registration', () => {
    it('should fire handler when registered command completes', async () => {
      let fired = false;

      tracker.registerHandler({
        commandTypes: ['CheckTests', 'CheckTypes', 'CheckLint'],
        handler: () => {
          fired = true;
        },
      });

      await tracker.onCommandStarted({ type: 'CheckTests', correlationId: 'c1', requestId: 'r1', data: {} });
      await tracker.onCommandStarted({ type: 'CheckTypes', correlationId: 'c1', requestId: 'r2', data: {} });
      await tracker.onCommandStarted({ type: 'CheckLint', correlationId: 'c1', requestId: 'r3', data: {} });

      await tracker.onEventReceived({ type: 'TestsCheckPassed', correlationId: 'c1', data: {} }, 'CheckTests');
      await tracker.onEventReceived({ type: 'TypeCheckPassed', correlationId: 'c1', data: {} }, 'CheckTypes');
      await tracker.onEventReceived({ type: 'LintCheckPassed', correlationId: 'c1', data: {} }, 'CheckLint');

      expect(fired).toBe(true);
    });

    it('should fire multiple registered handlers independently', async () => {
      let handler1Fired = false;
      let handler2Fired = false;

      tracker.registerHandler({
        commandTypes: ['A', 'B'],
        handler: () => {
          handler1Fired = true;
        },
      });
      tracker.registerHandler({
        commandTypes: ['C', 'D'],
        handler: () => {
          handler2Fired = true;
        },
      });

      await tracker.onCommandStarted({ type: 'A', correlationId: 'c1', requestId: 'r1', data: {} });
      await tracker.onCommandStarted({ type: 'B', correlationId: 'c1', requestId: 'r2', data: {} });
      await tracker.onEventReceived({ type: 'ADone', correlationId: 'c1', data: {} }, 'A');
      await tracker.onEventReceived({ type: 'BDone', correlationId: 'c1', data: {} }, 'B');

      expect(handler1Fired).toBe(true);
      expect(handler2Fired).toBe(false);

      await tracker.onCommandStarted({ type: 'C', correlationId: 'c1', requestId: 'r3', data: {} });
      await tracker.onCommandStarted({ type: 'D', correlationId: 'c1', requestId: 'r4', data: {} });
      await tracker.onEventReceived({ type: 'CDone', correlationId: 'c1', data: {} }, 'C');
      await tracker.onEventReceived({ type: 'DDone', correlationId: 'c1', data: {} }, 'D');

      expect(handler2Fired).toBe(true);
    });
  });

  describe('command tracking', () => {
    it('should track multiple commands by correlationId', async () => {
      tracker.registerHandler({
        commandTypes: ['CheckTests', 'CheckTypes', 'CheckLint'],
        handler: () => {},
      });

      const command: Command = {
        type: 'CheckTests',
        correlationId: 'c1',
        requestId: 'r1',
        data: {},
      };

      await tracker.onCommandStarted(command);

      expect(await tracker.isWaitingForAsync('c1', 'CheckTests')).toBe(true);
      expect(await tracker.isWaitingForAsync('c1', 'CheckTypes')).toBe(false);
    });

    it('should create handler instance when first tracked command arrives', async () => {
      let fired = false;

      tracker.registerHandler({
        commandTypes: ['A', 'B'],
        handler: () => {
          fired = true;
        },
      });

      await tracker.onCommandStarted({ type: 'A', correlationId: 'c1', requestId: 'r1', data: {} });

      expect(await tracker.isWaitingForAsync('c1', 'A')).toBe(true);
      expect(fired).toBe(false);
    });

    it('should not fire handler multiple times for same correlationId when commands arrive separately', async () => {
      let fireCount = 0;

      tracker.registerHandler({
        commandTypes: ['A', 'B'],
        handler: () => {
          fireCount++;
        },
      });

      await tracker.onCommandStarted({ type: 'A', correlationId: 'c1', requestId: 'r1', data: {} });
      await tracker.onCommandStarted({ type: 'B', correlationId: 'c1', requestId: 'r2', data: {} });

      await tracker.onEventReceived({ type: 'ADone', correlationId: 'c1', data: {} }, 'A');
      await tracker.onEventReceived({ type: 'BDone', correlationId: 'c1', data: {} }, 'B');

      expect(fireCount).toBe(1);
    });

    it('should ignore commands without correlationId', async () => {
      let fired = false;

      tracker.registerHandler({
        commandTypes: ['A'],
        handler: () => {
          fired = true;
        },
      });

      await tracker.onCommandStarted({
        type: 'A',
        requestId: 'r1',
        data: {},
      } as Command);

      await tracker.onEventReceived({ type: 'ADone', correlationId: 'c1', data: {} }, 'A');

      expect(fired).toBe(false);
    });

    it('should ignore commands without requestId', async () => {
      let fired = false;

      tracker.registerHandler({
        commandTypes: ['A'],
        handler: () => {
          fired = true;
        },
      });

      await tracker.onCommandStarted({
        type: 'A',
        correlationId: 'c1',
        data: {},
      } as Command);

      await tracker.onEventReceived({ type: 'ADone', correlationId: 'c1', data: {} }, 'A');

      expect(fired).toBe(false);
    });
  });

  describe('event routing', () => {
    it('should mark command as complete when event received', async () => {
      tracker.registerHandler({
        commandTypes: ['A'],
        handler: () => {},
      });

      await tracker.onCommandStarted({
        type: 'A',
        correlationId: 'c1',
        requestId: 'r1',
        data: {},
      });

      const event: Event = {
        type: 'ADone',
        correlationId: 'c1',
        data: {},
      };

      await tracker.onEventReceived(event, 'A');

      expect(await tracker.isWaitingForAsync('c1', 'A')).toBe(false);
    });

    it('should collect events for each command type', async () => {
      let receivedEvents: Record<string, Event[]> = {};

      tracker.registerHandler({
        commandTypes: ['A', 'B'],
        handler: (events) => {
          receivedEvents = events;
        },
      });

      await tracker.onCommandStarted({
        type: 'A',
        correlationId: 'c1',
        requestId: 'r1',
        data: {},
      });
      await tracker.onCommandStarted({
        type: 'B',
        correlationId: 'c1',
        requestId: 'r2',
        data: {},
      });

      await tracker.onEventReceived({ type: 'ADone', correlationId: 'c1', data: { foo: 1 } }, 'A');
      await tracker.onEventReceived({ type: 'BDone', correlationId: 'c1', data: { bar: 2 } }, 'B');

      expect(receivedEvents.A).toHaveLength(1);
      expect(receivedEvents.A[0].type).toBe('ADone');
      expect(receivedEvents.B).toHaveLength(1);
      expect(receivedEvents.B[0].type).toBe('BDone');
    });

    it('should ignore events without correlationId', async () => {
      let handlerCalled = false;

      tracker.registerHandler({
        commandTypes: ['A'],
        handler: () => {
          handlerCalled = true;
        },
      });

      await tracker.onCommandStarted({
        type: 'A',
        correlationId: 'c1',
        requestId: 'r1',
        data: {},
      });

      await tracker.onEventReceived({ type: 'ADone', data: {} } as Event, 'A');

      expect(handlerCalled).toBe(false);
    });
  });

  describe('handler execution', () => {
    it('should fire handler when all commands complete', async () => {
      let fired = false;

      tracker.registerHandler({
        commandTypes: ['A', 'B'],
        handler: () => {
          fired = true;
        },
      });

      await tracker.onCommandStarted({
        type: 'A',
        correlationId: 'c1',
        requestId: 'r1',
        data: {},
      });
      await tracker.onCommandStarted({
        type: 'B',
        correlationId: 'c1',
        requestId: 'r2',
        data: {},
      });

      await tracker.onEventReceived({ type: 'ADone', correlationId: 'c1', data: {} }, 'A');
      expect(fired).toBe(false);

      await tracker.onEventReceived({ type: 'BDone', correlationId: 'c1', data: {} }, 'B');
      expect(fired).toBe(true);
    });

    it('should not fire handler until all tracked commands have events', async () => {
      let fireCount = 0;

      tracker.registerHandler({
        commandTypes: ['CheckTests', 'CheckTypes', 'CheckLint'],
        handler: () => {
          fireCount++;
        },
      });

      await tracker.onCommandStarted({
        type: 'CheckTests',
        correlationId: 'c1',
        requestId: 'r1',
        data: {},
      });
      await tracker.onCommandStarted({
        type: 'CheckTypes',
        correlationId: 'c1',
        requestId: 'r2',
        data: {},
      });
      await tracker.onCommandStarted({
        type: 'CheckLint',
        correlationId: 'c1',
        requestId: 'r3',
        data: {},
      });

      await tracker.onEventReceived({ type: 'TestsCheckPassed', correlationId: 'c1', data: {} }, 'CheckTests');
      expect(fireCount).toBe(0);

      await tracker.onEventReceived({ type: 'TypeCheckPassed', correlationId: 'c1', data: {} }, 'CheckTypes');
      expect(fireCount).toBe(0);

      await tracker.onEventReceived({ type: 'LintCheckPassed', correlationId: 'c1', data: {} }, 'CheckLint');
      expect(fireCount).toBe(1);
    });

    it('should cleanup after handler fires by allowing new tracking for same correlationId', async () => {
      let fireCount = 0;

      tracker.registerHandler({
        commandTypes: ['A'],
        handler: () => {
          fireCount++;
        },
      });

      await tracker.onCommandStarted({ type: 'A', correlationId: 'c1', requestId: 'r1', data: {} });
      await tracker.onEventReceived({ type: 'ADone', correlationId: 'c1', data: {} }, 'A');
      expect(fireCount).toBe(1);

      expect(await tracker.isWaitingForAsync('c1', 'A')).toBe(false);
    });

    it('should handle separate correlationIds independently', async () => {
      const firedFor: string[] = [];

      tracker.registerHandler({
        commandTypes: ['A', 'B'],
        handler: (events) => {
          firedFor.push(events.A[0].correlationId ?? 'unknown');
        },
      });

      await tracker.onCommandStarted({ type: 'A', correlationId: 'c1', requestId: 'r1', data: {} });
      await tracker.onCommandStarted({ type: 'B', correlationId: 'c1', requestId: 'r2', data: {} });
      await tracker.onCommandStarted({ type: 'A', correlationId: 'c2', requestId: 'r3', data: {} });
      await tracker.onCommandStarted({ type: 'B', correlationId: 'c2', requestId: 'r4', data: {} });

      await tracker.onEventReceived({ type: 'ADone', correlationId: 'c1', data: {} }, 'A');
      await tracker.onEventReceived({ type: 'BDone', correlationId: 'c2', data: {} }, 'B');

      expect(firedFor).toHaveLength(0);

      await tracker.onEventReceived({ type: 'BDone', correlationId: 'c1', data: {} }, 'B');
      expect(firedFor).toEqual(['c1']);

      await tracker.onEventReceived({ type: 'ADone', correlationId: 'c2', data: {} }, 'A');
      expect(firedFor).toEqual(['c1', 'c2']);
    });
  });

  describe('persist for retry', () => {
    it('should reset trackers when handler returns persist: true', async () => {
      let callCount = 0;

      tracker.registerHandler({
        commandTypes: ['A'],
        handler: () => {
          callCount++;
          return callCount < 3 ? { persist: true } : undefined;
        },
      });

      await tracker.onCommandStarted({ type: 'A', correlationId: 'c1', requestId: 'r1', data: {} });
      await tracker.onEventReceived({ type: 'ADone', correlationId: 'c1', data: {} }, 'A');
      expect(callCount).toBe(1);

      await tracker.onCommandStarted({ type: 'A', correlationId: 'c1', requestId: 'r2', data: {} });
      expect(await tracker.isWaitingForAsync('c1', 'A')).toBe(true);

      await tracker.onEventReceived({ type: 'ADone', correlationId: 'c1', data: {} }, 'A');
      expect(callCount).toBe(2);

      await tracker.onCommandStarted({ type: 'A', correlationId: 'c1', requestId: 'r3', data: {} });
      await tracker.onEventReceived({ type: 'ADone', correlationId: 'c1', data: {} }, 'A');
      expect(callCount).toBe(3);

      expect(await tracker.isWaitingForAsync('c1', 'A')).toBe(false);
    });

    it('should cleanup on handler error and not throw', async () => {
      let handlerCalls = 0;

      tracker.registerHandler({
        commandTypes: ['A'],
        handler: () => {
          handlerCalls++;
          throw new Error('Handler error');
        },
      });

      await tracker.onCommandStarted({ type: 'A', correlationId: 'c1', requestId: 'r1', data: {} });

      await expect(
        tracker.onEventReceived({ type: 'ADone', correlationId: 'c1', data: {} }, 'A'),
      ).resolves.not.toThrow();

      expect(handlerCalls).toBe(1);
      expect(await tracker.isWaitingForAsync('c1', 'A')).toBe(false);
    });
  });

  describe('error callback', () => {
    it('should accept onError callback in options', () => {
      const onError = vi.fn();

      tracker = new SettledTracker({ onError });

      expect(tracker).toBeInstanceOf(SettledTracker);
    });

    it('should call onError when handler throws', async () => {
      const onError = vi.fn();
      const thrownError = new Error('Handler failed');

      tracker = new SettledTracker({ onError });

      tracker.registerHandler({
        commandTypes: ['A'],
        handler: () => {
          throw thrownError;
        },
      });

      await tracker.onCommandStarted({ type: 'A', correlationId: 'c1', requestId: 'r1', data: {} });
      await tracker.onEventReceived({ type: 'ADone', correlationId: 'c1', data: {} }, 'A');

      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(thrownError, {
        commandTypes: ['A'],
        correlationId: 'c1',
      });
    });
  });

  describe('dispatch callback', () => {
    it('should call onDispatch when provided', async () => {
      const dispatched: Array<{ type: string; data: unknown }> = [];

      tracker = new SettledTracker({
        onDispatch: (commandType, data, _correlationId) => {
          dispatched.push({ type: commandType, data });
        },
      });

      tracker.registerHandler({
        commandTypes: ['A'],
        handler: (_events, send) => {
          send('FollowUp', { foo: 'bar' });
        },
      });

      await tracker.onCommandStarted({ type: 'A', correlationId: 'c1', requestId: 'r1', data: {} });
      await tracker.onEventReceived({ type: 'ADone', correlationId: 'c1', data: {} }, 'A');

      expect(dispatched).toHaveLength(1);
      expect(dispatched[0]).toEqual({ type: 'FollowUp', data: { foo: 'bar' } });
    });

    it('should pass correlationId to onDispatch', async () => {
      let receivedCorrelationId: string | undefined;

      tracker = new SettledTracker({
        onDispatch: (_commandType, _data, correlationId) => {
          receivedCorrelationId = correlationId;
        },
      });

      tracker.registerHandler({
        commandTypes: ['A'],
        handler: (_events, send) => {
          send('FollowUp', {});
        },
      });

      await tracker.onCommandStarted({ type: 'A', correlationId: 'c1', requestId: 'r1', data: {} });
      await tracker.onEventReceived({ type: 'ADone', correlationId: 'c1', data: {} }, 'A');

      expect(receivedCorrelationId).toBe('c1');
    });
  });

  describe('event emission', () => {
    it('should emit SettledInstanceCreated when first command starts for a template', async () => {
      const emittedEvents: SettledEvent[] = [];

      tracker = new SettledTracker({
        onEventEmit: (event) => {
          emittedEvents.push(event);
        },
      });

      tracker.registerHandler({
        commandTypes: ['A', 'B'],
        handler: () => {},
      });

      await tracker.onCommandStarted({ type: 'A', correlationId: 'c1', requestId: 'r1', data: {} });

      expect(emittedEvents).toHaveLength(2);
      expect(emittedEvents[0].type).toBe('SettledInstanceCreated');
      expect(emittedEvents[0].data).toEqual({
        templateId: 'template-A,B',
        correlationId: 'c1',
        commandTypes: ['A', 'B'],
      });
    });

    it('should emit SettledCommandStarted when command starts', async () => {
      const emittedEvents: SettledEvent[] = [];

      tracker = new SettledTracker({
        onEventEmit: (event) => {
          emittedEvents.push(event);
        },
      });

      tracker.registerHandler({
        commandTypes: ['A', 'B'],
        handler: () => {},
      });

      await tracker.onCommandStarted({ type: 'A', correlationId: 'c1', requestId: 'r1', data: {} });

      expect(emittedEvents[1].type).toBe('SettledCommandStarted');
      expect(emittedEvents[1].data).toEqual({
        templateId: 'template-A,B',
        correlationId: 'c1',
        commandType: 'A',
      });
    });

    it('should not emit SettledInstanceCreated for subsequent commands in same instance', async () => {
      const emittedEvents: SettledEvent[] = [];

      tracker = new SettledTracker({
        onEventEmit: (event) => {
          emittedEvents.push(event);
        },
      });

      tracker.registerHandler({
        commandTypes: ['A', 'B'],
        handler: () => {},
      });

      await tracker.onCommandStarted({ type: 'A', correlationId: 'c1', requestId: 'r1', data: {} });
      await tracker.onCommandStarted({ type: 'B', correlationId: 'c1', requestId: 'r2', data: {} });

      const createdEvents = emittedEvents.filter((e) => e.type === 'SettledInstanceCreated');
      expect(createdEvents).toHaveLength(1);
    });

    it('should emit SettledEventReceived when event is received', async () => {
      const emittedEvents: SettledEvent[] = [];

      tracker = new SettledTracker({
        onEventEmit: (event) => {
          emittedEvents.push(event);
        },
      });

      tracker.registerHandler({
        commandTypes: ['A'],
        handler: () => {},
      });

      await tracker.onCommandStarted({ type: 'A', correlationId: 'c1', requestId: 'r1', data: {} });
      emittedEvents.length = 0;

      const domainEvent: Event = { type: 'ADone', correlationId: 'c1', data: { result: 'ok' } };
      await tracker.onEventReceived(domainEvent, 'A');

      expect(emittedEvents[0].type).toBe('SettledEventReceived');
      expect(emittedEvents[0].data).toEqual({
        templateId: 'template-A',
        correlationId: 'c1',
        commandType: 'A',
        event: domainEvent,
      });
    });

    it('should emit SettledHandlerFired when handler fires', async () => {
      const emittedEvents: SettledEvent[] = [];

      tracker = new SettledTracker({
        onEventEmit: (event) => {
          emittedEvents.push(event);
        },
      });

      tracker.registerHandler({
        commandTypes: ['A'],
        handler: () => {},
      });

      await tracker.onCommandStarted({ type: 'A', correlationId: 'c1', requestId: 'r1', data: {} });
      emittedEvents.length = 0;

      await tracker.onEventReceived({ type: 'ADone', correlationId: 'c1', data: {} }, 'A');

      const firedEvent = emittedEvents.find((e) => e.type === 'SettledHandlerFired');
      expect(firedEvent).toBeDefined();
      expect(firedEvent?.data).toEqual({
        templateId: 'template-A',
        correlationId: 'c1',
        persist: false,
      });
    });

    it('should emit SettledInstanceCleaned when handler fires without persist', async () => {
      const emittedEvents: SettledEvent[] = [];

      tracker = new SettledTracker({
        onEventEmit: (event) => {
          emittedEvents.push(event);
        },
      });

      tracker.registerHandler({
        commandTypes: ['A'],
        handler: () => {},
      });

      await tracker.onCommandStarted({ type: 'A', correlationId: 'c1', requestId: 'r1', data: {} });
      emittedEvents.length = 0;

      await tracker.onEventReceived({ type: 'ADone', correlationId: 'c1', data: {} }, 'A');

      const cleanedEvent = emittedEvents.find((e) => e.type === 'SettledInstanceCleaned');
      expect(cleanedEvent).toBeDefined();
      expect(cleanedEvent?.data).toEqual({
        templateId: 'template-A',
        correlationId: 'c1',
      });
    });

    it('should emit SettledInstanceReset when handler returns persist: true', async () => {
      const emittedEvents: SettledEvent[] = [];

      tracker = new SettledTracker({
        onEventEmit: (event) => {
          emittedEvents.push(event);
        },
      });

      tracker.registerHandler({
        commandTypes: ['A'],
        handler: () => ({ persist: true }),
      });

      await tracker.onCommandStarted({ type: 'A', correlationId: 'c1', requestId: 'r1', data: {} });
      emittedEvents.length = 0;

      await tracker.onEventReceived({ type: 'ADone', correlationId: 'c1', data: {} }, 'A');

      const firedEvent = emittedEvents.find((e) => e.type === 'SettledHandlerFired');
      expect(firedEvent?.data).toEqual({
        templateId: 'template-A',
        correlationId: 'c1',
        persist: true,
      });

      const resetEvent = emittedEvents.find((e) => e.type === 'SettledInstanceReset');
      expect(resetEvent).toBeDefined();
      expect(resetEvent?.data).toEqual({
        templateId: 'template-A',
        correlationId: 'c1',
      });
    });

    it('should emit SettledInstanceCleaned on handler error', async () => {
      const emittedEvents: SettledEvent[] = [];

      tracker = new SettledTracker({
        onEventEmit: (event) => {
          emittedEvents.push(event);
        },
        onError: () => {},
      });

      tracker.registerHandler({
        commandTypes: ['A'],
        handler: () => {
          throw new Error('Handler error');
        },
      });

      await tracker.onCommandStarted({ type: 'A', correlationId: 'c1', requestId: 'r1', data: {} });
      emittedEvents.length = 0;

      await tracker.onEventReceived({ type: 'ADone', correlationId: 'c1', data: {} }, 'A');

      const cleanedEvent = emittedEvents.find((e) => e.type === 'SettledInstanceCleaned');
      expect(cleanedEvent).toBeDefined();
    });
  });

  describe('projection-based state (full ES)', () => {
    it('should query instance state from readModel after emitting events', async () => {
      const { eventStore, readModel, close } = createPipelineEventStore();

      try {
        const emittedEvents: SettledEvent[] = [];

        const esTracker = new SettledTracker({
          readModel,
          onEventEmit: async (event) => {
            emittedEvents.push(event);
            await eventStore.appendToStream(`settled-${event.data.correlationId}`, [
              { type: event.type, data: event.data },
            ]);
          },
        });

        esTracker.registerHandler({
          commandTypes: ['A', 'B'],
          handler: () => {},
        });

        await esTracker.onCommandStarted({ type: 'A', correlationId: 'c1', requestId: 'r1', data: {} });

        const instance = await readModel.getSettledInstance('template-A,B', 'c1');

        expect(instance).not.toBeNull();
        expect(instance?.status).toBe('active');
        expect(instance?.commandTrackers).toHaveLength(2);

        const trackerA = instance?.commandTrackers.find((t) => t.commandType === 'A');
        expect(trackerA?.hasStarted).toBe(true);
        expect(trackerA?.hasCompleted).toBe(false);
      } finally {
        await close();
      }
    });

    it('should derive isWaitingFor from projection query', async () => {
      const { eventStore, readModel, close } = createPipelineEventStore();

      try {
        const esTracker = new SettledTracker({
          readModel,
          onEventEmit: async (event) => {
            await eventStore.appendToStream(`settled-${event.data.correlationId}`, [
              { type: event.type, data: event.data },
            ]);
          },
        });

        esTracker.registerHandler({
          commandTypes: ['A'],
          handler: () => {},
        });

        await esTracker.onCommandStarted({ type: 'A', correlationId: 'c1', requestId: 'r1', data: {} });

        const isWaiting = await esTracker.isWaitingForAsync('c1', 'A');
        expect(isWaiting).toBe(true);

        const isWaitingB = await esTracker.isWaitingForAsync('c1', 'B');
        expect(isWaitingB).toBe(false);
      } finally {
        await close();
      }
    });
  });
});
