import { describe, it, expect, beforeEach } from 'vitest';
import { createKanbanPipeline, resetRetryState, setRetryCount, testShouldRetry } from './kanban.pipeline';

describe('kanban.pipeline', () => {
  beforeEach(() => {
    resetRetryState();
  });

  describe('shouldRetry', () => {
    it('should return true when retry count is below max', () => {
      expect(testShouldRetry('./slice-path')).toBe(true);
    });

    it('should return false when retry count reaches max', () => {
      setRetryCount('./slice-path', 3);
      expect(testShouldRetry('./slice-path')).toBe(false);
    });
  });

  describe('pipeline structure', () => {
    it('should have name kanban', () => {
      const pipeline = createKanbanPipeline();
      expect(pipeline.descriptor.name).toBe('kanban');
    });

    it('should have handlers for slice workflow', () => {
      const pipeline = createKanbanPipeline();
      const eventTypes = pipeline.descriptor.handlers.filter((h) => h.type === 'emit').map((h) => h.eventType);
      expect(eventTypes).toContain('SchemaExported');
      expect(eventTypes).toContain('SliceGenerated');
    });
  });
});
