import type { Event } from '@auto-engineer/message-bus';
import type { Response } from 'express';
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import { SSEManager } from './sse-manager';

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
      listeners.close?.forEach((h) => h());
    },
  } as unknown as MockResponse;
}

describe('SSEManager', () => {
  let manager: SSEManager;

  beforeEach(() => {
    manager = new SSEManager();
  });

  describe('client connection', () => {
    it('should set correct SSE headers when client connects', () => {
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

    it('should receive broadcasts after connecting', () => {
      const res = createMockResponse();
      manager.addClient('c1', res);

      const event: Event = { type: 'TestEvent', data: { foo: 'bar' } };
      manager.broadcast(event);

      expect(res.written).toContainEqual(`data: ${JSON.stringify(event)}\n\n`);
    });
  });

  describe('client removal', () => {
    it('should not receive broadcasts after explicit removal', () => {
      const res = createMockResponse();
      manager.addClient('c1', res);
      manager.removeClient('c1');

      const event: Event = { type: 'TestEvent', data: { foo: 'bar' } };
      manager.broadcast(event);

      expect(res.written).toHaveLength(1);
    });

    it('should not receive broadcasts after connection close', () => {
      const res = createMockResponse();
      manager.addClient('c1', res);
      res.triggerClose();

      const event: Event = { type: 'TestEvent', data: { foo: 'bar' } };
      manager.broadcast(event);

      expect(res.written).toHaveLength(1);
    });
  });

  describe('broadcasting', () => {
    it('should broadcast event to all connected clients', () => {
      const res1 = createMockResponse();
      const res2 = createMockResponse();

      manager.addClient('c1', res1);
      manager.addClient('c2', res2);

      const event: Event = { type: 'TestEvent', data: { foo: 'bar' } };
      manager.broadcast(event);

      expect(res1.written).toContainEqual(`data: ${JSON.stringify(event)}\n\n`);
      expect(res2.written).toContainEqual(`data: ${JSON.stringify(event)}\n\n`);
    });

    it('should filter events by correlationId when client subscribes to specific correlation', () => {
      const filteredRes = createMockResponse();
      const unfilteredRes = createMockResponse();

      manager.addClient('c1', filteredRes, 'workflow-123');
      manager.addClient('c2', unfilteredRes);

      const event: Event = { type: 'TestEvent', correlationId: 'workflow-456', data: {} };
      manager.broadcast(event);

      expect(filteredRes.written).toHaveLength(1);
      expect(unfilteredRes.written).toHaveLength(2);
    });

    it('should send event to filtered client when correlationId matches', () => {
      const res = createMockResponse();
      manager.addClient('c1', res, 'workflow-123');

      const event: Event = { type: 'TestEvent', correlationId: 'workflow-123', data: {} };
      manager.broadcast(event);

      expect(res.written).toContainEqual(`data: ${JSON.stringify(event)}\n\n`);
    });

    it('should not send event to filtered client when correlationId does not match', () => {
      const res = createMockResponse();
      manager.addClient('c1', res, 'workflow-123');

      const event: Event = { type: 'TestEvent', correlationId: 'workflow-456', data: {} };
      manager.broadcast(event);

      expect(res.written).toHaveLength(1);
    });
  });

  describe('broadcast error handling', () => {
    it('should not throw when client write fails', () => {
      const res = createMockResponse();
      manager.addClient('c1', res);

      vi.mocked(res.write).mockImplementation(() => {
        throw new Error('Connection reset');
      });

      const event: Event = { type: 'TestEvent', data: {} };

      expect(() => manager.broadcast(event)).not.toThrow();
    });

    it('should stop sending to failed client on subsequent broadcasts', () => {
      const res = createMockResponse();
      let writeCallCount = 0;
      vi.mocked(res.write).mockImplementation((data: string) => {
        writeCallCount++;
        if (writeCallCount > 2) {
          throw new Error('Connection reset');
        }
        res.written.push(data);
        return true;
      });

      manager.addClient('c1', res);

      const event1: Event = { type: 'TestEvent1', data: {} };
      manager.broadcast(event1);

      const event2: Event = { type: 'TestEvent2', data: {} };
      manager.broadcast(event2);

      const eventMessages = res.written.filter((w) => w.startsWith('data:'));
      expect(eventMessages).toHaveLength(1);
    });

    it('should continue broadcasting to other clients after one fails', () => {
      const failingRes = createMockResponse();
      const workingRes = createMockResponse();

      vi.mocked(failingRes.write)
        .mockImplementationOnce(() => true)
        .mockImplementation(() => {
          throw new Error('Connection reset');
        });

      manager.addClient('c1', failingRes);
      manager.addClient('c2', workingRes);

      const event: Event = { type: 'TestEvent', data: {} };
      manager.broadcast(event);

      expect(workingRes.written).toContainEqual(`data: ${JSON.stringify(event)}\n\n`);
    });
  });

  describe('closeAll', () => {
    it('should end all client connections', () => {
      const res1 = createMockResponse();
      const res2 = createMockResponse();

      manager.addClient('c1', res1);
      manager.addClient('c2', res2);

      manager.closeAll();

      expect(res1.endMock).toHaveBeenCalled();
      expect(res2.endMock).toHaveBeenCalled();
    });

    it('should not send broadcasts after closeAll', () => {
      const res = createMockResponse();
      manager.addClient('c1', res);

      manager.closeAll();

      const event: Event = { type: 'TestEvent', data: {} };
      manager.broadcast(event);

      expect(res.written).toHaveLength(1);
    });
  });
});
