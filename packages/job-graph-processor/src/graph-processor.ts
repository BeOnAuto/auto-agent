import type { Event, MessageBus } from '@auto-engineer/message-bus';
import type { FailurePolicy } from './evolve';
import type { Job } from './graph-validator';

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
    const { graphId } = command.data;

    if (graphs.has(graphId)) {
      return { type: 'graph.failed', data: { graphId, reason: `Graph ${graphId} already submitted` } };
    }

    graphs.set(graphId, { graphId });

    return { type: 'graph.accepted', data: { graphId } };
  }

  return { submit };
}
