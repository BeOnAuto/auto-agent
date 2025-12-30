import { describe, expect, it } from 'vitest';
import { createSQLitePipelineEventStore } from './sqlite-pipeline-event-store';

describe('SQLitePipelineEventStore', () => {
  describe('createSQLitePipelineEventStore', () => {
    it('should create SQLite event store with fileName config', async () => {
      const context = await createSQLitePipelineEventStore({ fileName: ':memory:' });
      expect(context.eventStore).toBeDefined();
      expect(context.readModel).toBeDefined();
      await context.close();
    });
  });
});
