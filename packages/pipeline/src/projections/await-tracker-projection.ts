export interface AwaitTrackerDocument {
  [key: string]: unknown;
  correlationId: string;
  pendingKeys: string[];
  results: Record<string, unknown>;
  status: 'pending' | 'completed';
}

export interface AwaitStartedEvent {
  type: 'AwaitStarted';
  data: {
    correlationId: string;
    keys: string[];
  };
}

export interface AwaitItemCompletedEvent {
  type: 'AwaitItemCompleted';
  data: {
    correlationId: string;
    key: string;
    result: unknown;
  };
}

export interface AwaitCompletedEvent {
  type: 'AwaitCompleted';
  data: {
    correlationId: string;
  };
}

export type AwaitEvent = AwaitStartedEvent | AwaitItemCompletedEvent | AwaitCompletedEvent;

export function evolve(document: AwaitTrackerDocument | null, event: AwaitEvent): AwaitTrackerDocument {
  switch (event.type) {
    case 'AwaitStarted': {
      const { correlationId, keys } = event.data;
      return {
        correlationId,
        pendingKeys: [...keys],
        results: {},
        status: 'pending',
      };
    }
    case 'AwaitItemCompleted': {
      if (document === null) {
        throw new Error('Cannot apply AwaitItemCompleted to null document');
      }
      const { key, result } = event.data;
      const newPendingKeys = document.pendingKeys.filter((k) => k !== key);
      return {
        ...document,
        pendingKeys: newPendingKeys,
        results: { ...document.results, [key]: result },
      };
    }
    case 'AwaitCompleted': {
      if (document === null) {
        throw new Error('Cannot apply AwaitCompleted to null document');
      }
      return {
        ...document,
        status: 'completed',
      };
    }
  }
}
