import type { InMemoryDatabase } from '@event-driven-io/emmett';
import type { NodeStatus } from '../graph/types';
import type { ItemStatusDocument } from '../projections/item-status-projection';
import type { MessageLogDocument } from '../projections/message-log-projection';
import type { NodeStatusDocument } from '../projections/node-status-projection';
import type { StatsDocument } from '../projections/stats-projection';

export interface CommandStats {
  pendingCount: number;
  endedCount: number;
  aggregateStatus: NodeStatus;
}

export interface MessageStats {
  totalMessages: number;
  totalCommands: number;
  totalEvents: number;
}

export class PipelineReadModel {
  private readonly itemStatusCollection;
  private readonly nodeStatusCollection;
  private readonly messageLogCollection;
  private readonly statsCollection;

  constructor(database: InMemoryDatabase) {
    this.itemStatusCollection = database.collection<ItemStatusDocument>('ItemStatus');
    this.nodeStatusCollection = database.collection<NodeStatusDocument>('NodeStatus');
    this.messageLogCollection = database.collection<MessageLogDocument>('MessageLog');
    this.statsCollection = database.collection<StatsDocument>('Stats');
  }

  async computeCommandStats(correlationId: string, commandType: string): Promise<CommandStats> {
    const items = await this.itemStatusCollection.find(
      (doc) => doc.correlationId === correlationId && doc.commandType === commandType,
    );

    if (items.length === 0) {
      return { pendingCount: 0, endedCount: 0, aggregateStatus: 'idle' };
    }

    let pendingCount = 0;
    let endedCount = 0;
    let hasError = false;

    for (const item of items) {
      if (item.status === 'running') {
        pendingCount++;
      } else {
        endedCount++;
        if (item.status === 'error') {
          hasError = true;
        }
      }
    }

    let aggregateStatus: NodeStatus;
    if (pendingCount > 0) {
      aggregateStatus = 'running';
    } else if (endedCount === 0) {
      aggregateStatus = 'idle';
    } else if (hasError) {
      aggregateStatus = 'error';
    } else {
      aggregateStatus = 'success';
    }

    return { pendingCount, endedCount, aggregateStatus };
  }

  async hasCorrelation(correlationId: string): Promise<boolean> {
    const nodes = await this.nodeStatusCollection.find((doc) => doc.correlationId === correlationId);
    return nodes.length > 0;
  }

  async getNodeStatus(correlationId: string, commandName: string): Promise<NodeStatusDocument | null> {
    const nodes = await this.nodeStatusCollection.find(
      (doc) => doc.correlationId === correlationId && doc.commandName === commandName,
    );
    if (nodes.length === 0) {
      return null;
    }
    const node = nodes[0];
    return {
      correlationId: node.correlationId,
      commandName: node.commandName,
      status: node.status,
      pendingCount: node.pendingCount,
      endedCount: node.endedCount,
    };
  }

  async getItemStatus(correlationId: string, commandType: string, itemKey: string): Promise<ItemStatusDocument | null> {
    const items = await this.itemStatusCollection.find(
      (doc) => doc.correlationId === correlationId && doc.commandType === commandType && doc.itemKey === itemKey,
    );
    if (items.length === 0) {
      return null;
    }
    const item = items[0];
    return {
      correlationId: item.correlationId,
      commandType: item.commandType,
      itemKey: item.itemKey,
      currentRequestId: item.currentRequestId,
      status: item.status,
      attemptCount: item.attemptCount,
    };
  }

  async getMessages(correlationId?: string): Promise<MessageLogDocument[]> {
    if (correlationId) {
      return this.messageLogCollection.find((doc) => doc.correlationId === correlationId);
    }
    return this.messageLogCollection.find(() => true);
  }

  async getStats(): Promise<MessageStats> {
    const docs = await this.statsCollection.find((doc) => doc.totalMessages !== undefined);
    if (docs.length === 0) {
      return { totalMessages: 0, totalCommands: 0, totalEvents: 0 };
    }
    const stats = docs[0];
    return {
      totalMessages: stats.totalMessages,
      totalCommands: stats.totalCommands,
      totalEvents: stats.totalEvents,
    };
  }
}
