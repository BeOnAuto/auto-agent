import type { Event } from '@auto-engineer/message-bus';
import { describe, expect, it } from 'vitest';
import type { PhasedExecutionDocument, PhasedExecutionEvent } from './phased-execution-projection';
import { evolve } from './phased-execution-projection';

describe('PhasedExecutionProjection', () => {
  const triggerEvent: Event = { type: 'TestEvent', correlationId: 'c1', data: { items: ['a', 'b'] } };

  describe('PhasedExecutionStarted', () => {
    it('should create initial document with items and phases', () => {
      const event: PhasedExecutionEvent = {
        type: 'PhasedExecutionStarted',
        data: {
          executionId: 'exec-1',
          correlationId: 'c1',
          handlerId: 'handler-1',
          triggerEvent,
          items: [
            { key: 'a', phase: 'prepare', dispatched: false, completed: false },
            { key: 'b', phase: 'execute', dispatched: false, completed: false },
          ],
          phases: ['prepare', 'execute'],
        },
      };

      const result = evolve(null, event);

      expect(result.executionId).toBe('exec-1');
      expect(result.correlationId).toBe('c1');
      expect(result.handlerId).toBe('handler-1');
      expect(result.status).toBe('active');
      expect(result.currentPhaseIndex).toBe(0);
      expect(result.items).toHaveLength(2);
      expect(result.phases).toEqual(['prepare', 'execute']);
      expect(result.failedItems).toEqual([]);
    });
  });

  describe('PhasedItemDispatched', () => {
    it('should mark item as dispatched', () => {
      const doc: PhasedExecutionDocument = {
        executionId: 'exec-1',
        correlationId: 'c1',
        handlerId: 'handler-1',
        triggerEvent,
        items: [
          { key: 'a', phase: 'prepare', dispatched: false, completed: false },
          { key: 'b', phase: 'execute', dispatched: false, completed: false },
        ],
        phases: ['prepare', 'execute'],
        currentPhaseIndex: 0,
        status: 'active',
        failedItems: [],
      };

      const event: PhasedExecutionEvent = {
        type: 'PhasedItemDispatched',
        data: { executionId: 'exec-1', itemKey: 'a', phase: 'prepare' },
      };

      const result = evolve(doc, event);

      expect(result.items.find((i) => i.key === 'a')?.dispatched).toBe(true);
      expect(result.items.find((i) => i.key === 'b')?.dispatched).toBe(false);
    });

    it('should throw when document is null', () => {
      const event: PhasedExecutionEvent = {
        type: 'PhasedItemDispatched',
        data: { executionId: 'exec-1', itemKey: 'a', phase: 'prepare' },
      };

      expect(() => evolve(null, event)).toThrow('Cannot apply PhasedItemDispatched to null document');
    });
  });

  describe('PhasedItemCompleted', () => {
    it('should mark item as completed', () => {
      const doc: PhasedExecutionDocument = {
        executionId: 'exec-1',
        correlationId: 'c1',
        handlerId: 'handler-1',
        triggerEvent,
        items: [{ key: 'a', phase: 'prepare', dispatched: true, completed: false }],
        phases: ['prepare'],
        currentPhaseIndex: 0,
        status: 'active',
        failedItems: [],
      };

      const resultEvent: Event = { type: 'ItemDone', correlationId: 'c1', data: {} };
      const event: PhasedExecutionEvent = {
        type: 'PhasedItemCompleted',
        data: { executionId: 'exec-1', itemKey: 'a', resultEvent },
      };

      const result = evolve(doc, event);

      expect(result.items.find((i) => i.key === 'a')?.completed).toBe(true);
    });
  });

  describe('PhasedItemFailed', () => {
    it('should add item to failedItems', () => {
      const doc: PhasedExecutionDocument = {
        executionId: 'exec-1',
        correlationId: 'c1',
        handlerId: 'handler-1',
        triggerEvent,
        items: [{ key: 'a', phase: 'prepare', dispatched: true, completed: false }],
        phases: ['prepare'],
        currentPhaseIndex: 0,
        status: 'active',
        failedItems: [],
      };

      const event: PhasedExecutionEvent = {
        type: 'PhasedItemFailed',
        data: { executionId: 'exec-1', itemKey: 'a', error: { message: 'Failed' } },
      };

      const result = evolve(doc, event);

      expect(result.failedItems).toHaveLength(1);
      expect(result.failedItems[0].key).toBe('a');
      expect(result.failedItems[0].error).toEqual({ message: 'Failed' });
    });
  });

  describe('PhasedPhaseAdvanced', () => {
    it('should update currentPhaseIndex', () => {
      const doc: PhasedExecutionDocument = {
        executionId: 'exec-1',
        correlationId: 'c1',
        handlerId: 'handler-1',
        triggerEvent,
        items: [{ key: 'a', phase: 'prepare', dispatched: true, completed: true }],
        phases: ['prepare', 'execute'],
        currentPhaseIndex: 0,
        status: 'active',
        failedItems: [],
      };

      const event: PhasedExecutionEvent = {
        type: 'PhasedPhaseAdvanced',
        data: { executionId: 'exec-1', fromPhase: 0, toPhase: 1 },
      };

      const result = evolve(doc, event);

      expect(result.currentPhaseIndex).toBe(1);
    });
  });

  describe('PhasedExecutionCompleted', () => {
    it('should set status to completed on success', () => {
      const doc: PhasedExecutionDocument = {
        executionId: 'exec-1',
        correlationId: 'c1',
        handlerId: 'handler-1',
        triggerEvent,
        items: [{ key: 'a', phase: 'prepare', dispatched: true, completed: true }],
        phases: ['prepare'],
        currentPhaseIndex: 1,
        status: 'active',
        failedItems: [],
      };

      const event: PhasedExecutionEvent = {
        type: 'PhasedExecutionCompleted',
        data: { executionId: 'exec-1', success: true, results: ['a'] },
      };

      const result = evolve(doc, event);

      expect(result.status).toBe('completed');
    });

    it('should set status to failed on failure', () => {
      const doc: PhasedExecutionDocument = {
        executionId: 'exec-1',
        correlationId: 'c1',
        handlerId: 'handler-1',
        triggerEvent,
        items: [{ key: 'a', phase: 'prepare', dispatched: true, completed: false }],
        phases: ['prepare'],
        currentPhaseIndex: 0,
        status: 'active',
        failedItems: [{ key: 'a', error: { message: 'Failed' } }],
      };

      const event: PhasedExecutionEvent = {
        type: 'PhasedExecutionCompleted',
        data: { executionId: 'exec-1', success: false, results: [] },
      };

      const result = evolve(doc, event);

      expect(result.status).toBe('failed');
    });
  });
});
