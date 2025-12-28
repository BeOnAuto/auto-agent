import { getInMemoryDatabase, type InMemoryDatabase } from '@event-driven-io/emmett';
import { beforeEach, describe, expect, it } from 'vitest';
import type { ItemStatusDocument } from '../projections/item-status-projection';
import type { NodeStatusDocument } from '../projections/node-status-projection';
import { PipelineReadModel } from './pipeline-read-model';

type WithId<T> = T & { _id: string; _version?: never };

describe('PipelineReadModel', () => {
  let database: InMemoryDatabase;
  let readModel: PipelineReadModel;

  beforeEach(() => {
    database = getInMemoryDatabase();
    readModel = new PipelineReadModel(database);
  });

  describe('computeCommandStats', () => {
    it('should return idle stats when no items exist', async () => {
      const result = await readModel.computeCommandStats('c1', 'Cmd');

      expect(result).toEqual({
        pendingCount: 0,
        endedCount: 0,
        aggregateStatus: 'idle',
      });
    });

    it('should count running items as pending', async () => {
      const collection = database.collection<WithId<ItemStatusDocument>>('ItemStatus');
      await collection.insertOne({
        _id: 'c1-Cmd-a',
        correlationId: 'c1',
        commandType: 'Cmd',
        itemKey: 'a',
        currentRequestId: 'r1',
        status: 'running',
        attemptCount: 1,
      });

      const result = await readModel.computeCommandStats('c1', 'Cmd');

      expect(result).toEqual({
        pendingCount: 1,
        endedCount: 0,
        aggregateStatus: 'running',
      });
    });

    it('should count success items as ended', async () => {
      const collection = database.collection<WithId<ItemStatusDocument>>('ItemStatus');
      await collection.insertOne({
        _id: 'c1-Cmd-a',
        correlationId: 'c1',
        commandType: 'Cmd',
        itemKey: 'a',
        currentRequestId: 'r1',
        status: 'success',
        attemptCount: 1,
      });

      const result = await readModel.computeCommandStats('c1', 'Cmd');

      expect(result).toEqual({
        pendingCount: 0,
        endedCount: 1,
        aggregateStatus: 'success',
      });
    });

    it('should count error items as ended with error status', async () => {
      const collection = database.collection<WithId<ItemStatusDocument>>('ItemStatus');
      await collection.insertOne({
        _id: 'c1-Cmd-a',
        correlationId: 'c1',
        commandType: 'Cmd',
        itemKey: 'a',
        currentRequestId: 'r1',
        status: 'error',
        attemptCount: 1,
      });

      const result = await readModel.computeCommandStats('c1', 'Cmd');

      expect(result).toEqual({
        pendingCount: 0,
        endedCount: 1,
        aggregateStatus: 'error',
      });
    });

    it('should aggregate multiple items correctly', async () => {
      const collection = database.collection<WithId<ItemStatusDocument>>('ItemStatus');
      await collection.insertOne({
        _id: 'c1-Cmd-a',
        correlationId: 'c1',
        commandType: 'Cmd',
        itemKey: 'a',
        currentRequestId: 'r1',
        status: 'running',
        attemptCount: 1,
      });
      await collection.insertOne({
        _id: 'c1-Cmd-b',
        correlationId: 'c1',
        commandType: 'Cmd',
        itemKey: 'b',
        currentRequestId: 'r2',
        status: 'running',
        attemptCount: 1,
      });
      await collection.insertOne({
        _id: 'c1-Cmd-c',
        correlationId: 'c1',
        commandType: 'Cmd',
        itemKey: 'c',
        currentRequestId: 'r3',
        status: 'success',
        attemptCount: 1,
      });

      const result = await readModel.computeCommandStats('c1', 'Cmd');

      expect(result).toEqual({
        pendingCount: 2,
        endedCount: 1,
        aggregateStatus: 'running',
      });
    });

    it('should return error status when any item has error and none running', async () => {
      const collection = database.collection<WithId<ItemStatusDocument>>('ItemStatus');
      await collection.insertOne({
        _id: 'c1-Cmd-a',
        correlationId: 'c1',
        commandType: 'Cmd',
        itemKey: 'a',
        currentRequestId: 'r1',
        status: 'success',
        attemptCount: 1,
      });
      await collection.insertOne({
        _id: 'c1-Cmd-b',
        correlationId: 'c1',
        commandType: 'Cmd',
        itemKey: 'b',
        currentRequestId: 'r2',
        status: 'error',
        attemptCount: 1,
      });

      const result = await readModel.computeCommandStats('c1', 'Cmd');

      expect(result).toEqual({
        pendingCount: 0,
        endedCount: 2,
        aggregateStatus: 'error',
      });
    });

    it('should filter by correlationId', async () => {
      const collection = database.collection<WithId<ItemStatusDocument>>('ItemStatus');
      await collection.insertOne({
        _id: 'c1-Cmd-a',
        correlationId: 'c1',
        commandType: 'Cmd',
        itemKey: 'a',
        currentRequestId: 'r1',
        status: 'running',
        attemptCount: 1,
      });
      await collection.insertOne({
        _id: 'c2-Cmd-a',
        correlationId: 'c2',
        commandType: 'Cmd',
        itemKey: 'a',
        currentRequestId: 'r2',
        status: 'success',
        attemptCount: 1,
      });

      const result = await readModel.computeCommandStats('c1', 'Cmd');

      expect(result).toEqual({
        pendingCount: 1,
        endedCount: 0,
        aggregateStatus: 'running',
      });
    });

    it('should filter by commandType', async () => {
      const collection = database.collection<WithId<ItemStatusDocument>>('ItemStatus');
      await collection.insertOne({
        _id: 'c1-CmdA-a',
        correlationId: 'c1',
        commandType: 'CmdA',
        itemKey: 'a',
        currentRequestId: 'r1',
        status: 'running',
        attemptCount: 1,
      });
      await collection.insertOne({
        _id: 'c1-CmdB-a',
        correlationId: 'c1',
        commandType: 'CmdB',
        itemKey: 'a',
        currentRequestId: 'r2',
        status: 'success',
        attemptCount: 1,
      });

      const result = await readModel.computeCommandStats('c1', 'CmdA');

      expect(result).toEqual({
        pendingCount: 1,
        endedCount: 0,
        aggregateStatus: 'running',
      });
    });
  });

  describe('hasCorrelation', () => {
    it('should return false when no node status exists', async () => {
      const result = await readModel.hasCorrelation('c1');

      expect(result).toBe(false);
    });

    it('should return true when node status exists for correlation', async () => {
      const collection = database.collection<WithId<NodeStatusDocument>>('NodeStatus');
      await collection.insertOne({
        _id: 'c1-Cmd',
        correlationId: 'c1',
        commandName: 'Cmd',
        status: 'running',
        pendingCount: 1,
        endedCount: 0,
      });

      const result = await readModel.hasCorrelation('c1');

      expect(result).toBe(true);
    });

    it('should return false for different correlationId', async () => {
      const collection = database.collection<WithId<NodeStatusDocument>>('NodeStatus');
      await collection.insertOne({
        _id: 'c1-Cmd',
        correlationId: 'c1',
        commandName: 'Cmd',
        status: 'running',
        pendingCount: 1,
        endedCount: 0,
      });

      const result = await readModel.hasCorrelation('c2');

      expect(result).toBe(false);
    });
  });
});
