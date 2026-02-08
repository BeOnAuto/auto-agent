import type { Command, Event, MessageBus } from '@auto-engineer/message-bus';
import type { FailurePolicy } from '../evolve';
import { createGraphProcessor, type ProcessGraphCommand } from '../graph-processor';
import type { Job } from '../graph-validator';

function isContextWithMessageBus(context: unknown): context is { messageBus: MessageBus } {
  return (
    context !== null &&
    context !== undefined &&
    typeof context === 'object' &&
    'messageBus' in context &&
    context.messageBus !== null &&
    context.messageBus !== undefined &&
    typeof context.messageBus === 'object'
  );
}

function toProcessGraphCommand(command: Command): ProcessGraphCommand {
  const data = command.data as { graphId: string; jobs: Job[]; failurePolicy: FailurePolicy };
  return { type: command.type, data };
}

export const commandHandler = {
  name: 'ProcessJobGraph',
  displayName: 'Process Job Graph',
  alias: 'process:job-graph',
  description: 'Process a directed acyclic graph of jobs with dependency tracking and failure policies',
  category: 'orchestration',
  icon: 'git-branch',
  fields: {
    graphId: {
      description: 'Unique identifier for the graph',
      required: true,
    },
    jobs: {
      description: 'Array of jobs with dependencies',
      required: true,
    },
    failurePolicy: {
      description: 'Policy for handling job failures: halt, skip-dependents, or continue',
      required: true,
    },
  },
  examples: [
    '$ auto process:job-graph --graphId=g1 --jobs=\'[{"id":"a","dependsOn":[],"target":"build","payload":{}}]\' --failurePolicy=halt',
  ],
  events: [
    { name: 'graph.dispatching', displayName: 'Graph Dispatching' },
    { name: 'graph.failed', displayName: 'Graph Failed' },
    { name: 'graph.completed', displayName: 'Graph Completed' },
  ],
  handle: async (command: Command, context?: unknown): Promise<Event | Event[]> => {
    const { graphId } = command.data;

    if (!isContextWithMessageBus(context)) {
      return {
        type: 'graph.failed',
        data: { graphId, reason: 'messageBus not available in context' },
      };
    }

    const processor = createGraphProcessor(context.messageBus);
    return processor.submit(toProcessGraphCommand(command));
  },
};

export default commandHandler;
