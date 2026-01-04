import { describe, expect, it } from 'vitest';
import { parseMessageKey, sortFilesByPath, sortImportsBySource, sortMessagesByKey, toMessageKey } from './ordering';

describe('ordering utilities', () => {
  describe('toMessageKey', () => {
    it('creates key from kind and name', () => {
      expect(toMessageKey('command', 'AddTodo')).toBe('command:AddTodo');
      expect(toMessageKey('event', 'TodoAdded')).toBe('event:TodoAdded');
      expect(toMessageKey('state', 'TodoList')).toBe('state:TodoList');
    });
  });

  describe('parseMessageKey', () => {
    it('parses key back to kind and name', () => {
      expect(parseMessageKey('command:AddTodo')).toEqual({ kind: 'command', name: 'AddTodo' });
      expect(parseMessageKey('event:TodoAdded')).toEqual({ kind: 'event', name: 'TodoAdded' });
      expect(parseMessageKey('state:TodoList')).toEqual({ kind: 'state', name: 'TodoList' });
    });

    it('throws error for invalid format without colon', () => {
      expect(() => parseMessageKey('invalid')).toThrow('Invalid message key format: invalid');
    });

    it('throws error for invalid kind', () => {
      expect(() => parseMessageKey('unknown:SomeMessage')).toThrow('Invalid message kind: unknown');
    });

    it('handles names containing colons', () => {
      expect(parseMessageKey('event:Foo:Bar')).toEqual({ kind: 'event', name: 'Foo:Bar' });
    });
  });

  describe('sortMessagesByKey', () => {
    it('sorts messages alphabetically by messageKey', () => {
      const messages = [
        { kind: 'state' as const, name: 'TodoList' },
        { kind: 'command' as const, name: 'AddTodo' },
        { kind: 'event' as const, name: 'TodoAdded' },
        { kind: 'command' as const, name: 'DeleteTodo' },
      ];

      const sorted = sortMessagesByKey(messages);

      expect(sorted).toEqual([
        { kind: 'command', name: 'AddTodo' },
        { kind: 'command', name: 'DeleteTodo' },
        { kind: 'event', name: 'TodoAdded' },
        { kind: 'state', name: 'TodoList' },
      ]);
    });

    it('returns empty array for empty input', () => {
      expect(sortMessagesByKey([])).toEqual([]);
    });
  });

  describe('sortFilesByPath', () => {
    it('sorts files alphabetically by path', () => {
      const files = [
        { path: 'src/users.narrative.ts', code: 'users' },
        { path: 'generated.narrative.ts', code: 'default' },
        { path: 'src/orders.narrative.ts', code: 'orders' },
      ];

      const sorted = sortFilesByPath(files);

      expect(sorted.map((f) => f.path)).toEqual([
        'generated.narrative.ts',
        'src/orders.narrative.ts',
        'src/users.narrative.ts',
      ]);
    });

    it('returns empty array for empty input', () => {
      expect(sortFilesByPath([])).toEqual([]);
    });
  });

  describe('sortImportsBySource', () => {
    it('sorts imports alphabetically by source path then by type names', () => {
      const imports = [
        { fromPath: './users', typeNames: ['CreateUser', 'UserCreated'] },
        { fromPath: './orders', typeNames: ['PlaceOrder', 'OrderPlaced'] },
        { fromPath: './shared', typeNames: ['BaseEvent'] },
      ];

      const sorted = sortImportsBySource(imports);

      expect(sorted.map((i) => i.fromPath)).toEqual(['./orders', './shared', './users']);
    });

    it('sorts type names within each import', () => {
      const imports = [{ fromPath: './types', typeNames: ['Zebra', 'Alpha', 'Beta'] }];

      const sorted = sortImportsBySource(imports);

      expect(sorted[0].typeNames).toEqual(['Alpha', 'Beta', 'Zebra']);
    });

    it('returns empty array for empty input', () => {
      expect(sortImportsBySource([])).toEqual([]);
    });
  });
});
