import type { Event } from '@auto-engineer/message-bus';
import type { JobGraphEvent } from './evolve';

export function parseCorrelationId(correlationId: string): { graphId: string; jobId: string } | null {
  const match = correlationId.match(/^graph:(.+):(.+)$/);
  if (match === null) return null;
  return { graphId: match[1], jobId: match[2] };
}

export function isJobFailure(event: Event): boolean {
  return 'error' in event.data && event.data.error !== undefined;
}

export function classifyJobEvent(event: Event): JobGraphEvent | null {
  const parsed = parseCorrelationId(event.correlationId ?? '');
  if (parsed === null) return null;

  if (isJobFailure(event)) {
    return {
      type: 'JobFailed',
      data: { jobId: parsed.jobId, error: String(event.data.error) },
    };
  }

  return {
    type: 'JobSucceeded',
    data: { jobId: parsed.jobId, result: event.data },
  };
}
