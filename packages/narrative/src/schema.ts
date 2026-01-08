import { z } from 'zod';

// Message reference for module type ownership
export const MessageRefSchema = z
  .object({
    kind: z.enum(['command', 'event', 'state']).describe('Message kind'),
    name: z.string().describe('Message name'),
  })
  .describe('Reference to a message type');

// Module schema for type ownership and file grouping
export const ModuleSchema = z
  .object({
    id: z.string().describe('Unique module identifier. For derived modules, equals sourceFile'),
    sourceFile: z.string().describe('Output file path for this module'),
    isDerived: z.boolean().describe('True if auto-derived from sourceFile grouping, false if user-authored'),
    contains: z
      .object({
        narrativeIds: z.array(z.string()).describe('IDs of narratives in this module'),
      })
      .describe('Narratives contained in this module'),
    declares: z
      .object({
        messages: z.array(MessageRefSchema).describe('Message types owned by this module'),
      })
      .describe('Types declared/owned by this module'),
  })
  .describe('Module for grouping narratives and owning types');

const IntegrationSchema = z
  .object({
    name: z.string().describe('Integration name (e.g., MailChimp, Twilio)'),
    description: z.string().optional(),
    source: z.string().describe('integration module source (e.g., @auto-engineer/mailchimp-integration)'),
  })
  .describe('External service integration configuration');

// Data flow schemas for unified architecture
export const MessageTargetSchema = z
  .object({
    type: z.enum(['Event', 'Command', 'State']).describe('Type of message to target'),
    name: z.string().describe('Name of the specific message'),
    fields: z.record(z.unknown()).optional().describe('Field selector for partial message targeting'),
  })
  .describe('Target message with optional field selection');

export const DestinationSchema = z
  .discriminatedUnion('type', [
    z.object({
      type: z.literal('stream'),
      pattern: z.string().describe('Stream pattern with interpolation (e.g., listing-${propertyId})'),
    }),
    z.object({
      type: z.literal('integration'),
      systems: z.array(z.string()).describe('Integration names to send to'),
      message: z
        .object({
          name: z.string(),
          type: z.enum(['command', 'query', 'reaction']),
        })
        .optional(),
    }),
    z.object({
      type: z.literal('database'),
      collection: z.string().describe('Database collection name'),
    }),
    z.object({
      type: z.literal('topic'),
      name: z.string().describe('Message topic/queue name'),
    }),
  ])
  .describe('Destination for outbound data');

export const OriginSchema = z
  .discriminatedUnion('type', [
    z.object({
      type: z.literal('projection'),
      name: z.string(),
      idField: z
        .union([z.string(), z.array(z.string())])
        .optional()
        .describe(
          'Field(s) from event used as the projection unique identifier. Can be single field or array for composite keys. Omit for singleton projections.',
        ),
      singleton: z
        .boolean()
        .optional()
        .describe(
          'True if this is a singleton projection that aggregates data from multiple entities into one document',
        ),
    }),
    z.object({
      type: z.literal('readModel'),
      name: z.string().describe('Read model name'),
    }),
    z.object({
      type: z.literal('database'),
      collection: z.string().describe('Database collection name'),
      query: z.unknown().optional().describe('Optional query filter'),
    }),
    z.object({
      type: z.literal('api'),
      endpoint: z.string().describe('API endpoint URL'),
      method: z.string().optional().describe('HTTP method (defaults to GET)'),
    }),
    z.object({
      type: z.literal('integration'),
      systems: z.array(z.string()),
    }),
  ])
  .describe('Origin for inbound data');

const DataSinkSchema = z
  .object({
    id: z.string().optional().describe('Optional unique identifier for the data sink'),
    target: MessageTargetSchema,
    destination: DestinationSchema,
    transform: z.string().optional().describe('Optional transformation function name'),
    _additionalInstructions: z.string().optional().describe('Additional instructions'),
    _withState: z
      .lazy(() => DataSourceSchema)
      .optional()
      .describe('Optional state data source for command'),
  })
  .describe('Data sink configuration for outbound data flow');

const DataSourceSchema = z
  .object({
    id: z.string().optional().describe('Optional unique identifier for the data source'),
    target: MessageTargetSchema,
    origin: OriginSchema,
    transform: z.string().optional().describe('Optional transformation function name'),
    _additionalInstructions: z.string().optional().describe('Additional instructions'),
  })
  .describe('Data source configuration for inbound data flow');

export const DataSchema = z
  .object({
    id: z.string().optional().describe('Optional unique identifier for the data configuration'),
    items: z.array(z.union([DataSinkSchema, DataSourceSchema])).describe('Array of data sinks and sources'),
  })
  .describe('Data configuration containing sinks and sources');

