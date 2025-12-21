import type { Event } from '@auto-engineer/message-bus';
import type { CommandDispatch } from './types';

export type KeyExtractor = (event: Event) => string;

export type EventPredicate = (event: Event) => boolean;

export interface EmitHandlerDescriptor {
  type: 'emit';
  eventType: string;
  predicate?: EventPredicate;
  commands: CommandDispatch[];
}

export interface SuccessContext<T = unknown> {
  results: T[];
  duration: number;
  triggerEvent: Event;
}

export interface FailureContext<T = unknown> {
  failures: Array<{ key: string; error: unknown }>;
  successes: T[];
  triggerEvent: Event;
}

export interface GatherEventConfig<T = unknown> {
  eventType: string;
  dataFactory: (context: T) => Record<string, unknown>;
}

export interface RunAwaitHandlerDescriptor {
  type: 'run-await';
  eventType: string;
  predicate?: EventPredicate;
  commands: CommandDispatch[] | ((event: Event) => CommandDispatch[]);
  awaitConfig: {
    keyName: string;
    key: KeyExtractor;
    timeout?: number;
  };
  onSuccess?: GatherEventConfig<SuccessContext>;
  onFailure?: GatherEventConfig<FailureContext>;
}

export interface ForEachPhasedDescriptor {
  type: 'foreach-phased';
  eventType: string;
  predicate?: EventPredicate;
  itemsSelector: (event: Event) => unknown[];
  phases: readonly string[];
  classifier: (item: unknown) => string;
  stopOnFailure: boolean;
  emitFactory: (item: unknown, phase: string, event: Event) => CommandDispatch;
  completion: {
    successEvent: string;
    failureEvent: string;
    itemKey: KeyExtractor;
  };
}

export interface CustomHandlerDescriptor {
  type: 'custom';
  eventType: string;
  predicate?: EventPredicate;
  handler: (event: Event) => void | Promise<void>;
  declaredEmits?: string[];
}

export type HandlerDescriptor =
  | EmitHandlerDescriptor
  | RunAwaitHandlerDescriptor
  | ForEachPhasedDescriptor
  | CustomHandlerDescriptor;

export interface PipelineDescriptor {
  name: string;
  version?: string;
  description?: string;
  keys: Map<string, KeyExtractor>;
  handlers: HandlerDescriptor[];
}
