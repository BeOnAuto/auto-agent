import { describe, it, expect } from 'vitest';
import { generateScaffoldFilePlans } from '../../scaffoldFromSchema';
import { Model as SpecsSchema } from '@auto-engineer/narrative';

describe('generateScaffoldFilePlans', () => {
  it('should generate a valid register file', async () => {
    const spec: SpecsSchema = {
      variant: 'specs',
      narratives: [
        {
          name: 'Host creates a listing',
          slices: [
            {
              type: 'command',
              name: 'Create listing',
              stream: 'listings-${propertyId}',
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
                                  title: 'Modern Downtown Apartment',
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
    const registerFile = plans.find((p) => p.outputPath.endsWith('register.ts'));

    expect(registerFile?.contents).toMatchInlineSnapshot(`
          "import type { CommandProcessor, EventStore } from '@event-driven-io/emmett';
          import { handle } from './handle';
          import type { CreateListing } from './commands';

          export function register(messageBus: CommandProcessor, eventStore: EventStore) {
            messageBus.handle<CreateListing>((command: CreateListing) => handle(eventStore, command), 'CreateListing');
          }
          "
        `);
  });
});
