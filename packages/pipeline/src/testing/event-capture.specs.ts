import type { Event } from '@auto-engineer/message-bus';
import { beforeEach, describe, expect, it } from 'vitest';
import { EventCapture } from './event-capture';

describe('EventCapture', () => {
  let capture: EventCapture;

  beforeEach(() => {
    capture = new EventCapture();
  });

  describe('record', () => {
    it('should record a single event', () => {
      const event: Event = { type: 'TestEvent', data: { foo: 'bar' } };
      capture.record(event);
      expect(capture.getEvents()).toHaveLength(1);
      expect(capture.getEvents()[0]).toEqual(event);
    });

    it('should record multiple events in order', () => {
      const event1: Event = { type: 'First', data: {} };
      const event2: Event = { type: 'Second', data: {} };
      const event3: Event = { type: 'Third', data: {} };

      capture.record(event1);
      capture.record(event2);
      capture.record(event3);

      const events = capture.getEvents();
      expect(events).toHaveLength(3);
      expect(events[0].type).toBe('First');
      expect(events[1].type).toBe('Second');
      expect(events[2].type).toBe('Third');
    });
  });

  describe('getEvents', () => {
    it('should return empty array initially', () => {
      expect(capture.getEvents()).toEqual([]);
    });

    it('should return a copy of events array', () => {
      const event: Event = { type: 'TestEvent', data: {} };
      capture.record(event);

      const events = capture.getEvents();
      events.push({ type: 'Modified', data: {} });

      expect(capture.getEvents()).toHaveLength(1);
    });
  });

  describe('getEventTypes', () => {
    it('should return empty array initially', () => {
      expect(capture.getEventTypes()).toEqual([]);
    });

    it('should return event types in order', () => {
      capture.record({ type: 'A', data: {} });
      capture.record({ type: 'B', data: {} });
      capture.record({ type: 'C', data: {} });

      expect(capture.getEventTypes()).toEqual(['A', 'B', 'C']);
    });
  });

  describe('clear', () => {
    it('should clear all recorded events', () => {
      capture.record({ type: 'A', data: {} });
      capture.record({ type: 'B', data: {} });

      capture.clear();

      expect(capture.getEvents()).toEqual([]);
    });
  });

  describe('hasEvent', () => {
    it('should return false when event not present', () => {
      expect(capture.hasEvent('Missing')).toBe(false);
    });

    it('should return true when event is present', () => {
      capture.record({ type: 'Present', data: {} });
      expect(capture.hasEvent('Present')).toBe(true);
    });
  });

  describe('getEventsOfType', () => {
    it('should return empty array when no matching events', () => {
      capture.record({ type: 'Other', data: {} });
      expect(capture.getEventsOfType('Missing')).toEqual([]);
    });

    it('should return all events of specified type', () => {
      capture.record({ type: 'A', data: { id: 1 } });
      capture.record({ type: 'B', data: { id: 2 } });
      capture.record({ type: 'A', data: { id: 3 } });

      const aEvents = capture.getEventsOfType('A');
      expect(aEvents).toHaveLength(2);
      expect(aEvents[0].data).toEqual({ id: 1 });
      expect(aEvents[1].data).toEqual({ id: 3 });
    });
  });

  describe('waitForEvent', () => {
    it('should resolve immediately if event already present', async () => {
      capture.record({ type: 'Already', data: {} });

      const event = await capture.waitForEvent('Already', 100);
      expect(event.type).toBe('Already');
    });

    it('should resolve when event is recorded', async () => {
      const promise = capture.waitForEvent('Delayed', 500);

      setTimeout(() => {
        capture.record({ type: 'Delayed', data: { success: true } });
      }, 50);

      const event = await promise;
      expect(event.type).toBe('Delayed');
      expect(event.data).toEqual({ success: true });
    });

    it('should reject on timeout if event not recorded', async () => {
      await expect(capture.waitForEvent('Never', 50)).rejects.toThrow('Timeout waiting for event: Never');
    });
  });

  describe('count', () => {
    it('should return 0 initially', () => {
      expect(capture.count).toBe(0);
    });

    it('should return number of recorded events', () => {
      capture.record({ type: 'A', data: {} });
      capture.record({ type: 'B', data: {} });
      expect(capture.count).toBe(2);
    });
  });
});
