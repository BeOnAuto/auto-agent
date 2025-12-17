import type { CommandRef, EventRef, StateRef, ErrorRef } from './extract/step-types';

export type { CommandRef, EventRef, StateRef, ErrorRef };

export interface Message {
  type: string;
  fields: Field[];
  source?: 'when' | 'given' | 'then';
  sourceFlowName?: string;
  sourceSliceName?: string;
}

export interface Field {
  name: string;
  tsType: string;
  required: boolean;
}

export interface MessageDefinition {
  type: 'command' | 'event' | 'state';
  name: string;
  fields?: Array<{
    name: string;
    type: string;
    required?: boolean;
    description?: string;
    defaultValue?: unknown;
  }>;
  metadata?: unknown;
  description?: string;
}

export interface GwtCondition {
  given?: EventRef[];
  when: CommandRef | EventRef[];
  then: Array<EventRef | StateRef | CommandRef | ErrorRef>;
  description?: string;
  ruleDescription?: string;
}
