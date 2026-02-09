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

  it('ignores correlated events after graph completes', async () => {
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
      data: {},
      correlationId: 'graph:g1:a',
    });

    await bus.publishEvent({
      type: 'LateEvent',
      data: {},
      correlationId: 'graph:g1:a',
    });

    expect(completed).toEqual([{ type: 'graph.completed', data: { graphId: 'g1' } }]);
  });

  it('ignores events with unrecognized correlationId format', async () => {
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
      type: 'WeirdEvent',
      data: {},
      correlationId: 'graph:g1:',
    });

    expect(completed).toEqual([]);
  });

  it('sends target commands for initial ready jobs', async () => {
    const bus = createMessageBus();
    const processor = createGraphProcessor(bus);
    const received: Array<{ type: string; data: unknown; correlationId?: string }> = [];
    bus.registerCommandHandler({
      name: 'build',
      handle: async (command) => {
        received.push({ type: command.type, data: command.data, correlationId: command.correlationId });
        return { type: 'BuildCompleted', data: {} };
      },
    });

    processor.submit({
      type: 'ProcessGraph',
      data: {
        graphId: 'g1',
        jobs: [{ id: 'a', dependsOn: [], target: 'build', payload: { src: './app' } }],
        failurePolicy: 'halt',
      },
    });

    await new Promise((r) => setTimeout(r, 10));

    expect(received).toEqual([{ type: 'build', data: { src: './app' }, correlationId: 'graph:g1:a' }]);
  });

  it('sends target commands for newly ready dependent jobs', async () => {
    const bus = createMessageBus();
    const processor = createGraphProcessor(bus);
    const received: Array<{ type: string; data: unknown; correlationId?: string }> = [];
    bus.registerCommandHandler({
      name: 'build',
      handle: async (command) => {
        received.push({ type: command.type, data: command.data, correlationId: command.correlationId });
        return { type: 'BuildCompleted', data: {} };
      },
    });
    bus.registerCommandHandler({
      name: 'test',
      handle: async (command) => {
        received.push({ type: command.type, data: command.data, correlationId: command.correlationId });
        return { type: 'TestPassed', data: {} };
      },
    });

    processor.submit({
      type: 'ProcessGraph',
      data: {
        graphId: 'g1',
        jobs: [
          { id: 'a', dependsOn: [], target: 'build', payload: { src: './app' } },
          { id: 'b', dependsOn: ['a'], target: 'test', payload: { suite: 'unit' } },
        ],
        failurePolicy: 'halt',
      },
    });

    await new Promise((r) => setTimeout(r, 50));

    expect(received).toEqual([
      { type: 'build', data: { src: './app' }, correlationId: 'graph:g1:a' },
      { type: 'test', data: { suite: 'unit' }, correlationId: 'graph:g1:b' },
    ]);
  });

  it('uses dispatch callback instead of messageBus.sendCommand when provided', async () => {
    const bus = createMessageBus();
    const dispatched: Array<{ type: string; data: unknown; correlationId: string }> = [];
    const dispatch = async (command: { type: string; data: unknown; correlationId: string }) => {
      dispatched.push(command);
    };
    const processor = createGraphProcessor(bus, { dispatch });

    processor.submit({
      type: 'ProcessGraph',
      data: {
        graphId: 'g1',
        jobs: [{ id: 'a', dependsOn: [], target: 'build', payload: { src: './app' } }],
        failurePolicy: 'halt',
      },
    });

    await new Promise((r) => setTimeout(r, 10));

    expect(dispatched).toEqual([{ type: 'build', data: { src: './app' }, correlationId: 'graph:g1:a' }]);
  });

  it('rejects command with missing jobs', () => {
    const bus = createMessageBus();
    const processor = createGraphProcessor(bus);

    const result = processor.submit({
      type: 'ProcessGraph',
      data: { graphId: 'g1', failurePolicy: 'halt' } as any,
    });

    expect(result).toEqual({
      type: 'graph.failed',
      data: { graphId: 'g1', reason: 'jobs is required and must be an array' },
    });
  });

  it('applies halt policy when job fails via correlation', async () => {
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
      type: 'BuildFailed',
      data: { error: 'compile error' },
      correlationId: 'graph:g1:a',
    });

    expect(completed).toEqual([{ type: 'graph.completed', data: { graphId: 'g1' } }]);
  });
});
