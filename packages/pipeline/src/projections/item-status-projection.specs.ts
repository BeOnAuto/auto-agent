import { describe, expect, it } from 'vitest';
import { evolve, type ItemStatusChangedEvent, type ItemStatusDocument } from './item-status-projection';

describe('ItemStatusProjection', () => {
  describe('evolve', () => {
    it('creates item document with running status when item starts', () => {
      const event: ItemStatusChangedEvent = {
        type: 'ItemStatusChanged',
        data: {
          correlationId: 'c1',
          commandType: 'ProcessItem',
          itemKey: 'item-1',
          requestId: 'req-1',
          status: 'running',
          attemptCount: 1,
        },
      };

      const result = evolve(null, event);

      expect(result).toEqual({
        correlationId: 'c1',
        commandType: 'ProcessItem',
        itemKey: 'item-1',
        currentRequestId: 'req-1',
        status: 'running',
        attemptCount: 1,
      });
    });

    it('updates item document to success status when item completes', () => {
      const existing: ItemStatusDocument = {
        correlationId: 'c1',
        commandType: 'ProcessItem',
        itemKey: 'item-1',
        currentRequestId: 'req-1',
        status: 'running',
        attemptCount: 1,
      };
      const event: ItemStatusChangedEvent = {
        type: 'ItemStatusChanged',
        data: {
          correlationId: 'c1',
          commandType: 'ProcessItem',
          itemKey: 'item-1',
          requestId: 'req-1',
          status: 'success',
          attemptCount: 1,
        },
      };

      const result = evolve(existing, event);

      expect(result).toEqual({
        correlationId: 'c1',
        commandType: 'ProcessItem',
        itemKey: 'item-1',
        currentRequestId: 'req-1',
        status: 'success',
        attemptCount: 1,
      });
    });

    it('updates item document to error status when item fails', () => {
      const existing: ItemStatusDocument = {
        correlationId: 'c1',
        commandType: 'ProcessItem',
        itemKey: 'item-1',
        currentRequestId: 'req-1',
        status: 'running',
        attemptCount: 1,
      };
      const event: ItemStatusChangedEvent = {
        type: 'ItemStatusChanged',
        data: {
          correlationId: 'c1',
          commandType: 'ProcessItem',
          itemKey: 'item-1',
          requestId: 'req-1',
          status: 'error',
          attemptCount: 1,
        },
      };

      const result = evolve(existing, event);

      expect(result).toEqual({
        correlationId: 'c1',
        commandType: 'ProcessItem',
        itemKey: 'item-1',
        currentRequestId: 'req-1',
        status: 'error',
        attemptCount: 1,
      });
    });

    it('increments attempt count on retry', () => {
      const existing: ItemStatusDocument = {
        correlationId: 'c1',
        commandType: 'ProcessItem',
        itemKey: 'item-1',
        currentRequestId: 'req-1',
        status: 'error',
        attemptCount: 1,
      };
      const event: ItemStatusChangedEvent = {
        type: 'ItemStatusChanged',
        data: {
          correlationId: 'c1',
          commandType: 'ProcessItem',
          itemKey: 'item-1',
          requestId: 'req-2',
          status: 'running',
          attemptCount: 2,
        },
      };

      const result = evolve(existing, event);

      expect(result).toEqual({
        correlationId: 'c1',
        commandType: 'ProcessItem',
        itemKey: 'item-1',
        currentRequestId: 'req-2',
        status: 'running',
        attemptCount: 2,
      });
    });
  });
});
