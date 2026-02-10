import { describe, expect, it } from 'vitest';
import { parseInlineObjectFields } from './type-helpers';

describe('parseInlineObjectFields', () => {
  it('should parse simple inline object fields', () => {
    expect(parseInlineObjectFields('{ name: string; age: number }')).toEqual([
      { name: 'name', tsType: 'string' },
      { name: 'age', tsType: 'number' },
    ]);
  });

  it('should parse Array<{...}> wrapper', () => {
    expect(parseInlineObjectFields('Array<{ id: string; count: number }>')).toEqual([
      { name: 'id', tsType: 'string' },
      { name: 'count', tsType: 'number' },
    ]);
  });

  it('should parse nested inline objects without breaking', () => {
    const tsType = '{ userId: string; items: Array<{ id: string; qty: number }> }';
    expect(parseInlineObjectFields(tsType)).toEqual([
      { name: 'userId', tsType: 'string' },
      { name: 'items', tsType: 'Array<{ id: string; qty: number }>' },
    ]);
  });

  it('should parse deeply nested types', () => {
    const tsType = 'Array<{ sessionId: string; performance: Array<{ exerciseId: string; completedSets: number }> }>';
    expect(parseInlineObjectFields(tsType)).toEqual([
      { name: 'sessionId', tsType: 'string' },
      { name: 'performance', tsType: 'Array<{ exerciseId: string; completedSets: number }>' },
    ]);
  });

  it('should return empty array for empty object', () => {
    expect(parseInlineObjectFields('{}')).toEqual([]);
  });

  it('should return empty array for non-inline types', () => {
    expect(parseInlineObjectFields('string')).toEqual([]);
  });
});
