import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import type { Response } from 'express';
import { SSEManager } from './sse-manager';
import type { Event } from '@auto-engineer/message-bus';

interface MockResponse extends Response {
  written: string[];
  ended: boolean;
  writeHeadMock: Mock;
  endMock: Mock;
  triggerClose: () => void;
}

function createMockResponse(): MockResponse {
  const written: string[] = [];
  let ended = false;
  const listeners: Record<string, Array<() => void>> = {};

  const writeHeadMock = vi.fn();
  const endMock = vi.fn(() => {
    ended = true;
  });

  return {
    written,
    ended,
    writeHeadMock,
    endMock,
    writeHead: writeHeadMock,
    write: vi.fn((data: string) => {
      written.push(data);
      return true;
    }),
    end: endMock,
    on: vi.fn((event: string, handler: () => void) => {
      listeners[event] = listeners[event] ?? [];
      listeners[event].push(handler);
    }),
    triggerClose: () => {
      listeners['close']?.forEach((h) => h());
    },
  } as unknown as MockResponse;
}

describe('SSEManager', () => {
  let manager: SSEManager;

  beforeEach(() => {
    manager = new SSEManager();
  });

  describe('client management', () => {
    it('should add client', () => {
      const res = createMockResponse();
      manager.addClient('c1', res);
      expect(manager.clientCount).toBe(1);
    });

    it('should set correct SSE headers', () => {
      const res = createMockResponse();
      manager.addClient('c1', res);
      expect(res.writeHeadMock).toHaveBeenCalledWith(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      });
    });

    it('should send heartbeat comment on connect', () => {
      const res = createMockResponse();
      manager.addClient('c1', res);
      expect(res.written[0]).toBe(':\n\n');
    });

    it('should remove client', () => {
      const res = createMockResponse();
      manager.addClient('c1', res);
      manager.removeClient('c1');
      expect(manager.clientCount).toBe(0);
    });

    it('should cleanup client on response close', () => {
      const res = createMockResponse();
      manager.addClient('c1', res);
      res.triggerClose();
      expect(manager.clientCount).toBe(0);
    });
  });

  describe('broadcasting', () => {
    it('should broadcast event to all clients', () => {
      const res1 = createMockResponse();
      const res2 = createMockResponse();

      manager.addClient('c1', res1);
      manager.addClient('c2', res2);

      const event: Event = { type: 'TestEvent', data: { foo: 'bar' } };
      manager.broadcast(event);

      expect(res1.written).toContainEqual(`data: ${JSON.stringify(event)}\n\n`);
      expect(res2.written).toContainEqual(`data: ${JSON.stringify(event)}\n\n`);
    });

    it('should filter by correlationId when set', () => {
      const res1 = createMockResponse();
      const res2 = createMockResponse();

      manager.addClient('c1', res1, 'workflow-123');
      manager.addClient('c2', res2);

      const event: Event = { type: 'TestEvent', correlationId: 'workflow-456', data: {} };
      manager.broadcast(event);

      expect(res1.written.length).toBe(1);
      expect(res2.written.length).toBe(2);
    });

    it('should send to filtered client when correlationId matches', () => {
      const res = createMockResponse();
      manager.addClient('c1', res, 'workflow-123');

      const event: Event = { type: 'TestEvent', correlationId: 'workflow-123', data: {} };
      manager.broadcast(event);

      expect(res.written).toContainEqual(`data: ${JSON.stringify(event)}\n\n`);
    });

    it('should not send to filtered client when correlationId does not match', () => {
      const res = createMockResponse();
      manager.addClient('c1', res, 'workflow-123');

      const event: Event = { type: 'TestEvent', correlationId: 'workflow-456', data: {} };
      manager.broadcast(event);

      expect(res.written.length).toBe(1);
    });
  });

  describe('closeAll', () => {
    it('should close all clients', () => {
      const res1 = createMockResponse();
      const res2 = createMockResponse();

      manager.addClient('c1', res1);
      manager.addClient('c2', res2);

      manager.closeAll();

      expect(manager.clientCount).toBe(0);
      expect(res1.endMock).toHaveBeenCalled();
      expect(res2.endMock).toHaveBeenCalled();
    });
  });
});
