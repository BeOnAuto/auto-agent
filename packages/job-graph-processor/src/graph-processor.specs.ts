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
});
