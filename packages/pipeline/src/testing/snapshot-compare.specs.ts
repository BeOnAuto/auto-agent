import { describe, it, expect } from 'vitest';
import {
  compareEventSequence,
  containsSubsequence,
  findMissingEvents,
  findUnexpectedEvents,
  formatSnapshotDiff,
} from './snapshot-compare';

describe('snapshot-compare', () => {
  describe('compareEventSequence', () => {
    it('should match identical sequences', () => {
      const result = compareEventSequence(['A', 'B', 'C'], ['A', 'B', 'C']);
      expect(result.matches).toBe(true);
      expect(result.differences).toHaveLength(0);
    });

    it('should detect mismatches', () => {
      const result = compareEventSequence(['A', 'B', 'C'], ['A', 'X', 'C']);
      expect(result.matches).toBe(false);
      expect(result.differences).toHaveLength(1);
      expect(result.differences[0]).toEqual({
        type: 'mismatch',
        index: 1,
        expected: 'B',
        actual: 'X',
      });
    });

    it('should detect missing events', () => {
      const result = compareEventSequence(['A', 'B', 'C'], ['A', 'B']);
      expect(result.matches).toBe(false);
      expect(result.differences).toContainEqual({
        type: 'missing',
        index: 2,
        expected: 'C',
      });
    });

    it('should detect extra events', () => {
      const result = compareEventSequence(['A', 'B'], ['A', 'B', 'C']);
      expect(result.matches).toBe(false);
      expect(result.differences).toContainEqual({
        type: 'extra',
        index: 2,
        actual: 'C',
      });
    });

    it('should report counts', () => {
      const result = compareEventSequence(['A', 'B', 'C'], ['A', 'B']);
      expect(result.expectedCount).toBe(3);
      expect(result.actualCount).toBe(2);
    });
  });

  describe('containsSubsequence', () => {
    it('should find exact subsequence', () => {
      expect(containsSubsequence(['A', 'B', 'C', 'D'], ['B', 'C'])).toBe(true);
    });

    it('should find non-contiguous subsequence', () => {
      expect(containsSubsequence(['A', 'B', 'C', 'D'], ['A', 'C'])).toBe(true);
    });

    it('should return false for missing subsequence', () => {
      expect(containsSubsequence(['A', 'B', 'C'], ['X', 'Y'])).toBe(false);
    });

    it('should return true for empty subsequence', () => {
      expect(containsSubsequence(['A', 'B'], [])).toBe(true);
    });

    it('should return false for empty sequence with non-empty subsequence', () => {
      expect(containsSubsequence([], ['A'])).toBe(false);
    });

    it('should require order', () => {
      expect(containsSubsequence(['A', 'B', 'C'], ['C', 'A'])).toBe(false);
    });
  });

  describe('findMissingEvents', () => {
    it('should find missing events', () => {
      const missing = findMissingEvents(['A', 'B', 'C'], ['A', 'B', 'D']);
      expect(missing).toEqual(['D']);
    });

    it('should return empty for all present', () => {
      const missing = findMissingEvents(['A', 'B', 'C'], ['A', 'B']);
      expect(missing).toEqual([]);
    });
  });

  describe('findUnexpectedEvents', () => {
    it('should find unexpected events', () => {
      const unexpected = findUnexpectedEvents(['A', 'B', 'X'], ['A', 'B', 'C']);
      expect(unexpected).toEqual(['X']);
    });

    it('should return empty when all allowed', () => {
      const unexpected = findUnexpectedEvents(['A', 'B'], ['A', 'B', 'C']);
      expect(unexpected).toEqual([]);
    });
  });

  describe('formatSnapshotDiff', () => {
    it('should format matching result', () => {
      const result = compareEventSequence(['A', 'B'], ['A', 'B']);
      const formatted = formatSnapshotDiff(result);
      expect(formatted).toContain('✓');
      expect(formatted).toContain('matches');
    });

    it('should format mismatching result', () => {
      const result = compareEventSequence(['A', 'B'], ['A', 'X']);
      const formatted = formatSnapshotDiff(result);
      expect(formatted).toContain('✗');
      expect(formatted).toContain('mismatch');
      expect(formatted).toContain('Expected "B"');
      expect(formatted).toContain('got "X"');
    });

    it('should format missing events', () => {
      const result = compareEventSequence(['A', 'B', 'C'], ['A', 'B']);
      const formatted = formatSnapshotDiff(result);
      expect(formatted).toContain('Missing "C"');
    });

    it('should format extra events', () => {
      const result = compareEventSequence(['A', 'B'], ['A', 'B', 'C']);
      const formatted = formatSnapshotDiff(result);
      expect(formatted).toContain('Unexpected "C"');
    });
  });
});
