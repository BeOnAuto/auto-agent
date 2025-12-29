import type { Event } from '@auto-engineer/message-bus';

interface CommandTracker {
  commandType: string;
  hasStarted: boolean;
  hasCompleted: boolean;
  events: Event[];
}

export interface SettledInstanceDocument {
  [key: string]: unknown;
  instanceId: string;
  templateId: string;
  correlationId: string;
  commandTrackers: CommandTracker[];
  status: 'active' | 'fired' | 'cleaned';
}

export interface SettledInstanceCreatedEvent {
  type: 'SettledInstanceCreated';
  data: {
    templateId: string;
    correlationId: string;
    commandTypes: readonly string[];
  };
}

export interface SettledCommandStartedEvent {
  type: 'SettledCommandStarted';
  data: {
    templateId: string;
    correlationId: string;
    commandType: string;
  };
}

export interface SettledEventReceivedEvent {
  type: 'SettledEventReceived';
  data: {
    templateId: string;
    correlationId: string;
    commandType: string;
    event: Event;
  };
}

export interface SettledHandlerFiredEvent {
  type: 'SettledHandlerFired';
  data: {
    templateId: string;
    correlationId: string;
    persist: boolean;
  };
}

export interface SettledInstanceResetEvent {
  type: 'SettledInstanceReset';
  data: {
    templateId: string;
    correlationId: string;
  };
}

export interface SettledInstanceCleanedEvent {
  type: 'SettledInstanceCleaned';
  data: {
    templateId: string;
    correlationId: string;
  };
}

export type SettledEvent =
  | SettledInstanceCreatedEvent
  | SettledCommandStartedEvent
  | SettledEventReceivedEvent
  | SettledHandlerFiredEvent
  | SettledInstanceResetEvent
  | SettledInstanceCleanedEvent;

export function evolve(document: SettledInstanceDocument | null, event: SettledEvent): SettledInstanceDocument {
  if (event.type === 'SettledInstanceCreated') {
    const { templateId, correlationId, commandTypes } = event.data;
    return {
      instanceId: `${templateId}-${correlationId}`,
      templateId,
      correlationId,
      commandTrackers: commandTypes.map((commandType) => ({
        commandType,
        hasStarted: false,
        hasCompleted: false,
        events: [],
      })),
      status: 'active',
    };
  }

  if (event.type === 'SettledCommandStarted') {
    if (document === null) {
      throw new Error('Cannot apply SettledCommandStarted to null document');
    }
    const { commandType } = event.data;
    return {
      ...document,
      commandTrackers: document.commandTrackers.map((tracker) =>
        tracker.commandType === commandType ? { ...tracker, hasStarted: true, hasCompleted: false } : tracker,
      ),
    };
  }

  if (event.type === 'SettledEventReceived') {
    if (document === null) {
      throw new Error('Cannot apply SettledEventReceived to null document');
    }
    const { commandType, event: domainEvent } = event.data;
    return {
      ...document,
      commandTrackers: document.commandTrackers.map((tracker) =>
        tracker.commandType === commandType
          ? { ...tracker, hasCompleted: true, events: [...tracker.events, domainEvent] }
          : tracker,
      ),
    };
  }

  if (event.type === 'SettledHandlerFired') {
    if (document === null) {
      throw new Error('Cannot apply SettledHandlerFired to null document');
    }
    return {
      ...document,
      status: 'fired',
    };
  }

  if (event.type === 'SettledInstanceReset') {
    if (document === null) {
      throw new Error('Cannot apply SettledInstanceReset to null document');
    }
    return {
      ...document,
      status: 'active',
      commandTrackers: document.commandTrackers.map((tracker) => ({
        ...tracker,
        hasStarted: false,
        hasCompleted: false,
        events: [],
      })),
    };
  }

  if (event.type === 'SettledInstanceCleaned') {
    if (document === null) {
      throw new Error('Cannot apply SettledInstanceCleaned to null document');
    }
    return {
      ...document,
      status: 'cleaned',
    };
  }

  throw new Error(`Unknown event type: ${(event as { type: string }).type}`);
}
