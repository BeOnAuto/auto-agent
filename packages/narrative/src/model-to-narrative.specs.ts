import { describe, expect, it } from 'vitest';
import type { Model } from './index';
import schema from './samples/seasonal-assistant.schema.json';
import { modelToNarrative } from './transformers/model-to-narrative';

function getCode(result: Awaited<ReturnType<typeof modelToNarrative>>): string {
  return result.files.map((f) => f.code).join('\n');
}

describe('modelToNarrative', () => {
  it('should create a full flow DSL from a model', async () => {
    const result = await modelToNarrative({ ...schema, modules: [] } as Model);
    const code = getCode(result);

    expect(code).toEqual(`import {
  command,
  data,
  describe,
  example,
  gql,
  it,
  narrative,
  query,
  react,
  rule,
  sink,
  source,
  specs,
} from '@auto-engineer/narrative';
import type { Command, Event, State } from '@auto-engineer/narrative';
import { AI, ProductCatalog } from '../server/src/integrations';
type EnterShoppingCriteria = Command<
  'EnterShoppingCriteria',
  {
    sessionId: string;
    criteria: string;
  }
>;
type ShoppingCriteriaEntered = Event<
  'ShoppingCriteriaEntered',
  {
    sessionId: string;
    criteria: string;
  }
>;
type SuggestShoppingItems = Command<
  'SuggestShoppingItems',
  {
    sessionId: string;
    prompt: string;
  }
>;
type Products = State<
  'Products',
  {
    products: {
      productId: string;
      name: string;
      category: string;
      price: number;
      tags: Array<string>;
      imageUrl: string;
    }[];
  }
>;
type ShoppingItemsSuggested = Event<
  'ShoppingItemsSuggested',
  {
    sessionId: string;
    suggestedItems: {
      productId: string;
      name: string;
      quantity: number;
      reason: string;
    }[];
  }
>;
type SuggestedItems = State<
  'SuggestedItems',
  {
    sessionId: string;
    items: {
      productId: string;
      name: string;
      quantity: number;
      reason: string;
    }[];
  }
>;
type AddItemsToCart = Command<
  'AddItemsToCart',
  {
    sessionId: string;
    items: {
      productId: string;
      quantity: number;
    }[];
  }
>;
type ItemsAddedToCart = Event<
  'ItemsAddedToCart',
  {
    sessionId: string;
    items: {
      productId: string;
      quantity: number;
    }[];
  }
>;
narrative('Seasonal Assistant', () => {
  command('enters shopping criteria into assistant')
    .client(() => {
      describe('Assistant Chat Interface', () => {
        it('allow shopper to describe their shopping needs in natural language');
        it('provide a text input for entering criteria');
        it('show examples of what to include (age, interests, budget)');
        it('show a button to submit the criteria');
        it('generate a persisted session id for a visit');
        it('show the header on top of the page');
      });
    })
    .request(
      gql(\`mutation EnterShoppingCriteria($input: EnterShoppingCriteriaInput!) {
  enterShoppingCriteria(input: $input) {
    success
    error {
      type
      message
    }
  }
}\`),
    )
    .server(() => {
      data({ items: [sink().event('ShoppingCriteriaEntered').toStream('shopping-session-\${sessionId}')] });
      specs('When shopper submits criteria, a shopping session is started', () => {
        rule('Valid criteria should start a shopping session', () => {
          example('User submits shopping criteria for children')
            .when<EnterShoppingCriteria>({
              sessionId: 'shopper-123',
              criteria:
                'I need back-to-school items for my 7-year-old daughter who loves soccer and crafts, and my 12-year-old son who is into computers and Magic the Gathering.',
            })
            .then<ShoppingCriteriaEntered>({
              sessionId: 'shopper-123',
              criteria:
                'I need back-to-school items for my 7-year-old daughter who loves soccer and crafts, and my 12-year-old son who is into computers and Magic the Gathering.',
            });
        });
      });
    });
  react('creates a chat session').server(() => {
    specs('When shopping criteria are entered, request wishlist creation', () => {
      rule('Shopping criteria should trigger item suggestion', () => {
        example('Criteria entered triggers wishlist creation')
          .when<ShoppingCriteriaEntered>({
            sessionId: 'session-abc',
            criteria:
              'I need back-to-school items for my 7-year-old daughter who loves soccer and crafts, and my 12-year-old son who is into computers and Magic the Gathering.',
          })
          .then<SuggestShoppingItems>({
            sessionId: 'session-abc',
            prompt:
              'I need back-to-school items for my 7-year-old daughter who loves soccer and crafts, and my 12-year-old son who is into computers and Magic the Gathering.',
          });
      });
    });
  });
  command('selects items relevant to the shopping criteria').server(() => {
    data({
      items: [
        sink()
          .command('SuggestShoppingItems')
          .toIntegration(AI, 'DoChat', 'command')
          .withState(source().state('Products').fromIntegration(ProductCatalog))
          .additionalInstructions(
            'add the following to the DoChat: schemaName: Products, systemPrompt: use the PRODUCT_CATALOGUE_PRODUCTS MCP tool to get product data',
          ),
        sink().event('ShoppingItemsSuggested').toStream('shopping-session-\${sessionId}'),
      ],
    });
    specs('When chat is triggered, AI suggests items based on product catalog', () => {
      rule('AI should suggest relevant items from available products', () => {
        example('Product catalog with matching items generates suggestions')
          .given<Products>({
            products: [
              {
                productId: 'prod-soccer-ball',
                name: 'Super Soccer Ball',
                category: 'Sports',
                price: 10,
                tags: ['soccer', 'sports'],
                imageUrl: 'https://example.com/soccer-ball.jpg',
              },
              {
                productId: 'prod-craft-kit',
                name: 'Deluxe Craft Kit',
                category: 'Arts & Crafts',
                price: 25,
                tags: ['crafts', 'art', 'creative'],
                imageUrl: 'https://example.com/craft-kit.jpg',
              },
              {
                productId: 'prod-laptop-bag',
                name: 'Tech Laptop Backpack',
                category: 'School Supplies',
                price: 45,
                tags: ['computers', 'tech', 'school'],
                imageUrl: 'https://example.com/laptop-bag.jpg',
              },
              {
                productId: 'prod-mtg-starter',
                name: 'Magic the Gathering Starter Set',
                category: 'Games',
                price: 30,
                tags: ['magic', 'tcg', 'games'],
                imageUrl: 'https://example.com/mtg-starter.jpg',
              },
            ],
          })
          .when<SuggestShoppingItems>({
            sessionId: 'session-abc',
            prompt:
              'I need back-to-school items for my 7-year-old daughter who loves soccer and crafts, and my 12-year-old son who is into computers and Magic the Gathering.',
          })
          .then<ShoppingItemsSuggested>({
            sessionId: 'session-abc',
            suggestedItems: [
              {
                productId: 'prod-soccer-ball',
                name: 'Super Soccer Ball',
                quantity: 1,
                reason: 'Perfect for your daughter who loves soccer',
              },
              {
                productId: 'prod-craft-kit',
                name: 'Deluxe Craft Kit',
                quantity: 1,
                reason: 'Great for creative activities and crafts',
              },
              {
                productId: 'prod-laptop-bag',
                name: 'Tech Laptop Backpack',
                quantity: 1,
                reason: "Essential for your son's school computer needs",
              },
              {
                productId: 'prod-mtg-starter',
                name: 'Magic the Gathering Starter Set',
                quantity: 1,
                reason: 'Ideal starter set for Magic the Gathering enthusiasts',
              },
            ],
          });
      });
    });
  });
  query('views suggested items')
    .client(() => {
      describe('Suggested Items Screen', () => {
        it('display all suggested items with names and reasons');
        it('show quantity selectors for each item');
        it('have an "Add to Cart" button for selected items');
        it('allow removing items from the suggestions');
      });
    })
    .request(
      gql(\`query GetSuggestedItems($sessionId: ID!) {
  suggestedItems(sessionId: $sessionId) {
    items {
      productId
      name
      quantity
      reason
    }
  }
}\`),
    )
    .server(() => {
      data({ items: [source().state('SuggestedItems').fromProjection('SuggestedItemsProjection', 'sessionId')] });
      specs('Suggested items are available for viewing', () => {
        rule('Items should be available for viewing after suggestion', () => {
          example('Item becomes available after AI suggestion event')
            .when<ShoppingItemsSuggested>({
              sessionId: 'session-abc',
              suggestedItems: [
                {
                  productId: 'prod-soccer-ball',
                  name: 'Super Soccer Ball',
                  quantity: 1,
                  reason: 'Perfect for your daughter who loves soccer',
                },
                {
                  productId: 'prod-craft-kit',
                  name: 'Deluxe Craft Kit',
                  quantity: 1,
                  reason: 'Great for creative activities and crafts',
                },
                {
                  productId: 'prod-laptop-bag',
                  name: 'Tech Laptop Backpack',
                  quantity: 1,
                  reason: "Essential for your son's school computer needs",
                },
                {
                  productId: 'prod-mtg-starter',
                  name: 'Magic the Gathering Starter Set',
                  quantity: 1,
                  reason: 'Ideal starter set for Magic the Gathering enthusiasts',
                },
              ],
            })
            .then<SuggestedItems>({
              sessionId: 'session-abc',
              items: [
                {
                  productId: 'prod-soccer-ball',
                  name: 'Super Soccer Ball',
                  quantity: 1,
                  reason: 'Perfect for your daughter who loves soccer',
                },
                {
                  productId: 'prod-craft-kit',
                  name: 'Deluxe Craft Kit',
                  quantity: 1,
                  reason: 'Great for creative activities and crafts',
                },
                {
                  productId: 'prod-laptop-bag',
                  name: 'Tech Laptop Backpack',
                  quantity: 1,
                  reason: "Essential for your son's school computer needs",
                },
                {
                  productId: 'prod-mtg-starter',
                  name: 'Magic the Gathering Starter Set',
                  quantity: 1,
                  reason: 'Ideal starter set for Magic the Gathering enthusiasts',
                },
              ],
            });
        });
      });
    });
  command('accepts items and adds to their cart')
    .client(() => {
      describe('Suggested Items Screen', () => {
        it('allow selecting specific items to add');
        it('update quantities before adding to cart');
        it('provide feedback when items are added');
      });
    })
    .server(() => {
      data({ items: [sink().event('ItemsAddedToCart').toStream('shopping-session-\${sessionId}')] });
      specs('When shopper accepts items, they are added to cart', () => {
        rule('Accepted items should be added to the shopping cart', () => {
          example('User selects all suggested items for cart')
            .when<AddItemsToCart>({
              sessionId: 'session-abc',
              items: [
                { productId: 'prod-soccer-ball', quantity: 1 },
                { productId: 'prod-craft-kit', quantity: 1 },
                { productId: 'prod-laptop-bag', quantity: 1 },
                { productId: 'prod-mtg-starter', quantity: 1 },
              ],
            })
            .then<ItemsAddedToCart>({
              sessionId: 'session-abc',
              items: [
                { productId: 'prod-soccer-ball', quantity: 1 },
                { productId: 'prod-craft-kit', quantity: 1 },
                { productId: 'prod-laptop-bag', quantity: 1 },
                { productId: 'prod-mtg-starter', quantity: 1 },
              ],
            });
        });
      });
    });
});
`);
  });

  it('should handle experience slices in model to flow conversion', async () => {
    const experienceModel: Model = {
      variant: 'specs',
      narratives: [
        {
          name: 'Test Experience Flow',
          id: 'TEST-001',
          slices: [
            {
              name: 'Homepage',
              id: 'EXP-001',
              type: 'experience',
              client: {
                specs: [
                  { type: 'it', title: 'show a hero section with a welcome message' },
                  { type: 'it', title: 'allow user to start the questionnaire' },
                ],
              },
            },
          ],
        },
      ],
      messages: [],
      integrations: [],
      modules: [],
    };

    const code = getCode(await modelToNarrative(experienceModel));

    expect(code).toEqual(`import { experience, it, narrative } from '@auto-engineer/narrative';
narrative('Test Experience Flow', 'TEST-001', () => {
  experience('Homepage', 'EXP-001').client(() => {
    it('show a hero section with a welcome message');
    it('allow user to start the questionnaire');
  });
});
`);
  });

  it('should handle flows and slices without IDs', async () => {
    const modelWithoutIds: Model = {
      variant: 'specs',
      narratives: [
        {
          name: 'Test Flow without IDs',
          // id: undefined - no ID
          slices: [
            {
              name: 'Homepage',
              // id: undefined - no ID
              type: 'experience',
              client: {
                specs: [
                  {
                    type: 'describe',
                    title: 'Homepage specs',
                    children: [
                      { type: 'it', title: 'show welcome message' },
                      { type: 'it', title: 'display navigation' },
                    ],
                  },
                ],
              },
            },
          ],
        },
      ],
      messages: [],
      integrations: [],
      modules: [],
    };

    const code = getCode(await modelToNarrative(modelWithoutIds));

    expect(code).toEqual(`import { describe, experience, it, narrative } from '@auto-engineer/narrative';
narrative('Test Flow without IDs', () => {
  experience('Homepage').client(() => {
    describe('Homepage specs', () => {
      it('show welcome message');
      it('display navigation');
    });
  });
});
`);
  });

  it('should include flow and slice IDs in generated code', async () => {
    const modelWithIds: Model = {
      variant: 'specs',
      narratives: [
        {
          name: 'Test Flow with IDs',
          id: 'FLOW-123',
          slices: [
            {
              name: 'Homepage',
              id: 'SLICE-ABC',
              type: 'experience',
              client: {
                specs: [
                  {
                    type: 'describe',
                    title: 'Homepage specs',
                    children: [
                      { type: 'it', title: 'show welcome message' },
                      { type: 'it', title: 'display navigation' },
                    ],
                  },
                ],
              },
            },
            {
              name: 'view products',
              id: 'SLICE-XYZ',
              type: 'query',
              client: {
                specs: [
                  {
                    type: 'describe',
                    title: 'Product list specs',
                    children: [
                      { type: 'it', title: 'display all products' },
                      { type: 'it', title: 'allow filtering' },
                    ],
                  },
                ],
              },
              server: {
                description: 'Product query server',
                specs: [
                  {
                    type: 'gherkin',
                    feature: 'Product data specs',
                    rules: [],
                  },
                ],
              },
            },
          ],
        },
      ],
      messages: [],
      integrations: [],
      modules: [],
    };

    const code = getCode(await modelToNarrative(modelWithIds));

    expect(code).toEqual(`import { describe, experience, it, narrative, query, specs } from '@auto-engineer/narrative';
narrative('Test Flow with IDs', 'FLOW-123', () => {
  experience('Homepage', 'SLICE-ABC').client(() => {
    describe('Homepage specs', () => {
      it('show welcome message');
      it('display navigation');
    });
  });
  query('view products', 'SLICE-XYZ')
    .client(() => {
      describe('Product list specs', () => {
        it('display all products');
        it('allow filtering');
      });
    })
    .server(() => {
      specs('Product data specs', () => {});
    });
});
`);
  });

  it('should include rule IDs in server specs when present', async () => {
    const modelWithRuleIds: Model = {
      variant: 'specs',
      narratives: [
        {
          name: 'Test Flow with Rule IDs',
          id: 'FLOW-456',
          slices: [
            {
              name: 'process command',
              id: 'SLICE-789',
              type: 'command',
              client: {
                specs: [],
              },
              server: {
                description: 'Command processing server',
                specs: [
                  {
                    type: 'gherkin',
                    feature: 'Command Processing',
                    rules: [
                      {
                        id: 'RULE-ABC',
                        name: 'Valid commands should be processed',
                        examples: [
                          {
                            id: 'EX-001',
                            name: 'User submits valid command',
                            steps: [
                              {
                                keyword: 'When',
                                text: 'ProcessCommand',
                                docString: { id: 'cmd-123', action: 'create' },
                              },
                              {
                                keyword: 'Then',
                                text: 'CommandProcessed',
                                docString: { id: 'cmd-123', status: 'success' },
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
      ],
      messages: [
        {
          type: 'command',
          name: 'ProcessCommand',
          fields: [
            { name: 'id', type: 'string', required: true },
            { name: 'action', type: 'string', required: true },
          ],
          metadata: { version: 1 },
        },
        {
          type: 'event',
          name: 'CommandProcessed',
          fields: [
            { name: 'id', type: 'string', required: true },
            { name: 'status', type: 'string', required: true },
          ],
          source: 'external',
          metadata: { version: 1 },
        },
      ],
      integrations: [],
      modules: [],
    };

    const code = getCode(await modelToNarrative(modelWithRuleIds));

    expect(code).toEqual(`import { command, example, narrative, rule, specs } from '@auto-engineer/narrative';
import type { Command, Event } from '@auto-engineer/narrative';
type ProcessCommand = Command<
  'ProcessCommand',
  {
    id: string;
    action: string;
  }
>;
type CommandProcessed = Event<
  'CommandProcessed',
  {
    id: string;
    status: string;
  }
>;
narrative('Test Flow with Rule IDs', 'FLOW-456', () => {
  command('process command', 'SLICE-789').server(() => {
    specs('Command Processing', () => {
      rule('Valid commands should be processed', 'RULE-ABC', () => {
        example('User submits valid command')
          .when<ProcessCommand>({ id: 'cmd-123', action: 'create' })
          .then<CommandProcessed>({ id: 'cmd-123', status: 'success' });
      });
    });
  });
});
`);
  });

  it('should correctly resolve Date types in messages', async () => {
    const modelWithDateTypes: Model = {
      variant: 'specs',
      narratives: [
        {
          name: 'Questionnaire Flow',
          id: 'QUEST-001',
          slices: [],
        },
      ],
      messages: [
        {
          type: 'event',
          name: 'QuestionnaireLinkSent',
          fields: [
            { name: 'questionnaireId', type: 'string', required: true },
            { name: 'participantId', type: 'string', required: true },
            { name: 'link', type: 'string', required: true },
            { name: 'sentAt', type: 'Date', required: true },
          ],
          source: 'external',
          metadata: { version: 1 },
        },
        {
          type: 'event',
          name: 'QuestionAnswered',
          fields: [
            { name: 'questionnaireId', type: 'string', required: true },
            { name: 'participantId', type: 'string', required: true },
            { name: 'questionId', type: 'string', required: true },
            { name: 'answer', type: 'unknown', required: true },
            { name: 'savedAt', type: 'Date', required: true },
          ],
          source: 'external',
          metadata: { version: 1 },
        },
      ],
      integrations: [],
      modules: [],
    };

    const code = getCode(await modelToNarrative(modelWithDateTypes));

    expect(code).toEqual(`import { narrative } from '@auto-engineer/narrative';
import type { Event } from '@auto-engineer/narrative';
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
    answer: unknown;
    savedAt: Date;
  }
>;
narrative('Questionnaire Flow', 'QUEST-001', () => {});
`);
  });

  it('should generate browser-compatible imports without mixing values and types', async () => {
    const questionnairesModel: Model = {
      variant: 'specs',
      narratives: [
        {
          name: 'Questionnaires',
          id: 'Q9m2Kp4Lx',
          slices: [
            {
              name: 'Homepage',
              id: 'H1a4Bn6Cy',
              type: 'experience',
              client: {
                specs: [
                  { type: 'it', title: 'show a hero section with a welcome message' },
                  { type: 'it', title: 'allow user to start the questionnaire' },
                ],
              },
            },
            {
              name: 'views the questionnaire',
              id: 'V7n8Rq5M',
              type: 'query',
              client: {
                specs: [
                  {
                    type: 'describe',
                    title: 'Questionnaire Progress',
                    children: [
                      { type: 'it', title: 'focus on the current question based on the progress state' },
                      { type: 'it', title: 'display the list of answered questions' },
                      { type: 'it', title: 'display the list of remaining questions' },
                      { type: 'it', title: 'show a progress indicator that is always visible as the user scrolls' },
                    ],
                  },
                ],
              },
              request:
                'query QuestionnaireProgress($participantId: ID!) {\n  questionnaireProgress(participantId: $participantId) {\n    questionnaireId\n    participantId\n    currentQuestionId\n    remainingQuestions\n    status\n    answers {\n      questionId\n      value\n    }\n  }\n}',
              server: {
                description: '',
                data: {
                  items: [
                    {
                      target: {
                        type: 'State',
                        name: 'QuestionnaireProgress',
                      },
                      origin: {
                        type: 'projection',
                        name: 'Questionnaires',
                        idField: 'questionnaire-participantId',
                      },
                    },
                  ],
                },
                specs: [
                  {
                    type: 'gherkin',
                    feature: '',
                    rules: [
                      {
                        id: 'r1A3Bp9W',
                        name: 'questionnaires show current progress',
                        examples: [
                          {
                            id: 'EX-001',
                            name: 'a question has already been answered',
                            steps: [
                              {
                                keyword: 'Given',
                                text: 'QuestionnaireLinkSent',
                                docString: {
                                  questionnaireId: 'q-001',
                                  participantId: 'participant-abc',
                                  link: 'https://app.example.com/q/q-001?participant=participant-abc',
                                  sentAt: new Date('2030-01-01T09:00:00.000Z'),
                                },
                              },
                              {
                                keyword: 'When',
                                text: 'QuestionAnswered',
                                docString: {
                                  questionnaireId: 'q-001',
                                  participantId: 'participant-abc',
                                  questionId: 'q1',
                                  answer: 'Yes',
                                  savedAt: new Date('2030-01-01T09:05:00.000Z'),
                                },
                              },
                              {
                                keyword: 'Then',
                                text: 'QuestionnaireProgress',
                                docString: {
                                  questionnaireId: 'q-001',
                                  participantId: 'participant-abc',
                                  status: 'in_progress',
                                  currentQuestionId: 'q2',
                                  remainingQuestions: ['q2', 'q3'],
                                  answers: [
                                    {
                                      questionId: 'q1',
                                      value: 'Yes',
                                    },
                                  ],
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
      ],
      messages: [
        {
          type: 'event',
          name: 'QuestionnaireLinkSent',
          fields: [
            {
              name: 'questionnaireId',
              type: 'string',
              required: true,
            },
            {
              name: 'participantId',
              type: 'string',
              required: true,
            },
            {
              name: 'link',
              type: 'string',
              required: true,
            },
            {
              name: 'sentAt',
              type: 'Date',
              required: true,
            },
          ],
          source: 'internal',
          metadata: {
            version: 1,
          },
        },
        {
          type: 'event',
          name: 'QuestionAnswered',
          fields: [
            {
              name: 'questionnaireId',
              type: 'string',
              required: true,
            },
            {
              name: 'participantId',
              type: 'string',
              required: true,
            },
            {
              name: 'questionId',
              type: 'string',
              required: true,
            },
            {
              name: 'answer',
              type: 'unknown',
              required: true,
            },
            {
              name: 'savedAt',
              type: 'Date',
              required: true,
            },
          ],
          source: 'internal',
          metadata: {
            version: 1,
          },
        },
        {
          type: 'state',
          name: 'QuestionnaireProgress',
          fields: [
            {
              name: 'questionnaireId',
              type: 'string',
              required: true,
            },
            {
              name: 'participantId',
              type: 'string',
              required: true,
            },
            {
              name: 'status',
              type: '"in_progress" | "ready_to_submit" | "submitted"',
              required: true,
            },
            {
              name: 'currentQuestionId',
              type: 'string | null',
              required: true,
            },
            {
              name: 'remainingQuestions',
              type: 'Array<string>',
              required: true,
            },
            {
              name: 'answers',
              type: 'Array<{ questionId: string; value: unknown }>',
              required: true,
            },
          ],
          metadata: {
            version: 1,
          },
        },
      ],
      integrations: [],
      modules: [],
    };

    const code = getCode(await modelToNarrative(questionnairesModel));

    expect(code).toEqual(`import {
  data,
  describe,
  example,
  experience,
  gql,
  it,
  narrative,
  query,
  rule,
  source,
  specs,
} from '@auto-engineer/narrative';
import type { Event, State } from '@auto-engineer/narrative';
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
    answer: unknown;
    savedAt: Date;
  }
>;
type QuestionnaireProgress = State<
  'QuestionnaireProgress',
  {
    questionnaireId: string;
    participantId: string;
    status: 'in_progress' | 'ready_to_submit' | 'submitted';
    currentQuestionId: string | null;
    remainingQuestions: string[];
    answers: {
      questionId: string;
      value: unknown;
    }[];
  }
>;
narrative('Questionnaires', 'Q9m2Kp4Lx', () => {
  experience('Homepage', 'H1a4Bn6Cy').client(() => {
    it('show a hero section with a welcome message');
    it('allow user to start the questionnaire');
  });
  query('views the questionnaire', 'V7n8Rq5M')
    .client(() => {
      describe('Questionnaire Progress', () => {
        it('focus on the current question based on the progress state');
        it('display the list of answered questions');
        it('display the list of remaining questions');
        it('show a progress indicator that is always visible as the user scrolls');
      });
    })
    .request(
      gql(\`query QuestionnaireProgress($participantId: ID!) {
  questionnaireProgress(participantId: $participantId) {
    questionnaireId
    participantId
    currentQuestionId
    remainingQuestions
    status
    answers {
      questionId
      value
    }
  }
}\`),
    )
    .server(() => {
      data({
        items: [
          source().state('QuestionnaireProgress').fromProjection('Questionnaires', 'questionnaire-participantId'),
        ],
      });
      specs(() => {
        rule('questionnaires show current progress', 'r1A3Bp9W', () => {
          example('a question has already been answered')
            .given<QuestionnaireLinkSent>({
              questionnaireId: 'q-001',
              participantId: 'participant-abc',
              link: 'https://app.example.com/q/q-001?participant=participant-abc',
              sentAt: new Date('2030-01-01T09:00:00.000Z'),
            })
            .when<QuestionAnswered>({
              questionnaireId: 'q-001',
              participantId: 'participant-abc',
              questionId: 'q1',
              answer: 'Yes',
              savedAt: new Date('2030-01-01T09:05:00.000Z'),
            })
            .then<QuestionnaireProgress>({
              questionnaireId: 'q-001',
              participantId: 'participant-abc',
              status: 'in_progress',
              currentQuestionId: 'q2',
              remainingQuestions: ['q2', 'q3'],
              answers: [{ questionId: 'q1', value: 'Yes' }],
            });
        });
      });
    });
});
`);
  });

  it('should consolidate duplicate rules with multiple examples into single rule blocks', async () => {
    const modelWithDuplicateRules: Model = {
      variant: 'specs',
      narratives: [
        {
          name: 'Test Flow',
          id: 'TEST-FLOW',
          slices: [
            {
              name: 'test slice',
              id: 'TEST-SLICE',
              type: 'query',
              client: {
                specs: [],
              },
              server: {
                description: 'Test server for duplicate rules',
                specs: [
                  {
                    type: 'gherkin',
                    feature: 'Test Rules',
                    rules: [
                      {
                        id: 'r1A3Bp9W',
                        name: 'questionnaires show current progress',
                        examples: [
                          {
                            id: 'EX-001',
                            name: 'a question has already been answered',
                            steps: [
                              {
                                keyword: 'Given',
                                text: 'QuestionnaireLinkSent',
                                docString: {
                                  questionnaireId: 'q-001',
                                  participantId: 'participant-abc',
                                },
                              },
                              {
                                keyword: 'When',
                                text: 'QuestionAnswered',
                                docString: {
                                  questionnaireId: 'q-001',
                                  questionId: 'q1',
                                  answer: 'Yes',
                                },
                              },
                              {
                                keyword: 'Then',
                                text: 'QuestionnaireProgress',
                                docString: {
                                  questionnaireId: 'q-001',
                                  status: 'in_progress',
                                },
                              },
                            ],
                          },
                          {
                            id: 'EX-002',
                            name: 'no questions have been answered yet',
                            steps: [
                              {
                                keyword: 'Given',
                                text: 'QuestionnaireLinkSent',
                                docString: {
                                  questionnaireId: 'q-001',
                                  participantId: 'participant-abc',
                                },
                              },
                              {
                                keyword: 'When',
                                text: 'QuestionnaireLinkSent',
                                docString: {},
                              },
                              {
                                keyword: 'Then',
                                text: 'QuestionnaireProgress',
                                docString: {
                                  questionnaireId: 'q-001',
                                  status: 'in_progress',
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
      ],
      messages: [
        {
          type: 'event',
          name: 'QuestionnaireLinkSent',
          fields: [
            { name: 'questionnaireId', type: 'string', required: true },
            { name: 'participantId', type: 'string', required: true },
          ],
          source: 'internal',
          metadata: { version: 1 },
        },
        {
          type: 'event',
          name: 'QuestionAnswered',
          fields: [
            { name: 'questionnaireId', type: 'string', required: true },
            { name: 'questionId', type: 'string', required: true },
            { name: 'answer', type: 'unknown', required: true },
          ],
          source: 'internal',
          metadata: { version: 1 },
        },
        {
          type: 'state',
          name: 'QuestionnaireProgress',
          fields: [
            { name: 'questionnaireId', type: 'string', required: true },
            { name: 'status', type: 'string', required: true },
          ],
          metadata: { version: 1 },
        },
      ],
      integrations: [],
      modules: [],
    };

    const code = getCode(await modelToNarrative(modelWithDuplicateRules));

    expect(code).toEqual(`import { example, narrative, query, rule, specs } from '@auto-engineer/narrative';
import type { Event, State } from '@auto-engineer/narrative';
type QuestionnaireLinkSent = Event<
  'QuestionnaireLinkSent',
  {
    questionnaireId: string;
    participantId: string;
  }
>;
type QuestionAnswered = Event<
  'QuestionAnswered',
  {
    questionnaireId: string;
    questionId: string;
    answer: unknown;
  }
>;
type QuestionnaireProgress = State<
  'QuestionnaireProgress',
  {
    questionnaireId: string;
    status: string;
  }
>;
narrative('Test Flow', 'TEST-FLOW', () => {
  query('test slice', 'TEST-SLICE').server(() => {
    specs('Test Rules', () => {
      rule('questionnaires show current progress', 'r1A3Bp9W', () => {
        example('a question has already been answered')
          .given<QuestionnaireLinkSent>({ questionnaireId: 'q-001', participantId: 'participant-abc' })
          .when<QuestionAnswered>({ questionnaireId: 'q-001', questionId: 'q1', answer: 'Yes' })
          .then<QuestionnaireProgress>({ questionnaireId: 'q-001', status: 'in_progress' });
        example('no questions have been answered yet')
          .given<QuestionnaireLinkSent>({ questionnaireId: 'q-001', participantId: 'participant-abc' })
          .then<QuestionnaireProgress>({ questionnaireId: 'q-001', status: 'in_progress' });
      });
    });
  });
});
`);
  });

  it('should chain multiple given examples with and() syntax', async () => {
    const modelWithMultiGiven: Model = {
      variant: 'specs',
      narratives: [
        {
          name: 'Multi Given Flow',
          id: 'MULTI-GIVEN',
          slices: [
            {
              name: 'multi given slice',
              id: 'MULTI-SLICE',
              type: 'query',
              client: {
                specs: [],
              },
              server: {
                description: 'Multi given server rules',
                specs: [
                  {
                    type: 'gherkin',
                    feature: 'Multi Given Rules',
                    rules: [
                      {
                        id: 'MultiGiven',
                        name: 'all questions have been answered',
                        examples: [
                          {
                            id: 'EX-001',
                            name: 'questionnaire with multiple events',
                            steps: [
                              {
                                keyword: 'Given',
                                text: 'QuestionnaireConfig',
                                docString: {
                                  questionnaireId: 'q-001',
                                  numberOfQuestions: 3,
                                },
                              },
                              {
                                keyword: 'And',
                                text: 'QuestionnaireLinkSent',
                                docString: {
                                  questionnaireId: 'q-001',
                                  participantId: 'participant-abc',
                                  link: 'https://example.com/q/q-001',
                                  sentAt: new Date('2030-01-01T09:00:00.000Z'),
                                },
                              },
                              {
                                keyword: 'And',
                                text: 'QuestionAnswered',
                                docString: {
                                  questionnaireId: 'q-001',
                                  participantId: 'participant-abc',
                                  questionId: 'q1',
                                  answer: 'Yes',
                                  savedAt: new Date('2030-01-01T09:05:00.000Z'),
                                },
                              },
                              {
                                keyword: 'And',
                                text: 'QuestionAnswered',
                                docString: {
                                  questionnaireId: 'q-001',
                                  participantId: 'participant-abc',
                                  questionId: 'q2',
                                  answer: 'No',
                                  savedAt: new Date('2030-01-01T09:10:00.000Z'),
                                },
                              },
                              {
                                keyword: 'When',
                                text: 'QuestionAnswered',
                                docString: {
                                  questionnaireId: 'q-001',
                                  participantId: 'participant-abc',
                                  questionId: 'q3',
                                  answer: 'Maybe',
                                  savedAt: new Date('2030-01-01T09:15:00.000Z'),
                                },
                              },
                              {
                                keyword: 'Then',
                                text: 'QuestionnaireProgress',
                                docString: {
                                  questionnaireId: 'q-001',
                                  participantId: 'participant-abc',
                                  status: 'ready_to_submit',
                                  currentQuestionId: null,
                                  remainingQuestions: [],
                                  answers: [
                                    { questionId: 'q1', value: 'Yes' },
                                    { questionId: 'q2', value: 'No' },
                                  ],
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
      ],
      messages: [
        {
          type: 'state',
          name: 'QuestionnaireConfig',
          fields: [
            { name: 'questionnaireId', type: 'string', required: true },
            { name: 'numberOfQuestions', type: 'number', required: true },
          ],
          metadata: { version: 1 },
        },
        {
          type: 'event',
          name: 'QuestionnaireLinkSent',
          fields: [
            { name: 'questionnaireId', type: 'string', required: true },
            { name: 'participantId', type: 'string', required: true },
            { name: 'link', type: 'string', required: true },
            { name: 'sentAt', type: 'Date', required: true },
          ],
          source: 'internal',
          metadata: { version: 1 },
        },
        {
          type: 'event',
          name: 'QuestionAnswered',
          fields: [
            { name: 'questionnaireId', type: 'string', required: true },
            { name: 'participantId', type: 'string', required: true },
            { name: 'questionId', type: 'string', required: true },
            { name: 'answer', type: 'unknown', required: true },
            { name: 'savedAt', type: 'Date', required: true },
          ],
          source: 'internal',
          metadata: { version: 1 },
        },
        {
          type: 'state',
          name: 'QuestionnaireProgress',
          fields: [
            { name: 'questionnaireId', type: 'string', required: true },
            { name: 'participantId', type: 'string', required: true },
            { name: 'status', type: '"in_progress" | "ready_to_submit" | "submitted"', required: true },
            { name: 'currentQuestionId', type: 'string | null', required: true },
            { name: 'remainingQuestions', type: 'Array<string>', required: true },
            { name: 'answers', type: 'Array<{ questionId: string; value: unknown }>', required: true },
          ],
          metadata: { version: 1 },
        },
      ],
      integrations: [],
      modules: [],
    };

    const code = getCode(await modelToNarrative(modelWithMultiGiven));

    expect(code).toEqual(`import { example, narrative, query, rule, specs } from '@auto-engineer/narrative';
import type { Event, State } from '@auto-engineer/narrative';
type QuestionnaireConfig = State<
  'QuestionnaireConfig',
  {
    questionnaireId: string;
    numberOfQuestions: number;
  }
>;
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
    answer: unknown;
    savedAt: Date;
  }
>;
type QuestionnaireProgress = State<
  'QuestionnaireProgress',
  {
    questionnaireId: string;
    participantId: string;
    status: 'in_progress' | 'ready_to_submit' | 'submitted';
    currentQuestionId: string | null;
    remainingQuestions: string[];
    answers: {
      questionId: string;
      value: unknown;
    }[];
  }
>;
narrative('Multi Given Flow', 'MULTI-GIVEN', () => {
  query('multi given slice', 'MULTI-SLICE').server(() => {
    specs('Multi Given Rules', () => {
      rule('all questions have been answered', 'MultiGiven', () => {
        example('questionnaire with multiple events')
          .given<QuestionnaireConfig>({ questionnaireId: 'q-001', numberOfQuestions: 3 })
          .and<QuestionnaireLinkSent>({
            questionnaireId: 'q-001',
            participantId: 'participant-abc',
            link: 'https://example.com/q/q-001',
            sentAt: new Date('2030-01-01T09:00:00.000Z'),
          })
          .and<QuestionAnswered>({
            questionnaireId: 'q-001',
            participantId: 'participant-abc',
            questionId: 'q1',
            answer: 'Yes',
            savedAt: new Date('2030-01-01T09:05:00.000Z'),
          })
          .and<QuestionAnswered>({
            questionnaireId: 'q-001',
            participantId: 'participant-abc',
            questionId: 'q2',
            answer: 'No',
            savedAt: new Date('2030-01-01T09:10:00.000Z'),
          })
          .when<QuestionAnswered>({
            questionnaireId: 'q-001',
            participantId: 'participant-abc',
            questionId: 'q3',
            answer: 'Maybe',
            savedAt: new Date('2030-01-01T09:15:00.000Z'),
          })
          .then<QuestionnaireProgress>({
            questionnaireId: 'q-001',
            participantId: 'participant-abc',
            status: 'ready_to_submit',
            currentQuestionId: null,
            remainingQuestions: [],
            answers: [
              { questionId: 'q1', value: 'Yes' },
              { questionId: 'q2', value: 'No' },
            ],
          });
      });
    });
  });
});
`);
  });

  it('should generate types for states referenced in data origins', async () => {
    const modelWithReferencedStates: Model = {
      variant: 'specs',
      narratives: [
        {
          name: 'Referenced States Flow',
          id: 'REF-STATES',
          slices: [
            {
              name: 'query with database states',
              id: 'REF-SLICE',
              type: 'query',
              client: {
                specs: [],
              },
              server: {
                description: 'Server for referenced states',
                data: {
                  items: [
                    {
                      target: {
                        type: 'State',
                        name: 'QuestionnaireProgress',
                      },
                      origin: {
                        type: 'projection',
                        name: 'QuestionnaireProjection',
                        idField: 'participantId',
                      },
                    },
                    {
                      target: {
                        type: 'State',
                        name: 'QuestionnaireConfig',
                      },
                      origin: {
                        type: 'database',
                        collection: 'ConfigStore',
                        query: { questionnaireId: '$questionnaireId' },
                      },
                    },
                  ],
                },
                specs: [
                  {
                    type: 'gherkin',
                    feature: 'Database State Rules',
                    rules: [
                      {
                        id: 'RefState',
                        name: 'questionnaire config is available when referenced',
                        examples: [
                          {
                            id: 'EX-001',
                            name: 'config from database is accessible',
                            steps: [
                              {
                                keyword: 'Given',
                                text: 'QuestionnaireConfig',
                                docString: {
                                  questionnaireId: 'q-001',
                                  numberOfQuestions: 5,
                                  title: 'Customer Satisfaction Survey',
                                },
                              },
                              {
                                keyword: 'When',
                                text: 'QuestionnaireProgress',
                                docString: {},
                              },
                              {
                                keyword: 'Then',
                                text: 'QuestionnaireProgress',
                                docString: {
                                  questionnaireId: 'q-001',
                                  participantId: 'participant-abc',
                                  status: 'in_progress',
                                  totalQuestions: 5,
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
      ],
      messages: [
        {
          type: 'state',
          name: 'QuestionnaireProgress',
          fields: [
            { name: 'questionnaireId', type: 'string', required: true },
            { name: 'participantId', type: 'string', required: true },
            { name: 'status', type: 'string', required: true },
            { name: 'totalQuestions', type: 'number', required: true },
          ],
          metadata: { version: 1 },
        },
        {
          type: 'state',
          name: 'QuestionnaireConfig',
          fields: [
            { name: 'questionnaireId', type: 'string', required: true },
            { name: 'numberOfQuestions', type: 'number', required: true },
            { name: 'title', type: 'string', required: true },
          ],
          metadata: { version: 1 },
        },
      ],
      integrations: [],
      modules: [],
    };

    const code = getCode(await modelToNarrative(modelWithReferencedStates));

    expect(
      code,
    ).toEqual(`import { data, example, narrative, query, rule, source, specs } from '@auto-engineer/narrative';
import type { State } from '@auto-engineer/narrative';
type QuestionnaireProgress = State<
  'QuestionnaireProgress',
  {
    questionnaireId: string;
    participantId: string;
    status: string;
    totalQuestions: number;
  }
>;
type QuestionnaireConfig = State<
  'QuestionnaireConfig',
  {
    questionnaireId: string;
    numberOfQuestions: number;
    title: string;
  }
>;
narrative('Referenced States Flow', 'REF-STATES', () => {
  query('query with database states', 'REF-SLICE').server(() => {
    data({
      items: [
        source().state('QuestionnaireProgress').fromProjection('QuestionnaireProjection', 'participantId'),
        source().state('QuestionnaireConfig').fromDatabase('ConfigStore', { questionnaireId: '$questionnaireId' }),
      ],
    });
    specs('Database State Rules', () => {
      rule('questionnaire config is available when referenced', 'RefState', () => {
        example('config from database is accessible')
          .given<QuestionnaireConfig>({
            questionnaireId: 'q-001',
            numberOfQuestions: 5,
            title: 'Customer Satisfaction Survey',
          })
          .then<QuestionnaireProgress>({
            questionnaireId: 'q-001',
            participantId: 'participant-abc',
            status: 'in_progress',
            totalQuestions: 5,
          });
      });
    });
  });
});
`);
  });

  it('should generate new Date() constructors for Date fields', async () => {
    const modelWithDateFields: Model = {
      variant: 'specs',
      narratives: [
        {
          name: 'Date Handling Flow',
          id: 'DATE-FLOW',
          slices: [
            {
              name: 'date handling slice',
              id: 'DATE-SLICE',
              type: 'query',
              client: {
                specs: [],
              },
              server: {
                description: 'Date server with Date fields',
                specs: [
                  {
                    type: 'gherkin',
                    feature: 'Date Field Rules',
                    rules: [
                      {
                        id: 'DateRule',
                        name: 'handles Date fields correctly',
                        examples: [
                          {
                            id: 'EX-001',
                            name: 'event with Date fields',
                            steps: [
                              {
                                keyword: 'Given',
                                text: 'TimestampedEvent',
                                docString: {
                                  id: 'event-123',
                                  sentAt: new Date('2030-01-01T09:00:00.000Z'),
                                  savedAt: new Date('2030-01-01T09:05:00.000Z'),
                                  attemptedAt: '2030-01-01T09:10:00.000Z',
                                  submittedAt: '2030-01-01T09:15:00.000Z',
                                },
                              },
                              {
                                keyword: 'When',
                                text: 'ProcessEvent',
                                docString: {
                                  processedAt: '2030-01-01T10:00:00.000Z',
                                },
                              },
                              {
                                keyword: 'Then',
                                text: 'ProcessState',
                                docString: {
                                  id: 'state-123',
                                  completedAt: '2030-01-01T11:00:00.000Z',
                                  status: 'completed',
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
      ],
      messages: [
        {
          type: 'event',
          name: 'TimestampedEvent',
          fields: [
            { name: 'id', type: 'string', required: true },
            { name: 'sentAt', type: 'Date', required: true },
            { name: 'savedAt', type: 'Date', required: true },
            { name: 'attemptedAt', type: 'Date', required: true },
            { name: 'submittedAt', type: 'Date', required: true },
          ],
          source: 'internal',
          metadata: { version: 1 },
        },
        {
          type: 'event',
          name: 'ProcessEvent',
          fields: [{ name: 'processedAt', type: 'Date', required: true }],
          source: 'internal',
          metadata: { version: 1 },
        },
        {
          type: 'state',
          name: 'ProcessState',
          fields: [
            { name: 'id', type: 'string', required: true },
            { name: 'completedAt', type: 'Date', required: true },
            { name: 'status', type: 'string', required: true },
          ],
          metadata: { version: 1 },
        },
      ],
      integrations: [],
      modules: [],
    };

    const code = getCode(await modelToNarrative(modelWithDateFields));

    expect(code).toEqual(`import { example, narrative, query, rule, specs } from '@auto-engineer/narrative';
import type { Event, State } from '@auto-engineer/narrative';
type TimestampedEvent = Event<
  'TimestampedEvent',
  {
    id: string;
    sentAt: Date;
    savedAt: Date;
    attemptedAt: Date;
    submittedAt: Date;
  }
>;
type ProcessEvent = Event<
  'ProcessEvent',
  {
    processedAt: Date;
  }
>;
type ProcessState = State<
  'ProcessState',
  {
    id: string;
    completedAt: Date;
    status: string;
  }
>;
narrative('Date Handling Flow', 'DATE-FLOW', () => {
  query('date handling slice', 'DATE-SLICE').server(() => {
    specs('Date Field Rules', () => {
      rule('handles Date fields correctly', 'DateRule', () => {
        example('event with Date fields')
          .given<TimestampedEvent>({
            id: 'event-123',
            sentAt: new Date('2030-01-01T09:00:00.000Z'),
            savedAt: new Date('2030-01-01T09:05:00.000Z'),
            attemptedAt: new Date('2030-01-01T09:10:00.000Z'),
            submittedAt: new Date('2030-01-01T09:15:00.000Z'),
          })
          .when<ProcessEvent>({ processedAt: new Date('2030-01-01T10:00:00.000Z') })
          .then<ProcessState>({
            id: 'state-123',
            completedAt: new Date('2030-01-01T11:00:00.000Z'),
            status: 'completed',
          });
      });
    });
  });
});
`);
  });

  it('should generate multiple flows when multiple flows have the same sourceFile', async () => {
    const modelWithMultipleFlowsSameSource: Model = {
      variant: 'specs',
      narratives: [
        {
          name: 'Home Screen',
          sourceFile: '/path/to/homepage.narrative.ts',
          slices: [
            {
              name: 'Active Surveys Summary',
              id: 'aifPcU3hw',
              type: 'experience',
              client: {
                specs: [{ type: 'it', title: 'show active surveys summary' }],
              },
            },
          ],
        },
        {
          name: 'Create Survey',
          sourceFile: '/path/to/homepage.narrative.ts',
          slices: [
            {
              name: 'Create Survey Form',
              id: 'MPviTMrQC',
              type: 'experience',
              client: {
                specs: [{ type: 'it', title: 'allow entering survey title' }],
              },
            },
          ],
        },
        {
          name: 'Response Analytics',
          sourceFile: '/path/to/homepage.narrative.ts',
          slices: [
            {
              name: 'Response Rate Charts',
              id: 'eME978Euk',
              type: 'experience',
              client: {
                specs: [{ type: 'it', title: 'show daily response rate charts' }],
              },
            },
          ],
        },
      ],
      messages: [],
      integrations: [],
      modules: [],
    };

    const code = getCode(await modelToNarrative(modelWithMultipleFlowsSameSource));

    expect(code).toEqual(`import { experience, it, narrative } from '@auto-engineer/narrative';
narrative('Home Screen', () => {
  experience('Active Surveys Summary', 'aifPcU3hw').client(() => {
    it('show active surveys summary');
  });
});
narrative('Create Survey', () => {
  experience('Create Survey Form', 'MPviTMrQC').client(() => {
    it('allow entering survey title');
  });
});
narrative('Response Analytics', () => {
  experience('Response Rate Charts', 'eME978Euk').client(() => {
    it('show daily response rate charts');
  });
});
`);
  });

  it('should omit .when({}) when given has multiple items and when is empty', async () => {
    const modelWithEmptyWhen: Model = {
      variant: 'specs',
      narratives: [
        {
          name: 'Todo List Summary',
          id: 'TODO-001',
          slices: [
            {
              name: 'views completion summary',
              id: 'SUMMARY-001',
              type: 'query',
              client: {
                specs: [],
              },
              server: {
                description: 'Summary calculation server',
                specs: [
                  {
                    type: 'gherkin',
                    feature: 'Summary Statistics',
                    rules: [
                      {
                        id: 'RULE-SUMMARY',
                        name: 'summary shows overall todo list statistics',
                        examples: [
                          {
                            id: 'EX-001',
                            name: 'calculates summary from multiple todos',
                            steps: [
                              {
                                keyword: 'Given',
                                text: 'TodoAdded',
                                docString: {
                                  todoId: 'todo-001',
                                  description: 'Buy groceries',
                                  status: 'pending',
                                  addedAt: new Date('2030-01-01T09:00:00.000Z'),
                                },
                              },
                              {
                                keyword: 'And',
                                text: 'TodoAdded',
                                docString: {
                                  todoId: 'todo-002',
                                  description: 'Write report',
                                  status: 'pending',
                                  addedAt: new Date('2030-01-01T09:10:00.000Z'),
                                },
                              },
                              {
                                keyword: 'And',
                                text: 'TodoMarkedInProgress',
                                docString: {
                                  todoId: 'todo-001',
                                  markedAt: new Date('2030-01-01T10:00:00.000Z'),
                                },
                              },
                              {
                                keyword: 'And',
                                text: 'TodoMarkedComplete',
                                docString: {
                                  todoId: 'todo-002',
                                  completedAt: new Date('2030-01-01T11:00:00.000Z'),
                                },
                              },
                              {
                                keyword: 'Then',
                                text: 'TodoListSummary',
                                docString: {
                                  summaryId: 'main-summary',
                                  totalTodos: 2,
                                  pendingCount: 0,
                                  inProgressCount: 1,
                                  completedCount: 1,
                                  completionPercentage: 50,
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
      ],
      messages: [
        {
          type: 'event',
          name: 'TodoAdded',
          fields: [
            { name: 'todoId', type: 'string', required: true },
            { name: 'description', type: 'string', required: true },
            { name: 'status', type: 'string', required: true },
            { name: 'addedAt', type: 'Date', required: true },
          ],
          source: 'internal',
          metadata: { version: 1 },
        },
        {
          type: 'event',
          name: 'TodoMarkedInProgress',
          fields: [
            { name: 'todoId', type: 'string', required: true },
            { name: 'markedAt', type: 'Date', required: true },
          ],
          source: 'internal',
          metadata: { version: 1 },
        },
        {
          type: 'event',
          name: 'TodoMarkedComplete',
          fields: [
            { name: 'todoId', type: 'string', required: true },
            { name: 'completedAt', type: 'Date', required: true },
          ],
          source: 'internal',
          metadata: { version: 1 },
        },
        {
          type: 'state',
          name: 'TodoListSummary',
          fields: [
            { name: 'summaryId', type: 'string', required: true },
            { name: 'totalTodos', type: 'number', required: true },
            { name: 'pendingCount', type: 'number', required: true },
            { name: 'inProgressCount', type: 'number', required: true },
            { name: 'completedCount', type: 'number', required: true },
            { name: 'completionPercentage', type: 'number', required: true },
          ],
          metadata: { version: 1 },
        },
      ],
      integrations: [],
      modules: [],
    };

    const code = getCode(await modelToNarrative(modelWithEmptyWhen));

    expect(code).toEqual(`import { example, narrative, query, rule, specs } from '@auto-engineer/narrative';
import type { Event, State } from '@auto-engineer/narrative';
type TodoAdded = Event<
  'TodoAdded',
  {
    todoId: string;
    description: string;
    status: string;
    addedAt: Date;
  }
>;
type TodoMarkedInProgress = Event<
  'TodoMarkedInProgress',
  {
    todoId: string;
    markedAt: Date;
  }
>;
type TodoMarkedComplete = Event<
  'TodoMarkedComplete',
  {
    todoId: string;
    completedAt: Date;
  }
>;
type TodoListSummary = State<
  'TodoListSummary',
  {
    summaryId: string;
    totalTodos: number;
    pendingCount: number;
    inProgressCount: number;
    completedCount: number;
    completionPercentage: number;
  }
>;
narrative('Todo List Summary', 'TODO-001', () => {
  query('views completion summary', 'SUMMARY-001').server(() => {
    specs('Summary Statistics', () => {
      rule('summary shows overall todo list statistics', 'RULE-SUMMARY', () => {
        example('calculates summary from multiple todos')
          .given<TodoAdded>({
            todoId: 'todo-001',
            description: 'Buy groceries',
            status: 'pending',
            addedAt: new Date('2030-01-01T09:00:00.000Z'),
          })
          .and<TodoAdded>({
            todoId: 'todo-002',
            description: 'Write report',
            status: 'pending',
            addedAt: new Date('2030-01-01T09:10:00.000Z'),
          })
          .and<TodoMarkedInProgress>({ todoId: 'todo-001', markedAt: new Date('2030-01-01T10:00:00.000Z') })
          .and<TodoMarkedComplete>({ todoId: 'todo-002', completedAt: new Date('2030-01-01T11:00:00.000Z') })
          .then<TodoListSummary>({
            summaryId: 'main-summary',
            totalTodos: 2,
            pendingCount: 0,
            inProgressCount: 1,
            completedCount: 1,
            completionPercentage: 50,
          });
      });
    });
  });
});
`);

    expect(code).not.toContain('when({})');
    expect(code).not.toContain('when<');
  });

  describe('projection DSL generation', () => {
    it('should generate fromSingletonProjection for singleton projections', async () => {
      const modelWithSingletonProjection: Model = {
        variant: 'specs',
        narratives: [
          {
            name: 'Todo Summary Flow',
            id: 'TODO-SUMMARY',
            slices: [
              {
                name: 'views todo summary',
                id: 'SUMMARY-SLICE',
                type: 'query',
                client: {
                  specs: [],
                },
                server: {
                  description: 'Summary server',
                  data: {
                    items: [
                      {
                        target: {
                          type: 'State',
                          name: 'TodoListSummary',
                        },
                        origin: {
                          type: 'projection',
                          name: 'TodoSummary',
                          singleton: true,
                        },
                      },
                    ],
                  },
                  specs: [
                    {
                      type: 'gherkin',
                      feature: 'Summary Rules',
                      rules: [],
                    },
                  ],
                },
              },
            ],
          },
        ],
        messages: [
          {
            type: 'state',
            name: 'TodoListSummary',
            fields: [
              { name: 'summaryId', type: 'string', required: true },
              { name: 'totalTodos', type: 'number', required: true },
            ],
            metadata: { version: 1 },
          },
        ],
        integrations: [],
        modules: [],
      };

      const code = getCode(await modelToNarrative(modelWithSingletonProjection));

      expect(code).toEqual(`import { data, narrative, query, source, specs } from '@auto-engineer/narrative';
import type { State } from '@auto-engineer/narrative';
type TodoListSummary = State<
  'TodoListSummary',
  {
    summaryId: string;
    totalTodos: number;
  }
>;
narrative('Todo Summary Flow', 'TODO-SUMMARY', () => {
  query('views todo summary', 'SUMMARY-SLICE').server(() => {
    data({ items: [source().state('TodoListSummary').fromSingletonProjection('TodoSummary')] });
    specs('Summary Rules', () => {});
  });
});
`);
    });

    it('should generate fromProjection with single idField for regular projections', async () => {
      const modelWithRegularProjection: Model = {
        variant: 'specs',
        narratives: [
          {
            name: 'Todo Flow',
            id: 'TODO-FLOW',
            slices: [
              {
                name: 'views todo',
                id: 'TODO-SLICE',
                type: 'query',
                client: {
                  specs: [],
                },
                server: {
                  description: 'Todo server',
                  data: {
                    items: [
                      {
                        target: {
                          type: 'State',
                          name: 'TodoState',
                        },
                        origin: {
                          type: 'projection',
                          name: 'Todos',
                          idField: 'todoId',
                        },
                      },
                    ],
                  },
                  specs: [
                    {
                      type: 'gherkin',
                      feature: 'Todo Rules',
                      rules: [],
                    },
                  ],
                },
              },
            ],
          },
        ],
        messages: [
          {
            type: 'state',
            name: 'TodoState',
            fields: [
              { name: 'todoId', type: 'string', required: true },
              { name: 'description', type: 'string', required: true },
            ],
            metadata: { version: 1 },
          },
        ],
        integrations: [],
        modules: [],
      };

      const code = getCode(await modelToNarrative(modelWithRegularProjection));

      expect(code).toEqual(`import { data, narrative, query, source, specs } from '@auto-engineer/narrative';
import type { State } from '@auto-engineer/narrative';
type TodoState = State<
  'TodoState',
  {
    todoId: string;
    description: string;
  }
>;
narrative('Todo Flow', 'TODO-FLOW', () => {
  query('views todo', 'TODO-SLICE').server(() => {
    data({ items: [source().state('TodoState').fromProjection('Todos', 'todoId')] });
    specs('Todo Rules', () => {});
  });
});
`);
    });

    it('should generate fromCompositeProjection with array idField for composite key projections', async () => {
      const modelWithCompositeProjection: Model = {
        variant: 'specs',
        narratives: [
          {
            name: 'User Project Flow',
            id: 'USER-PROJECT-FLOW',
            slices: [
              {
                name: 'views user project',
                id: 'USER-PROJECT-SLICE',
                type: 'query',
                client: {
                  specs: [],
                },
                server: {
                  description: 'User project server',
                  data: {
                    items: [
                      {
                        target: {
                          type: 'State',
                          name: 'UserProjectState',
                        },
                        origin: {
                          type: 'projection',
                          name: 'UserProjects',
                          idField: ['userId', 'projectId'],
                        },
                      },
                    ],
                  },
                  specs: [
                    {
                      type: 'gherkin',
                      feature: 'User Project Rules',
                      rules: [],
                    },
                  ],
                },
              },
            ],
          },
        ],
        messages: [
          {
            type: 'state',
            name: 'UserProjectState',
            fields: [
              { name: 'userId', type: 'string', required: true },
              { name: 'projectId', type: 'string', required: true },
              { name: 'role', type: 'string', required: true },
            ],
            metadata: { version: 1 },
          },
        ],
        integrations: [],
        modules: [],
      };

      const code = getCode(await modelToNarrative(modelWithCompositeProjection));

      expect(code).toEqual(`import { data, narrative, query, source, specs } from '@auto-engineer/narrative';
import type { State } from '@auto-engineer/narrative';
type UserProjectState = State<
  'UserProjectState',
  {
    userId: string;
    projectId: string;
    role: string;
  }
>;
narrative('User Project Flow', 'USER-PROJECT-FLOW', () => {
  query('views user project', 'USER-PROJECT-SLICE').server(() => {
    data({
      items: [source().state('UserProjectState').fromCompositeProjection('UserProjects', ['userId', 'projectId'])],
    });
    specs('User Project Rules', () => {});
  });
});
`);
    });

    it('should generate all three projection types in a single narrative', async () => {
      const modelWithAllProjectionTypes: Model = {
        variant: 'specs',
        narratives: [
          {
            name: 'All Projection Types',
            id: 'ALL-PROJ',
            slices: [
              {
                name: 'views summary',
                id: 'SUMMARY-SLICE',
                type: 'query',
                client: {
                  specs: [],
                },
                server: {
                  description: 'Summary server',
                  data: {
                    items: [
                      {
                        target: {
                          type: 'State',
                          name: 'TodoListSummary',
                        },
                        origin: {
                          type: 'projection',
                          name: 'TodoSummary',
                          singleton: true,
                        },
                      },
                    ],
                  },
                  specs: [
                    {
                      type: 'gherkin',
                      feature: 'Summary Rules',
                      rules: [],
                    },
                  ],
                },
              },
              {
                name: 'views todo',
                id: 'TODO-SLICE',
                type: 'query',
                client: {
                  specs: [],
                },
                server: {
                  description: 'Todo server',
                  data: {
                    items: [
                      {
                        target: {
                          type: 'State',
                          name: 'TodoState',
                        },
                        origin: {
                          type: 'projection',
                          name: 'Todos',
                          idField: 'todoId',
                        },
                      },
                    ],
                  },
                  specs: [
                    {
                      type: 'gherkin',
                      feature: 'Todo Rules',
                      rules: [],
                    },
                  ],
                },
              },
              {
                name: 'views user project todos',
                id: 'USER-PROJECT-SLICE',
                type: 'query',
                client: {
                  specs: [],
                },
                server: {
                  description: 'User project server',
                  data: {
                    items: [
                      {
                        target: {
                          type: 'State',
                          name: 'UserProjectTodos',
                        },
                        origin: {
                          type: 'projection',
                          name: 'UserProjectTodos',
                          idField: ['userId', 'projectId'],
                        },
                      },
                    ],
                  },
                  specs: [
                    {
                      type: 'gherkin',
                      feature: 'User Project Rules',
                      rules: [],
                    },
                  ],
                },
              },
            ],
          },
        ],
        messages: [
          {
            type: 'state',
            name: 'TodoListSummary',
            fields: [
              { name: 'summaryId', type: 'string', required: true },
              { name: 'totalTodos', type: 'number', required: true },
            ],
            metadata: { version: 1 },
          },
          {
            type: 'state',
            name: 'TodoState',
            fields: [
              { name: 'todoId', type: 'string', required: true },
              { name: 'description', type: 'string', required: true },
            ],
            metadata: { version: 1 },
          },
          {
            type: 'state',
            name: 'UserProjectTodos',
            fields: [
              { name: 'userId', type: 'string', required: true },
              { name: 'projectId', type: 'string', required: true },
              { name: 'todos', type: 'Array<string>', required: true },
            ],
            metadata: { version: 1 },
          },
        ],
        integrations: [],
        modules: [],
      };

      const code = getCode(await modelToNarrative(modelWithAllProjectionTypes));

      expect(code).toEqual(`import { data, narrative, query, source, specs } from '@auto-engineer/narrative';
import type { State } from '@auto-engineer/narrative';
type TodoListSummary = State<
  'TodoListSummary',
  {
    summaryId: string;
    totalTodos: number;
  }
>;
type TodoState = State<
  'TodoState',
  {
    todoId: string;
    description: string;
  }
>;
type UserProjectTodos = State<
  'UserProjectTodos',
  {
    userId: string;
    projectId: string;
    todos: string[];
  }
>;
narrative('All Projection Types', 'ALL-PROJ', () => {
  query('views summary', 'SUMMARY-SLICE').server(() => {
    data({ items: [source().state('TodoListSummary').fromSingletonProjection('TodoSummary')] });
    specs('Summary Rules', () => {});
  });
  query('views todo', 'TODO-SLICE').server(() => {
    data({ items: [source().state('TodoState').fromProjection('Todos', 'todoId')] });
    specs('Todo Rules', () => {});
  });
  query('views user project todos', 'USER-PROJECT-SLICE').server(() => {
    data({
      items: [source().state('UserProjectTodos').fromCompositeProjection('UserProjectTodos', ['userId', 'projectId'])],
    });
    specs('User Project Rules', () => {});
  });
});
`);
    });
  });

  describe('modules', () => {
    it('generates multiple files for derived modules with different sourceFiles', async () => {
      const model: Model = {
        variant: 'specs',
        narratives: [
          { name: 'Orders', id: 'orders-flow', sourceFile: 'orders.narrative.ts', slices: [] },
          { name: 'Users', id: 'users-flow', sourceFile: 'users.narrative.ts', slices: [] },
        ],
        messages: [],
        integrations: [],
        modules: [
          {
            id: 'orders.narrative.ts',
            sourceFile: 'orders.narrative.ts',
            isDerived: true,
            contains: { narrativeIds: ['orders-flow'] },
            declares: { messages: [] },
          },
          {
            id: 'users.narrative.ts',
            sourceFile: 'users.narrative.ts',
            isDerived: true,
            contains: { narrativeIds: ['users-flow'] },
            declares: { messages: [] },
          },
        ],
      };

      const result = await modelToNarrative(model);

      expect(result.files).toHaveLength(2);
      expect(result.files.map((f) => f.path).sort()).toEqual(['orders.narrative.ts', 'users.narrative.ts']);

      const ordersFile = result.files.find((f) => f.path === 'orders.narrative.ts');
      const usersFile = result.files.find((f) => f.path === 'users.narrative.ts');

      expect(ordersFile?.code).toContain("narrative('Orders', 'orders-flow'");
      expect(usersFile?.code).toContain("narrative('Users', 'users-flow'");
    });

    it('duplicates types in each derived module file (no cross-module imports)', async () => {
      const model: Model = {
        variant: 'specs',
        narratives: [
          { name: 'Flow A', id: 'flow-a', sourceFile: 'a.narrative.ts', slices: [] },
          { name: 'Flow B', id: 'flow-b', sourceFile: 'b.narrative.ts', slices: [] },
        ],
        messages: [
          {
            type: 'event',
            source: 'internal',
            name: 'SharedEvent',
            fields: [{ name: 'id', type: 'string', required: true }],
          },
        ],
        integrations: [],
        modules: [
          {
            id: 'a.narrative.ts',
            sourceFile: 'a.narrative.ts',
            isDerived: true,
            contains: { narrativeIds: ['flow-a'] },
            declares: { messages: [{ kind: 'event', name: 'SharedEvent' }] },
          },
          {
            id: 'b.narrative.ts',
            sourceFile: 'b.narrative.ts',
            isDerived: true,
            contains: { narrativeIds: ['flow-b'] },
            declares: { messages: [{ kind: 'event', name: 'SharedEvent' }] },
          },
        ],
      };

      const result = await modelToNarrative(model);

      expect(result.files).toHaveLength(2);

      for (const file of result.files) {
        expect(file.code).toContain('type SharedEvent = Event<');
        expect(file.code).not.toContain('import type { SharedEvent }');
      }
    });

    it('generates cross-module type imports for authored modules', async () => {
      const model: Model = {
        variant: 'specs',
        narratives: [
          { name: 'Shared Types', id: 'shared-types', slices: [] },
          {
            name: 'Orders',
            id: 'orders-flow',
            slices: [
              {
                name: 'create order',
                type: 'command',
                client: { specs: [] },
                server: {
                  description: 'Creates an order',
                  specs: [
                    {
                      type: 'gherkin',
                      feature: 'Order Creation',
                      rules: [
                        {
                          name: 'Valid order',
                          examples: [
                            {
                              name: 'Creates order',
                              steps: [
                                { keyword: 'When', text: 'CreateOrder' },
                                { keyword: 'Then', text: 'OrderCreated' },
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
        ],
        messages: [
          {
            type: 'command',
            name: 'CreateOrder',
            fields: [{ name: 'orderId', type: 'string', required: true }],
          },
          {
            type: 'event',
            source: 'internal',
            name: 'OrderCreated',
            fields: [{ name: 'orderId', type: 'string', required: true }],
          },
        ],
        integrations: [],
        modules: [
          {
            id: 'shared',
            sourceFile: 'shared/types.narrative.ts',
            isDerived: false,
            contains: { narrativeIds: ['shared-types'] },
            declares: { messages: [{ kind: 'event', name: 'OrderCreated' }] },
          },
          {
            id: 'orders',
            sourceFile: 'features/orders.narrative.ts',
            isDerived: false,
            contains: { narrativeIds: ['orders-flow'] },
            declares: { messages: [{ kind: 'command', name: 'CreateOrder' }] },
          },
        ],
      };

      const result = await modelToNarrative(model);

      expect(result.files).toHaveLength(2);

      const ordersFile = result.files.find((f) => f.path.includes('orders'));
      expect(ordersFile).toBeDefined();

      expect(ordersFile!.code).toContain("import type { OrderCreated } from '../shared/types.narrative';");
      expect(ordersFile!.code).toContain('type CreateOrder = Command<');
      expect(ordersFile!.code).not.toContain('type OrderCreated = Event<');
    });

    it('generates correct relative import paths for nested directories', async () => {
      const model: Model = {
        variant: 'specs',
        narratives: [
          { name: 'Core Types', id: 'core', slices: [] },
          {
            name: 'Feature',
            id: 'feature',
            slices: [
              {
                name: 'do something',
                type: 'command',
                client: { specs: [] },
                server: {
                  description: 'Does something',
                  specs: [
                    {
                      type: 'gherkin',
                      feature: 'Feature',
                      rules: [
                        {
                          name: 'Rule',
                          examples: [
                            {
                              name: 'Example',
                              steps: [{ keyword: 'Then', text: 'CoreEvent' }],
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
        ],
        messages: [
          {
            type: 'event',
            source: 'internal',
            name: 'CoreEvent',
            fields: [{ name: 'id', type: 'string', required: true }],
          },
        ],
        integrations: [],
        modules: [
          {
            id: 'core',
            sourceFile: 'src/core/types.narrative.ts',
            isDerived: false,
            contains: { narrativeIds: ['core'] },
            declares: { messages: [{ kind: 'event', name: 'CoreEvent' }] },
          },
          {
            id: 'feature',
            sourceFile: 'src/features/sub/feature.narrative.ts',
            isDerived: false,
            contains: { narrativeIds: ['feature'] },
            declares: { messages: [] },
          },
        ],
      };

      const result = await modelToNarrative(model);

      const featureFile = result.files.find((f) => f.path.includes('feature'));
      expect(featureFile).toBeDefined();
      expect(featureFile!.code).toContain("import type { CoreEvent } from '../../core/types.narrative';");
    });

    it('groups multiple imported types from same module into single import', async () => {
      const model: Model = {
        variant: 'specs',
        narratives: [
          { name: 'Shared', id: 'shared', slices: [] },
          {
            name: 'Consumer',
            id: 'consumer',
            slices: [
              {
                name: 'process',
                type: 'command',
                client: { specs: [] },
                server: {
                  description: 'Processes',
                  specs: [
                    {
                      type: 'gherkin',
                      feature: 'Processing',
                      rules: [
                        {
                          name: 'Rule',
                          examples: [
                            {
                              name: 'Example',
                              steps: [
                                { keyword: 'Given', text: 'EventA' },
                                { keyword: 'Then', text: 'EventB' },
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
        ],
        messages: [
          { type: 'event', source: 'internal', name: 'EventA', fields: [] },
          { type: 'event', source: 'internal', name: 'EventB', fields: [] },
        ],
        integrations: [],
        modules: [
          {
            id: 'shared',
            sourceFile: 'shared.narrative.ts',
            isDerived: false,
            contains: { narrativeIds: ['shared'] },
            declares: {
              messages: [
                { kind: 'event', name: 'EventA' },
                { kind: 'event', name: 'EventB' },
              ],
            },
          },
          {
            id: 'consumer',
            sourceFile: 'consumer.narrative.ts',
            isDerived: false,
            contains: { narrativeIds: ['consumer'] },
            declares: { messages: [] },
          },
        ],
      };

      const result = await modelToNarrative(model);

      const consumerFile = result.files.find((f) => f.path.includes('consumer'));
      expect(consumerFile).toBeDefined();

      expect(consumerFile!.code).toMatch(/import type \{ EventA, EventB \} from/);
      expect(consumerFile!.code.match(/import type \{/g)?.length).toBe(1);
    });

    it('sorts cross-module imports alphabetically by path', async () => {
      const model: Model = {
        variant: 'specs',
        narratives: [
          { name: 'Types Z', id: 'z-types', slices: [] },
          { name: 'Types A', id: 'a-types', slices: [] },
          {
            name: 'Consumer',
            id: 'consumer',
            slices: [
              {
                name: 'process',
                type: 'command',
                client: { specs: [] },
                server: {
                  description: 'Processes',
                  specs: [
                    {
                      type: 'gherkin',
                      feature: 'Processing',
                      rules: [
                        {
                          name: 'Rule',
                          examples: [
                            {
                              name: 'Example',
                              steps: [
                                { keyword: 'Given', text: 'ZEvent' },
                                { keyword: 'Then', text: 'AEvent' },
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
        ],
        messages: [
          { type: 'event', source: 'internal', name: 'ZEvent', fields: [] },
          { type: 'event', source: 'internal', name: 'AEvent', fields: [] },
        ],
        integrations: [],
        modules: [
          {
            id: 'z-types',
            sourceFile: 'z-types.narrative.ts',
            isDerived: false,
            contains: { narrativeIds: ['z-types'] },
            declares: { messages: [{ kind: 'event', name: 'ZEvent' }] },
          },
          {
            id: 'a-types',
            sourceFile: 'a-types.narrative.ts',
            isDerived: false,
            contains: { narrativeIds: ['a-types'] },
            declares: { messages: [{ kind: 'event', name: 'AEvent' }] },
          },
          {
            id: 'consumer',
            sourceFile: 'consumer.narrative.ts',
            isDerived: false,
            contains: { narrativeIds: ['consumer'] },
            declares: { messages: [] },
          },
        ],
      };

      const result = await modelToNarrative(model);

      const consumerFile = result.files.find((f) => f.path.includes('consumer'));
      expect(consumerFile).toBeDefined();

      const importLines = consumerFile!.code.split('\n').filter((line) => line.startsWith('import type {'));

      expect(importLines).toHaveLength(2);
      expect(importLines[0]).toContain('a-types');
      expect(importLines[1]).toContain('z-types');
    });

    it('derives modules when model has empty modules array', async () => {
      const model: Model = {
        variant: 'specs',
        narratives: [
          { name: 'Flow A', id: 'flow-a', sourceFile: 'a.narrative.ts', slices: [] },
          { name: 'Flow B', id: 'flow-b', sourceFile: 'b.narrative.ts', slices: [] },
        ],
        messages: [
          {
            type: 'event',
            source: 'internal',
            name: 'TestEvent',
            fields: [{ name: 'id', type: 'string', required: true }],
          },
        ],
        integrations: [],
        modules: [],
      };

      const result = await modelToNarrative(model);

      expect(result.files).toHaveLength(2);
      expect(result.files.map((f) => f.path).sort()).toEqual(['a.narrative.ts', 'b.narrative.ts']);

      for (const file of result.files) {
        expect(file.code).toContain('type TestEvent = Event<');
      }
    });
  });

  describe('data item IDs', () => {
    it('should generate sink id when provided', async () => {
      const modelWithSinkId: Model = {
        variant: 'specs',
        narratives: [
          {
            name: 'Order Flow',
            id: 'ORDER-FLOW',
            slices: [
              {
                name: 'places order',
                id: 'ORDER-SLICE',
                type: 'command',
                client: { specs: [] },
                server: {
                  description: 'Order server',
                  data: {
                    items: [
                      {
                        id: 'SINK-001',
                        target: { type: 'Event', name: 'OrderPlaced' },
                        destination: { type: 'stream', pattern: 'orders-stream' },
                      },
                    ],
                  },
                  specs: [],
                },
              },
            ],
          },
        ],
        messages: [
          {
            type: 'event',
            source: 'internal',
            name: 'OrderPlaced',
            fields: [{ name: 'orderId', type: 'string', required: true }],
          },
        ],
        integrations: [],
        modules: [],
      };

      const code = getCode(await modelToNarrative(modelWithSinkId));
      expect(code).toContain("sink('SINK-001').event('OrderPlaced').toStream('orders-stream')");
    });

    it('should generate source id when provided', async () => {
      const modelWithSourceId: Model = {
        variant: 'specs',
        narratives: [
          {
            name: 'Order Flow',
            id: 'ORDER-FLOW',
            slices: [
              {
                name: 'views order',
                id: 'ORDER-SLICE',
                type: 'query',
                client: { specs: [] },
                server: {
                  description: 'Order server',
                  data: {
                    items: [
                      {
                        id: 'SOURCE-001',
                        target: { type: 'State', name: 'OrderState' },
                        origin: { type: 'projection', name: 'Orders', idField: 'orderId' },
                      },
                    ],
                  },
                  specs: [],
                },
              },
            ],
          },
        ],
        messages: [
          {
            type: 'state',
            name: 'OrderState',
            fields: [{ name: 'orderId', type: 'string', required: true }],
          },
        ],
        integrations: [],
        modules: [],
      };

      const code = getCode(await modelToNarrative(modelWithSourceId));
      expect(code).toContain("source('SOURCE-001').state('OrderState').fromProjection('Orders', 'orderId')");
    });

    it('should not generate id when not provided', async () => {
      const modelWithoutId: Model = {
        variant: 'specs',
        narratives: [
          {
            name: 'Order Flow',
            id: 'ORDER-FLOW',
            slices: [
              {
                name: 'places order',
                id: 'ORDER-SLICE',
                type: 'command',
                client: { specs: [] },
                server: {
                  description: 'Order server',
                  data: {
                    items: [
                      {
                        target: { type: 'Event', name: 'OrderPlaced' },
                        destination: { type: 'stream', pattern: 'orders-stream' },
                      },
                    ],
                  },
                  specs: [],
                },
              },
            ],
          },
        ],
        messages: [
          {
            type: 'event',
            source: 'internal',
            name: 'OrderPlaced',
            fields: [{ name: 'orderId', type: 'string', required: true }],
          },
        ],
        integrations: [],
        modules: [],
      };

      const code = getCode(await modelToNarrative(modelWithoutId));
      expect(code).toContain("sink().event('OrderPlaced').toStream('orders-stream')");
      expect(code).not.toContain("sink('')");
    });

    it('should generate _additionalInstructions on source items', async () => {
      const modelWithSourceInstructions: Model = {
        variant: 'specs',
        narratives: [
          {
            name: 'Order Flow',
            id: 'ORDER-FLOW',
            slices: [
              {
                name: 'views order',
                id: 'ORDER-SLICE',
                type: 'query',
                client: { specs: [] },
                server: {
                  description: 'Order server',
                  data: {
                    items: [
                      {
                        target: { type: 'State', name: 'OrderState' },
                        origin: { type: 'projection', name: 'Orders', idField: 'orderId' },
                        _additionalInstructions: 'Filter by active orders only',
                      },
                    ],
                  },
                  specs: [],
                },
              },
            ],
          },
        ],
        messages: [
          {
            type: 'state',
            name: 'OrderState',
            fields: [{ name: 'orderId', type: 'string', required: true }],
          },
        ],
        integrations: [],
        modules: [],
      };

      const code = getCode(await modelToNarrative(modelWithSourceInstructions));
      expect(code).toContain(".additionalInstructions('Filter by active orders only')");
    });
  });
});
