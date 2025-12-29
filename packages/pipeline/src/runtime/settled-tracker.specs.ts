import type { Command, Event } from '@auto-engineer/message-bus';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SettledEvent, SettledInstanceDocument } from '../projections/settled-instance-projection';
import { SettledTracker } from './settled-tracker';

describe('SettledTracker', () => {
  let tracker: SettledTracker;

  beforeEach(() => {
    tracker = new SettledTracker();
  });

  describe('handler registration', () => {
    it('should fire handler when registered command completes', () => {
      let fired = false;

      tracker.registerHandler({
        commandTypes: ['CheckTests', 'CheckTypes', 'CheckLint'],
        handler: () => {
          fired = true;
        },
      });

      tracker.onCommandStarted({ type: 'CheckTests', correlationId: 'c1', requestId: 'r1', data: {} });
      tracker.onCommandStarted({ type: 'CheckTypes', correlationId: 'c1', requestId: 'r2', data: {} });
      tracker.onCommandStarted({ type: 'CheckLint', correlationId: 'c1', requestId: 'r3', data: {} });

      tracker.onEventReceived({ type: 'TestsCheckPassed', correlationId: 'c1', data: {} }, 'CheckTests');
      tracker.onEventReceived({ type: 'TypeCheckPassed', correlationId: 'c1', data: {} }, 'CheckTypes');
      tracker.onEventReceived({ type: 'LintCheckPassed', correlationId: 'c1', data: {} }, 'CheckLint');

      expect(fired).toBe(true);
    });

    it('should fire multiple registered handlers independently', () => {
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

      tracker.onCommandStarted({ type: 'A', correlationId: 'c1', requestId: 'r1', data: {} });
      tracker.onCommandStarted({ type: 'B', correlationId: 'c1', requestId: 'r2', data: {} });
      tracker.onEventReceived({ type: 'ADone', correlationId: 'c1', data: {} }, 'A');
      tracker.onEventReceived({ type: 'BDone', correlationId: 'c1', data: {} }, 'B');

      expect(handler1Fired).toBe(true);
      expect(handler2Fired).toBe(false);

      tracker.onCommandStarted({ type: 'C', correlationId: 'c1', requestId: 'r3', data: {} });
      tracker.onCommandStarted({ type: 'D', correlationId: 'c1', requestId: 'r4', data: {} });
      tracker.onEventReceived({ type: 'CDone', correlationId: 'c1', data: {} }, 'C');
      tracker.onEventReceived({ type: 'DDone', correlationId: 'c1', data: {} }, 'D');

      expect(handler2Fired).toBe(true);
    });
  });

  describe('command tracking', () => {
    it('should track multiple commands by correlationId', () => {
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

      tracker.onCommandStarted(command);

      expect(tracker.isWaitingFor('c1', 'CheckTests')).toBe(true);
      expect(tracker.isWaitingFor('c1', 'CheckTypes')).toBe(false);
    });

    it('should create handler instance when first tracked command arrives', () => {
      let fired = false;

      tracker.registerHandler({
        commandTypes: ['A', 'B'],
        handler: () => {
          fired = true;
        },
      });

      tracker.onCommandStarted({ type: 'A', correlationId: 'c1', requestId: 'r1', data: {} });

      expect(tracker.isWaitingFor('c1', 'A')).toBe(true);
      expect(fired).toBe(false);
    });

    it('should not fire handler multiple times for same correlationId when commands arrive separately', () => {
      let fireCount = 0;

      tracker.registerHandler({
        commandTypes: ['A', 'B'],
        handler: () => {
          fireCount++;
        },
      });

      tracker.onCommandStarted({ type: 'A', correlationId: 'c1', requestId: 'r1', data: {} });
      tracker.onCommandStarted({ type: 'B', correlationId: 'c1', requestId: 'r2', data: {} });

      tracker.onEventReceived({ type: 'ADone', correlationId: 'c1', data: {} }, 'A');
      tracker.onEventReceived({ type: 'BDone', correlationId: 'c1', data: {} }, 'B');

      expect(fireCount).toBe(1);
    });

    it('should ignore commands without correlationId', () => {
      let fired = false;

      tracker.registerHandler({
        commandTypes: ['A'],
        handler: () => {
          fired = true;
        },
      });

      tracker.onCommandStarted({
        type: 'A',
        requestId: 'r1',
        data: {},
      } as Command);

      tracker.onEventReceived({ type: 'ADone', correlationId: 'c1', data: {} }, 'A');

      expect(fired).toBe(false);
    });

    it('should ignore commands without requestId', () => {
      let fired = false;

      tracker.registerHandler({
        commandTypes: ['A'],
        handler: () => {
          fired = true;
        },
      });

      tracker.onCommandStarted({
        type: 'A',
        correlationId: 'c1',
        data: {},
      } as Command);

      tracker.onEventReceived({ type: 'ADone', correlationId: 'c1', data: {} }, 'A');

      expect(fired).toBe(false);
    });
  });

  describe('event routing', () => {
    it('should mark command as complete when event received', () => {
      tracker.registerHandler({
        commandTypes: ['A'],
        handler: () => {},
      });

      tracker.onCommandStarted({
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

      tracker.onEventReceived(event, 'A');

      expect(tracker.isWaitingFor('c1', 'A')).toBe(false);
    });

    it('should collect events for each command type', () => {
      let receivedEvents: Record<string, Event[]> = {};

      tracker.registerHandler({
        commandTypes: ['A', 'B'],
        handler: (events) => {
          receivedEvents = events;
        },
      });

      tracker.onCommandStarted({
        type: 'A',
        correlationId: 'c1',
        requestId: 'r1',
        data: {},
      });
      tracker.onCommandStarted({
        type: 'B',
        correlationId: 'c1',
        requestId: 'r2',
        data: {},
      });

      tracker.onEventReceived({ type: 'ADone', correlationId: 'c1', data: { foo: 1 } }, 'A');
      tracker.onEventReceived({ type: 'BDone', correlationId: 'c1', data: { bar: 2 } }, 'B');

      expect(receivedEvents.A).toHaveLength(1);
      expect(receivedEvents.A[0].type).toBe('ADone');
      expect(receivedEvents.B).toHaveLength(1);
      expect(receivedEvents.B[0].type).toBe('BDone');
    });

    it('should ignore events without correlationId', () => {
      let handlerCalled = false;

      tracker.registerHandler({
        commandTypes: ['A'],
        handler: () => {
          handlerCalled = true;
        },
      });

      tracker.onCommandStarted({
        type: 'A',
        correlationId: 'c1',
        requestId: 'r1',
        data: {},
      });

      tracker.onEventReceived({ type: 'ADone', data: {} } as Event, 'A');

      expect(handlerCalled).toBe(false);
    });
  });

  describe('handler execution', () => {
    it('should fire handler when all commands complete', () => {
      let fired = false;

      tracker.registerHandler({
        commandTypes: ['A', 'B'],
        handler: () => {
          fired = true;
        },
      });

      tracker.onCommandStarted({
        type: 'A',
        correlationId: 'c1',
        requestId: 'r1',
        data: {},
      });
      tracker.onCommandStarted({
        type: 'B',
        correlationId: 'c1',
        requestId: 'r2',
        data: {},
      });

      tracker.onEventReceived({ type: 'ADone', correlationId: 'c1', data: {} }, 'A');
      expect(fired).toBe(false);

      tracker.onEventReceived({ type: 'BDone', correlationId: 'c1', data: {} }, 'B');
      expect(fired).toBe(true);
    });

    it('should not fire handler until all tracked commands have events', () => {
      let fireCount = 0;

      tracker.registerHandler({
        commandTypes: ['CheckTests', 'CheckTypes', 'CheckLint'],
        handler: () => {
          fireCount++;
        },
      });

      tracker.onCommandStarted({
        type: 'CheckTests',
        correlationId: 'c1',
        requestId: 'r1',
        data: {},
      });
      tracker.onCommandStarted({
        type: 'CheckTypes',
        correlationId: 'c1',
        requestId: 'r2',
        data: {},
      });
      tracker.onCommandStarted({
        type: 'CheckLint',
        correlationId: 'c1',
        requestId: 'r3',
        data: {},
      });

      tracker.onEventReceived({ type: 'TestsCheckPassed', correlationId: 'c1', data: {} }, 'CheckTests');
      expect(fireCount).toBe(0);

      tracker.onEventReceived({ type: 'TypeCheckPassed', correlationId: 'c1', data: {} }, 'CheckTypes');
      expect(fireCount).toBe(0);

      tracker.onEventReceived({ type: 'LintCheckPassed', correlationId: 'c1', data: {} }, 'CheckLint');
      expect(fireCount).toBe(1);
    });

    it('should cleanup after handler fires by allowing new tracking for same correlationId', () => {
      let fireCount = 0;

      tracker.registerHandler({
        commandTypes: ['A'],
        handler: () => {
          fireCount++;
        },
      });

      tracker.onCommandStarted({ type: 'A', correlationId: 'c1', requestId: 'r1', data: {} });
      tracker.onEventReceived({ type: 'ADone', correlationId: 'c1', data: {} }, 'A');
      expect(fireCount).toBe(1);

      expect(tracker.isWaitingFor('c1', 'A')).toBe(false);
    });

    it('should handle separate correlationIds independently', () => {
      const firedFor: string[] = [];

      tracker.registerHandler({
        commandTypes: ['A', 'B'],
        handler: (events) => {
          firedFor.push(events.A[0].correlationId ?? 'unknown');
        },
      });

      tracker.onCommandStarted({ type: 'A', correlationId: 'c1', requestId: 'r1', data: {} });
      tracker.onCommandStarted({ type: 'B', correlationId: 'c1', requestId: 'r2', data: {} });
      tracker.onCommandStarted({ type: 'A', correlationId: 'c2', requestId: 'r3', data: {} });
      tracker.onCommandStarted({ type: 'B', correlationId: 'c2', requestId: 'r4', data: {} });

      tracker.onEventReceived({ type: 'ADone', correlationId: 'c1', data: {} }, 'A');
      tracker.onEventReceived({ type: 'BDone', correlationId: 'c2', data: {} }, 'B');

      expect(firedFor).toHaveLength(0);

      tracker.onEventReceived({ type: 'BDone', correlationId: 'c1', data: {} }, 'B');
      expect(firedFor).toEqual(['c1']);

      tracker.onEventReceived({ type: 'ADone', correlationId: 'c2', data: {} }, 'A');
      expect(firedFor).toEqual(['c1', 'c2']);
    });
  });

  describe('persist for retry', () => {
    it('should reset trackers when handler returns persist: true', () => {
      let callCount = 0;

      tracker.registerHandler({
        commandTypes: ['A'],
        handler: () => {
          callCount++;
          return callCount < 3 ? { persist: true } : undefined;
        },
      });

      tracker.onCommandStarted({ type: 'A', correlationId: 'c1', requestId: 'r1', data: {} });
      tracker.onEventReceived({ type: 'ADone', correlationId: 'c1', data: {} }, 'A');
      expect(callCount).toBe(1);

      tracker.onCommandStarted({ type: 'A', correlationId: 'c1', requestId: 'r2', data: {} });
      expect(tracker.isWaitingFor('c1', 'A')).toBe(true);

      tracker.onEventReceived({ type: 'ADone', correlationId: 'c1', data: {} }, 'A');
      expect(callCount).toBe(2);

      tracker.onCommandStarted({ type: 'A', correlationId: 'c1', requestId: 'r3', data: {} });
      tracker.onEventReceived({ type: 'ADone', correlationId: 'c1', data: {} }, 'A');
      expect(callCount).toBe(3);

      expect(tracker.isWaitingFor('c1', 'A')).toBe(false);
    });

    it('should cleanup on handler error and not throw', () => {
      let handlerCalls = 0;

      tracker.registerHandler({
        commandTypes: ['A'],
        handler: () => {
          handlerCalls++;
          throw new Error('Handler error');
        },
      });

      tracker.onCommandStarted({ type: 'A', correlationId: 'c1', requestId: 'r1', data: {} });

      expect(() => {
        tracker.onEventReceived({ type: 'ADone', correlationId: 'c1', data: {} }, 'A');
      }).not.toThrow();

      expect(handlerCalls).toBe(1);
      expect(tracker.isWaitingFor('c1', 'A')).toBe(false);
    });
  });

  describe('error callback', () => {
    it('should accept onError callback in options', () => {
      const onError = vi.fn();

      tracker = new SettledTracker({ onError });

      expect(tracker).toBeInstanceOf(SettledTracker);
    });

    it('should call onError when handler throws', () => {
      const onError = vi.fn();
      const thrownError = new Error('Handler failed');

      tracker = new SettledTracker({ onError });

      tracker.registerHandler({
        commandTypes: ['A'],
        handler: () => {
          throw thrownError;
        },
      });

      tracker.onCommandStarted({ type: 'A', correlationId: 'c1', requestId: 'r1', data: {} });
      tracker.onEventReceived({ type: 'ADone', correlationId: 'c1', data: {} }, 'A');

      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(thrownError, {
        commandTypes: ['A'],
        correlationId: 'c1',
      });
    });
  });

  describe('dispatch callback', () => {
    it('should call onDispatch when provided', () => {
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

      tracker.onCommandStarted({ type: 'A', correlationId: 'c1', requestId: 'r1', data: {} });
      tracker.onEventReceived({ type: 'ADone', correlationId: 'c1', data: {} }, 'A');

      expect(dispatched).toHaveLength(1);
      expect(dispatched[0]).toEqual({ type: 'FollowUp', data: { foo: 'bar' } });
    });

    it('should pass correlationId to onDispatch', () => {
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

      tracker.onCommandStarted({ type: 'A', correlationId: 'c1', requestId: 'r1', data: {} });
      tracker.onEventReceived({ type: 'ADone', correlationId: 'c1', data: {} }, 'A');

      expect(receivedCorrelationId).toBe('c1');
    });
  });

  describe('event emission', () => {
    it('should emit SettledInstanceCreated when first command starts for a template', () => {
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

      tracker.onCommandStarted({ type: 'A', correlationId: 'c1', requestId: 'r1', data: {} });

      expect(emittedEvents).toHaveLength(2);
      expect(emittedEvents[0].type).toBe('SettledInstanceCreated');
      expect(emittedEvents[0].data).toEqual({
        templateId: 'template-A,B',
        correlationId: 'c1',
        commandTypes: ['A', 'B'],
      });
    });

    it('should emit SettledCommandStarted when command starts', () => {
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

      tracker.onCommandStarted({ type: 'A', correlationId: 'c1', requestId: 'r1', data: {} });

      expect(emittedEvents[1].type).toBe('SettledCommandStarted');
      expect(emittedEvents[1].data).toEqual({
        templateId: 'template-A,B',
        correlationId: 'c1',
        commandType: 'A',
      });
    });

    it('should not emit SettledInstanceCreated for subsequent commands in same instance', () => {
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

      tracker.onCommandStarted({ type: 'A', correlationId: 'c1', requestId: 'r1', data: {} });
      tracker.onCommandStarted({ type: 'B', correlationId: 'c1', requestId: 'r2', data: {} });

      const createdEvents = emittedEvents.filter((e) => e.type === 'SettledInstanceCreated');
      expect(createdEvents).toHaveLength(1);
    });

    it('should emit SettledEventReceived when event is received', () => {
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

      tracker.onCommandStarted({ type: 'A', correlationId: 'c1', requestId: 'r1', data: {} });
      emittedEvents.length = 0;

      const domainEvent: Event = { type: 'ADone', correlationId: 'c1', data: { result: 'ok' } };
      tracker.onEventReceived(domainEvent, 'A');

      expect(emittedEvents[0].type).toBe('SettledEventReceived');
      expect(emittedEvents[0].data).toEqual({
        templateId: 'template-A',
        correlationId: 'c1',
        commandType: 'A',
        event: domainEvent,
      });
    });

    it('should emit SettledHandlerFired when handler fires', () => {
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

      tracker.onCommandStarted({ type: 'A', correlationId: 'c1', requestId: 'r1', data: {} });
      emittedEvents.length = 0;

      tracker.onEventReceived({ type: 'ADone', correlationId: 'c1', data: {} }, 'A');

      const firedEvent = emittedEvents.find((e) => e.type === 'SettledHandlerFired');
      expect(firedEvent).toBeDefined();
      expect(firedEvent?.data).toEqual({
        templateId: 'template-A',
        correlationId: 'c1',
        persist: false,
      });
    });

    it('should emit SettledInstanceCleaned when handler fires without persist', () => {
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

      tracker.onCommandStarted({ type: 'A', correlationId: 'c1', requestId: 'r1', data: {} });
      emittedEvents.length = 0;

      tracker.onEventReceived({ type: 'ADone', correlationId: 'c1', data: {} }, 'A');

      const cleanedEvent = emittedEvents.find((e) => e.type === 'SettledInstanceCleaned');
      expect(cleanedEvent).toBeDefined();
      expect(cleanedEvent?.data).toEqual({
        templateId: 'template-A',
        correlationId: 'c1',
      });
    });

    it('should emit SettledInstanceReset when handler returns persist: true', () => {
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

      tracker.onCommandStarted({ type: 'A', correlationId: 'c1', requestId: 'r1', data: {} });
      emittedEvents.length = 0;

      tracker.onEventReceived({ type: 'ADone', correlationId: 'c1', data: {} }, 'A');

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

    it('should emit SettledInstanceCleaned on handler error', () => {
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

      tracker.onCommandStarted({ type: 'A', correlationId: 'c1', requestId: 'r1', data: {} });
      emittedEvents.length = 0;

      tracker.onEventReceived({ type: 'ADone', correlationId: 'c1', data: {} }, 'A');

      const cleanedEvent = emittedEvents.find((e) => e.type === 'SettledInstanceCleaned');
      expect(cleanedEvent).toBeDefined();
    });
  });

  describe('rebuild from projection', () => {
    it('should restore active instances from projection documents', () => {
      tracker.registerHandler({
        commandTypes: ['A', 'B'],
        handler: () => {},
      });

      const documents: SettledInstanceDocument[] = [
        {
          instanceId: 'template-A,B-c1',
          templateId: 'template-A,B',
          correlationId: 'c1',
          commandTrackers: [
            { commandType: 'A', hasStarted: true, hasCompleted: false, events: [] },
            { commandType: 'B', hasStarted: false, hasCompleted: false, events: [] },
          ],
          status: 'active',
        },
      ];

      tracker.rebuildFromProjection(documents);

      expect(tracker.isWaitingFor('c1', 'A')).toBe(true);
      expect(tracker.isWaitingFor('c1', 'B')).toBe(false);
      expect(tracker.getActiveInstanceCount()).toBe(1);
    });

    it('should skip cleaned instances', () => {
      tracker.registerHandler({
        commandTypes: ['A'],
        handler: () => {},
      });

      const documents: SettledInstanceDocument[] = [
        {
          instanceId: 'template-A-c1',
          templateId: 'template-A',
          correlationId: 'c1',
          commandTrackers: [{ commandType: 'A', hasStarted: true, hasCompleted: false, events: [] }],
          status: 'cleaned',
        },
      ];

      tracker.rebuildFromProjection(documents);

      expect(tracker.getActiveInstanceCount()).toBe(0);
    });

    it('should skip fired instances', () => {
      tracker.registerHandler({
        commandTypes: ['A'],
        handler: () => {},
      });

      const documents: SettledInstanceDocument[] = [
        {
          instanceId: 'template-A-c1',
          templateId: 'template-A',
          correlationId: 'c1',
          commandTrackers: [{ commandType: 'A', hasStarted: true, hasCompleted: true, events: [] }],
          status: 'fired',
        },
      ];

      tracker.rebuildFromProjection(documents);

      expect(tracker.getActiveInstanceCount()).toBe(0);
    });

    it('should restore events in command trackers', () => {
      tracker.registerHandler({
        commandTypes: ['A'],
        handler: () => {},
      });

      const storedEvent: Event = { type: 'ADone', correlationId: 'c1', data: { result: 'ok' } };
      const documents: SettledInstanceDocument[] = [
        {
          instanceId: 'template-A-c1',
          templateId: 'template-A',
          correlationId: 'c1',
          commandTrackers: [{ commandType: 'A', hasStarted: true, hasCompleted: true, events: [storedEvent] }],
          status: 'active',
        },
      ];

      tracker.rebuildFromProjection(documents);

      expect(tracker.getActiveInstanceCount()).toBe(1);
    });

    it('should skip instances for unregistered templates', () => {
      const documents: SettledInstanceDocument[] = [
        {
          instanceId: 'template-Unknown-c1',
          templateId: 'template-Unknown',
          correlationId: 'c1',
          commandTrackers: [{ commandType: 'Unknown', hasStarted: true, hasCompleted: false, events: [] }],
          status: 'active',
        },
      ];

      tracker.rebuildFromProjection(documents);

      expect(tracker.getActiveInstanceCount()).toBe(0);
    });
  });
});
