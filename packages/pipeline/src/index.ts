export { define } from './builder/define';
export type {
  CompletionConfig,
  EmitChain,
  ForEachBuilder,
  GatherBuilder,
  GatherChain,
  HandleChain,
  HandleOptions,
  PhasedBuilder,
  PhasedChain,
  PhasedTerminal,
  Pipeline,
  PipelineBuilder,
  RunBuilder,
  TriggerBuilder,
} from './builder/define';

export { dispatch } from './core/types';
export type { Command, CommandDispatch, Event } from './core/types';

export type {
  CustomHandlerDescriptor,
  EmitHandlerDescriptor,
  EventPredicate,
  FailureContext,
  ForEachPhasedDescriptor,
  GatherEventConfig,
  HandlerDescriptor,
  KeyExtractor,
  PipelineDescriptor,
  RunAwaitHandlerDescriptor,
  SuccessContext,
} from './core/descriptors';

export type { GraphEdge, GraphIR, GraphNode, NodeType } from './graph/types';

export { PipelineRuntime } from './runtime/pipeline-runtime';
export type { PipelineContext, RuntimeConfig } from './runtime/context';

export { AwaitTracker } from './runtime/await-tracker';

export { PipelineServer } from './server/pipeline-server';
export type { PipelineServerConfig, CommandHandlerWithMetadata } from './server/pipeline-server';

export { SettledTracker } from './runtime/settled-tracker';
export { EventCommandMapper } from './runtime/event-command-map';
export { PhasedExecutor } from './runtime/phased-executor';
export { SSEManager } from './server/sse-manager';

export { EventLogger } from './logging/event-logger';
export type { LogEntry, EventLoggerOptions } from './logging/event-logger';

export {
  compareEventSequence,
  containsSubsequence,
  findMissingEvents,
  findUnexpectedEvents,
  formatSnapshotDiff,
} from './testing/snapshot-compare';
export type { SnapshotDiff, SnapshotResult } from './testing/snapshot-compare';
