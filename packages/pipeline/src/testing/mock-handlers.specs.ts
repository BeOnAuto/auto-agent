import { describe, it, expect, beforeEach } from 'vitest';
import { createMockHandlers, getHandlerCallCount, resetCallCounts, createStatefulHandler } from './mock-handlers';

describe('mock-handlers', () => {
  beforeEach(() => {
    resetCallCounts();
  });

  describe('createMockHandlers', () => {
    it('should create handlers with correct names', () => {
      const handlers = createMockHandlers([
        {
          name: 'CheckTests',
          events: ['TestsCheckPassed'],
          fn: () => ({ type: 'TestsCheckPassed', data: {} }),
        },
        {
          name: 'CheckTypes',
          events: ['TypeCheckPassed'],
          fn: () => ({ type: 'TypeCheckPassed', data: {} }),
        },
      ]);

      expect(handlers).toHaveLength(2);
      expect(handlers[0].name).toBe('CheckTests');
      expect(handlers[1].name).toBe('CheckTypes');
    });

    it('should create handlers with correct events', () => {
      const handlers = createMockHandlers([
        {
          name: 'CheckTests',
          events: ['TestsCheckPassed', 'TestsCheckFailed'],
          fn: () => ({ type: 'TestsCheckPassed', data: {} }),
        },
      ]);

      expect(handlers[0].events).toEqual(['TestsCheckPassed', 'TestsCheckFailed']);
    });

    it('should call handler function with command', async () => {
      let receivedCommand: unknown = null;
      const handlers = createMockHandlers([
        {
          name: 'TestHandler',
          events: ['Done'],
          fn: (cmd) => {
            receivedCommand = cmd;
            return { type: 'Done', data: {} };
          },
        },
      ]);

      const command = { type: 'TestHandler', data: { foo: 'bar' } };
      await handlers[0].handle(command);

      expect(receivedCommand).toEqual(command);
    });

    it('should return event from handler function', async () => {
      const handlers = createMockHandlers([
        {
          name: 'TestHandler',
          events: ['Result'],
          fn: () => ({ type: 'Result', data: { value: 42 } }),
        },
      ]);

      const result = await handlers[0].handle({ type: 'TestHandler', data: {} });

      expect(result).toEqual({ type: 'Result', data: { value: 42 } });
    });

    it('should return array of events from handler function', async () => {
      const handlers = createMockHandlers([
        {
          name: 'MultiEventHandler',
          events: ['First', 'Second'],
          fn: () => [
            { type: 'First', data: {} },
            { type: 'Second', data: {} },
          ],
        },
      ]);

      const result = await handlers[0].handle({ type: 'MultiEventHandler', data: {} });

      expect(result).toEqual([
        { type: 'First', data: {} },
        { type: 'Second', data: {} },
      ]);
    });

    it('should pass attempt number to handler function', async () => {
      let receivedAttempts: number[] = [];
      const handlers = createMockHandlers([
        {
          name: 'TrackingHandler',
          events: ['Done'],
          fn: (_, attempt) => {
            receivedAttempts.push(attempt);
            return { type: 'Done', data: {} };
          },
        },
      ]);

      await handlers[0].handle({ type: 'TrackingHandler', data: {} });
      await handlers[0].handle({ type: 'TrackingHandler', data: {} });
      await handlers[0].handle({ type: 'TrackingHandler', data: {} });

      expect(receivedAttempts).toEqual([1, 2, 3]);
    });

    it('should reset call counts when creating new handlers', () => {
      createMockHandlers([
        {
          name: 'First',
          events: ['Done'],
          fn: () => ({ type: 'Done', data: {} }),
        },
      ]);

      expect(getHandlerCallCount('First')).toBe(0);
    });
  });

  describe('getHandlerCallCount', () => {
    it('should return 0 for uncalled handler', () => {
      createMockHandlers([
        {
          name: 'Uncalled',
          events: ['Done'],
          fn: () => ({ type: 'Done', data: {} }),
        },
      ]);

      expect(getHandlerCallCount('Uncalled')).toBe(0);
    });

    it('should track call count for handler', async () => {
      const handlers = createMockHandlers([
        {
          name: 'Called',
          events: ['Done'],
          fn: () => ({ type: 'Done', data: {} }),
        },
      ]);

      await handlers[0].handle({ type: 'Called', data: {} });
      await handlers[0].handle({ type: 'Called', data: {} });

      expect(getHandlerCallCount('Called')).toBe(2);
    });
  });

  describe('resetCallCounts', () => {
    it('should clear all call counts', async () => {
      const handlers = createMockHandlers([
        {
          name: 'Handler1',
          events: ['Done'],
          fn: () => ({ type: 'Done', data: {} }),
        },
        {
          name: 'Handler2',
          events: ['Done'],
          fn: () => ({ type: 'Done', data: {} }),
        },
      ]);

      await handlers[0].handle({ type: 'Handler1', data: {} });
      await handlers[1].handle({ type: 'Handler2', data: {} });

      resetCallCounts();

      expect(getHandlerCallCount('Handler1')).toBe(0);
      expect(getHandlerCallCount('Handler2')).toBe(0);
    });
  });

  describe('createStatefulHandler', () => {
    it('should fail for initial attempts', async () => {
      const handler = createStatefulHandler({
        name: 'CheckTests',
        events: ['TestsCheckPassed', 'TestsCheckFailed'],
        initialFails: 2,
        failEvent: (cmd) => ({ type: 'TestsCheckFailed', data: { target: cmd.data } }),
        successEvent: (cmd) => ({ type: 'TestsCheckPassed', data: { target: cmd.data } }),
      });

      const command = { type: 'CheckTests', data: { dir: './src' } };

      const result1 = await handler.handle(command);
      expect(Array.isArray(result1) ? result1[0].type : result1.type).toBe('TestsCheckFailed');

      const result2 = await handler.handle(command);
      expect(Array.isArray(result2) ? result2[0].type : result2.type).toBe('TestsCheckFailed');

      const result3 = await handler.handle(command);
      expect(Array.isArray(result3) ? result3[0].type : result3.type).toBe('TestsCheckPassed');
    });

    it('should preserve handler metadata', () => {
      const handler = createStatefulHandler({
        name: 'CheckTypes',
        events: ['TypeCheckPassed', 'TypeCheckFailed'],
        initialFails: 1,
        failEvent: () => ({ type: 'TypeCheckFailed', data: {} }),
        successEvent: () => ({ type: 'TypeCheckPassed', data: {} }),
      });

      expect(handler.name).toBe('CheckTypes');
      expect(handler.events).toEqual(['TypeCheckPassed', 'TypeCheckFailed']);
    });

    it('should succeed immediately when initialFails is 0', async () => {
      const handler = createStatefulHandler({
        name: 'AlwaysPass',
        events: ['Passed'],
        initialFails: 0,
        failEvent: () => ({ type: 'Failed', data: {} }),
        successEvent: () => ({ type: 'Passed', data: {} }),
      });

      const result = await handler.handle({ type: 'AlwaysPass', data: {} });
      expect(Array.isArray(result) ? result[0].type : result.type).toBe('Passed');
    });
  });
});
