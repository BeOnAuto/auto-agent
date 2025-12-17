import { z } from 'zod';

// Core types and utilities
export type {
  Integration,
  DataSink,
  DataSource,
  DataSinkItem,
  DataSourceItem,
  DataItem,
  MessageTarget,
  Destination,
  Origin,
  State,
  Command,
  Event,
} from './types';
export { MessageTargetSchema, DataSinkSchema, DataSourceSchema } from './schema';
export { createIntegration } from './types';

// Apollo GraphQL
export { gql } from 'graphql-tag';

// HTTP GET template literal function
export const get = (strings: TemplateStringsArray, ...values: unknown[]) => {
  return strings.reduce((result, str, i) => {
    const value = values[i];
    return result + str + (value !== undefined && value !== null ? String(value) : '');
  }, '');
};

// Fluent API
export type {
  FluentCommandSliceBuilder,
  FluentQuerySliceBuilder,
  FluentReactionSliceBuilder,
  FluentExperienceSliceBuilder,
} from './fluent-builder';
export { command, query, react, experience, decide, evolve } from './fluent-builder';

// Data narrative builders
export { sink, source } from './data-narrative-builders';
export type { FieldSelector } from './data-narrative-builders';

// Narrative language functions
export { narrative, narrative as flow } from './narrative';
export { client, server, specs, describe, it, should, request, data, rule, example, thenError } from './narrative';
export type { ExampleBuilder, GivenBuilder, WhenBuilder, ThenBuilder } from './narrative';
export type { SliceTypeValueInterface } from './narrative';
export { SliceType } from './narrative';

// Narrative conversion utilities
export { getNarratives } from './getNarratives';
export { modelToNarrative } from './transformers/model-to-narrative';

export type { ExportSchemaEvents } from './commands/export-schema';

// Testing helpers
export { createNarrativeSpec, given as testGiven, when as testWhen } from './testing';

// Schema definitions for progressive narrative creation
export {
  NarrativeNamesSchema as NarrativeNamesSystemSchema,
  SliceNamesSchema as SliceNamesSystemSchema,
  ClientServerNamesSchema as ClientServerNamesSystemSchema,
  modelSchema as SpecsSystemSchema,
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
  modelSchema,
  ExampleSchema,
  RuleSchema,
  SpecSchema,
  StepSchema,
  StepErrorSchema,
  StepWithDocStringSchema,
  StepWithErrorSchema,
} from './schema';

import {
  NarrativeSchema,
  SliceSchema,
  modelSchema,
  QuerySliceSchema,
  ReactSliceSchema,
  ExperienceSliceSchema,
  MessageSchema,
  MessageFieldSchema,
  CommandSliceSchema,
  ExampleSchema,
  RuleSchema,
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
export type { ClientSpecNode } from './schema';

// ID assignment utilities
export { addAutoIds, hasAllIds } from './id';