const MessageFieldSchema = z
  .object({
    name: z.string(),
    type: z.string().describe('Field type (e.g., string, number, Date, UUID, etc.)'),
    required: z.boolean().default(true),
    description: z.string().optional(),
    defaultValue: z.unknown().optional().describe('Default value for optional fields'),
  })
  .describe('Field definition for a message');

const BaseMessageSchema = z.object({
  name: z.string().describe('Message name'),
  fields: z.array(MessageFieldSchema),
  description: z.string().optional(),
  metadata: z
    .object({
      version: z.number().default(1).describe('Version number for schema evolution'),
    })
    .optional(),
});

const CommandSchema = BaseMessageSchema.extend({
  type: z.literal('command'),
}).describe('Command that triggers state changes');

const EventSchema = BaseMessageSchema.extend({
  type: z.literal('event'),
  source: z.enum(['internal', 'external']).default('internal'),
}).describe('Event representing something that has happened');

const StateSchema = BaseMessageSchema.extend({
  type: z.literal('state'),
}).describe('State/Read Model representing a view of data');

const MessageSchema = z.discriminatedUnion('type', [CommandSchema, EventSchema, StateSchema]);

const BaseSliceSchema = z
  .object({
    name: z.string(),
    id: z.string().optional().describe('Optional unique identifier for the slice'),
    description: z.string().optional(),
    stream: z.string().optional().describe('Event stream pattern for this slice'),
    via: z.array(z.string()).optional().describe('Integration names used by this slice'),
    additionalInstructions: z.string().optional().describe('Additional instructions'),
  })
  .describe('Base properties shared by all slice types');

const StepErrorSchema = z.object({
  type: z.enum(['IllegalStateError', 'ValidationError', 'NotFoundError']).describe('Error type'),
  message: z.string().optional().describe('Optional error message'),
});

const StepWithDocStringSchema = z.object({
  id: z.string().optional().describe('Optional unique identifier for the step'),
  keyword: z.enum(['Given', 'When', 'Then', 'And']).describe('Gherkin keyword'),
  text: z.string().describe('The type name (e.g., AddTodo, TodoAdded)'),
  docString: z.record(z.unknown()).optional().describe('The example data'),
});

const StepWithErrorSchema = z.object({
  id: z.string().optional().describe('Optional unique identifier for the step'),
  keyword: z.literal('Then').describe('Error steps use Then keyword'),
  error: StepErrorSchema.describe('Error details'),
});

const StepSchema = z.union([StepWithDocStringSchema, StepWithErrorSchema]).describe('A Gherkin step');

const ExampleSchema = z
  .object({
    id: z.string().optional().describe('Unique example identifier'),
    name: z.string().describe('Example name'),
    steps: z.array(StepSchema).describe('Gherkin steps for this example'),
  })
  .describe('BDD example with Gherkin steps');

const RuleSchema = z
  .object({
    id: z.string().optional().describe('Unique rule identifier'),
    name: z.string().describe('Rule name'),
    examples: z.array(ExampleSchema).describe('Examples demonstrating the rule'),
  })
  .describe('Business rule with examples');

const SpecSchema = z
  .object({
    id: z.string().optional().describe('Optional unique identifier for the spec'),
    type: z.literal('gherkin').describe('Specification type'),
    feature: z.string().describe('Feature name'),
    rules: z.array(RuleSchema).describe('Business rules for this spec'),
  })
  .describe('Gherkin specification with business rules');

const ItNode = z
  .object({
    type: z.literal('it'),
    id: z.string().optional(),
    title: z.string(),
  })
  .strict();

type ClientSpecNode =
  | { type: 'it'; id?: string; title: string }
  | { type: 'describe'; id?: string; title?: string; children?: ClientSpecNode[] };

export const ClientSpecNodeSchema: z.ZodType<ClientSpecNode> = z.lazy(() =>
  z.union([
    ItNode,
    z
      .object({
        type: z.literal('describe'),
        id: z.string().optional(),
        title: z.string().optional(),
        children: z.array(ClientSpecNodeSchema).default([]),
      })
      .strict(),
  ]),
);

export const ClientSpecSchema = z.array(ClientSpecNodeSchema).default([]);

const CommandSliceSchema = BaseSliceSchema.extend({
  type: z.literal('command'),
  client: z.object({
    specs: ClientSpecSchema,
  }),
  request: z.string().describe('Command request (GraphQL, REST endpoint, or other query format)').optional(),
  server: z.object({
    description: z.string(),
    data: DataSchema.optional().describe('Data configuration for command slices'),
    specs: z.array(SpecSchema).describe('Server-side specifications with rules and examples'),
  }),
}).describe('Command slice handling user actions and business logic');

const QuerySliceSchema = BaseSliceSchema.extend({
  type: z.literal('query'),
  client: z.object({
    specs: ClientSpecSchema,
  }),
  request: z.string().describe('Query request (GraphQL, REST endpoint, or other query format)').optional(),
  server: z.object({
    description: z.string(),
    data: DataSchema.optional().describe('Data configuration for query slices'),
    specs: z.array(SpecSchema).describe('Server-side specifications with rules and examples'),
  }),
}).describe('Query slice for reading data and maintaining projections');

