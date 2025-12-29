import type { Event } from '@auto-engineer/message-bus';

interface ItemTracker {
  key: string;
  phase: string;
  dispatched: boolean;
  completed: boolean;
}

export interface PhasedExecutionDocument {
  [key: string]: unknown;
  executionId: string;
  correlationId: string;
  handlerId: string;
  triggerEvent: Event;
  items: ItemTracker[];
  phases: readonly string[];
  currentPhaseIndex: number;
  status: 'active' | 'completed' | 'failed';
  failedItems: Array<{ key: string; error: unknown }>;
}

export interface PhasedExecutionStartedEvent {
  type: 'PhasedExecutionStarted';
  data: {
    executionId: string;
    correlationId: string;
    handlerId: string;
    triggerEvent: Event;
    items: ItemTracker[];
    phases: readonly string[];
  };
}

export interface PhasedItemDispatchedEvent {
  type: 'PhasedItemDispatched';
  data: {
    executionId: string;
    itemKey: string;
    phase: string;
  };
}

export interface PhasedItemCompletedEvent {
  type: 'PhasedItemCompleted';
  data: {
    executionId: string;
    itemKey: string;
    resultEvent: Event;
  };
}

export interface PhasedItemFailedEvent {
  type: 'PhasedItemFailed';
  data: {
    executionId: string;
    itemKey: string;
    error: unknown;
  };
}

export interface PhasedPhaseAdvancedEvent {
  type: 'PhasedPhaseAdvanced';
  data: {
    executionId: string;
    fromPhase: number;
    toPhase: number;
  };
}

export interface PhasedExecutionCompletedEvent {
  type: 'PhasedExecutionCompleted';
  data: {
    executionId: string;
    success: boolean;
    results: string[];
  };
}

export type PhasedExecutionEvent =
  | PhasedExecutionStartedEvent
  | PhasedItemDispatchedEvent
  | PhasedItemCompletedEvent
  | PhasedItemFailedEvent
  | PhasedPhaseAdvancedEvent
  | PhasedExecutionCompletedEvent;

function assertDocument(
  document: PhasedExecutionDocument | null,
  eventType: string,
): asserts document is PhasedExecutionDocument {
  if (document === null) {
    throw new Error(`Cannot apply ${eventType} to null document`);
  }
}

function evolveItemDispatched(document: PhasedExecutionDocument, itemKey: string): PhasedExecutionDocument {
  return {
    ...document,
    items: document.items.map((item) => (item.key === itemKey ? { ...item, dispatched: true } : item)),
  };
}

function evolveItemCompleted(document: PhasedExecutionDocument, itemKey: string): PhasedExecutionDocument {
  return {
    ...document,
    items: document.items.map((item) => (item.key === itemKey ? { ...item, completed: true } : item)),
  };
}

export function evolve(document: PhasedExecutionDocument | null, event: PhasedExecutionEvent): PhasedExecutionDocument {
  switch (event.type) {
    case 'PhasedExecutionStarted': {
      const { executionId, correlationId, handlerId, triggerEvent, items, phases } = event.data;
      return {
        executionId,
        correlationId,
        handlerId,
        triggerEvent,
        items: items.map((item) => ({ ...item })),
        phases,
        currentPhaseIndex: 0,
        status: 'active',
        failedItems: [],
      };
    }
    case 'PhasedItemDispatched':
      assertDocument(document, event.type);
      return evolveItemDispatched(document, event.data.itemKey);
    case 'PhasedItemCompleted':
      assertDocument(document, event.type);
      return evolveItemCompleted(document, event.data.itemKey);
    case 'PhasedItemFailed':
      assertDocument(document, event.type);
      return {
        ...document,
        failedItems: [...document.failedItems, { key: event.data.itemKey, error: event.data.error }],
      };
    case 'PhasedPhaseAdvanced':
      assertDocument(document, event.type);
      return { ...document, currentPhaseIndex: event.data.toPhase };
    case 'PhasedExecutionCompleted':
      assertDocument(document, event.type);
      return { ...document, status: event.data.success ? 'completed' : 'failed' };
  }
}
