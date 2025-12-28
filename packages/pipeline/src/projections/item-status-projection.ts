export interface ItemStatusDocument {
  correlationId: string;
  commandType: string;
  itemKey: string;
  currentRequestId: string;
  status: 'running' | 'success' | 'error';
  attemptCount: number;
}

export interface ItemStatusChangedEvent {
  type: 'ItemStatusChanged';
  data: {
    correlationId: string;
    commandType: string;
    itemKey: string;
    requestId: string;
    status: 'running' | 'success' | 'error';
    attemptCount: number;
  };
}

export function evolve(_document: ItemStatusDocument | null, event: ItemStatusChangedEvent): ItemStatusDocument {
  return {
    correlationId: event.data.correlationId,
    commandType: event.data.commandType,
    itemKey: event.data.itemKey,
    currentRequestId: event.data.requestId,
    status: event.data.status,
    attemptCount: event.data.attemptCount,
  };
}
