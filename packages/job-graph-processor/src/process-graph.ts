import type { Event } from '@auto-engineer/message-bus';
import type { FailurePolicy } from './evolve';
import type { Job } from './graph-validator';
import { validateGraph } from './graph-validator';

interface ProcessGraphCommand {
  type: 'ProcessGraph';
  data: {
    graphId: string;
    jobs: readonly Job[];
    failurePolicy: FailurePolicy;
  };
}

export async function handleProcessGraph(command: ProcessGraphCommand): Promise<Event | Event[]> {
  const { graphId, jobs } = command.data;

  const validation = validateGraph(jobs);
  if (!validation.valid) {
    return {
      type: 'graph.failed',
      data: { graphId, reason: validation.error },
    };
  }

  return [];
}
