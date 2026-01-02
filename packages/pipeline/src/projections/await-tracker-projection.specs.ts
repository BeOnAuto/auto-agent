import { describe, expect, it } from 'vitest';
import { evolve } from './await-tracker-projection';

describe('await-tracker-projection', () => {
  describe('evolve', () => {
    it('should throw when applying AwaitItemCompleted to null document', () => {
      expect(() =>
        evolve(null, {
          type: 'AwaitItemCompleted',
          data: { correlationId: 'c1', key: 'k1', result: {} },
        }),
      ).toThrow('Cannot apply AwaitItemCompleted to null document');
    });

    it('should throw when applying AwaitCompleted to null document', () => {
      expect(() =>
        evolve(null, {
          type: 'AwaitCompleted',
          data: { correlationId: 'c1' },
        }),
      ).toThrow('Cannot apply AwaitCompleted to null document');
    });
  });
});
