import type { Event, MessageBus } from '@auto-engineer/message-bus';
import type { InMemoryEventStore } from '@event-driven-io/emmett';
import type { ForEachPhasedDescriptor } from '../core/descriptors';

export interface PipelineContext {
  emit: (type: string, data: unknown) => Promise<void>;
  sendCommand: (type: string, data: unknown) => Promise<void>;
  correlationId: string;
  startPhased?: (handler: ForEachPhasedDescriptor, event: Event) => Promise<void>;
  eventStore?: InMemoryEventStore;
  messageBus?: MessageBus;
}

export interface RuntimeConfig {
  defaultTimeout?: number;
}
