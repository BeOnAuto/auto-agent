// Export only the DSL functions for use in auto.config.ts
export { autoConfig, dispatch, fold, getPipelineGraph, on } from './dsl/index';
export type {
  ConfigDefinition,
  DispatchAction,
  DslRegistration,
  EventRegistration,
  FoldRegistration,
  SettledHandlerConfig,
} from './dsl/types';
export type { CommandMetadata } from './server/command-metadata-service';
export { CommandMetadataService } from './server/command-metadata-service';
