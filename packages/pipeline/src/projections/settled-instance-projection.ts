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

function assertDocument(
  document: SettledInstanceDocument | null,
  eventType: string,
): asserts document is SettledInstanceDocument {
  if (document === null) {
    throw new Error(`Cannot apply ${eventType} to null document`);
  }
}

function evolveCommandStarted(document: SettledInstanceDocument, commandType: string): SettledInstanceDocument {
  return {
    ...document,
    commandTrackers: document.commandTrackers.map((tracker) =>
      tracker.commandType === commandType ? { ...tracker, hasStarted: true, hasCompleted: false } : tracker,
    ),
  };
}

function evolveEventReceived(
  document: SettledInstanceDocument,
  commandType: string,
  domainEvent: Event,
): SettledInstanceDocument {
  return {
    ...document,
    commandTrackers: document.commandTrackers.map((tracker) =>
      tracker.commandType === commandType
        ? { ...tracker, hasCompleted: true, events: [...tracker.events, domainEvent] }
        : tracker,
    ),
  };
}

function evolveReset(document: SettledInstanceDocument): SettledInstanceDocument {
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

export function evolve(document: SettledInstanceDocument | null, event: SettledEvent): SettledInstanceDocument {
  switch (event.type) {
    case 'SettledInstanceCreated': {
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
    case 'SettledCommandStarted':
      assertDocument(document, event.type);
      return evolveCommandStarted(document, event.data.commandType);
    case 'SettledEventReceived':
      assertDocument(document, event.type);
      return evolveEventReceived(document, event.data.commandType, event.data.event);
    case 'SettledHandlerFired':
      assertDocument(document, event.type);
      return { ...document, status: 'fired' };
    case 'SettledInstanceReset':
      assertDocument(document, event.type);
      return evolveReset(document);
    case 'SettledInstanceCleaned':
      assertDocument(document, event.type);
      return { ...document, status: 'cleaned' };
  }
}
