import { getInMemoryDatabase, type InMemoryDatabase } from '@event-driven-io/emmett';
import { beforeEach, describe, expect, it } from 'vitest';
import type { ItemStatusDocument } from '../projections/item-status-projection';
import type { MessageLogDocument } from '../projections/message-log-projection';
import type { NodeStatusDocument } from '../projections/node-status-projection';
import type { PhasedExecutionDocument } from '../projections/phased-execution-projection';
import type { SettledInstanceDocument } from '../projections/settled-instance-projection';
import type { StatsDocument } from '../projections/stats-projection';
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

    it('should return success status when item that initially failed is now success after retry (BUG: CheckTypes showing error)', async () => {
      const collection = database.collection<WithId<ItemStatusDocument>>('ItemStatus');
      await collection.insertOne({
        _id: 'c1-CheckTypes-slice1',
        correlationId: 'c1',
        commandType: 'CheckTypes',
        itemKey: 'slice1',
        currentRequestId: 'r1',
        status: 'success',
        attemptCount: 1,
      });
      await collection.insertOne({
        _id: 'c1-CheckTypes-slice2',
        correlationId: 'c1',
        commandType: 'CheckTypes',
        itemKey: 'slice2',
        currentRequestId: 'r2',
        status: 'success',
        attemptCount: 1,
      });
      await collection.insertOne({
        _id: 'c1-CheckTypes-slice3',
        correlationId: 'c1',
        commandType: 'CheckTypes',
        itemKey: 'slice3',
        currentRequestId: 'r3',
        status: 'success',
        attemptCount: 1,
      });
      await collection.insertOne({
        _id: 'c1-CheckTypes-slice4',
        correlationId: 'c1',
        commandType: 'CheckTypes',
        itemKey: 'slice4',
        currentRequestId: 'r4',
        status: 'success',
        attemptCount: 1,
      });
      await collection.insertOne({
        _id: 'c1-CheckTypes-slice5',
        correlationId: 'c1',
        commandType: 'CheckTypes',
        itemKey: 'slice5',
        currentRequestId: 'r6',
        status: 'success',
        attemptCount: 2,
      });

      const result = await readModel.computeCommandStats('c1', 'CheckTypes');

      expect(result).toEqual({
        pendingCount: 0,
        endedCount: 5,
        aggregateStatus: 'success',
      });
    });

    it('documents behavior: returns error when stale error items exist (BUG: requestId-based itemKey needs proper extractor)', async () => {
      const collection = database.collection<WithId<ItemStatusDocument>>('ItemStatus');
      await collection.insertOne({
        _id: 'c1-CheckTypes-r1',
        correlationId: 'c1',
        commandType: 'CheckTypes',
        itemKey: 'r1',
        currentRequestId: 'r1',
        status: 'success',
        attemptCount: 1,
      });
      await collection.insertOne({
        _id: 'c1-CheckTypes-r2',
        correlationId: 'c1',
        commandType: 'CheckTypes',
        itemKey: 'r2',
        currentRequestId: 'r2',
        status: 'success',
        attemptCount: 1,
      });
      await collection.insertOne({
        _id: 'c1-CheckTypes-r5',
        correlationId: 'c1',
        commandType: 'CheckTypes',
        itemKey: 'r5',
        currentRequestId: 'r5',
        status: 'error',
        attemptCount: 1,
      });
      await collection.insertOne({
        _id: 'c1-CheckTypes-r6',
        correlationId: 'c1',
        commandType: 'CheckTypes',
        itemKey: 'r6',
        currentRequestId: 'r6',
        status: 'success',
        attemptCount: 1,
      });

      const result = await readModel.computeCommandStats('c1', 'CheckTypes');

      expect(result).toEqual({
        pendingCount: 0,
        endedCount: 4,
        aggregateStatus: 'error',
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

  describe('getMessages', () => {
    it('should return empty array when no messages exist', async () => {
      const result = await readModel.getMessages();

      expect(result).toEqual([]);
    });

    it('should return all messages from MessageLog collection', async () => {
      const collection = database.collection<WithId<MessageLogDocument>>('MessageLog');
      const timestamp = new Date('2025-01-01T00:00:00Z');
      await collection.insertOne({
        _id: 'r1',
        correlationId: 'c1',
        requestId: 'r1',
        messageType: 'command',
        messageName: 'CreateUser',
        messageData: { name: 'Alice' },
        timestamp,
      });

      const result = await readModel.getMessages();

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        correlationId: 'c1',
        requestId: 'r1',
        messageType: 'command',
        messageName: 'CreateUser',
      });
    });

    it('should return messages filtered by correlationId', async () => {
      const collection = database.collection<WithId<MessageLogDocument>>('MessageLog');
      const timestamp = new Date('2025-01-01T00:00:00Z');
      await collection.insertOne({
        _id: 'r1',
        correlationId: 'c1',
        requestId: 'r1',
        messageType: 'command',
        messageName: 'CreateUser',
        messageData: {},
        timestamp,
      });
      await collection.insertOne({
        _id: 'r2',
        correlationId: 'c2',
        requestId: 'r2',
        messageType: 'command',
        messageName: 'DeleteUser',
        messageData: {},
        timestamp,
      });

      const result = await readModel.getMessages('c1');

      expect(result).toHaveLength(1);
      expect(result[0].correlationId).toBe('c1');
    });
  });

  describe('getItemStatus', () => {
    it('should return null when no item status exists', async () => {
      const result = await readModel.getItemStatus('c1', 'CreateUser', 'item1');

      expect(result).toBeNull();
    });

    it('should return item status from ItemStatus collection', async () => {
      const collection = database.collection<WithId<ItemStatusDocument>>('ItemStatus');
      await collection.insertOne({
        _id: 'c1-CreateUser-item1',
        correlationId: 'c1',
        commandType: 'CreateUser',
        itemKey: 'item1',
        currentRequestId: 'r1',
        status: 'running',
        attemptCount: 1,
      });

      const result = await readModel.getItemStatus('c1', 'CreateUser', 'item1');

      expect(result).toMatchObject({
        correlationId: 'c1',
        commandType: 'CreateUser',
        itemKey: 'item1',
        currentRequestId: 'r1',
        status: 'running',
        attemptCount: 1,
      });
    });

    it('should return null for different correlationId', async () => {
      const collection = database.collection<WithId<ItemStatusDocument>>('ItemStatus');
      await collection.insertOne({
        _id: 'c1-CreateUser-item1',
        correlationId: 'c1',
        commandType: 'CreateUser',
        itemKey: 'item1',
        currentRequestId: 'r1',
        status: 'running',
        attemptCount: 1,
      });

      const result = await readModel.getItemStatus('c2', 'CreateUser', 'item1');

      expect(result).toBeNull();
    });

    it('should return null for different commandType', async () => {
      const collection = database.collection<WithId<ItemStatusDocument>>('ItemStatus');
      await collection.insertOne({
        _id: 'c1-CreateUser-item1',
        correlationId: 'c1',
        commandType: 'CreateUser',
        itemKey: 'item1',
        currentRequestId: 'r1',
        status: 'running',
        attemptCount: 1,
      });

      const result = await readModel.getItemStatus('c1', 'DeleteUser', 'item1');

      expect(result).toBeNull();
    });

    it('should return null for different itemKey', async () => {
      const collection = database.collection<WithId<ItemStatusDocument>>('ItemStatus');
      await collection.insertOne({
        _id: 'c1-CreateUser-item1',
        correlationId: 'c1',
        commandType: 'CreateUser',
        itemKey: 'item1',
        currentRequestId: 'r1',
        status: 'running',
        attemptCount: 1,
      });

      const result = await readModel.getItemStatus('c1', 'CreateUser', 'item2');

      expect(result).toBeNull();
    });
  });

  describe('getNodeStatus', () => {
    it('should return null when no node status exists', async () => {
      const result = await readModel.getNodeStatus('c1', 'CreateUser');

      expect(result).toBeNull();
    });

    it('should return node status from NodeStatus collection', async () => {
      const collection = database.collection<WithId<NodeStatusDocument>>('NodeStatus');
      await collection.insertOne({
        _id: 'c1-CreateUser',
        correlationId: 'c1',
        commandName: 'CreateUser',
        status: 'running',
        pendingCount: 1,
        endedCount: 0,
      });

      const result = await readModel.getNodeStatus('c1', 'CreateUser');

      expect(result).toEqual({
        correlationId: 'c1',
        commandName: 'CreateUser',
        status: 'running',
        pendingCount: 1,
        endedCount: 0,
      });
    });

    it('should return null for different correlationId', async () => {
      const collection = database.collection<WithId<NodeStatusDocument>>('NodeStatus');
      await collection.insertOne({
        _id: 'c1-CreateUser',
        correlationId: 'c1',
        commandName: 'CreateUser',
        status: 'running',
        pendingCount: 1,
        endedCount: 0,
      });

      const result = await readModel.getNodeStatus('c2', 'CreateUser');

      expect(result).toBeNull();
    });

    it('should return null for different commandName', async () => {
      const collection = database.collection<WithId<NodeStatusDocument>>('NodeStatus');
      await collection.insertOne({
        _id: 'c1-CreateUser',
        correlationId: 'c1',
        commandName: 'CreateUser',
        status: 'running',
        pendingCount: 1,
        endedCount: 0,
      });

      const result = await readModel.getNodeStatus('c1', 'DeleteUser');

      expect(result).toBeNull();
    });
  });

  describe('getStats', () => {
    it('should return zero stats when no messages exist', async () => {
      const result = await readModel.getStats();

      expect(result).toEqual({
        totalMessages: 0,
        totalCommands: 0,
        totalEvents: 0,
      });
    });

    it('should return stats from Stats collection', async () => {
      const collection = database.collection<WithId<StatsDocument>>('Stats');
      await collection.insertOne({
        _id: 'global',
        totalMessages: 10,
        totalCommands: 6,
        totalEvents: 4,
      });

      const result = await readModel.getStats();

      expect(result).toEqual({
        totalMessages: 10,
        totalCommands: 6,
        totalEvents: 4,
      });
    });
  });

  describe('getSettledInstance', () => {
    it('should return null when no settled instance exists', async () => {
      const result = await readModel.getSettledInstance('template-CmdA', 'c1');

      expect(result).toBeNull();
    });

    it('should return settled instance from collection', async () => {
      const collection = database.collection<WithId<SettledInstanceDocument>>('SettledInstance');
      await collection.insertOne({
        _id: 'template-CmdA-c1',
        instanceId: 'template-CmdA-c1',
        templateId: 'template-CmdA',
        correlationId: 'c1',
        commandTrackers: [{ commandType: 'CmdA', hasStarted: true, hasCompleted: false, events: [] }],
        status: 'active',
        firedCount: 0,
      });

      const result = await readModel.getSettledInstance('template-CmdA', 'c1');

      expect(result).toMatchObject({
        instanceId: 'template-CmdA-c1',
        templateId: 'template-CmdA',
        correlationId: 'c1',
        status: 'active',
      });
    });

    it('should return null for different templateId', async () => {
      const collection = database.collection<WithId<SettledInstanceDocument>>('SettledInstance');
      await collection.insertOne({
        _id: 'template-CmdA-c1',
        instanceId: 'template-CmdA-c1',
        templateId: 'template-CmdA',
        correlationId: 'c1',
        commandTrackers: [],
        status: 'active',
        firedCount: 0,
      });

      const result = await readModel.getSettledInstance('template-CmdB', 'c1');

      expect(result).toBeNull();
    });

    it('should return null for different correlationId', async () => {
      const collection = database.collection<WithId<SettledInstanceDocument>>('SettledInstance');
      await collection.insertOne({
        _id: 'template-CmdA-c1',
        instanceId: 'template-CmdA-c1',
        templateId: 'template-CmdA',
        correlationId: 'c1',
        commandTrackers: [],
        status: 'active',
        firedCount: 0,
      });

      const result = await readModel.getSettledInstance('template-CmdA', 'c2');

      expect(result).toBeNull();
    });
  });

  describe('getActiveSettledInstances', () => {
    it('should return empty array when no instances exist', async () => {
      const result = await readModel.getActiveSettledInstances('c1');

      expect(result).toEqual([]);
    });

    it('should return only active instances for correlationId', async () => {
      const collection = database.collection<WithId<SettledInstanceDocument>>('SettledInstance');
      await collection.insertOne({
        _id: 'template-CmdA-c1',
        instanceId: 'template-CmdA-c1',
        templateId: 'template-CmdA',
        correlationId: 'c1',
        commandTrackers: [],
        status: 'active',
        firedCount: 0,
      });
      await collection.insertOne({
        _id: 'template-CmdB-c1',
        instanceId: 'template-CmdB-c1',
        templateId: 'template-CmdB',
        correlationId: 'c1',
        commandTrackers: [],
        status: 'fired',
        firedCount: 1,
      });

      const result = await readModel.getActiveSettledInstances('c1');

      expect(result).toHaveLength(1);
      expect(result[0].templateId).toBe('template-CmdA');
    });

    it('should filter by correlationId', async () => {
      const collection = database.collection<WithId<SettledInstanceDocument>>('SettledInstance');
      await collection.insertOne({
        _id: 'template-CmdA-c1',
        instanceId: 'template-CmdA-c1',
        templateId: 'template-CmdA',
        correlationId: 'c1',
        commandTrackers: [],
        status: 'active',
        firedCount: 0,
      });
      await collection.insertOne({
        _id: 'template-CmdA-c2',
        instanceId: 'template-CmdA-c2',
        templateId: 'template-CmdA',
        correlationId: 'c2',
        commandTrackers: [],
        status: 'active',
        firedCount: 0,
      });

      const result = await readModel.getActiveSettledInstances('c1');

      expect(result).toHaveLength(1);
      expect(result[0].correlationId).toBe('c1');
    });

    it('should exclude cleaned instances', async () => {
      const collection = database.collection<WithId<SettledInstanceDocument>>('SettledInstance');
      await collection.insertOne({
        _id: 'template-CmdA-c1',
        instanceId: 'template-CmdA-c1',
        templateId: 'template-CmdA',
        correlationId: 'c1',
        commandTrackers: [],
        status: 'cleaned',
        firedCount: 0,
      });

      const result = await readModel.getActiveSettledInstances('c1');

      expect(result).toEqual([]);
    });
  });

  describe('getPhasedExecution', () => {
    it('should return null when no execution exists', async () => {
      const result = await readModel.getPhasedExecution('exec-1');

      expect(result).toBeNull();
    });

    it('should return execution from collection', async () => {
      const collection = database.collection<WithId<PhasedExecutionDocument>>('PhasedExecution');
      const triggerEvent = { type: 'TestEvent', correlationId: 'c1', data: {} };
      await collection.insertOne({
        _id: 'exec-1',
        executionId: 'exec-1',
        correlationId: 'c1',
        handlerId: 'handler-1',
        triggerEvent,
        items: [{ key: 'a', phase: 'prepare', dispatched: false, completed: false }],
        phases: ['prepare'],
        currentPhaseIndex: 0,
        status: 'active',
        failedItems: [],
      });

      const result = await readModel.getPhasedExecution('exec-1');

      expect(result).toMatchObject({
        executionId: 'exec-1',
        correlationId: 'c1',
        handlerId: 'handler-1',
        status: 'active',
      });
    });

    it('should return null for different executionId', async () => {
      const collection = database.collection<WithId<PhasedExecutionDocument>>('PhasedExecution');
      const triggerEvent = { type: 'TestEvent', correlationId: 'c1', data: {} };
      await collection.insertOne({
        _id: 'exec-1',
        executionId: 'exec-1',
        correlationId: 'c1',
        handlerId: 'handler-1',
        triggerEvent,
        items: [],
        phases: ['prepare'],
        currentPhaseIndex: 0,
        status: 'active',
        failedItems: [],
      });

      const result = await readModel.getPhasedExecution('exec-2');

      expect(result).toBeNull();
    });
  });

  describe('getActivePhasedExecutions', () => {
    it('should return empty array when no executions exist', async () => {
      const result = await readModel.getActivePhasedExecutions('c1');

      expect(result).toEqual([]);
    });

    it('should return only active executions for correlationId', async () => {
      const collection = database.collection<WithId<PhasedExecutionDocument>>('PhasedExecution');
      const triggerEvent = { type: 'TestEvent', correlationId: 'c1', data: {} };
      await collection.insertOne({
        _id: 'exec-1',
        executionId: 'exec-1',
        correlationId: 'c1',
        handlerId: 'handler-1',
        triggerEvent,
        items: [],
        phases: ['prepare'],
        currentPhaseIndex: 0,
        status: 'active',
        failedItems: [],
      });
      await collection.insertOne({
        _id: 'exec-2',
        executionId: 'exec-2',
        correlationId: 'c1',
        handlerId: 'handler-2',
        triggerEvent,
        items: [],
        phases: ['prepare'],
        currentPhaseIndex: 0,
        status: 'completed',
        failedItems: [],
      });

      const result = await readModel.getActivePhasedExecutions('c1');

      expect(result).toHaveLength(1);
      expect(result[0].executionId).toBe('exec-1');
    });

    it('should filter by correlationId', async () => {
      const collection = database.collection<WithId<PhasedExecutionDocument>>('PhasedExecution');
      const triggerEvent1 = { type: 'TestEvent', correlationId: 'c1', data: {} };
      const triggerEvent2 = { type: 'TestEvent', correlationId: 'c2', data: {} };
      await collection.insertOne({
        _id: 'exec-1',
        executionId: 'exec-1',
        correlationId: 'c1',
        handlerId: 'handler-1',
        triggerEvent: triggerEvent1,
        items: [],
        phases: ['prepare'],
        currentPhaseIndex: 0,
        status: 'active',
        failedItems: [],
      });
      await collection.insertOne({
        _id: 'exec-2',
        executionId: 'exec-2',
        correlationId: 'c2',
        handlerId: 'handler-1',
        triggerEvent: triggerEvent2,
        items: [],
        phases: ['prepare'],
        currentPhaseIndex: 0,
        status: 'active',
        failedItems: [],
      });

      const result = await readModel.getActivePhasedExecutions('c1');

      expect(result).toHaveLength(1);
      expect(result[0].correlationId).toBe('c1');
    });

    it('should exclude failed executions', async () => {
      const collection = database.collection<WithId<PhasedExecutionDocument>>('PhasedExecution');
      const triggerEvent = { type: 'TestEvent', correlationId: 'c1', data: {} };
      await collection.insertOne({
        _id: 'exec-1',
        executionId: 'exec-1',
        correlationId: 'c1',
        handlerId: 'handler-1',
        triggerEvent,
        items: [],
        phases: ['prepare'],
        currentPhaseIndex: 0,
        status: 'failed',
        failedItems: [{ key: 'a', error: { message: 'Failed' } }],
      });

      const result = await readModel.getActivePhasedExecutions('c1');

      expect(result).toEqual([]);
    });
  });

  describe('computeSettledStats', () => {
    it('should return idle when no instance exists', async () => {
      const result = await readModel.computeSettledStats('c1', 'template-A');

      expect(result).toEqual({
        status: 'idle',
        pendingCount: 0,
        endedCount: 0,
      });
    });

    it('should return pendingCount=1 and status=running when instance is active', async () => {
      const collection = database.collection<WithId<SettledInstanceDocument>>('SettledInstance');
      await collection.insertOne({
        _id: 'template-CheckTests,CheckTypes,CheckLint-c1',
        instanceId: 'template-CheckTests,CheckTypes,CheckLint-c1',
        templateId: 'template-CheckTests,CheckTypes,CheckLint',
        correlationId: 'c1',
        commandTrackers: [
          { commandType: 'CheckTests', hasStarted: true, hasCompleted: false, events: [] },
          { commandType: 'CheckTypes', hasStarted: true, hasCompleted: false, events: [] },
          { commandType: 'CheckLint', hasStarted: true, hasCompleted: false, events: [] },
        ],
        status: 'active',
        firedCount: 0,
      });

      const result = await readModel.computeSettledStats('c1', 'template-CheckTests,CheckTypes,CheckLint');

      expect(result).toEqual({
        status: 'running',
        pendingCount: 1,
        endedCount: 0,
      });
    });

    it('should return status=error when any collected event contains Failed', async () => {
      const collection = database.collection<WithId<SettledInstanceDocument>>('SettledInstance');
      await collection.insertOne({
        _id: 'template-CheckTests,CheckTypes,CheckLint-c1',
        instanceId: 'template-CheckTests,CheckTypes,CheckLint-c1',
        templateId: 'template-CheckTests,CheckTypes,CheckLint',
        correlationId: 'c1',
        commandTrackers: [
          {
            commandType: 'CheckTests',
            hasStarted: true,
            hasCompleted: true,
            events: [{ type: 'TestsPassed', correlationId: 'c1', data: {} }],
          },
          {
            commandType: 'CheckTypes',
            hasStarted: true,
            hasCompleted: true,
            events: [{ type: 'TypeCheckFailed', correlationId: 'c1', data: { errors: 'TS2322' } }],
          },
          { commandType: 'CheckLint', hasStarted: true, hasCompleted: false, events: [] },
        ],
        status: 'active',
        firedCount: 0,
      });

      const result = await readModel.computeSettledStats('c1', 'template-CheckTests,CheckTypes,CheckLint');

      expect(result).toEqual({
        status: 'error',
        pendingCount: 1,
        endedCount: 0,
      });
    });

    it('should return endedCount=1 and status=success after handler fires without failures', async () => {
      const collection = database.collection<WithId<SettledInstanceDocument>>('SettledInstance');
      await collection.insertOne({
        _id: 'template-CheckTests,CheckTypes,CheckLint-c1',
        instanceId: 'template-CheckTests,CheckTypes,CheckLint-c1',
        templateId: 'template-CheckTests,CheckTypes,CheckLint',
        correlationId: 'c1',
        commandTrackers: [
          { commandType: 'CheckTests', hasStarted: true, hasCompleted: false, events: [] },
          { commandType: 'CheckTypes', hasStarted: true, hasCompleted: false, events: [] },
          { commandType: 'CheckLint', hasStarted: true, hasCompleted: false, events: [] },
        ],
        status: 'active',
        firedCount: 1,
      });

      const result = await readModel.computeSettledStats('c1', 'template-CheckTests,CheckTypes,CheckLint');

      expect(result).toEqual({
        status: 'success',
        pendingCount: 1,
        endedCount: 1,
      });
    });

    it('should return pendingCount=0 and endedCount when instance status is fired', async () => {
      const collection = database.collection<WithId<SettledInstanceDocument>>('SettledInstance');
      await collection.insertOne({
        _id: 'template-CheckTests-c1',
        instanceId: 'template-CheckTests-c1',
        templateId: 'template-CheckTests',
        correlationId: 'c1',
        commandTrackers: [
          {
            commandType: 'CheckTests',
            hasStarted: true,
            hasCompleted: true,
            events: [{ type: 'TestsPassed', correlationId: 'c1', data: {} }],
          },
        ],
        status: 'fired',
        firedCount: 2,
      });

      const result = await readModel.computeSettledStats('c1', 'template-CheckTests');

      expect(result).toEqual({
        status: 'success',
        pendingCount: 0,
        endedCount: 2,
      });
    });

    it('should return status=error when fired instance has failed events', async () => {
      const collection = database.collection<WithId<SettledInstanceDocument>>('SettledInstance');
      await collection.insertOne({
        _id: 'template-CheckTests-c1',
        instanceId: 'template-CheckTests-c1',
        templateId: 'template-CheckTests',
        correlationId: 'c1',
        commandTrackers: [
          {
            commandType: 'CheckTests',
            hasStarted: true,
            hasCompleted: true,
            events: [{ type: 'TestsFailed', correlationId: 'c1', data: {} }],
          },
        ],
        status: 'fired',
        firedCount: 1,
      });

      const result = await readModel.computeSettledStats('c1', 'template-CheckTests');

      expect(result).toEqual({
        status: 'error',
        pendingCount: 0,
        endedCount: 1,
      });
    });

    it('should return pendingCount=0 and endedCount when instance status is cleaned', async () => {
      const collection = database.collection<WithId<SettledInstanceDocument>>('SettledInstance');
      await collection.insertOne({
        _id: 'template-CheckTests-c1',
        instanceId: 'template-CheckTests-c1',
        templateId: 'template-CheckTests',
        correlationId: 'c1',
        commandTrackers: [
          {
            commandType: 'CheckTests',
            hasStarted: true,
            hasCompleted: true,
            events: [{ type: 'TestsPassed', correlationId: 'c1', data: {} }],
          },
        ],
        status: 'cleaned',
        firedCount: 3,
      });

      const result = await readModel.computeSettledStats('c1', 'template-CheckTests');

      expect(result).toEqual({
        status: 'success',
        pendingCount: 0,
        endedCount: 3,
      });
    });

    it('should return pendingCount=0 when active instance has firedCount but all commands completed (BUG: settled showing running)', async () => {
      const collection = database.collection<WithId<SettledInstanceDocument>>('SettledInstance');
      await collection.insertOne({
        _id: 'template-CheckTests,CheckTypes,CheckLint-c1',
        instanceId: 'template-CheckTests,CheckTypes,CheckLint-c1',
        templateId: 'template-CheckTests,CheckTypes,CheckLint',
        correlationId: 'c1',
        commandTrackers: [
          {
            commandType: 'CheckTests',
            hasStarted: true,
            hasCompleted: true,
            events: [{ type: 'TestsPassed', correlationId: 'c1', data: {} }],
          },
          {
            commandType: 'CheckTypes',
            hasStarted: true,
            hasCompleted: true,
            events: [{ type: 'TypeCheckPassed', correlationId: 'c1', data: {} }],
          },
          {
            commandType: 'CheckLint',
            hasStarted: true,
            hasCompleted: true,
            events: [{ type: 'LintCheckPassed', correlationId: 'c1', data: {} }],
          },
        ],
        status: 'active',
        firedCount: 7,
      });

      const result = await readModel.computeSettledStats('c1', 'template-CheckTests,CheckTypes,CheckLint');

      expect(result).toEqual({
        status: 'success',
        pendingCount: 0,
        endedCount: 7,
      });
    });
  });
});
