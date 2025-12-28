export interface LatestRunDocument {
  [key: string]: unknown;
  latestCorrelationId: string;
  triggerCommand: string;
}

interface PipelineRunStartedEvent {
  type: 'PipelineRunStarted';
  data: {
    correlationId: string;
    triggerCommand: string;
  };
}

export function evolve(_document: LatestRunDocument | null, event: PipelineRunStartedEvent): LatestRunDocument {
  return {
    latestCorrelationId: event.data.correlationId,
    triggerCommand: event.data.triggerCommand,
  };
}
