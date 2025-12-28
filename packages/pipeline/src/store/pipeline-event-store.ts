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
import type { LatestRunDocument } from '../projections/latest-run-projection';
import { evolve as evolveLatestRun } from '../projections/latest-run-projection';
import type { MessageLogDocument, MessageLogEvent } from '../projections/message-log-projection';
import { evolve as evolveMessageLog } from '../projections/message-log-projection';
import type { NodeStatusChangedEvent, NodeStatusDocument } from '../projections/node-status-projection';
import { evolve as evolveNodeStatus } from '../projections/node-status-projection';
import type { StatsDocument } from '../projections/stats-projection';
import { evolve as evolveStats } from '../projections/stats-projection';
import { PipelineReadModel } from './pipeline-read-model';

interface PipelineRunStartedEvent {
  type: 'PipelineRunStarted';
  data: {
    correlationId: string;
    triggerCommand: string;
  };
}

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

  const latestRunProjection = inMemorySingleStreamProjection<LatestRunDocument, PipelineRunStartedEvent>({
    collectionName: 'LatestRun',
    canHandle: ['PipelineRunStarted'],
    getDocumentId: () => 'singleton',
    evolve: (document: LatestRunDocument | null, event: PipelineRunStartedEvent) => evolveLatestRun(document, event),
  });

  const messageLogProjection = inMemorySingleStreamProjection<MessageLogDocument, MessageLogEvent>({
    collectionName: 'MessageLog',
    canHandle: ['CommandDispatched', 'DomainEventEmitted', 'PipelineRunStarted', 'NodeStatusChanged'],
    getDocumentId: (event) => {
      if (event.type === 'PipelineRunStarted') {
        return `prs-${event.data.correlationId}`;
      }
      if (event.type === 'NodeStatusChanged') {
        return `nsc-${event.data.correlationId}-${event.data.commandName}-${event.data.status}`;
      }
      if (event.type === 'DomainEventEmitted') {
        return `dee-${event.data.requestId}-${event.data.eventType}`;
      }
      return `cmd-${event.data.requestId}`;
    },
    evolve: (document: MessageLogDocument | null, event: MessageLogEvent) => evolveMessageLog(document, event),
  });

  const statsProjection = inMemorySingleStreamProjection<StatsDocument, MessageLogEvent>({
    collectionName: 'Stats',
    canHandle: ['CommandDispatched', 'DomainEventEmitted'],
    getDocumentId: () => 'global',
    evolve: (document: StatsDocument | null, event: MessageLogEvent) => evolveStats(document, event),
  });

  return inlineProjections<InMemoryReadEventMetadata>([
    itemStatusProjection,
    nodeStatusProjection,
    latestRunProjection,
    messageLogProjection,
    statsProjection,
  ] as Parameters<typeof inlineProjections<InMemoryReadEventMetadata>>[0]);
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
