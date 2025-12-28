import { nanoid } from 'nanoid';
import type { NodeStatus } from '../graph/types';

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

export interface PipelineRunStartedLogEvent {
  type: 'PipelineRunStarted';
  data: {
    correlationId: string;
    triggerCommand: string;
  };
}

export interface NodeStatusChangedLogEvent {
  type: 'NodeStatusChanged';
  data: {
    correlationId: string;
    commandName: string;
    status: NodeStatus;
    previousStatus: NodeStatus;
    pendingCount: number;
    endedCount: number;
  };
}

export type MessageLogEvent =
  | CommandDispatchedEvent
  | DomainEventEmittedEvent
  | PipelineRunStartedLogEvent
  | NodeStatusChangedLogEvent;

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

  if (event.type === 'DomainEventEmitted') {
    return {
      correlationId: event.data.correlationId,
      requestId: event.data.requestId,
      messageType: 'event',
      messageName: event.data.eventType,
      messageData: event.data.eventData,
      timestamp: event.data.timestamp,
    };
  }

  if (event.type === 'PipelineRunStarted') {
    return {
      correlationId: event.data.correlationId,
      requestId: event.data.correlationId,
      messageType: 'event',
      messageName: 'PipelineRunStarted',
      messageData: {
        correlationId: event.data.correlationId,
        triggerCommand: event.data.triggerCommand,
      },
      timestamp: new Date(),
    };
  }

  return {
    correlationId: event.data.correlationId,
    requestId: nanoid(),
    messageType: 'event',
    messageName: 'NodeStatusChanged',
    messageData: {
      nodeId: `cmd:${event.data.commandName}`,
      status: event.data.status,
      previousStatus: event.data.previousStatus,
      pendingCount: event.data.pendingCount,
      endedCount: event.data.endedCount,
    },
    timestamp: new Date(),
  };
}
