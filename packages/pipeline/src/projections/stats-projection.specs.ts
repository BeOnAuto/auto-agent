import { describe, expect, it } from 'vitest';
import type { MessageLogEvent } from './message-log-projection';
import { evolve, type StatsDocument } from './stats-projection';

describe('StatsProjection', () => {
  describe('CommandDispatched', () => {
    it('increments totalMessages and totalCommands for first command', () => {
      const event: MessageLogEvent = {
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
        totalMessages: 1,
        totalCommands: 1,
        totalEvents: 0,
      });
    });

    it('accumulates commands over time', () => {
      const existing: StatsDocument = {
        totalMessages: 5,
        totalCommands: 3,
        totalEvents: 2,
      };

      const event: MessageLogEvent = {
        type: 'CommandDispatched',
        data: {
          correlationId: 'c1',
          requestId: 'r2',
          commandType: 'UpdateUser',
          commandData: { name: 'Bob' },
          timestamp: new Date('2025-01-01T00:00:01Z'),
        },
      };

      const result = evolve(existing, event);

      expect(result).toEqual({
        totalMessages: 6,
        totalCommands: 4,
        totalEvents: 2,
      });
    });
  });

  describe('DomainEventEmitted', () => {
    it('increments totalMessages and totalEvents for first event', () => {
      const event: MessageLogEvent = {
        type: 'DomainEventEmitted',
        data: {
          correlationId: 'c1',
          requestId: 'r1',
          eventType: 'UserCreated',
          eventData: { userId: '123' },
          timestamp: new Date('2025-01-01T00:00:00Z'),
        },
      };

      const result = evolve(null, event);

      expect(result).toEqual({
        totalMessages: 1,
        totalCommands: 0,
        totalEvents: 1,
      });
    });

    it('accumulates events over time', () => {
      const existing: StatsDocument = {
        totalMessages: 5,
        totalCommands: 3,
        totalEvents: 2,
      };

      const event: MessageLogEvent = {
        type: 'DomainEventEmitted',
        data: {
          correlationId: 'c1',
          requestId: 'r2',
          eventType: 'UserUpdated',
          eventData: { userId: '123' },
          timestamp: new Date('2025-01-01T00:00:01Z'),
        },
      };

      const result = evolve(existing, event);

      expect(result).toEqual({
        totalMessages: 6,
        totalCommands: 3,
        totalEvents: 3,
      });
    });
  });
});
