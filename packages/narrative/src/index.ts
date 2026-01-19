import type { z } from 'zod';

// Republished to fix workspace:* dependency resolution in 1.3.0

// Apollo GraphQL
export { gql } from 'graphql-tag';
export { DataSchema, DataSinkSchema, DataSourceSchema, MessageTargetSchema } from './schema';
// Core types and utilities
export type {
  Command,
  Data,
  DataItem,
  DataSink,
  DataSinkItem,
  DataSource,
  DataSourceItem,
  Destination,
  Event,
  Integration,
  MessageTarget,
  Origin,
  State,
} from './types';
export { createIntegration } from './types';

// HTTP GET template literal function
export const get = (strings: TemplateStringsArray, ...values: unknown[]) => {
  return strings.reduce((result, str, i) => {
    const value = values[i];
    return result + str + (value !== undefined && value !== null ? String(value) : '');
  }, '');
};

export type { ExportSchemaEvents } from './commands/export-schema';
export type { FieldSelector } from './data-narrative-builders';

// Data narrative builders
export { sink, source } from './data-narrative-builders';
// Fluent API
export type {
  FluentCommandSliceBuilder,
  FluentExperienceSliceBuilder,
  FluentQuerySliceBuilder,
  FluentReactionSliceBuilder,
} from './fluent-builder';
export { command, decide, evolve, experience, query, react } from './fluent-builder';
// Narrative conversion utilities
export { getNarratives } from './getNarratives';
export type { ExampleBuilder, GivenBuilder, SliceTypeValueInterface, ThenBuilder, WhenBuilder } from './narrative';
// Narrative language functions
export {
  client,
  data,
  describe,
  example,
  it,
  narrative,
  narrative as flow,
  request,
  rule,
  SliceType,
  server,
  should,
  specs,
  thenError,
} from './narrative';
// Schema definitions for progressive narrative creation
export {
  ClientServerNamesSchema as ClientServerNamesSystemSchema,
  CommandSchema,
  CommandSliceSchema,
  EventSchema,
  ExampleSchema,
  ExperienceSliceSchema,
  IntegrationSchema,
  MessageFieldSchema,
  MessageRefSchema,
  MessageSchema,
  ModuleSchema,
  modelSchema as SpecsSystemSchema,
  modelSchema,
  NarrativeNamesSchema as NarrativeNamesSystemSchema,
  NarrativeSchema,
  QuerySliceSchema,
  ReactSliceSchema,
  RuleSchema,
  SliceNamesSchema as SliceNamesSystemSchema,
  SliceSchema,
  SpecSchema,
  StateSchema,
  StepErrorSchema,
  StepSchema,
  StepWithDocStringSchema,
  StepWithErrorSchema,
} from './schema';

// Testing helpers
export { createNarrativeSpec, given as testGiven, when as testWhen } from './testing';
export type { GeneratedNarratives } from './transformers/model-to-narrative';
export { modelToNarrative } from './transformers/model-to-narrative';

import type {
  CommandSliceSchema,
  ExampleSchema,
  ExperienceSliceSchema,
  MessageFieldSchema,
  MessageRefSchema,
  MessageSchema,
  ModuleSchema,
  modelSchema,
  NarrativeSchema,
  QuerySliceSchema,
  ReactSliceSchema,
  RuleSchema,
  SliceSchema,
  SpecSchema,
  StepSchema,
} from './schema';
export type Model = z.infer<typeof modelSchema>;
export type Narrative = z.infer<typeof NarrativeSchema>;
export type Slice = z.infer<typeof SliceSchema>;
export type QuerySlice = z.infer<typeof QuerySliceSchema>;
export type ReactSlice = z.infer<typeof ReactSliceSchema>;
export type CommandSlice = z.infer<typeof CommandSliceSchema>;
export type ExperienceSlice = z.infer<typeof ExperienceSliceSchema>;
export type Message = z.infer<typeof MessageSchema>;
export type Example = z.infer<typeof ExampleSchema>;
export type MessageField = z.infer<typeof MessageFieldSchema>;
export type Rule = z.infer<typeof RuleSchema>;
export type Spec = z.infer<typeof SpecSchema>;
export type Step = z.infer<typeof StepSchema>;
export type Module = z.infer<typeof ModuleSchema>;
export type MessageRef = z.infer<typeof MessageRefSchema>;

// ID assignment utilities
export { addAutoIds, hasAllIds } from './id';
export type { ClientSpecNode } from './schema';
