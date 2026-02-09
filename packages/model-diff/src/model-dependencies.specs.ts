import { describe, expect, it } from 'vitest';
import { walkStepsByKeyword } from './model-dependencies';

describe('walkStepsByKeyword', () => {
  it('groups step texts by their keyword', () => {
    const specs = [
      {
        type: 'gherkin' as const,
        feature: 'test',
        rules: [
          {
            name: 'r1',
            examples: [
              {
                name: 'e1',
                steps: [
                  { keyword: 'Given' as const, text: 'EventA' },
                  { keyword: 'When' as const, text: 'CommandB' },
                  { keyword: 'Then' as const, text: 'EventC' },
                ],
              },
            ],
          },
        ],
      },
    ];
    expect(walkStepsByKeyword(specs)).toEqual({
      given: ['EventA'],
      when: ['CommandB'],
      then: ['EventC'],
    });
  });

  it('resolves And to previous major keyword', () => {
    const specs = [
      {
        type: 'gherkin' as const,
        feature: 'test',
        rules: [
          {
            name: 'r1',
            examples: [
              {
                name: 'e1',
                steps: [
                  { keyword: 'Given' as const, text: 'E1' },
                  { keyword: 'And' as const, text: 'E2' },
                  { keyword: 'When' as const, text: 'C1' },
                  { keyword: 'Then' as const, text: 'Ev1' },
                  { keyword: 'And' as const, text: 'Ev2' },
                ],
              },
            ],
          },
        ],
      },
    ];
    expect(walkStepsByKeyword(specs)).toEqual({
      given: ['E1', 'E2'],
      when: ['C1'],
      then: ['Ev1', 'Ev2'],
    });
  });

  it('skips error steps (no text property)', () => {
    const specs = [
      {
        type: 'gherkin' as const,
        feature: 'test',
        rules: [
          {
            name: 'r1',
            examples: [
              {
                name: 'e1',
                steps: [
                  { keyword: 'Given' as const, text: 'E1' },
                  { keyword: 'When' as const, text: 'C1' },
                  { keyword: 'Then' as const, error: { type: 'ValidationError' as const, message: 'bad' } },
                ],
              },
            ],
          },
        ],
      },
    ];
    expect(walkStepsByKeyword(specs)).toEqual({
      given: ['E1'],
      when: ['C1'],
      then: [],
    });
  });

  it('deduplicates step texts across rules and examples', () => {
    const specs = [
      {
        type: 'gherkin' as const,
        feature: 'test',
        rules: [
          {
            name: 'r1',
            examples: [
              {
                name: 'e1',
                steps: [
                  { keyword: 'Given' as const, text: 'EventA' },
                  { keyword: 'When' as const, text: 'CommandB' },
                  { keyword: 'Then' as const, text: 'EventC' },
                ],
              },
              {
                name: 'e2',
                steps: [
                  { keyword: 'Given' as const, text: 'EventA' },
                  { keyword: 'When' as const, text: 'CommandB' },
                  { keyword: 'Then' as const, text: 'EventC' },
                ],
              },
            ],
          },
        ],
      },
    ];
    expect(walkStepsByKeyword(specs)).toEqual({
      given: ['EventA'],
      when: ['CommandB'],
      then: ['EventC'],
    });
  });

  it('returns empty buckets for empty specs', () => {
    expect(walkStepsByKeyword([])).toEqual({
      given: [],
      when: [],
      then: [],
    });
  });
});
