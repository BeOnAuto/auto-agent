import type { NodeStatus } from '../graph/types';

export interface NodeStatusDocument {
  correlationId: string;
  commandName: string;
  status: NodeStatus;
  pendingCount: number;
  endedCount: number;
}

export interface NodeStatusChangedEvent {
  type: 'NodeStatusChanged';
  data: {
    correlationId: string;
    commandName: string;
    nodeId: string;
    status: NodeStatus;
    previousStatus: NodeStatus;
    pendingCount: number;
    endedCount: number;
  };
}

export function evolve(_document: NodeStatusDocument | null, event: NodeStatusChangedEvent): NodeStatusDocument {
  return {
    correlationId: event.data.correlationId,
    commandName: event.data.commandName,
    status: event.data.status,
    pendingCount: event.data.pendingCount,
    endedCount: event.data.endedCount,
  };
}
