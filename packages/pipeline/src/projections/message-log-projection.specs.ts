import { describe, expect, it } from 'vitest';
import { type CommandDispatchedEvent, type DomainEventEmittedEvent, evolve } from './message-log-projection';

describe('MessageLogProjection', () => {
  describe('CommandDispatched', () => {
    it('creates message log entry for dispatched command', () => {
      const event: CommandDispatchedEvent = {
        type: 'CommandDispatched',
        data: {
          correlationId: 'c1',
          requestId: 'r1',
          commandType: 'CreateUser',
          commandData: { name: 'Alice' },
          timestamp: new Date('2025-01-01T00:00:00Z'),
        },
      };

      const result = evolve(null, event);

      expect(result).toEqual({
        correlationId: 'c1',
        requestId: 'r1',
        messageType: 'command',
        messageName: 'CreateUser',
        messageData: { name: 'Alice' },
        timestamp: new Date('2025-01-01T00:00:00Z'),
      });
    });
  });

  describe('DomainEventEmitted', () => {
    it('creates message log entry for emitted domain event', () => {
      const event: DomainEventEmittedEvent = {
        type: 'DomainEventEmitted',
        data: {
          correlationId: 'c1',
          requestId: 'r2',
          eventType: 'UserCreated',
          eventData: { userId: '123', name: 'Alice' },
          timestamp: new Date('2025-01-01T00:00:01Z'),
        },
      };

      const result = evolve(null, event);

      expect(result).toEqual({
        correlationId: 'c1',
        requestId: 'r2',
        messageType: 'event',
        messageName: 'UserCreated',
        messageData: { userId: '123', name: 'Alice' },
        timestamp: new Date('2025-01-01T00:00:01Z'),
      });
    });
  });
});
