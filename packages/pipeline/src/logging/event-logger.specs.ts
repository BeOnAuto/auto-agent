import { describe, it, expect, beforeEach } from 'vitest';
import { EventLogger } from './event-logger';
import type { Event } from '@auto-engineer/message-bus';

describe('EventLogger', () => {
  let logger: EventLogger;

  beforeEach(() => {
    logger = new EventLogger();
  });

  describe('logging', () => {
    it('should log events', () => {
      const event: Event = { type: 'TestEvent', data: { foo: 'bar' } };
      logger.log(event);
      expect(logger.getEntries()).toHaveLength(1);
      expect(logger.getEntries()[0].event).toEqual(event);
    });

    it('should add timestamp to entries', () => {
      const event: Event = { type: 'TestEvent', data: {} };
      logger.log(event);
      const entry = logger.getEntries()[0];
      expect(entry.timestamp).toBeDefined();
      expect(new Date(entry.timestamp).getTime()).toBeLessThanOrEqual(Date.now());
    });

    it('should extract correlationId', () => {
      const event: Event = { type: 'TestEvent', correlationId: 'c1', data: {} };
      logger.log(event);
      expect(logger.getEntries()[0].correlationId).toBe('c1');
    });

    it('should call onLog callback', () => {
      const logged: Event[] = [];
      logger = new EventLogger({
        onLog: (entry) => logged.push(entry.event),
      });

      logger.log({ type: 'E1', data: {} });
      logger.log({ type: 'E2', data: {} });

      expect(logged).toHaveLength(2);
      expect(logged.map((e) => e.type)).toEqual(['E1', 'E2']);
    });
  });

  describe('queries', () => {
    it('should filter by correlationId', () => {
      logger.log({ type: 'E1', correlationId: 'c1', data: {} });
      logger.log({ type: 'E2', correlationId: 'c2', data: {} });
      logger.log({ type: 'E3', correlationId: 'c1', data: {} });

      const c1Events = logger.getEntriesByCorrelationId('c1');
      expect(c1Events).toHaveLength(2);
      expect(c1Events.map((e) => e.event.type)).toEqual(['E1', 'E3']);
    });

    it('should return event types', () => {
      logger.log({ type: 'A', data: {} });
      logger.log({ type: 'B', data: {} });
      logger.log({ type: 'C', data: {} });

      expect(logger.getEventTypes()).toEqual(['A', 'B', 'C']);
    });

    it('should return event sequence', () => {
      logger.log({ type: 'Started', data: {} });
      logger.log({ type: 'Processing', data: {} });
      logger.log({ type: 'Completed', data: {} });

      expect(logger.getEventSequence()).toEqual(['Started', 'Processing', 'Completed']);
    });
  });

  describe('management', () => {
    it('should clear entries', () => {
      logger.log({ type: 'E1', data: {} });
      logger.log({ type: 'E2', data: {} });

      logger.clear();

      expect(logger.getEntries()).toHaveLength(0);
    });

    it('should serialize to JSON', () => {
      logger.log({ type: 'E1', data: { x: 1 } });
      const json = logger.toJSON();
      expect(json).toHaveLength(1);
      expect(json[0].event.type).toBe('E1');
    });

    it('should return copy of entries', () => {
      logger.log({ type: 'E1', data: {} });
      const entries = logger.getEntries();
      entries.push({ timestamp: '', event: { type: 'Fake', data: {} } });
      expect(logger.getEntries()).toHaveLength(1);
    });
  });
});
