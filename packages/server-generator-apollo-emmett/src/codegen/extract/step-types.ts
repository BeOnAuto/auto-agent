import type { Slice, Step, StepWithDocStringSchema, StepWithErrorSchema } from '@auto-engineer/narrative';
import type { z } from 'zod';

export type StepWithDocString = z.infer<typeof StepWithDocStringSchema>;
export type StepWithError = z.infer<typeof StepWithErrorSchema>;

export type StepKeyword = StepWithDocString['keyword'];
export type MajorKeyword = Exclude<StepKeyword, 'And'>;

export type ErrorType = StepWithError['error']['type'];

export type SliceType = Extract<Slice['type'], 'command' | 'query' | 'react'>;

export function getSliceType(slice: Slice): SliceType {
  if (slice.type === 'command' || slice.type === 'query' || slice.type === 'react') {
    return slice.type;
  }
  return 'command';
}

export function isStepWithDocString(step: Step): step is StepWithDocString {
  return 'text' in step;
}

export function isStepWithError(step: Step): step is StepWithError {
  return 'error' in step;
}

export function resolveMajorKeyword(keyword: StepKeyword, current: MajorKeyword): MajorKeyword {
  return keyword === 'And' ? current : keyword;
}

export interface CommandRef {
  commandRef: string;
  exampleData: Record<string, unknown>;
}

export interface EventRef {
  eventRef: string;
  exampleData: Record<string, unknown>;
}

export interface StateRef {
  stateRef: string;
  exampleData: Record<string, unknown>;
}

export interface ErrorRef {
  errorType: ErrorType;
  message?: string;
}
