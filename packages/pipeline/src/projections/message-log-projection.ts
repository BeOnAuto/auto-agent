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

export interface DomainEventEmittedEvent {
  type: 'DomainEventEmitted';
  data: {
    correlationId: string;
    requestId: string;
    eventType: string;
    eventData: Record<string, unknown>;
    timestamp: Date;
  };
}

export type MessageLogEvent = CommandDispatchedEvent | DomainEventEmittedEvent;

export function evolve(_document: MessageLogDocument | null, event: MessageLogEvent): MessageLogDocument {
  if (event.type === 'CommandDispatched') {
    return {
      correlationId: event.data.correlationId,
      requestId: event.data.requestId,
      messageType: 'command',
      messageName: event.data.commandType,
      messageData: event.data.commandData,
      timestamp: event.data.timestamp,
    };
  }

  return {
    correlationId: event.data.correlationId,
    requestId: event.data.requestId,
    messageType: 'event',
    messageName: event.data.eventType,
    messageData: event.data.eventData,
    timestamp: event.data.timestamp,
  };
}
