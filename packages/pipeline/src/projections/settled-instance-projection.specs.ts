import { describe, expect, it } from 'vitest';
import {
  evolve,
  type SettledCommandStartedEvent,
  type SettledEventReceivedEvent,
  type SettledHandlerFiredEvent,
  type SettledInstanceCleanedEvent,
  type SettledInstanceCreatedEvent,
  type SettledInstanceDocument,
  type SettledInstanceResetEvent,
} from './settled-instance-projection';

describe('SettledInstanceProjection', () => {
  describe('evolve', () => {
    describe('SettledInstanceCreated', () => {
      it('creates document with initial command trackers', () => {
        const event: SettledInstanceCreatedEvent = {
          type: 'SettledInstanceCreated',
          data: {
            templateId: 'template-CmdA,CmdB',
            correlationId: 'c1',
            commandTypes: ['CmdA', 'CmdB'],
          },
        };

        const result = evolve(null, event);

        expect(result).toEqual({
          instanceId: 'template-CmdA,CmdB-c1',
          templateId: 'template-CmdA,CmdB',
          correlationId: 'c1',
          commandTrackers: [
            { commandType: 'CmdA', hasStarted: false, hasCompleted: false, events: [] },
            { commandType: 'CmdB', hasStarted: false, hasCompleted: false, events: [] },
          ],
          status: 'active',
          firedCount: 0,
        });
      });
    });

    describe('SettledCommandStarted', () => {
      it('sets hasStarted true for the specified command', () => {
        const existing: SettledInstanceDocument = {
          instanceId: 'template-CmdA,CmdB-c1',
          templateId: 'template-CmdA,CmdB',
          correlationId: 'c1',
          commandTrackers: [
            { commandType: 'CmdA', hasStarted: false, hasCompleted: false, events: [] },
            { commandType: 'CmdB', hasStarted: false, hasCompleted: false, events: [] },
          ],
          status: 'active',
          firedCount: 0,
        };
        const event: SettledCommandStartedEvent = {
          type: 'SettledCommandStarted',
          data: {
            templateId: 'template-CmdA,CmdB',
            correlationId: 'c1',
            commandType: 'CmdA',
          },
        };

        const result = evolve(existing, event);

        expect(result.commandTrackers[0]).toEqual({
          commandType: 'CmdA',
          hasStarted: true,
          hasCompleted: false,
          events: [],
        });
        expect(result.commandTrackers[1]).toEqual({
          commandType: 'CmdB',
          hasStarted: false,
          hasCompleted: false,
          events: [],
        });
      });

      it('preserves hasCompleted when command restarts (supports concurrent commands)', () => {
        const existing: SettledInstanceDocument = {
          instanceId: 'template-CmdA-c1',
          templateId: 'template-CmdA',
          correlationId: 'c1',
          commandTrackers: [{ commandType: 'CmdA', hasStarted: true, hasCompleted: true, events: [] }],
          status: 'active',
          firedCount: 0,
        };
        const event: SettledCommandStartedEvent = {
          type: 'SettledCommandStarted',
          data: {
            templateId: 'template-CmdA',
            correlationId: 'c1',
            commandType: 'CmdA',
          },
        };

        const result = evolve(existing, event);

        expect(result.commandTrackers[0]).toEqual({
          commandType: 'CmdA',
          hasStarted: true,
          hasCompleted: true,
          events: [],
        });
      });
    });

    describe('SettledEventReceived', () => {
      it('adds event to tracker and sets hasCompleted true', () => {
        const existing: SettledInstanceDocument = {
          instanceId: 'template-CmdA-c1',
          templateId: 'template-CmdA',
          correlationId: 'c1',
          commandTrackers: [{ commandType: 'CmdA', hasStarted: true, hasCompleted: false, events: [] }],
          status: 'active',
          firedCount: 0,
        };
        const domainEvent = { type: 'UserCreated', correlationId: 'c1', data: { userId: 'u1' } };
        const event: SettledEventReceivedEvent = {
          type: 'SettledEventReceived',
          data: {
            templateId: 'template-CmdA',
            correlationId: 'c1',
            commandType: 'CmdA',
            event: domainEvent,
          },
        };

        const result = evolve(existing, event);

        expect(result.commandTrackers[0]).toEqual({
          commandType: 'CmdA',
          hasStarted: true,
          hasCompleted: true,
          events: [domainEvent],
        });
      });

      it('appends multiple events to tracker', () => {
        const event1 = { type: 'Event1', correlationId: 'c1', data: {} };
        const existing: SettledInstanceDocument = {
          instanceId: 'template-CmdA-c1',
          templateId: 'template-CmdA',
          correlationId: 'c1',
          commandTrackers: [{ commandType: 'CmdA', hasStarted: true, hasCompleted: true, events: [event1] }],
          status: 'active',
          firedCount: 0,
        };
        const event2 = { type: 'Event2', correlationId: 'c1', data: {} };
        const event: SettledEventReceivedEvent = {
          type: 'SettledEventReceived',
          data: {
            templateId: 'template-CmdA',
            correlationId: 'c1',
            commandType: 'CmdA',
            event: event2,
          },
        };

        const result = evolve(existing, event);

        expect(result.commandTrackers[0].events).toEqual([event1, event2]);
      });
    });

    describe('SettledHandlerFired', () => {
      it('sets status to fired and increments firedCount', () => {
        const existing: SettledInstanceDocument = {
          instanceId: 'template-CmdA-c1',
          templateId: 'template-CmdA',
          correlationId: 'c1',
          commandTrackers: [{ commandType: 'CmdA', hasStarted: true, hasCompleted: true, events: [] }],
          status: 'active',
          firedCount: 0,
        };
        const event: SettledHandlerFiredEvent = {
          type: 'SettledHandlerFired',
          data: {
            templateId: 'template-CmdA',
            correlationId: 'c1',
            persist: false,
          },
        };

        const result = evolve(existing, event);

        expect(result.status).toBe('fired');
        expect(result.firedCount).toBe(1);
      });
    });

    describe('SettledInstanceReset', () => {
      it('clears trackers and sets status back to active', () => {
        const domainEvent = { type: 'Event1', correlationId: 'c1', data: {} };
        const existing: SettledInstanceDocument = {
          instanceId: 'template-CmdA,CmdB-c1',
          templateId: 'template-CmdA,CmdB',
          correlationId: 'c1',
          commandTrackers: [
            { commandType: 'CmdA', hasStarted: true, hasCompleted: true, events: [domainEvent] },
            { commandType: 'CmdB', hasStarted: true, hasCompleted: true, events: [domainEvent] },
          ],
          status: 'fired',
          firedCount: 1,
        };
        const event: SettledInstanceResetEvent = {
          type: 'SettledInstanceReset',
          data: {
            templateId: 'template-CmdA,CmdB',
            correlationId: 'c1',
          },
        };

        const result = evolve(existing, event);

        expect(result.status).toBe('active');
        expect(result.commandTrackers).toEqual([
          { commandType: 'CmdA', hasStarted: true, hasCompleted: false, events: [] },
          { commandType: 'CmdB', hasStarted: true, hasCompleted: false, events: [] },
        ]);
      });
    });

    describe('SettledInstanceCleaned', () => {
      it('sets status to cleaned', () => {
        const existing: SettledInstanceDocument = {
          instanceId: 'template-CmdA-c1',
          templateId: 'template-CmdA',
          correlationId: 'c1',
          commandTrackers: [{ commandType: 'CmdA', hasStarted: true, hasCompleted: true, events: [] }],
          status: 'fired',
          firedCount: 1,
        };
        const event: SettledInstanceCleanedEvent = {
          type: 'SettledInstanceCleaned',
          data: {
            templateId: 'template-CmdA',
            correlationId: 'c1',
          },
        };

        const result = evolve(existing, event);

        expect(result.status).toBe('cleaned');
      });
    });

    describe('null document assertions', () => {
      it('should throw when applying SettledCommandStarted to null document', () => {
        const event: SettledCommandStartedEvent = {
          type: 'SettledCommandStarted',
          data: { templateId: 't1', correlationId: 'c1', commandType: 'Cmd' },
        };
        expect(() => evolve(null, event)).toThrow('Cannot apply SettledCommandStarted to null document');
      });

      it('should throw when applying SettledEventReceived to null document', () => {
        const event: SettledEventReceivedEvent = {
          type: 'SettledEventReceived',
          data: {
            templateId: 't1',
            correlationId: 'c1',
            commandType: 'Cmd',
            event: { type: 'E', correlationId: 'c1', data: {} },
          },
        };
        expect(() => evolve(null, event)).toThrow('Cannot apply SettledEventReceived to null document');
      });

      it('should throw when applying SettledHandlerFired to null document', () => {
        const event: SettledHandlerFiredEvent = {
          type: 'SettledHandlerFired',
          data: { templateId: 't1', correlationId: 'c1', persist: false },
        };
        expect(() => evolve(null, event)).toThrow('Cannot apply SettledHandlerFired to null document');
      });

      it('should throw when applying SettledInstanceReset to null document', () => {
        const event: SettledInstanceResetEvent = {
          type: 'SettledInstanceReset',
          data: { templateId: 't1', correlationId: 'c1' },
        };
        expect(() => evolve(null, event)).toThrow('Cannot apply SettledInstanceReset to null document');
      });

      it('should throw when applying SettledInstanceCleaned to null document', () => {
        const event: SettledInstanceCleanedEvent = {
          type: 'SettledInstanceCleaned',
          data: { templateId: 't1', correlationId: 'c1' },
        };
        expect(() => evolve(null, event)).toThrow('Cannot apply SettledInstanceCleaned to null document');
      });
    });
  });
});
