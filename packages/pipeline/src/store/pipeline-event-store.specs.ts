import { describe, expect, it } from 'vitest';
import type { ItemStatusDocument } from '../projections/item-status-projection';
import type { NodeStatusDocument } from '../projections/node-status-projection';
import type { SettledInstanceDocument } from '../projections/settled-instance-projection';
import { createPipelineEventStore } from './pipeline-event-store';

describe('PipelineEventStore', () => {
  describe('appendToStream', () => {
    it('should append events and update projections', async () => {
      const { eventStore, database, close } = createPipelineEventStore();
      try {
        await eventStore.appendToStream('pipeline-c1', [
          {
            type: 'ItemStatusChanged',
            data: {
              correlationId: 'c1',
              commandType: 'Cmd',
              itemKey: 'a',
              requestId: 'r1',
              status: 'running',
              attemptCount: 1,
            },
          },
        ]);

        const collection = database.collection<ItemStatusDocument & { _id: string }>('ItemStatus');
        const items = await collection.find();

        expect(items.length).toBe(1);
        expect(items[0]?.status).toBe('running');
      } finally {
        await close();
      }
    });

    it('should project NodeStatusChanged events', async () => {
      const { eventStore, database, close } = createPipelineEventStore();
      try {
        await eventStore.appendToStream('pipeline-c1', [
          {
            type: 'NodeStatusChanged',
            data: {
              correlationId: 'c1',
              commandName: 'Cmd',
              nodeId: 'node-1',
              status: 'running',
              previousStatus: 'idle',
              pendingCount: 1,
              endedCount: 0,
            },
          },
        ]);

        const collection = database.collection<NodeStatusDocument & { _id: string }>('NodeStatus');
        const nodes = await collection.find();

        expect(nodes.length).toBe(1);
        expect(nodes[0]?.status).toBe('running');
      } finally {
        await close();
      }
    });

    it('should update existing projection documents', async () => {
      const { eventStore, database, close } = createPipelineEventStore();
      try {
        await eventStore.appendToStream('pipeline-c1', [
          {
            type: 'ItemStatusChanged',
            data: {
              correlationId: 'c1',
              commandType: 'Cmd',
              itemKey: 'a',
              requestId: 'r1',
              status: 'running',
              attemptCount: 1,
            },
          },
        ]);

        await eventStore.appendToStream('pipeline-c1', [
          {
            type: 'ItemStatusChanged',
            data: {
              correlationId: 'c1',
              commandType: 'Cmd',
              itemKey: 'a',
              requestId: 'r1',
              status: 'success',
              attemptCount: 1,
            },
          },
        ]);

        const collection = database.collection<ItemStatusDocument & { _id: string }>('ItemStatus');
        const items = await collection.find();

        expect(items.length).toBe(1);
        expect(items[0]?.status).toBe('success');
      } finally {
        await close();
      }
    });
  });

  describe('readModel integration', () => {
    it('should provide working read model queries', async () => {
      const { eventStore, readModel, close } = createPipelineEventStore();
      try {
        await eventStore.appendToStream('pipeline-c1', [
          {
            type: 'ItemStatusChanged',
            data: {
              correlationId: 'c1',
              commandType: 'Cmd',
              itemKey: 'a',
              requestId: 'r1',
              status: 'running',
              attemptCount: 1,
            },
          },
          {
            type: 'ItemStatusChanged',
            data: {
              correlationId: 'c1',
              commandType: 'Cmd',
              itemKey: 'b',
              requestId: 'r2',
              status: 'success',
              attemptCount: 1,
            },
          },
        ]);

        const stats = await readModel.computeCommandStats('c1', 'Cmd');

        expect(stats).toEqual({
          pendingCount: 1,
          endedCount: 1,
          aggregateStatus: 'running',
        });
      } finally {
        await close();
      }
    });

    it('should detect correlation via read model', async () => {
      const { eventStore, readModel, close } = createPipelineEventStore();
      try {
        expect(await readModel.hasCorrelation('c1')).toBe(false);

        await eventStore.appendToStream('pipeline-c1', [
          {
            type: 'NodeStatusChanged',
            data: {
              correlationId: 'c1',
              commandName: 'Cmd',
              nodeId: 'node-1',
              status: 'running',
              previousStatus: 'idle',
              pendingCount: 1,
              endedCount: 0,
            },
          },
        ]);

        expect(await readModel.hasCorrelation('c1')).toBe(true);
      } finally {
        await close();
      }
    });
  });

  describe('settled instance projection', () => {
    it('should project SettledInstanceCreated events', async () => {
      const { eventStore, database, close } = createPipelineEventStore();
      try {
        await eventStore.appendToStream('settled-c1', [
          {
            type: 'SettledInstanceCreated',
            data: {
              templateId: 'template-CmdA,CmdB',
              correlationId: 'c1',
              commandTypes: ['CmdA', 'CmdB'],
            },
          },
        ]);

        const collection = database.collection<SettledInstanceDocument & { _id: string }>('SettledInstance');
        const instances = await collection.find();

        expect(instances.length).toBe(1);
        expect(instances[0]?.status).toBe('active');
        expect(instances[0]?.commandTrackers).toHaveLength(2);
      } finally {
        await close();
      }
    });

    it('should update settled instance through lifecycle events', async () => {
      const { eventStore, database, close } = createPipelineEventStore();
      try {
        await eventStore.appendToStream('settled-c1', [
          {
            type: 'SettledInstanceCreated',
            data: {
              templateId: 'template-CmdA',
              correlationId: 'c1',
              commandTypes: ['CmdA'],
            },
          },
          {
            type: 'SettledCommandStarted',
            data: {
              templateId: 'template-CmdA',
              correlationId: 'c1',
              commandType: 'CmdA',
            },
          },
        ]);

        const collection = database.collection<SettledInstanceDocument & { _id: string }>('SettledInstance');
        const instances = await collection.find();

        expect(instances.length).toBe(1);
        expect(instances[0]?.commandTrackers[0]?.hasStarted).toBe(true);
        expect(instances[0]?.commandTrackers[0]?.hasCompleted).toBe(false);
      } finally {
        await close();
      }
    });
  });
});
