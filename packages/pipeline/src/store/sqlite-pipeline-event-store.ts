import { getInMemoryDatabase, type InMemoryDatabase } from '@event-driven-io/emmett';
import { getSQLiteEventStore, type SQLiteEventStore } from '@event-driven-io/emmett-sqlite';
import { PipelineReadModel } from './pipeline-read-model';

export interface SQLitePipelineEventStoreContext {
  eventStore: SQLiteEventStore;
  database: InMemoryDatabase;
  readModel: PipelineReadModel;
  close: () => Promise<void>;
}

export interface SQLitePipelineEventStoreConfig {
  fileName: string;
}

export async function createSQLitePipelineEventStore(
  config: SQLitePipelineEventStoreConfig,
): Promise<SQLitePipelineEventStoreContext> {
  const database = getInMemoryDatabase();

  const eventStore = getSQLiteEventStore({
    fileName: config.fileName,
    schema: { autoMigration: 'CreateOrUpdate' },
  });

  const readModel = new PipelineReadModel(database);

  return {
    eventStore,
    database,
    readModel,
    close: async () => {
      // Minimal implementation for Burst 88
    },
  };
}
