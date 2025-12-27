import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { command } from './fluent-builder';
import type { CommandSlice } from './index';
import { example, flow, describe as narrativeDescribe, it as narrativeIt, rule, should, specs } from './narrative';
import { registry } from './narrative-registry';
import type { Event, State } from './types';

type QuestionnaireLinkSent = Event<
  'QuestionnaireLinkSent',
  {
    questionnaireId: string;
    participantId: string;
    link: string;
    sentAt: Date;
  }
>;

type QuestionAnswered = Event<
  'QuestionAnswered',
  {
    questionnaireId: string;
    participantId: string;
    questionId: string;
    answer: string;
    savedAt: Date;
  }
>;

type QuestionnaireProgress = State<
  'QuestionnaireProgress',
  {
    questionnaireId: string;
    participantId: string;
    status: string;
    currentQuestionId: string;
    remainingQuestions: string[];
    answers: { questionId: string; value: string }[];
  }
>;

describe('it and should with id parameter', () => {
  afterEach(() => {
    registry.clearAll();
  });

  it('should record it with title only', () => {
    flow('test it title only', () => {
      command('test command').client(() => {
        narrativeDescribe('Test Section', () => {
          narrativeIt('displays todo list');
        });
      });
    });

    const narratives = registry.getAllNarratives();
    const slice = narratives[0].slices[0] as CommandSlice;
    const describeNode = slice.client.specs[0];

    expect(describeNode.type).toBe('describe');
    if (describeNode.type !== 'describe') throw new Error('Expected describe node');
    expect(describeNode.children).toHaveLength(1);

    const itNode = describeNode.children![0];
    expect(itNode.type).toBe('it');
    expect(itNode.title).toBe('displays todo list');
    expect(itNode.id).toBeUndefined();
  });

  it('should record it with title and id (id at end)', () => {
    flow('test it with id', () => {
      command('test command').client(() => {
        narrativeDescribe('Test Section', () => {
          narrativeIt('displays todo list', 'IT-001');
        });
      });
    });

    const narratives = registry.getAllNarratives();
    const slice = narratives[0].slices[0] as CommandSlice;
    const describeNode = slice.client.specs[0];
    if (describeNode.type !== 'describe') throw new Error('Expected describe node');
    const itNode = describeNode.children![0];

    expect(itNode.type).toBe('it');
    expect(itNode.title).toBe('displays todo list');
    expect(itNode.id).toBe('IT-001');
  });

  it('should record should with title only', () => {
    flow('test should title only', () => {
      command('test command').client(() => {
        narrativeDescribe('Test Section', () => {
          should('display todo list');
        });
      });
    });

    const narratives = registry.getAllNarratives();
    const slice = narratives[0].slices[0] as CommandSlice;
    const describeNode = slice.client.specs[0];
    if (describeNode.type !== 'describe') throw new Error('Expected describe node');
    const itNode = describeNode.children![0];

    expect(itNode.type).toBe('it');
    expect(itNode.title).toBe('display todo list');
    expect(itNode.id).toBeUndefined();
  });

  it('should record should with title and id (id at end)', () => {
    flow('test should with id', () => {
      command('test command').client(() => {
        narrativeDescribe('Test Section', () => {
          should('display todo list', 'SH-001');
        });
      });
    });

    const narratives = registry.getAllNarratives();
    const slice = narratives[0].slices[0] as CommandSlice;
    const describeNode = slice.client.specs[0];
    if (describeNode.type !== 'describe') throw new Error('Expected describe node');
    const itNode = describeNode.children![0];

    expect(itNode.type).toBe('it');
    expect(itNode.title).toBe('display todo list');
    expect(itNode.id).toBe('SH-001');
  });
});

describe('describe with id parameter', () => {
  afterEach(() => {
    registry.clearAll();
  });

  it('should record describe with title and callback', () => {
    flow('test describe title', () => {
      command('test command').client(() => {
        narrativeDescribe('Todo List', () => {
          narrativeIt('shows items');
        });
      });
    });

    const narratives = registry.getAllNarratives();
    const slice = narratives[0].slices[0] as CommandSlice;
    const describeNode = slice.client.specs[0];

    expect(describeNode.type).toBe('describe');
    expect(describeNode.title).toBe('Todo List');
    expect(describeNode.id).toBeUndefined();
  });

  it('should record describe with title, id, and callback (id at end)', () => {
    flow('test describe with id', () => {
      command('test command').client(() => {
        narrativeDescribe('Todo List', 'DESC-001', () => {
          narrativeIt('shows items');
        });
      });
    });

    const narratives = registry.getAllNarratives();
    const slice = narratives[0].slices[0] as CommandSlice;
    const describeNode = slice.client.specs[0];

    expect(describeNode.type).toBe('describe');
    expect(describeNode.title).toBe('Todo List');
    expect(describeNode.id).toBe('DESC-001');
  });
});

