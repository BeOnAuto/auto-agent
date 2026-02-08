import { createMessageBus } from '@auto-engineer/message-bus';
import { describe, expect, it } from 'vitest';
import { commandHandler } from './process-job-graph';

describe('ProcessJobGraph command handler', () => {
  it('returns graph.dispatching with dispatched jobs when given valid graph and messageBus', async () => {
    const messageBus = createMessageBus();

    const result = await commandHandler.handle(
      {
        type: 'ProcessJobGraph',
        data: {
          graphId: 'g1',
          jobs: [
            { id: 'a', dependsOn: [], target: 'build', payload: { src: './app' } },
            { id: 'b', dependsOn: ['a'], target: 'test', payload: {} },
          ],
          failurePolicy: 'halt',
        },
      },
      { messageBus },
    );

    expect(result).toEqual({
      type: 'graph.dispatching',
      data: {
        graphId: 'g1',
        dispatchedJobs: [{ jobId: 'a', target: 'build', payload: { src: './app' }, correlationId: 'graph:g1:a' }],
      },
    });
  });

  it('returns graph.failed when messageBus is not available in context', async () => {
    const result = await commandHandler.handle({
      type: 'ProcessJobGraph',
      data: {
        graphId: 'g1',
        jobs: [{ id: 'a', dependsOn: [], target: 'build', payload: {} }],
        failurePolicy: 'halt',
      },
    });

    expect(result).toEqual({
      type: 'graph.failed',
      data: { graphId: 'g1', reason: 'messageBus not available in context' },
    });
  });

  it('returns graph.failed for invalid graph', async () => {
    const messageBus = createMessageBus();

    const result = await commandHandler.handle(
      {
        type: 'ProcessJobGraph',
        data: {
          graphId: 'g1',
          jobs: [],
          failurePolicy: 'halt',
        },
      },
      { messageBus },
    );

    expect(result).toEqual({
      type: 'graph.failed',
      data: { graphId: 'g1', reason: 'Graph must contain at least one job' },
    });
  });
});
