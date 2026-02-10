import type { Model as SpecsSchema } from '@auto-engineer/narrative';
import { describe, expect, it } from 'vitest';
import { generateScaffoldFilePlans } from '../../scaffoldFromSchema';

describe('projection.specs.ts.ejs', () => {
  it('should generate a valid test spec for a query slice projection', async () => {
    const spec: SpecsSchema = {
      variant: 'specs',
      narratives: [
        {
          name: 'listing-flow',
          slices: [
            {
              type: 'command',
              name: 'CreateListing',
              stream: 'listing-${propertyId}',
              client: { specs: [] },
              server: {
                description: '',
                specs: [
                  {
                    type: 'gherkin',
                    feature: 'CreateListing command',
                    rules: [
                      {
                        name: 'Should handle listing operations',
                        examples: [
                          {
                            name: 'User creates listing successfully',
                            steps: [
                              {
                                keyword: 'When',
                                text: 'CreateListing',
                                docString: {
                                  propertyId: 'listing_123',
                                  title: 'Sea View Flat',
                                  pricePerNight: 120,
                                  location: 'Brighton',
                                  maxGuests: 4,
                                },
                              },
                              {
                                keyword: 'Then',
                                text: 'ListingCreated',
                                docString: {
                                  propertyId: 'listing_123',
                                  title: 'Sea View Flat',
                                  pricePerNight: 120,
                                  location: 'Brighton',
                                  maxGuests: 4,
                                },
                              },
                            ],
                          },
                          {
                            name: 'User removes listing successfully',
                            steps: [
                              {
                                keyword: 'When',
                                text: 'RemoveListing',
                                docString: {
                                  propertyId: 'listing_123',
                                },
                              },
                              {
                                keyword: 'Then',
                                text: 'ListingRemoved',
                                docString: {},
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
              type: 'query',
              name: 'search-listings',
              stream: 'listings',
              client: { specs: [] },
              server: {
                description: '',
                data: {
                  items: [
                    {
                      origin: {
                        type: 'projection',
                        idField: 'propertyId',
                        name: 'AvailablePropertiesProjection',
                      },
                      target: {
                        type: 'State',
                        name: 'AvailableListings',
                      },
                    },
                  ],
                },
                specs: [
                  {
                    type: 'gherkin',
                    feature: 'Search listings query',
                    rules: [
                      {
                        name: 'Should project listings correctly',
                        examples: [
                          {
                            name: 'Listing created shows in search results',
                            steps: [
                              {
                                keyword: 'When',
                                text: 'ListingCreated',
                                docString: {
                                  propertyId: 'listing_123',
                                  title: 'Sea View Flat',
                                  pricePerNight: 120,
                                  location: 'Brighton',
                                  maxGuests: 4,
                                },
                              },
                              {
                                keyword: 'Then',
                                text: 'AvailableListings',
                                docString: {
                                  propertyId: 'listing_123',
                                  title: 'Sea View Flat',
                                  pricePerNight: 120,
                                  location: 'Brighton',
                                  maxGuests: 4,
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
          type: 'command',
          name: 'CreateListing',
          fields: [
            { name: 'propertyId', type: 'string', required: true },
            { name: 'title', type: 'string', required: true },
            { name: 'pricePerNight', type: 'number', required: true },
            { name: 'location', type: 'string', required: true },
            { name: 'maxGuests', type: 'number', required: true },
          ],
        },
        {
          type: 'command',
          name: 'RemoveListing',
          fields: [{ name: 'propertyId', type: 'string', required: true }],
        },
        {
          type: 'event',
          name: 'ListingCreated',
          source: 'internal',
          fields: [
            { name: 'propertyId', type: 'string', required: true },
            { name: 'title', type: 'string', required: true },
            { name: 'pricePerNight', type: 'number', required: true },
            { name: 'location', type: 'string', required: true },
            { name: 'maxGuests', type: 'number', required: true },
          ],
        },
        {
          type: 'event',
          name: 'ListingRemoved',
          source: 'internal',
          fields: [{ name: 'propertyId', type: 'string', required: true }],
        },
        {
          type: 'state',
          name: 'AvailableListings',
          fields: [
            { name: 'propertyId', type: 'string', required: true },
            { name: 'title', type: 'string', required: true },
            { name: 'pricePerNight', type: 'number', required: true },
            { name: 'location', type: 'string', required: true },
            { name: 'maxGuests', type: 'number', required: true },
          ],
        },
      ],
    } as SpecsSchema;

    const plans = await generateScaffoldFilePlans(spec.narratives, spec.messages, undefined, 'src/domain/flows');
    const specFile = plans.find((p) => p.outputPath.endsWith('projection.specs.ts'));

    expect(specFile?.contents).toMatchInlineSnapshot(`
      "import { describe, it, beforeEach, expect } from 'vitest';
      import { InMemoryProjectionSpec } from '@event-driven-io/emmett';
      import { projection } from './projection';
      import type { ListingCreated } from '../create-listing/events';
      import { AvailableListings } from './state';

      type ProjectionEvent = ListingCreated;

      describe('Should project listings correctly', () => {
        let given: InMemoryProjectionSpec<ProjectionEvent>;

        beforeEach(() => {
          given = InMemoryProjectionSpec.for({ projection });
        });

        it('Listing created shows in search results', () =>
          given([])
            .when([
              {
                type: 'ListingCreated',
                data: {
                  propertyId: 'listing_123',
                  title: 'Sea View Flat',
                  pricePerNight: 120,
                  location: 'Brighton',
                  maxGuests: 4,
                },
                metadata: {
                  streamName: 'listings',
                  streamPosition: 1n,
                  globalPosition: 1n,
                },
              },
            ])
            .then(async (state) => {
              const document = await state.database
                .collection<AvailableListings>('AvailablePropertiesProjection')
                .findOne((doc) => doc.propertyId === 'listing_123');

              const expected: AvailableListings = {
                propertyId: 'listing_123',
                title: 'Sea View Flat',
                pricePerNight: 120,
                location: 'Brighton',
                maxGuests: 4,
              };

              expect(document).toMatchObject(expected);
            }));
      });
      "
    `);
  });

  it('should generate a valid test spec for a model with given/when/then pattern', async () => {
    const questionnaireSpec: SpecsSchema = {
      variant: 'specs',
      narratives: [
        {
          name: 'Questionnaires',
          slices: [
            {
              name: 'views the questionnaire',
              type: 'query',
              client: { specs: [] },
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
                        name: 'questionnaires show current progress',
                        examples: [
                          {
                            name: 'a question has already been answered',
                            steps: [
                              {
                                keyword: 'Given',
                                text: 'QuestionnaireLinkSent',
                                docString: {
                                  questionnaireId: 'q-001',
                                  participantId: 'participant-abc',
                                  link: 'https://app.example.com/q/q-001?participant=participant-abc',
                                  sentAt: '2030-01-01T09:00:00.000Z',
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
                                  savedAt: '2030-01-01T09:05:00.000Z',
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
            { name: 'questionnaireId', type: 'string', required: true },
            { name: 'participantId', type: 'string', required: true },
            { name: 'link', type: 'string', required: true },
            { name: 'sentAt', type: 'Date', required: true },
          ],
          source: 'internal',
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
        },
      ],
    } as SpecsSchema;

    const plans = await generateScaffoldFilePlans(
      questionnaireSpec.narratives,
      questionnaireSpec.messages,
      undefined,
      'src/domain/flows',
    );
    const specFile = plans.find((p) => p.outputPath.endsWith('projection.specs.ts'));

    expect(specFile?.contents).toContain('a question has already been answered');
    expect(specFile?.contents).toContain('QuestionnaireLinkSent');
    expect(specFile?.contents).toContain('QuestionAnswered');
    expect(specFile?.contents).toContain('given([');
    expect(specFile?.contents).toContain('.when([');
  });

  it('should include all events from both given and when clauses in projection imports and types', async () => {
    const spec: SpecsSchema = {
      variant: 'specs',
      narratives: [
        {
          name: 'questionnaires',
          slices: [
            {
              type: 'command',
              name: 'sends-the-questionnaire-link',
              client: { specs: [] },
              server: {
                description: '',
                specs: [
                  {
                    type: 'gherkin',
                    feature: 'Sends questionnaire link',
                    rules: [
                      {
                        name: 'sends questionnaire link to participant',
                        examples: [
                          {
                            name: 'sends link successfully',
                            steps: [
                              {
                                keyword: 'When',
                                text: 'SendQuestionnaireLink',
                                docString: {
                                  questionnaireId: 'q-001',
                                  participantId: 'participant-abc',
                                },
                              },
                              {
                                keyword: 'Then',
                                text: 'QuestionnaireLinkSent',
                                docString: {
                                  questionnaireId: 'q-001',
                                  participantId: 'participant-abc',
                                  link: 'https://app.example.com/q/q-001?participant=participant-abc',
                                  sentAt: new Date('2030-01-01T09:00:00Z'),
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
              type: 'command',
              name: 'submits-a-questionnaire-answer',
              client: { specs: [] },
              server: {
                description: '',
                specs: [
                  {
                    type: 'gherkin',
                    feature: 'Submits questionnaire answer',
                    rules: [
                      {
                        name: 'submits answer successfully',
                        examples: [
                          {
                            name: 'answers question',
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
                                  savedAt: new Date('2030-01-01T09:05:00Z'),
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
              type: 'query',
              name: 'views-the-questionnaire',
              client: { specs: [] },
              server: {
                description: '',
                specs: [
                  {
                    type: 'gherkin',
                    feature: 'Views the questionnaire',
                    rules: [
                      {
                        name: 'questionnaires show current progress',
                        examples: [
                          {
                            name: 'a question has already been answered',
                            steps: [
                              {
                                keyword: 'Given',
                                text: 'QuestionnaireLinkSent',
                                docString: {
                                  questionnaireId: 'q-001',
                                  participantId: 'participant-abc',
                                  link: 'https://app.example.com/q/q-001?participant=participant-abc',
                                  sentAt: new Date('2030-01-01T09:00:00Z'),
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
                                  savedAt: new Date('2030-01-01T09:05:00Z'),
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
                                  remainingQuestions: ['q2'],
                                  answers: [{ questionId: 'q1', value: 'Yes' }],
                                },
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                ],
                data: {
                  items: [
                    {
                      origin: { name: 'Questionnaires', idField: 'questionnaireId-participantId' },
                      target: { name: 'QuestionnaireProgress' },
                    },
                  ],
                },
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
            { name: 'link', type: 'string', required: true },
            { name: 'sentAt', type: 'Date', required: true },
          ],
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
        },
      ],
    } as SpecsSchema;

    const plans = await generateScaffoldFilePlans(
      spec.narratives,
      [
        {
          type: 'command',
          name: 'SendQuestionnaireLink',
          fields: [
            { name: 'questionnaireId', type: 'string', required: true },
            { name: 'participantId', type: 'string', required: true },
          ],
        },
        {
          type: 'command',
          name: 'AnswerQuestion',
          fields: [
            { name: 'questionnaireId', type: 'string', required: true },
            { name: 'participantId', type: 'string', required: true },
            { name: 'questionId', type: 'string', required: true },
            { name: 'answer', type: 'unknown', required: true },
          ],
        },
        ...spec.messages,
      ],
      undefined,
      'src/domain/flows',
    );

    // Check projection.specs.ts file
    const specsFile = plans.find((p) => p.outputPath.endsWith('projection.specs.ts'));
    expect(specsFile?.contents).toBeDefined();

    // Must import BOTH event types
    expect(specsFile?.contents).toContain('import type { QuestionnaireLinkSent }');
    expect(specsFile?.contents).toContain('import type { QuestionAnswered }');

    // Union type must include BOTH events (order may vary due to sorting)
    expect(specsFile?.contents).toContain('type ProjectionEvent = QuestionAnswered | QuestionnaireLinkSent');

    // Check projection.ts file
    const projectionFile = plans.find((p) => p.outputPath.endsWith('projection.ts'));
    expect(projectionFile?.contents).toBeDefined();

    // Must import BOTH event types
    expect(projectionFile?.contents).toContain('import type { QuestionnaireLinkSent }');
    expect(projectionFile?.contents).toContain('import type { QuestionAnswered }');

    // AllEvents type must include BOTH events (order may vary due to sorting)
    expect(projectionFile?.contents).toContain('type AllEvents = QuestionAnswered | QuestionnaireLinkSent');

    // canHandle must include BOTH events
    expect(projectionFile?.contents).toContain("canHandle: ['QuestionnaireLinkSent', 'QuestionAnswered']");
  });

  it('should generate a valid test spec for singleton projection', async () => {
    const spec: SpecsSchema = {
      variant: 'specs',
      narratives: [
        {
          name: 'todo-flow',
          slices: [
            {
              type: 'command',
              name: 'manage-todo',
              stream: 'todo-${todoId}',
              client: { specs: [] },
              server: {
                description: '',
                specs: [
                  {
                    type: 'gherkin',
                    feature: 'Manage todo command',
                    rules: [
                      {
                        name: 'Should handle todo operations',
                        examples: [
                          {
                            name: 'User adds todo',
                            steps: [
                              {
                                keyword: 'When',
                                text: 'AddTodo',
                                docString: {
                                  todoId: 'todo_123',
                                  title: 'Buy milk',
                                },
                              },
                              {
                                keyword: 'Then',
                                text: 'TodoAdded',
                                docString: {
                                  todoId: 'todo_123',
                                  title: 'Buy milk',
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
              type: 'query',
              name: 'view-summary',
              stream: 'todos',
              client: { specs: [] },
              server: {
                description: '',
                data: {
                  items: [
                    {
                      target: {
                        type: 'State',
                        name: 'TodoSummary',
                      },
                      origin: {
                        type: 'projection',
                        name: 'TodoSummaryProjection',
                        singleton: true,
                      },
                    },
                  ],
                },
                specs: [
                  {
                    type: 'gherkin',
                    feature: 'View summary query',
                    rules: [
                      {
                        name: 'Should aggregate todo counts',
                        examples: [
                          {
                            name: 'Todo added updates count',
                            steps: [
                              {
                                keyword: 'When',
                                text: 'TodoAdded',
                                docString: {
                                  todoId: 'todo_123',
                                  title: 'Buy milk',
                                },
                              },
                              {
                                keyword: 'Then',
                                text: 'TodoSummary',
                                docString: {
                                  totalCount: 1,
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
          type: 'command',
          name: 'AddTodo',
          fields: [
            { name: 'todoId', type: 'string', required: true },
            { name: 'title', type: 'string', required: true },
          ],
        },
        {
          type: 'event',
          name: 'TodoAdded',
          source: 'internal',
          fields: [
            { name: 'todoId', type: 'string', required: true },
            { name: 'title', type: 'string', required: true },
          ],
        },
        {
          type: 'state',
          name: 'TodoSummary',
          fields: [{ name: 'totalCount', type: 'number', required: true }],
        },
      ],
    } as SpecsSchema;

    const plans = await generateScaffoldFilePlans(spec.narratives, spec.messages, undefined, 'src/domain/flows');
    const specFile = plans.find((p) => p.outputPath.endsWith('view-summary/projection.specs.ts'));

    expect(specFile?.contents).toMatchInlineSnapshot(`
      "import { describe, it, beforeEach, expect } from 'vitest';
      import { InMemoryProjectionSpec } from '@event-driven-io/emmett';
      import { projection } from './projection';
      import type { TodoAdded } from '../manage-todo/events';
      import { TodoSummary } from './state';

      type ProjectionEvent = TodoAdded;

      describe('Should aggregate todo counts', () => {
        let given: InMemoryProjectionSpec<ProjectionEvent>;

        beforeEach(() => {
          given = InMemoryProjectionSpec.for({ projection });
        });

        it('Todo added updates count', () =>
          given([])
            .when([
              {
                type: 'TodoAdded',
                data: {
                  todoId: 'todo_123',
                  title: 'Buy milk',
                },
                metadata: {
                  streamName: 'todos',
                  streamPosition: 1n,
                  globalPosition: 1n,
                },
              },
            ])
            .then(async (state) => {
              const document = await state.database.collection<TodoSummary>('TodoSummaryProjection').findOne();

              const expected: TodoSummary = {
                totalCount: 1,
              };

              expect(document).toMatchObject(expected);
            }));
      });
      "
    `);
  });

  it('should generate a valid test spec for composite key projection', async () => {
    const spec: SpecsSchema = {
      variant: 'specs',
      narratives: [
        {
          name: 'user-project-flow',
          slices: [
            {
              type: 'command',
              name: 'manage-user-project',
              stream: 'user-project-${userId}-${projectId}',
              client: { specs: [] },
              server: {
                description: '',
                specs: [
                  {
                    type: 'gherkin',
                    feature: 'Manage user project command',
                    rules: [
                      {
                        name: 'Should handle user project operations',
                        examples: [
                          {
                            name: 'User joins project',
                            steps: [
                              {
                                keyword: 'When',
                                text: 'JoinProject',
                                docString: {
                                  userId: 'user_123',
                                  projectId: 'proj_456',
                                  role: 'developer',
                                },
                              },
                              {
                                keyword: 'Then',
                                text: 'UserJoinedProject',
                                docString: {
                                  userId: 'user_123',
                                  projectId: 'proj_456',
                                  role: 'developer',
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
              type: 'query',
              name: 'view-user-projects',
              stream: 'user-projects',
              client: { specs: [] },
              server: {
                description: '',
                data: {
                  items: [
                    {
                      target: {
                        type: 'State',
                        name: 'UserProject',
                      },
                      origin: {
                        type: 'projection',
                        name: 'UserProjectsProjection',
                        idField: ['userId', 'projectId'],
                      },
                    },
                  ],
                },
                specs: [
                  {
                    type: 'gherkin',
                    feature: 'View user projects query',
                    rules: [
                      {
                        name: 'Should track user project memberships',
                        examples: [
                          {
                            name: 'User joins project',
                            steps: [
                              {
                                keyword: 'When',
                                text: 'UserJoinedProject',
                                docString: {
                                  userId: 'user_123',
                                  projectId: 'proj_456',
                                  role: 'developer',
                                },
                              },
                              {
                                keyword: 'Then',
                                text: 'UserProject',
                                docString: {
                                  userId: 'user_123',
                                  projectId: 'proj_456',
                                  role: 'developer',
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
          type: 'command',
          name: 'JoinProject',
          fields: [
            { name: 'userId', type: 'string', required: true },
            { name: 'projectId', type: 'string', required: true },
            { name: 'role', type: 'string', required: true },
          ],
        },
        {
          type: 'event',
          name: 'UserJoinedProject',
          source: 'internal',
          fields: [
            { name: 'userId', type: 'string', required: true },
            { name: 'projectId', type: 'string', required: true },
            { name: 'role', type: 'string', required: true },
          ],
        },
        {
          type: 'state',
          name: 'UserProject',
          fields: [
            { name: 'userId', type: 'string', required: true },
            { name: 'projectId', type: 'string', required: true },
            { name: 'role', type: 'string', required: true },
          ],
        },
      ],
    } as SpecsSchema;

    const plans = await generateScaffoldFilePlans(spec.narratives, spec.messages, undefined, 'src/domain/flows');
    const specFile = plans.find((p) => p.outputPath.endsWith('view-user-projects/projection.specs.ts'));

    expect(specFile?.contents).toMatchInlineSnapshot(`
      "import { describe, it, beforeEach, expect } from 'vitest';
      import { InMemoryProjectionSpec } from '@event-driven-io/emmett';
      import { projection } from './projection';
      import type { UserJoinedProject } from '../manage-user-project/events';
      import { UserProject } from './state';

      type ProjectionEvent = UserJoinedProject;

      describe('Should track user project memberships', () => {
        let given: InMemoryProjectionSpec<ProjectionEvent>;

        beforeEach(() => {
          given = InMemoryProjectionSpec.for({ projection });
        });

        it('User joins project', () =>
          given([])
            .when([
              {
                type: 'UserJoinedProject',
                data: {
                  userId: 'user_123',
                  projectId: 'proj_456',
                  role: 'developer',
                },
                metadata: {
                  streamName: 'user-projects',
                  streamPosition: 1n,
                  globalPosition: 1n,
                },
              },
            ])
            .then(async (state) => {
              const document = await state.database
                .collection<UserProject>('UserProjectsProjection')
                .findOne((doc) => doc.id === 'test-id');

              const expected: UserProject = {
                userId: 'user_123',
                projectId: 'proj_456',
                role: 'developer',
              };

              expect(document).toMatchObject(expected);
            }));
      });
      "
    `);
  });

  it('should generate empty when array for query action in projection.specs.ts', async () => {
    const spec: SpecsSchema = {
      variant: 'specs',
      narratives: [
        {
          name: 'workout-flow',
          slices: [
            {
              type: 'command',
              name: 'log-workout',
              stream: 'workouts-${memberId}',
              client: { specs: [] },
              server: {
                description: '',
                specs: [
                  {
                    type: 'gherkin',
                    feature: 'Log workout command',
                    rules: [
                      {
                        name: 'Should record workouts',
                        examples: [
                          {
                            name: 'User logs workout',
                            steps: [
                              {
                                keyword: 'When',
                                text: 'LogWorkout',
                                docString: { memberId: 'mem_001', caloriesBurned: 250 },
                              },
                              {
                                keyword: 'Then',
                                text: 'WorkoutRecorded',
                                docString: { memberId: 'mem_001', caloriesBurned: 250 },
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
              type: 'query',
              name: 'view-workout-history',
              stream: 'workouts',
              request:
                'query GetWorkoutHistory($memberId: ID!) { workoutHistory(memberId: $memberId) { totalCalories } }',
              client: { specs: [] },
              server: {
                description: '',
                data: {
                  items: [
                    {
                      target: { type: 'State', name: 'WorkoutHistory' },
                      origin: { type: 'projection', name: 'WorkoutHistoryProjection', idField: 'memberId' },
                    },
                  ],
                },
                specs: [
                  {
                    type: 'gherkin',
                    feature: 'View workout history query',
                    rules: [
                      {
                        name: 'Workout history projection',
                        examples: [
                          {
                            name: 'Shows calories after workout recorded',
                            steps: [
                              {
                                keyword: 'Given',
                                text: 'WorkoutRecorded',
                                docString: { memberId: 'mem_001', caloriesBurned: 250 },
                              },
                              { keyword: 'When', text: 'GetWorkoutHistory', docString: { memberId: 'mem_001' } },
                              {
                                keyword: 'Then',
                                text: 'WorkoutHistory',
                                docString: { memberId: 'mem_001', totalCalories: 250 },
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
          name: 'LogWorkout',
          fields: [
            { name: 'memberId', type: 'string', required: true },
            { name: 'caloriesBurned', type: 'number', required: true },
          ],
        },
        {
          type: 'event',
          name: 'WorkoutRecorded',
          source: 'internal',
          fields: [
            { name: 'memberId', type: 'string', required: true },
            { name: 'caloriesBurned', type: 'number', required: true },
          ],
        },
        { type: 'query', name: 'GetWorkoutHistory', fields: [{ name: 'memberId', type: 'string', required: true }] },
        {
          type: 'state',
          name: 'WorkoutHistory',
          fields: [
            { name: 'memberId', type: 'string', required: true },
            { name: 'totalCalories', type: 'number', required: true },
          ],
        },
      ],
    } as SpecsSchema;

    const plans = await generateScaffoldFilePlans(spec.narratives, spec.messages, undefined, 'src/domain/flows');
    const specFile = plans.find((p) => p.outputPath.endsWith('view-workout-history/projection.specs.ts'));

    expect(specFile?.contents).toMatchInlineSnapshot(`
      "import { describe, it, beforeEach, expect } from 'vitest';
      import { InMemoryProjectionSpec } from '@event-driven-io/emmett';
      import { projection } from './projection';
      import type { WorkoutRecorded } from '../log-workout/events';
      import { WorkoutHistory } from './state';

      type ProjectionEvent = WorkoutRecorded;

      describe('Workout history projection', () => {
        let given: InMemoryProjectionSpec<ProjectionEvent>;

        beforeEach(() => {
          given = InMemoryProjectionSpec.for({ projection });
        });

        it('Shows calories after workout recorded', () =>
          given([
            {
              type: 'WorkoutRecorded',
              data: {
                memberId: 'mem_001',
                caloriesBurned: 250,
              },
              metadata: {
                streamName: 'workouts',
                streamPosition: 1n,
                globalPosition: 1n,
              },
            },
          ])
            .when([])
            .then(async (state) => {
              const document = await state.database
                .collection<WorkoutHistory>('WorkoutHistoryProjection')
                .findOne((doc) => doc.memberId === 'mem_001');

              const expected: WorkoutHistory = {
                memberId: 'mem_001',
                totalCalories: 250,
              };

              expect(document).toMatchObject(expected);
            }));
      });
      "
    `);
  });

  it('should generate valid projection.ts when When clause is a query action (QueryActionRef)', async () => {
    const spec: SpecsSchema = {
      variant: 'specs',
      narratives: [
        {
          name: 'workout-flow',
          slices: [
            {
              type: 'command',
              name: 'log-workout',
              stream: 'workouts-${memberId}',
              client: { specs: [] },
              server: {
                description: '',
                specs: [
                  {
                    type: 'gherkin',
                    feature: 'Log workout command',
                    rules: [
                      {
                        name: 'Should record workouts',
                        examples: [
                          {
                            name: 'User logs workout',
                            steps: [
                              {
                                keyword: 'When',
                                text: 'LogWorkout',
                                docString: {
                                  memberId: 'mem_001',
                                  caloriesBurned: 250,
                                },
                              },
                              {
                                keyword: 'Then',
                                text: 'WorkoutRecorded',
                                docString: {
                                  memberId: 'mem_001',
                                  caloriesBurned: 250,
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
              type: 'query',
              name: 'view-workout-history',
              stream: 'workouts',
              request:
                'query GetWorkoutHistory($memberId: ID!) { workoutHistory(memberId: $memberId) { totalCalories } }',
              client: { specs: [] },
              server: {
                description: '',
                data: {
                  items: [
                    {
                      target: { type: 'State', name: 'WorkoutHistory' },
                      origin: { type: 'projection', name: 'WorkoutHistoryProjection', idField: 'memberId' },
                    },
                  ],
                },
                specs: [
                  {
                    type: 'gherkin',
                    feature: 'View workout history query',
                    rules: [
                      {
                        name: 'Workout history projection',
                        examples: [
                          {
                            name: 'Shows calories after workout recorded',
                            steps: [
                              {
                                keyword: 'Given',
                                text: 'WorkoutRecorded',
                                docString: { memberId: 'mem_001', caloriesBurned: 250 },
                              },
                              { keyword: 'When', text: 'GetWorkoutHistory', docString: { memberId: 'mem_001' } },
                              {
                                keyword: 'Then',
                                text: 'WorkoutHistory',
                                docString: { memberId: 'mem_001', totalCalories: 250 },
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
          name: 'LogWorkout',
          fields: [
            { name: 'memberId', type: 'string', required: true },
            { name: 'caloriesBurned', type: 'number', required: true },
          ],
        },
        {
          type: 'event',
          name: 'WorkoutRecorded',
          source: 'internal',
          fields: [
            { name: 'memberId', type: 'string', required: true },
            { name: 'caloriesBurned', type: 'number', required: true },
          ],
        },
        { type: 'query', name: 'GetWorkoutHistory', fields: [{ name: 'memberId', type: 'string', required: true }] },
        {
          type: 'state',
          name: 'WorkoutHistory',
          fields: [
            { name: 'memberId', type: 'string', required: true },
            { name: 'totalCalories', type: 'number', required: true },
          ],
        },
      ],
    } as SpecsSchema;

    const plans = await generateScaffoldFilePlans(spec.narratives, spec.messages, undefined, 'src/domain/flows');
    const projectionFile = plans.find((p) => p.outputPath.endsWith('view-workout-history/projection.ts'));

    expect(projectionFile?.contents).toMatchInlineSnapshot(`
      "import {
        inMemorySingleStreamProjection,
        type ReadEvent,
        type InMemoryReadEventMetadata,
      } from '@event-driven-io/emmett';
      import type { WorkoutHistory } from './state';
      import type { WorkoutRecorded } from '../log-workout/events';

      type AllEvents = WorkoutRecorded;

      export const projection = inMemorySingleStreamProjection<WorkoutHistory, AllEvents>({
        collectionName: 'WorkoutHistoryProjection',
        canHandle: ['WorkoutRecorded'],
        getDocumentId: (event) => event.data.memberId,
        evolve: (
          document: WorkoutHistory | null,
          event: ReadEvent<AllEvents, InMemoryReadEventMetadata>,
        ): WorkoutHistory | null => {
          switch (event.type) {
            case 'WorkoutRecorded': {
              /**
               * ## IMPLEMENTATION INSTRUCTIONS ##
               * Implement how this event updates the projection.
               *
               * **IMPORTANT - Internal State Pattern:**
               * If you need to track state beyond the public WorkoutHistory type (e.g., to calculate
               * aggregations, track previous values, etc.), follow this pattern:
               *
               * 1. Define an extended interface BEFORE the projection:
               *    interface InternalWorkoutHistory extends WorkoutHistory {
               *      internalField: SomeType;
               *    }
               *
               * 2. Cast document parameter to extended type:
               *    const current: InternalWorkoutHistory = document ?? { ...defaults };
               *
               * 3. Cast return values to extended type:
               *    return { ...allFields, internalField } as InternalWorkoutHistory;
               *
               * This keeps internal state separate from the public GraphQL schema.
               */
              return {
                memberId: /* TODO: map from event.data */ '',
                totalCalories: /* TODO: map from event.data */ 0,
              };
            }
            default:
              return document;
          }
        },
      });

      export default projection;
      "
    `);
  });
});
