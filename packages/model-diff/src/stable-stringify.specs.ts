import { describe, expect, it } from 'vitest';
import { stableStringify } from './stable-stringify';

describe('stableStringify', () => {
  it('produces identical output regardless of key order', () => {
    const a = stableStringify({ z: 1, a: 2 });
    const b = stableStringify({ a: 2, z: 1 });
    expect(a).toBe(b);
  });

  it('sorts nested object keys', () => {
    const result = stableStringify({ b: { d: 1, c: 2 }, a: 3 });
    expect(result).toBe('{"a":3,"b":{"c":2,"d":1}}');
  });

  it('handles arrays without reordering elements', () => {
    const result = stableStringify([3, 1, 2]);
    expect(result).toBe('[3,1,2]');
  });

  it('handles null and primitive values', () => {
    expect(stableStringify(null)).toBe('null');
    expect(stableStringify('hello')).toBe('"hello"');
    expect(stableStringify(42)).toBe('42');
    expect(stableStringify(true)).toBe('true');
  });

  it('handles nested arrays with objects', () => {
    const result = stableStringify([
      { z: 1, a: 2 },
      { y: 3, b: 4 },
    ]);
    expect(result).toBe('[{"a":2,"z":1},{"b":4,"y":3}]');
  });

  it('handles empty objects and arrays', () => {
    expect(stableStringify({})).toBe('{}');
    expect(stableStringify([])).toBe('[]');
  });

  it('handles undefined values by omitting them', () => {
    const result = stableStringify({ a: 1, b: undefined, c: 3 });
    expect(result).toBe('{"a":1,"c":3}');
  });
});
