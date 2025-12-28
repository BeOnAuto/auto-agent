import type { InMemoryDatabase } from '@event-driven-io/emmett';
import type { NodeStatus } from '../graph/types';
import type { ItemStatusDocument } from '../projections/item-status-projection';
import type { NodeStatusDocument } from '../projections/node-status-projection';

export interface CommandStats {
  pendingCount: number;
  endedCount: number;
  aggregateStatus: NodeStatus;
}

export class PipelineReadModel {
  private readonly itemStatusCollection;
  private readonly nodeStatusCollection;

  constructor(database: InMemoryDatabase) {
    this.itemStatusCollection = database.collection<ItemStatusDocument>('ItemStatus');
    this.nodeStatusCollection = database.collection<NodeStatusDocument>('NodeStatus');
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
}