describe('Narrative DSL', () => {
  beforeEach(async () => {
    registry.clearAll();
  });

  it('should support given() method in builder', () => {
    expect(() => {
      flow('test flow with given', () => {
        command('test command').server(() => {
          specs(() => {
            rule('test rule with given', () => {
              example('given test')
                .given<QuestionnaireLinkSent>({
                  questionnaireId: 'q-001',
                  participantId: 'participant-abc',
                  link: 'https://app.example.com/q/q-001?participant=participant-abc',
                  sentAt: new Date('2030-01-01T09:00:00Z'),
                })
                .when<QuestionAnswered>({
                  questionnaireId: 'q-001',
                  participantId: 'participant-abc',
                  questionId: 'q1',
                  answer: 'Yes',
                  savedAt: new Date('2030-01-01T09:05:00Z'),
                })
                .then<QuestionnaireProgress>({
                  questionnaireId: 'q-001',
                  participantId: 'participant-abc',
                  status: 'in_progress',
                  currentQuestionId: 'q2',
                  remainingQuestions: ['q2'],
                  answers: [{ questionId: 'q1', value: 'Yes' }],
                });
            });
          });
        });
      });
    }).not.toThrow();
  });

  it('should support when() method in builder', () => {
    expect(() => {
      flow('test flow with when', () => {
        command('test command').server(() => {
          specs(() => {
            rule('test rule', () => {
              example('when test')
                .given<QuestionnaireLinkSent>({
                  questionnaireId: 'q-001',
                  participantId: 'participant-abc',
                  link: 'https://app.example.com/q/q-001?participant=participant-abc',
                  sentAt: new Date('2030-01-01T09:00:00Z'),
                })
                .when<QuestionAnswered>({
                  questionnaireId: 'q-001',
                  participantId: 'participant-abc',
                  questionId: 'q1',
                  answer: 'Yes',
                  savedAt: new Date('2030-01-01T09:05:00Z'),
                })
                .then<QuestionnaireProgress>({
                  questionnaireId: 'q-001',
                  participantId: 'participant-abc',
                  status: 'in_progress',
                  currentQuestionId: 'q2',
                  remainingQuestions: ['q2'],
                  answers: [{ questionId: 'q1', value: 'Yes' }],
                });
            });
          });
        });
      });
    }).not.toThrow();
  });

  it('should support then() method in builder', () => {
    expect(() => {
      flow('test flow with then', () => {
        command('test command').server(() => {
          specs(() => {
            rule('test rule', () => {
              example('then test')
                .given<QuestionnaireLinkSent>({
                  questionnaireId: 'q-001',
                  participantId: 'participant-abc',
                  link: 'https://app.example.com/q/q-001?participant=participant-abc',
                  sentAt: new Date('2030-01-01T09:00:00Z'),
                })
                .when<QuestionAnswered>({
                  questionnaireId: 'q-001',
                  participantId: 'participant-abc',
                  questionId: 'q1',
                  answer: 'Yes',
                  savedAt: new Date('2030-01-01T09:05:00Z'),
                })
                .then<QuestionnaireProgress>({
                  questionnaireId: 'q-001',
                  participantId: 'participant-abc',
                  status: 'in_progress',
                  currentQuestionId: 'q2',
                  remainingQuestions: ['q2'],
                  answers: [{ questionId: 'q1', value: 'Yes' }],
                });
            });
          });
        });
      });
    }).not.toThrow();
  });

  it('should support full narrative DSL flow', () => {
    expect(() => {
      flow('test full DSL flow', () => {
        command('test preservation').server(() => {
          specs(() => {
            rule('full flow rule', () => {
              example('full flow test')
                .given<QuestionnaireLinkSent>({
                  questionnaireId: 'q-001',
                  participantId: 'participant-abc',
                  link: 'https://app.example.com/q/q-001?participant=participant-abc',
                  sentAt: new Date('2030-01-01T09:00:00Z'),
                })
                .when<QuestionAnswered>({
                  questionnaireId: 'q-001',
                  participantId: 'participant-abc',
                  questionId: 'q1',
                  answer: 'Yes',
                  savedAt: new Date('2030-01-01T09:05:00Z'),
                })
                .then<QuestionnaireProgress>({
                  questionnaireId: 'q-001',
                  participantId: 'participant-abc',
                  status: 'in_progress',
                  currentQuestionId: 'q2',
                  remainingQuestions: ['q2'],
                  answers: [{ questionId: 'q1', value: 'Yes' }],
                });
            });
          });
        });
      });
    }).not.toThrow();
  });
});
