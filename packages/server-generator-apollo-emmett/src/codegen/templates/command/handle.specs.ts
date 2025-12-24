import type { Model as SpecsSchema } from '@auto-engineer/narrative';
import { describe, expect, it } from 'vitest';
import { generateScaffoldFilePlans } from '../../scaffoldFromSchema';

describe('generateScaffoldFilePlans', () => {
  it('should generate a valid handle file', async () => {
    const spec: SpecsSchema = {
      variant: 'specs',
      narratives: [
        {
          name: 'Host creates a listing',
          slices: [
            {
              type: 'command',
              name: 'Create listing',
              stream: 'listing-${propertyId}',
              client: {
                specs: [],
              },
              server: {
                description: 'test',
                specs: [
                  {
                    type: 'gherkin',
                    feature: 'Create listing command',
                    rules: [
                      {
                        name: 'Should create listing successfully',
                        examples: [
                          {
                            name: 'User creates listing with valid data',
                            steps: [
                              {
                                keyword: 'When',
                                text: 'CreateListing',
                                docString: {
                                  propertyId: 'listing_123',
                                  title: 'Modern Downtown Apartment',
                                  listedAt: '2024-01-15T10:00:00Z',
                                  rating: 4.8,
                                  metadata: { foo: 'bar' },
                                },
                              },
                              {
                                keyword: 'Then',
                                text: 'ListingCreated',
                                docString: {
                                  propertyId: 'listing_123',
                                  listedAt: '2024-01-15T10:00:00Z',
                                  rating: 4.8,
                                  metadata: { foo: 'bar' },
                                },
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                ],
                data: [
                  {
                    target: {
                      type: 'Event',
                      name: 'ListingCreated',
                    },
                    destination: {
                      type: 'stream',
                      pattern: 'listings-${propertyId}',
                    },
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
            { name: 'listedAt', type: 'Date', required: true },
            { name: 'rating', type: 'number', required: true },
            { name: 'metadata', type: 'object', required: true },
          ],
        },
        {
          type: 'event',
          name: 'ListingCreated',
          source: 'internal',
          fields: [
            { name: 'propertyId', type: 'string', required: true },
            { name: 'title', type: 'string', required: true },
            { name: 'listedAt', type: 'Date', required: true },
            { name: 'rating', type: 'number', required: true },
            { name: 'metadata', type: 'object', required: true },
          ],
        },
      ],
    };

    const plans = await generateScaffoldFilePlans(spec.narratives, spec.messages, undefined, 'src/domain/flows');
    const handleFile = plans.find((p) => p.outputPath.endsWith('handle.ts'));

    expect(handleFile?.contents).toMatchInlineSnapshot(`
      "import { CommandHandler, type EventStore, type MessageHandlerResult } from '@event-driven-io/emmett';
      import { evolve } from './evolve';
      import { initialState } from './state';
      import { decide } from './decide';
      import type { CreateListing } from './commands';

      const handler = CommandHandler({
        evolve,
        initialState,
      });

      export const handle = async (eventStore: EventStore, command: CreateListing): Promise<MessageHandlerResult> => {
        const streamId = \`listings-\${command.data.propertyId}\`;

        try {
          await handler(eventStore, streamId, (state) => decide(command, state));
          return undefined; // success
        } catch (error: unknown) {
          return {
            type: 'SKIP',
            reason: \`Command failed: \${error instanceof Error ? error.message : 'Unknown'}\`,
          };
        }
      };
      "
    `);
  });
  it('should generate a valid handle file with integration', async () => {
    const spec: SpecsSchema = {
      variant: 'specs',
      narratives: [
        {
          name: 'Assistant suggests items',
          slices: [
            {
              type: 'command',
              name: 'Suggest Items',
              stream: 'session-${sessionId}',
              client: {
                specs: [],
              },
              server: {
                description: '',
                data: [
                  {
                    target: {
                      type: 'Command',
                      name: 'SuggestItems',
                    },
                    destination: {
                      type: 'integration',
                      systems: ['AI'],
                      message: {
                        name: 'DoChat',
                        type: 'command',
                      },
                    },
                    _additionalInstructions: 'Ensure systemPrompt includes product catalogue guidance',
                    _withState: {
                      target: {
                        type: 'State',
                        name: 'Products',
                      },
                      origin: {
                        type: 'integration',
                        systems: ['product-catalog'],
                      },
                    },
                  },
                  {
                    target: {
                      type: 'Event',
                      name: 'ItemsSuggested',
                    },
                    destination: {
                      type: 'stream',
                      pattern: 'session-${sessionId}',
                    },
                  },
                ],
                specs: [
                  {
                    type: 'gherkin',
                    feature: 'Suggest items command',
                    rules: [
                      {
                        name: 'Should suggest items successfully',
                        examples: [
                          {
                            name: 'User requests item suggestions',
                            steps: [
                              {
                                keyword: 'When',
                                text: 'SuggestItems',
                                docString: {
                                  sessionId: 'session-123',
                                  prompt: 'What should I buy?',
                                },
                              },
                              {
                                keyword: 'Then',
                                text: 'ItemsSuggested',
                                docString: {
                                  sessionId: 'session-123',
                                  items: [],
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
          name: 'SuggestItems',
          fields: [
            { name: 'sessionId', type: 'string', required: true },
            { name: 'prompt', type: 'string', required: true },
          ],
        },
        {
          type: 'command',
          name: 'DoChat',
          fields: [
            { name: 'sessionId', type: 'string', required: true },
            { name: 'prompt', type: 'string', required: true },
            { name: 'systemPrompt', type: 'string', required: false },
          ],
        },
        {
          type: 'event',
          name: 'ItemsSuggested',
          source: 'internal',
          fields: [
            { name: 'sessionId', type: 'string', required: true },
            { name: 'items', type: 'Array<object>', required: true },
          ],
        },
        {
          type: 'state',
          name: 'Products',
          fields: [
            {
              name: 'products',
              type: 'Array<{ id: string, name: string }>',
              required: true,
            },
          ],
        },
      ],
      integrations: [
        {
          name: 'AI',
          source: '@auto-engineer/ai-integration',
          description: '',
        },
        {
          name: 'product-catalog',
          source: '@auto-engineer/product-catalogue-integration',
          description: '',
        },
      ],
    };

    const plans = await generateScaffoldFilePlans(
      spec.narratives,
      spec.messages,
      spec.integrations,
      'src/domain/flows',
    );
    const handleFile = plans.find((p) => p.outputPath.endsWith('handle.ts'));

    expect(handleFile?.contents).toMatchInlineSnapshot(`
      "import '@auto-engineer/product-catalogue-integration';

      import { AI } from '@auto-engineer/ai-integration';

      import { Products } from '@auto-engineer/product-catalogue-integration';

      import { CommandHandler, type EventStore, type MessageHandlerResult } from '@event-driven-io/emmett';
      import { evolve } from './evolve';
      import { initialState } from './state';
      import { decide } from './decide';
      import type { SuggestItems } from './commands';

      /**
       * ## IMPLEMENTATION INSTRUCTIONS ##
       * Ensure systemPrompt includes product catalogue guidance
       */

      const handler = CommandHandler({
        evolve,
        initialState,
      });

      export const handle = async (eventStore: EventStore, command: SuggestItems): Promise<MessageHandlerResult> => {
        const streamId = \`session-\${command.data.sessionId}\`;

        try {
          // TODO: Map fields from the incoming command to this integration input.
          // - Use relevant fields from \`command.data\` to populate the required inputs below.
          // - Some fields may require transformation or enrichment.
          // - If additional context is needed, construct it here.
          // const products: Products | undefined = await AI.Commands?.DoChat<Products>({
          //   type: 'DoChat',
          //   data: {
          //    // sessionId: ???
          // prompt: ???
          // systemPrompt: ???
          //   },
          // });

          await handler(eventStore, streamId, (state) =>
            // TODO: add products as a parameter to decide once implemented above
            decide(command, state /* products */),
          );
          return undefined; // success
        } catch (error: unknown) {
          return {
            type: 'SKIP',
            reason: \`Command failed: \${error instanceof Error ? error.message : 'Unknown'}\`,
          };
        }
      };
      "
    `);
  });
});
