import type { CommandHandler } from '@auto-engineer/message-bus';
import { describe, expect, it } from 'vitest';
import { EventCommandMapper } from './event-command-map';

interface CommandHandlerWithEvents extends CommandHandler {
  events?: readonly string[];
}

describe('EventCommandMapper', () => {
  describe('basic mapping', () => {
    it('should map events to source commands from handler metadata', () => {
      const handlers: CommandHandlerWithEvents[] = [
        {
          name: 'CheckTests',
          events: ['TestsCheckPassed', 'TestsCheckFailed'],
          handle: async () => ({ type: 'TestsCheckPassed', data: {} }),
        },
        {
          name: 'CheckTypes',
          events: ['TypeCheckPassed', 'TypeCheckFailed'],
          handle: async () => ({ type: 'TypeCheckPassed', data: {} }),
        },
      ];

      const mapper = new EventCommandMapper(handlers);

      expect(mapper.getSourceCommand('TestsCheckPassed')).toBe('CheckTests');
      expect(mapper.getSourceCommand('TestsCheckFailed')).toBe('CheckTests');
      expect(mapper.getSourceCommand('TypeCheckPassed')).toBe('CheckTypes');
      expect(mapper.getSourceCommand('TypeCheckFailed')).toBe('CheckTypes');
    });

    it('should return undefined for unknown events', () => {
      const handlers: CommandHandlerWithEvents[] = [
        {
          name: 'CheckTests',
          events: ['TestsCheckPassed'],
          handle: async () => ({ type: 'TestsCheckPassed', data: {} }),
        },
      ];

      const mapper = new EventCommandMapper(handlers);

      expect(mapper.getSourceCommand('UnknownEvent')).toBeUndefined();
    });

    it('should handle handlers without events array', () => {
      const handlers: CommandHandlerWithEvents[] = [
        {
          name: 'SomeCommand',
          handle: async () => ({ type: 'SomeEvent', data: {} }),
        },
      ];

      const mapper = new EventCommandMapper(handlers);

      expect(mapper.getSourceCommand('SomeEvent')).toBeUndefined();
    });
  });

  describe('incremental updates', () => {
    it('should allow adding handlers after construction', () => {
      const mapper = new EventCommandMapper([]);

      mapper.addHandler({
        name: 'CheckLint',
        events: ['LintCheckPassed', 'LintCheckFailed'],
        handle: async () => ({ type: 'LintCheckPassed', data: {} }),
      });

      expect(mapper.getSourceCommand('LintCheckPassed')).toBe('CheckLint');
      expect(mapper.getSourceCommand('LintCheckFailed')).toBe('CheckLint');
    });

    it('should handle duplicate event registrations gracefully', () => {
      const handlers: CommandHandlerWithEvents[] = [
        {
          name: 'Handler1',
          events: ['SharedEvent'],
          handle: async () => ({ type: 'SharedEvent', data: {} }),
        },
      ];

      const mapper = new EventCommandMapper(handlers);

      mapper.addHandler({
        name: 'Handler2',
        events: ['SharedEvent'],
        handle: async () => ({ type: 'SharedEvent', data: {} }),
      });

      const result = mapper.getSourceCommand('SharedEvent');
      expect(['Handler1', 'Handler2']).toContain(result);
    });
  });

  describe('query methods', () => {
    it('should return all events for a command', () => {
      const handlers: CommandHandlerWithEvents[] = [
        {
          name: 'CheckTests',
          events: ['TestsCheckPassed', 'TestsCheckFailed', 'TestsCheckSkipped'],
          handle: async () => ({ type: 'TestsCheckPassed', data: {} }),
        },
      ];

      const mapper = new EventCommandMapper(handlers);
      const events = mapper.getEventsForCommand('CheckTests');

      expect(events).toEqual(['TestsCheckPassed', 'TestsCheckFailed', 'TestsCheckSkipped']);
    });

    it('should return empty array for unknown command', () => {
      const mapper = new EventCommandMapper([]);
      const events = mapper.getEventsForCommand('UnknownCommand');

      expect(events).toEqual([]);
    });

    it('should check if event is from command', () => {
      const handlers: CommandHandlerWithEvents[] = [
        {
          name: 'CheckTests',
          events: ['TestsCheckPassed', 'TestsCheckFailed'],
          handle: async () => ({ type: 'TestsCheckPassed', data: {} }),
        },
      ];

      const mapper = new EventCommandMapper(handlers);

      expect(mapper.isEventFromCommand('TestsCheckPassed', 'CheckTests')).toBe(true);
      expect(mapper.isEventFromCommand('TestsCheckFailed', 'CheckTests')).toBe(true);
      expect(mapper.isEventFromCommand('TypeCheckPassed', 'CheckTests')).toBe(false);
    });
  });
});
