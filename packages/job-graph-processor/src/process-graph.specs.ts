import { describe, expect, it } from 'vitest';
import { handleProcessGraph } from './process-graph';

describe('handleProcessGraph', () => {
  it('returns graph.failed when graph validation fails', async () => {
    const result = await handleProcessGraph({
      type: 'ProcessGraph',
      data: {
        graphId: 'g1',
        jobs: [],
        failurePolicy: 'halt',
      },
    });

    expect(result).toEqual({
      type: 'graph.failed',
      data: {
        graphId: 'g1',
        reason: 'Graph must contain at least one job',
      },
    });
  });
});
