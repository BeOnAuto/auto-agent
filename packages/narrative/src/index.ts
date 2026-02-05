export { gql } from 'graphql-tag';
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
  Query,
  State,
} from './types';
export { createIntegration } from './types';

export const get = (strings: TemplateStringsArray, ...values: unknown[]) => {
  return strings.reduce((result, str, i) => {
    const value = values[i];
    return result + str + (value !== undefined && value !== null ? String(value) : '');
  }, '');
};

export type { ExportSchemaEvents } from './commands/export-schema';
export type { FieldSelector } from './data-narrative-builders';

export { sink, source } from './data-narrative-builders';
export type {
  FluentCommandSliceBuilder,
  FluentExperienceSliceBuilder,
  FluentQuerySliceBuilder,
  FluentReactionSliceBuilder,
} from './fluent-builder';
export { command, decide, evolve, experience, query, react } from './fluent-builder';
export { getNarratives } from './getNarratives';
export { addAutoIds, hasAllIds } from './id';
export type { ExampleBuilder, GivenBuilder, SliceTypeValueInterface, ThenBuilder, WhenBuilder } from './narrative';
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
export * from './schema';
export { createNarrativeSpec, given as testGiven, when as testWhen } from './testing';
export type { GeneratedNarratives } from './transformers/model-to-narrative';
export { modelToNarrative } from './transformers/model-to-narrative';

export { detectQueryAction, extractQueryNameFromRequest } from './transformers/narrative-to-model/spec-processors';
