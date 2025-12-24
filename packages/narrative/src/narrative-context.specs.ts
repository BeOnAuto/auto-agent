import { beforeEach, describe, expect, it } from 'vitest';
import { command } from './fluent-builder';
import { example, flow, rule, specs } from './narrative';
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

describe('Narrative DSL', () => {
  beforeEach(async () => {
    // Clean test state before each test
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
