import {
  getInMemoryDatabase,
  getInMemoryEventStore,
  type InMemoryDatabase,
  type InMemoryEventStore,
  type InMemoryReadEventMetadata,
  inlineProjections,
  inMemorySingleStreamProjection,
} from '@event-driven-io/emmett';
import type { ItemStatusChangedEvent, ItemStatusDocument } from '../projections/item-status-projection';
import { evolve as evolveItemStatus } from '../projections/item-status-projection';
import type { NodeStatusChangedEvent, NodeStatusDocument } from '../projections/node-status-projection';
import { evolve as evolveNodeStatus } from '../projections/node-status-projection';
import { PipelineReadModel } from './pipeline-read-model';

function createProjections() {
  const itemStatusProjection = inMemorySingleStreamProjection<ItemStatusDocument, ItemStatusChangedEvent>({
    collectionName: 'ItemStatus',
    canHandle: ['ItemStatusChanged'],
    getDocumentId: (event) => `${event.data.correlationId}-${event.data.commandType}-${event.data.itemKey}`,
    evolve: (document: ItemStatusDocument | null, event: ItemStatusChangedEvent) => evolveItemStatus(document, event),
  });

  const nodeStatusProjection = inMemorySingleStreamProjection<NodeStatusDocument, NodeStatusChangedEvent>({
    collectionName: 'NodeStatus',
    canHandle: ['NodeStatusChanged'],
    getDocumentId: (event) => `${event.data.correlationId}-${event.data.commandName}`,
    evolve: (document: NodeStatusDocument | null, event: NodeStatusChangedEvent) => evolveNodeStatus(document, event),
  });

  return inlineProjections<InMemoryReadEventMetadata>([itemStatusProjection, nodeStatusProjection] as Parameters<
    typeof inlineProjections<InMemoryReadEventMetadata>
  >[0]);
}

export interface PipelineEventStoreContext {
  eventStore: InMemoryEventStore;
  database: InMemoryDatabase;
  readModel: PipelineReadModel;
  close: () => Promise<void>;
}

export function createPipelineEventStore(): PipelineEventStoreContext {
  const database = getInMemoryDatabase();
  const eventStore = getInMemoryEventStore({
    database,
    projections: createProjections() as Parameters<typeof getInMemoryEventStore>[0] extends { projections?: infer P }
      ? P
      : never,
  });
  const readModel = new PipelineReadModel(database);

  return {
    eventStore,
    database,
    readModel,
    close: async () => {
      // No-op for in-memory store
    },
  };
}
