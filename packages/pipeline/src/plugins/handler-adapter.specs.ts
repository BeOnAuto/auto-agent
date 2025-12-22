import { describe, it, expect, vi } from 'vitest';
import { adaptHandler, adaptHandlers } from './handler-adapter';
import type { CommandHandlerMetadata } from './plugin-loader';

describe('handler-adapter', () => {
  describe('adaptHandler', () => {
    it('should preserve name from source handler', () => {
      const source: CommandHandlerMetadata = {
        name: 'CheckTests',
        handle: vi.fn().mockResolvedValue({ type: 'TestsCheckPassed', data: {} }),
      };

      const adapted = adaptHandler(source);

      expect(adapted.name).toBe('CheckTests');
    });

    it('should preserve alias from source handler', () => {
      const source: CommandHandlerMetadata = {
        name: 'CheckTests',
        alias: 'check:tests',
        handle: vi.fn().mockResolvedValue({ type: 'TestsCheckPassed', data: {} }),
      };

      const adapted = adaptHandler(source);

      expect(adapted.alias).toBe('check:tests');
    });

    it('should preserve description from source handler', () => {
      const source: CommandHandlerMetadata = {
        name: 'CheckTypes',
        description: 'Runs TypeScript type checking',
        handle: vi.fn().mockResolvedValue({ type: 'TypeCheckPassed', data: {} }),
      };

      const adapted = adaptHandler(source);

      expect(adapted.description).toBe('Runs TypeScript type checking');
    });

    it('should preserve events from source handler', () => {
      const source: CommandHandlerMetadata = {
        name: 'CheckTests',
        events: ['TestsCheckPassed', 'TestsCheckFailed'],
        handle: vi.fn().mockResolvedValue({ type: 'TestsCheckPassed', data: {} }),
      };

      const adapted = adaptHandler(source);

      expect(adapted.events).toEqual(['TestsCheckPassed', 'TestsCheckFailed']);
    });

    it('should preserve fields from source handler', () => {
      const source: CommandHandlerMetadata = {
        name: 'CheckTests',
        fields: { targetDirectory: { type: 'string', required: true } },
        handle: vi.fn().mockResolvedValue({ type: 'TestsCheckPassed', data: {} }),
      };

      const adapted = adaptHandler(source);

      expect(adapted.fields).toEqual({ targetDirectory: { type: 'string', required: true } });
    });

    it('should call source handle function with command', async () => {
      const mockHandle = vi.fn().mockResolvedValue({ type: 'TestsCheckPassed', data: {} });
      const source: CommandHandlerMetadata = {
        name: 'CheckTests',
        handle: mockHandle,
      };

      const adapted = adaptHandler(source);
      const command = { type: 'CheckTests', data: { targetDirectory: './src' } };
      await adapted.handle(command);

      expect(mockHandle).toHaveBeenCalledWith(command);
    });

    it('should return single event from handle', async () => {
      const source: CommandHandlerMetadata = {
        name: 'CheckTests',
        handle: vi.fn().mockResolvedValue({ type: 'TestsCheckPassed', data: { passed: true } }),
      };

      const adapted = adaptHandler(source);
      const result = await adapted.handle({ type: 'CheckTests', data: {} });

      expect(result).toEqual({ type: 'TestsCheckPassed', data: { passed: true } });
    });

    it('should return array of events from handle', async () => {
      const events = [
        { type: 'SliceGenerated', data: { slicePath: './slice1' } },
        { type: 'ServerGenerated', data: {} },
      ];
      const source: CommandHandlerMetadata = {
        name: 'GenerateServer',
        handle: vi.fn().mockResolvedValue(events),
      };

      const adapted = adaptHandler(source);
      const result = await adapted.handle({ type: 'GenerateServer', data: {} });

      expect(result).toEqual(events);
    });

    it('should handle undefined optional fields', () => {
      const source: CommandHandlerMetadata = {
        name: 'SimpleHandler',
        handle: vi.fn().mockResolvedValue({ type: 'Done', data: {} }),
      };

      const adapted = adaptHandler(source);

      expect(adapted.alias).toBeUndefined();
      expect(adapted.description).toBeUndefined();
      expect(adapted.events).toBeUndefined();
      expect(adapted.fields).toBeUndefined();
    });
  });

  describe('adaptHandlers', () => {
    it('should adapt multiple handlers', () => {
      const sources: CommandHandlerMetadata[] = [
        { name: 'CheckTests', handle: vi.fn().mockResolvedValue({ type: 'TestsCheckPassed', data: {} }) },
        { name: 'CheckTypes', handle: vi.fn().mockResolvedValue({ type: 'TypeCheckPassed', data: {} }) },
        { name: 'CheckLint', handle: vi.fn().mockResolvedValue({ type: 'LintCheckPassed', data: {} }) },
      ];

      const adapted = adaptHandlers(sources);

      expect(adapted).toHaveLength(3);
      expect(adapted.map((h) => h.name)).toEqual(['CheckTests', 'CheckTypes', 'CheckLint']);
    });

    it('should return empty array for empty input', () => {
      const adapted = adaptHandlers([]);

      expect(adapted).toEqual([]);
    });

    it('should preserve all metadata on adapted handlers', () => {
      const sources: CommandHandlerMetadata[] = [
        {
          name: 'CheckTests',
          alias: 'check:tests',
          description: 'Run tests',
          events: ['TestsCheckPassed', 'TestsCheckFailed'],
          fields: { scope: { type: 'string' } },
          handle: vi.fn().mockResolvedValue({ type: 'TestsCheckPassed', data: {} }),
        },
      ];

      const adapted = adaptHandlers(sources);

      expect(adapted[0].name).toBe('CheckTests');
      expect(adapted[0].alias).toBe('check:tests');
      expect(adapted[0].description).toBe('Run tests');
      expect(adapted[0].events).toEqual(['TestsCheckPassed', 'TestsCheckFailed']);
      expect(adapted[0].fields).toEqual({ scope: { type: 'string' } });
    });
  });
});
