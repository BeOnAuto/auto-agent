import type { Event, MessageBus } from '@auto-engineer/message-bus';
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

export function createGraphProcessor(messageBus: MessageBus) {
  const graphs = new Map<string, { graphId: string }>();

  function submit(command: ProcessGraphCommand): Event {
    const { graphId, jobs } = command.data;

    if (graphs.has(graphId)) {
      return { type: 'graph.failed', data: { graphId, reason: `Graph ${graphId} already submitted` } };
    }

    const validation = validateGraph(jobs);
    if (!validation.valid) {
      return { type: 'graph.failed', data: { graphId, reason: validation.error } };
    }

    graphs.set(graphId, { graphId });

    return { type: 'graph.accepted', data: { graphId } };
  }

  return { submit };
}
