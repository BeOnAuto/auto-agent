import { describe, expect, it } from 'vitest';
import type { Narrative } from '../../index';
import { narrativesToModel } from './index';

describe('Type inference in narrative-to-model transformer', () => {
  it('should correctly extract command types from when clauses', () => {
    const flows: Narrative[] = [
      {
        name: 'Test Flow',
        id: 'FLOW-001',
        slices: [
          {
            id: 'SLICE-001',
            type: 'command',
            name: 'Submit Answer Command',
            client: { specs: [] },
            server: {
              description: 'Submit answer server',
              specs: [
                {
                  type: 'gherkin',
                  feature: 'Submit Answer Specs',
                  rules: [
                    {
                      id: 'RULE-001',
                      name: 'Should accept answer submission',
                      examples: [
                        {
                          name: 'Valid answer submission',
                          steps: [
                            {
                              keyword: 'When',
                              text: 'AnswerQuestion',
                              docString: {
                                questionnaireId: 'q-001',
                                participantId: 'participant-abc',
                                questionId: 'q1',
                                answer: 'Yes',
                              },
                            },
                            {
                              keyword: 'Then',
                              text: 'QuestionAnswered',
                              docString: {
                                questionnaireId: 'q-001',
                                participantId: 'participant-abc',
                                questionId: 'q1',
                                answer: 'Yes',
                                savedAt: new Date(),
                              },
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          },
          {
            id: 'SLICE-002',
            type: 'command',
            name: 'Submit Questionnaire Command',
            client: { specs: [] },
            server: {
              description: 'Submit questionnaire server',
              specs: [
                {
                  type: 'gherkin',
                  feature: 'Submit Questionnaire Specs',
                  rules: [
                    {
                      id: 'RULE-002',
                      name: 'Should submit questionnaire',
                      examples: [
                        {
                          name: 'Valid questionnaire submission',
                          steps: [
                            {
                              keyword: 'When',
                              text: 'SubmitQuestionnaire',
                              docString: {
                                questionnaireId: 'q-001',
                                participantId: 'participant-abc',
                              },
                            },
                            {
                              keyword: 'Then',
                              text: 'QuestionnaireSubmitted',
                              docString: {
                                questionnaireId: 'q-001',
                                participantId: 'participant-abc',
                                submittedAt: new Date(),
                              },
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          },
        ],
      },
    ];

    const model = narrativesToModel(flows);

    // Should have the correct command messages extracted
    expect(model.messages.some((msg) => msg.name === 'AnswerQuestion')).toBe(true);
    expect(model.messages.some((msg) => msg.name === 'SubmitQuestionnaire')).toBe(true);
    expect(model.messages.some((msg) => msg.name === 'QuestionAnswered')).toBe(true);
    expect(model.messages.some((msg) => msg.name === 'QuestionnaireSubmitted')).toBe(true);

    // Should NOT have InferredType fallback
    expect(model.messages.some((msg) => msg.name === 'InferredType')).toBe(false);

    // Verify the command messages have the correct structure
    const answerQuestionMsg = model.messages.find((msg) => msg.name === 'AnswerQuestion');
    expect(answerQuestionMsg?.type).toBe('command');
    expect(answerQuestionMsg?.fields).toBeDefined();

    const submitQuestionnaireMsg = model.messages.find((msg) => msg.name === 'SubmitQuestionnaire');
    expect(submitQuestionnaireMsg?.type).toBe('command');
    expect(submitQuestionnaireMsg?.fields).toBeDefined();
  });

  it('should handle single object when/then clauses correctly', () => {
    const flows: Narrative[] = [
      {
        name: 'Single Object Flow',
        id: 'FLOW-001',
        slices: [
          {
            id: 'SLICE-001',
            type: 'command',
            name: 'Single Object Command',
            client: { specs: [] },
            server: {
              description: 'Single object server',
              specs: [
                {
                  type: 'gherkin',
                  feature: 'Single Object Specs',
                  rules: [
                    {
                      id: 'RULE-001',
                      name: 'Should handle single object',
                      examples: [
                        {
                          name: 'Single object example',
                          steps: [
                            {
                              keyword: 'When',
                              text: 'TestCommand',
                              docString: { test: 'value' },
                            },
                            {
                              keyword: 'Then',
                              text: 'TestEvent',
                              docString: { result: 'success' },
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          },
        ],
      },
    ];

    const model = narrativesToModel(flows);

    // Should extract the command and event types from single objects
    expect(model.messages.some((msg) => msg.name === 'TestCommand')).toBe(true);
    expect(model.messages.some((msg) => msg.name === 'TestEvent')).toBe(true);
    expect(model.messages.some((msg) => msg.name === 'InferredType')).toBe(false);
  });
});
