import { describe, expect, it } from 'vitest';
import { evolve, type LatestRunDocument } from './latest-run-projection';

describe('LatestRunProjection', () => {
  describe('evolve', () => {
    it('tracks latest correlationId when PipelineRunStarted applied', () => {
      const event = {
        type: 'PipelineRunStarted' as const,
        data: { correlationId: 'c1', triggerCommand: 'StartPipeline' },
      };

      const result = evolve(null, event);

      expect(result).toEqual({
        latestCorrelationId: 'c1',
        triggerCommand: 'StartPipeline',
      });
    });

    it('updates to newest correlationId when second PipelineRunStarted applied', () => {
      const existing: LatestRunDocument = {
        latestCorrelationId: 'c1',
        triggerCommand: 'StartPipeline',
      };
      const event = {
        type: 'PipelineRunStarted' as const,
        data: { correlationId: 'c2', triggerCommand: 'StartPipeline' },
      };

      const result = evolve(existing, event);

      expect(result).toEqual({
        latestCorrelationId: 'c2',
        triggerCommand: 'StartPipeline',
      });
    });
  });
});
