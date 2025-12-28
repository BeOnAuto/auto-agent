import { describe, expect, it } from 'vitest';
import { evolve, type NodeStatusChangedEvent, type NodeStatusDocument } from './node-status-projection';

describe('NodeStatusProjection', () => {
  describe('evolve', () => {
    it('creates node document with running status when command starts', () => {
      const event: NodeStatusChangedEvent = {
        type: 'NodeStatusChanged',
        data: {
          correlationId: 'c1',
          commandName: 'ProcessItem',
          nodeId: 'cmd:ProcessItem',
          status: 'running',
          previousStatus: 'idle',
          pendingCount: 1,
          endedCount: 0,
        },
      };

      const result = evolve(null, event);

      expect(result).toEqual({
        correlationId: 'c1',
        commandName: 'ProcessItem',
        status: 'running',
        pendingCount: 1,
        endedCount: 0,
      });
    });

    it('updates node document to success status when command completes', () => {
      const existing: NodeStatusDocument = {
        correlationId: 'c1',
        commandName: 'ProcessItem',
        status: 'running',
        pendingCount: 1,
        endedCount: 0,
      };
      const event: NodeStatusChangedEvent = {
        type: 'NodeStatusChanged',
        data: {
          correlationId: 'c1',
          commandName: 'ProcessItem',
          nodeId: 'cmd:ProcessItem',
          status: 'success',
          previousStatus: 'running',
          pendingCount: 0,
          endedCount: 1,
        },
      };

      const result = evolve(existing, event);

      expect(result).toEqual({
        correlationId: 'c1',
        commandName: 'ProcessItem',
        status: 'success',
        pendingCount: 0,
        endedCount: 1,
      });
    });

    it('updates node document to error status when command fails', () => {
      const existing: NodeStatusDocument = {
        correlationId: 'c1',
        commandName: 'ProcessItem',
        status: 'running',
        pendingCount: 1,
        endedCount: 0,
      };
      const event: NodeStatusChangedEvent = {
        type: 'NodeStatusChanged',
        data: {
          correlationId: 'c1',
          commandName: 'ProcessItem',
          nodeId: 'cmd:ProcessItem',
          status: 'error',
          previousStatus: 'running',
          pendingCount: 0,
          endedCount: 1,
        },
      };

      const result = evolve(existing, event);

      expect(result).toEqual({
        correlationId: 'c1',
        commandName: 'ProcessItem',
        status: 'error',
        pendingCount: 0,
        endedCount: 1,
      });
    });

    it('tracks pending and ended counts for parallel items', () => {
      const existing: NodeStatusDocument = {
        correlationId: 'c1',
        commandName: 'ProcessItem',
        status: 'running',
        pendingCount: 3,
        endedCount: 2,
      };
      const event: NodeStatusChangedEvent = {
        type: 'NodeStatusChanged',
        data: {
          correlationId: 'c1',
          commandName: 'ProcessItem',
          nodeId: 'cmd:ProcessItem',
          status: 'running',
          previousStatus: 'running',
          pendingCount: 2,
          endedCount: 3,
        },
      };

      const result = evolve(existing, event);

      expect(result).toEqual({
        correlationId: 'c1',
        commandName: 'ProcessItem',
        status: 'running',
        pendingCount: 2,
        endedCount: 3,
      });
    });
  });
});
