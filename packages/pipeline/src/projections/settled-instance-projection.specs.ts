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
      it('sets status to fired', () => {
        const existing: SettledInstanceDocument = {
          instanceId: 'template-CmdA-c1',
          templateId: 'template-CmdA',
          correlationId: 'c1',
          commandTrackers: [{ commandType: 'CmdA', hasStarted: true, hasCompleted: true, events: [] }],
          status: 'active',
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
  });
});
