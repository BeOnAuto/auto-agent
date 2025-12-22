import type { Event } from '@auto-engineer/message-bus';
import type { ForEachPhasedDescriptor } from '../core/descriptors';

export interface PipelineContext {
  emit: (type: string, data: unknown) => Promise<void>;
  sendCommand: (type: string, data: unknown) => Promise<void>;
  correlationId: string;
  startPhased?: (handler: ForEachPhasedDescriptor, event: Event) => void;
}

export interface RuntimeConfig {
  defaultTimeout?: number;
}
