export interface MessageLogDocument {
  [key: string]: unknown;
  correlationId: string;
  requestId: string;
  messageType: 'command' | 'event';
  messageName: string;
  messageData: Record<string, unknown>;
  timestamp: Date;
}

export interface CommandDispatchedEvent {
  type: 'CommandDispatched';
  data: {
    correlationId: string;
    requestId: string;
    commandType: string;
    commandData: Record<string, unknown>;
    timestamp: Date;
  };
}

export function evolve(_document: MessageLogDocument | null, event: CommandDispatchedEvent): MessageLogDocument {
  return {
    correlationId: event.data.correlationId,
    requestId: event.data.requestId,
    messageType: 'command',
    messageName: event.data.commandType,
    messageData: event.data.commandData,
    timestamp: event.data.timestamp,
  };
}
