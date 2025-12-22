import { describe, it, expect } from 'vitest';
import { sanitizeEvent, sanitizeEvents, type SanitizedEvent } from './snapshot-sanitize';
import type { Event } from '@auto-engineer/message-bus';

describe('snapshot-sanitize', () => {
  describe('sanitizeEvent', () => {
    it('should preserve type and data', () => {
      const event: Event = {
        type: 'TestEvent',
        data: { foo: 'bar', count: 42 },
      };

      const sanitized = sanitizeEvent(event);

      expect(sanitized.type).toBe('TestEvent');
      expect(sanitized.data).toEqual({ foo: 'bar', count: 42 });
    });

    it('should strip timestamp', () => {
      const event: Event = {
        type: 'TestEvent',
        data: {},
        timestamp: new Date('2025-01-01T00:00:00.000Z'),
      };

      const sanitized = sanitizeEvent(event);

      expect(sanitized).not.toHaveProperty('timestamp');
    });

    it('should strip requestId', () => {
      const event: Event = {
        type: 'TestEvent',
        data: {},
        requestId: 'req-12345',
      };

      const sanitized = sanitizeEvent(event);

      expect(sanitized).not.toHaveProperty('requestId');
    });

    it('should strip correlationId', () => {
      const event: Event = {
        type: 'TestEvent',
        data: {},
        correlationId: 'corr-67890',
      };

      const sanitized = sanitizeEvent(event);

      expect(sanitized).not.toHaveProperty('correlationId');
    });

    it('should strip all volatile fields at once', () => {
      const event: Event = {
        type: 'CompleteEvent',
        data: { result: 'success' },
        timestamp: new Date('2025-01-01T00:00:00.000Z'),
        requestId: 'req-abc',
        correlationId: 'corr-xyz',
      };

      const sanitized = sanitizeEvent(event);

      expect(sanitized).toEqual({
        type: 'CompleteEvent',
        data: { result: 'success' },
      });
    });

    it('should return a new object (not mutate original)', () => {
      const testDate = new Date('2025-01-01T00:00:00.000Z');
      const event: Event = {
        type: 'TestEvent',
        data: { value: 1 },
        timestamp: testDate,
      };

      const sanitized = sanitizeEvent(event);

      expect(event.timestamp).toBe(testDate);
      expect(sanitized).not.toBe(event);
    });
  });

  describe('sanitizeEvents', () => {
    it('should sanitize empty array', () => {
      const result = sanitizeEvents([]);
      expect(result).toEqual([]);
    });

    it('should sanitize multiple events', () => {
      const events: Event[] = [
        { type: 'First', data: { a: 1 }, timestamp: new Date(), requestId: 'r1' },
        { type: 'Second', data: { b: 2 }, correlationId: 'c2' },
        { type: 'Third', data: { c: 3 } },
      ];

      const sanitized = sanitizeEvents(events);

      expect(sanitized).toEqual([
        { type: 'First', data: { a: 1 } },
        { type: 'Second', data: { b: 2 } },
        { type: 'Third', data: { c: 3 } },
      ]);
    });

    it('should preserve event order', () => {
      const events: Event[] = [
        { type: 'A', data: {} },
        { type: 'B', data: {} },
        { type: 'C', data: {} },
      ];

      const sanitized = sanitizeEvents(events);

      expect(sanitized.map((e) => e.type)).toEqual(['A', 'B', 'C']);
    });
  });

  describe('SanitizedEvent type', () => {
    it('should be assignable from sanitizeEvent result', () => {
      const event: Event = { type: 'Test', data: { x: 1 } };
      const sanitized: SanitizedEvent = sanitizeEvent(event);

      expect(sanitized.type).toBe('Test');
      expect(sanitized.data).toEqual({ x: 1 });
    });
  });
});