const ReactSliceSchema = BaseSliceSchema.extend({
  type: z.literal('react'),
  server: z.object({
    description: z.string().optional(),
    data: DataSchema.optional().describe('Data configuration for react slices'),
    specs: z.array(SpecSchema).describe('Server-side specifications with rules and examples'),
  }),
}).describe('React slice for automated responses to events');

const ExperienceSliceSchema = BaseSliceSchema.extend({
  type: z.literal('experience'),
  client: z.object({
    specs: ClientSpecSchema,
  }),
}).describe('Experience slice for user interactions and UI behavior');

const SliceSchema = z.discriminatedUnion('type', [
  CommandSliceSchema,
  QuerySliceSchema,
  ReactSliceSchema,
  ExperienceSliceSchema,
]);

const NarrativeSchema = z
  .object({
    name: z.string(),
    id: z.string().optional().describe('Optional unique identifier for the narrative'),
    description: z.string().optional(),
    slices: z.array(SliceSchema),
    sourceFile: z.string().optional(),
  })
  .describe('Business narrative containing related slices');

// Variant 1: Just narrative names
const NarrativeNamesOnlySchema = z
  .object({
    name: z.string(),
    id: z.string().optional().describe('Optional unique identifier for the narrative'),
    description: z.string().optional(),
  })
  .describe('Narrative with just name for initial planning');

// Variant 2: Narrative with slice names
const SliceNamesOnlySchema = z
  .object({
    name: z.string(),
    id: z.string().optional().describe('Optional unique identifier for the slice'),
    description: z.string().optional(),
    type: z.enum(['command', 'query', 'react']),
  })
  .describe('Slice with just name and type for structure planning');

const NarrativeWithSliceNamesSchema = z
  .object({
    name: z.string(),
    id: z.string().optional().describe('Optional unique identifier for the narrative'),
    description: z.string().optional(),
    slices: z.array(SliceNamesOnlySchema),
  })
  .describe('Narrative with slice names for structure planning');

// Variant 3: Narrative with client & server names
const ClientServerNamesSliceSchema = z
  .object({
    name: z.string(),
    id: z.string().optional().describe('Optional unique identifier for the slice'),
    type: z.enum(['command', 'query', 'react']),
    description: z.string().optional(),
    client: z
      .object({
        description: z.string(),
      })
      .optional(),
    server: z
      .object({
        description: z.string(),
      })
      .optional(),
  })
  .describe('Slice with client/server descriptions for behavior planning');

const NarrativeWithClientServerNamesSchema = z
  .object({
    name: z.string(),
    id: z.string().optional().describe('Optional unique identifier for the narrative'),
    description: z.string().optional(),
    slices: z.array(ClientServerNamesSliceSchema),
  })
  .describe('Narrative with client/server descriptions for behavior planning');

// Variant 4: Full specs (uses existing schemas)

export const NarrativeNamesSchema = z
  .object({
    variant: z.literal('narrative-names').describe('Just narrative names for initial ideation'),
    narratives: z.array(NarrativeNamesOnlySchema),
  })
  .describe('System with just flow names for initial planning');

export const SliceNamesSchema = z
  .object({
    variant: z.literal('slice-names').describe('Narratives with slice names for structure planning'),
    narratives: z.array(NarrativeWithSliceNamesSchema),
  })
  .describe('System with narrative and slice names for structure planning');

export const ClientServerNamesSchema = z
  .object({
    variant: z.literal('client-server-names').describe('Narratives with client/server descriptions'),
    narratives: z.array(NarrativeWithClientServerNamesSchema),
  })
  .describe('System with client/server descriptions for behavior planning');

export const modelSchema = z
  .object({
    variant: z.literal('specs').describe('Full specification with all details'),
    narratives: z.array(NarrativeSchema),
    messages: z.array(MessageSchema),
    integrations: z.array(IntegrationSchema).optional(),
    modules: z.array(ModuleSchema).describe('Modules for type ownership and file grouping'),
  })
  .describe('Complete system specification with all implementation details');

export type { ClientSpecNode };

export {
  MessageFieldSchema,
  MessageSchema,
  CommandSchema,
  EventSchema,
  StateSchema,
  IntegrationSchema,
  CommandSliceSchema,
  QuerySliceSchema,
  ReactSliceSchema,
  ExperienceSliceSchema,
  SliceSchema,
  NarrativeSchema,
  ExampleSchema,
  RuleSchema,
  SpecSchema,
  DataSinkSchema,
  DataSourceSchema,
  StepSchema,
  StepErrorSchema,
  StepWithDocStringSchema,
  StepWithErrorSchema,
};
