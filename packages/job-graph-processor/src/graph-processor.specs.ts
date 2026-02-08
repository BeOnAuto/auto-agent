import { createMessageBus } from '@auto-engineer/message-bus';
import { describe, expect, it } from 'vitest';
import { createGraphProcessor } from './graph-processor';

describe('createGraphProcessor', () => {
  it('rejects duplicate graph submissions', () => {
    const bus = createMessageBus();
    const processor = createGraphProcessor(bus);
    const command = {
      type: 'ProcessGraph' as const,
      data: {
        graphId: 'g1',
        jobs: [{ id: 'a', dependsOn: [] as string[], target: 'build', payload: {} }],
        failurePolicy: 'halt' as const,
      },
    };

    processor.submit(command);
    const second = processor.submit(command);

    expect(second).toEqual({
      type: 'graph.failed',
      data: { graphId: 'g1', reason: 'Graph g1 already submitted' },
    });
  });

  it('rejects invalid graph', () => {
    const bus = createMessageBus();
    const processor = createGraphProcessor(bus);

    const result = processor.submit({
      type: 'ProcessGraph',
      data: { graphId: 'g1', jobs: [], failurePolicy: 'halt' },
    });

    expect(result).toEqual({
      type: 'graph.failed',
      data: { graphId: 'g1', reason: 'Graph must contain at least one job' },
    });
  });

  it('dispatches ready jobs and returns dispatching event', () => {
    const bus = createMessageBus();
    const processor = createGraphProcessor(bus);

    const result = processor.submit({
      type: 'ProcessGraph',
      data: {
        graphId: 'g1',
        jobs: [
          { id: 'a', dependsOn: [], target: 'build', payload: { src: './app' } },
          { id: 'b', dependsOn: ['a'], target: 'test', payload: {} },
        ],
        failurePolicy: 'halt',
      },
    });

    expect(result).toEqual({
      type: 'graph.dispatching',
      data: {
        graphId: 'g1',
        dispatchedJobs: [{ jobId: 'a', target: 'build', payload: { src: './app' }, correlationId: 'graph:g1:a' }],
      },
    });
  });

  it('processes correlated events and emits graph.completed', async () => {
    const bus = createMessageBus();
    const processor = createGraphProcessor(bus);
    const completed: Array<{ type: string; data: Record<string, unknown> }> = [];
    bus.subscribeToEvent('graph.completed', {
      name: 'completionTracker',
      handle: (event) => {
        completed.push(event);
      },
    });

    processor.submit({
      type: 'ProcessGraph',
      data: {
        graphId: 'g1',
        jobs: [{ id: 'a', dependsOn: [], target: 'build', payload: {} }],
        failurePolicy: 'halt',
      },
    });

    await bus.publishEvent({
      type: 'BuildCompleted',
      data: { output: 'ok' },
      correlationId: 'graph:g1:a',
    });

    expect(completed).toEqual([{ type: 'graph.completed', data: { graphId: 'g1' } }]);
  });

  it('dispatches dependent jobs when deps complete via correlation', async () => {
    const bus = createMessageBus();
    const processor = createGraphProcessor(bus);
    const completed: Array<{ type: string; data: Record<string, unknown> }> = [];
    bus.subscribeToEvent('graph.completed', {
      name: 'completionTracker',
      handle: (event) => {
        completed.push(event);
      },
    });

    processor.submit({
      type: 'ProcessGraph',
      data: {
        graphId: 'g1',
        jobs: [
          { id: 'a', dependsOn: [], target: 'build', payload: {} },
          { id: 'b', dependsOn: ['a'], target: 'test', payload: {} },
        ],
        failurePolicy: 'halt',
      },
    });

    await bus.publishEvent({
      type: 'BuildCompleted',
      data: {},
      correlationId: 'graph:g1:a',
    });

    await bus.publishEvent({
      type: 'TestPassed',
      data: {},
      correlationId: 'graph:g1:b',
    });

    expect(completed).toEqual([{ type: 'graph.completed', data: { graphId: 'g1' } }]);
  });
});
