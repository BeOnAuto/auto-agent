import createDebug from 'debug';
import {
  clearCurrentNarrative,
  endClientBlock,
  endServerBlock,
  getCurrentSlice,
  popDescribe,
  pushDescribe,
  pushSpec,
  recordErrorStep,
  recordExample,
  recordIt,
  recordRule,
  recordStep,
  setSliceData,
  startClientBlock,
  startNarrative,
  startServerBlock,
} from './narrative-context';
import { registry } from './narrative-registry';
import type { DataItem } from './types';

const debug = createDebug('auto:narrative:narrative');
if ('color' in debug && typeof debug === 'object') {
  (debug as { color: string }).color = '6';
}

export function narrative(name: string, fn: () => void): void;
export function narrative(name: string, id: string, fn: () => void): void;
export function narrative(name: string, idOrFn: string | (() => void), fn?: () => void): void {
  const id = typeof idOrFn === 'string' ? idOrFn : undefined;
  const callback = typeof idOrFn === 'function' ? idOrFn : fn!;

  debug('Starting narrative definition: %s', name);
  const narrativeObj = startNarrative(name, id);
  debug('Executing narrative function for: %s', name);
  callback();
  debug('Narrative function executed, registering narrative: %s with %d slices', name, narrativeObj.slices.length);
  registry.register(narrativeObj);
  clearCurrentNarrative();
  debug('Narrative registered and context cleared: %s', name);
}

export const client = (fn: () => void) => {
  const slice = getCurrentSlice();
  if (slice) {
    startClientBlock(slice);
    fn();
    endClientBlock();
  }
};

export const server = (fn: () => void) => {
  const slice = getCurrentSlice();
  if (slice) {
    startServerBlock(slice, '');
    fn();
    endServerBlock();
  }
};

export const request = (_query: unknown) => ({
  with: (..._dependencies: unknown[]) => {},
});

export function describe(fn: () => void): void;
export function describe(title: string, fn: () => void): void;
export function describe(title: string, id: string, fn: () => void): void;
export function describe(titleOrFn: string | (() => void), idOrFn?: string | (() => void), fn?: () => void): void {
  if (typeof titleOrFn === 'function') {
    const slice = getCurrentSlice();
    const inferredTitle = slice?.name ?? '';
    pushDescribe(inferredTitle, undefined);
    titleOrFn();
    popDescribe();
    return;
  }

  const title = titleOrFn;
  const hasId = typeof idOrFn === 'string';
  const id = hasId ? idOrFn : undefined;
  const callback = hasId ? fn! : (idOrFn as () => void);

  pushDescribe(title, id);
  callback();
  popDescribe();
}

export function it(title: string): void;
export function it(title: string, id: string): void;
export function it(title: string, id?: string): void {
  recordIt(title, id);
}

export function should(title: string): void;
export function should(title: string, id: string): void;
export function should(title: string, id?: string): void {
  recordIt(title, id);
}

export function specs(feature: string, fn: () => void): void;
export function specs(fn: () => void): void;
export function specs(featureOrFn: string | (() => void), fn?: () => void): void {
  const feature = typeof featureOrFn === 'string' ? featureOrFn : '';
  const callback = typeof featureOrFn === 'function' ? featureOrFn : fn!;

  pushSpec(feature);
  callback();
}

export function rule(name: string, fn: () => void): void;
export function rule(name: string, id: string, fn: () => void): void;
export function rule(name: string, idOrFn: string | (() => void), fn?: () => void): void {
  const id = typeof idOrFn === 'string' ? idOrFn : undefined;
  const callback = typeof idOrFn === 'function' ? idOrFn : fn!;
  recordRule(name, id);
  callback();
}

type ExtractData<T> = T extends { data: infer D } ? D : T;

export interface ThenBuilder {
  and<T>(data: ExtractData<T>): ThenBuilder;
}

export interface WhenBuilder {
  then<T>(data: ExtractData<T>): ThenBuilder;
  and<T>(data: ExtractData<T>): WhenBuilder;
}

export interface GivenBuilder {
  and<T>(data: ExtractData<T>): GivenBuilder;
  when<W>(data: ExtractData<W>): WhenBuilder;
  then<T>(data: ExtractData<T>): ThenBuilder;
}

export interface ExampleBuilder {
  given<T>(data: ExtractData<T>): GivenBuilder;
  when<W>(data: ExtractData<W>): WhenBuilder;
}

function createThenBuilder(): ThenBuilder {
  return {
    and<T>(data: ExtractData<T>): ThenBuilder {
      recordStep('And', 'InferredType', data);
      return createThenBuilder();
    },
  };
}

function createWhenBuilder(): WhenBuilder {
  return {
    then<T>(data: ExtractData<T>): ThenBuilder {
      recordStep('Then', 'InferredType', data);
      return createThenBuilder();
    },
    and<T>(data: ExtractData<T>): WhenBuilder {
      recordStep('And', 'InferredType', data);
      return createWhenBuilder();
    },
  };
}

function createGivenBuilder(): GivenBuilder {
  return {
    and<T>(data: ExtractData<T>): GivenBuilder {
      recordStep('And', 'InferredType', data);
      return createGivenBuilder();
    },
    when<W>(data: ExtractData<W>): WhenBuilder {
      recordStep('When', 'InferredType', data);
      return createWhenBuilder();
    },
    then<T>(data: ExtractData<T>): ThenBuilder {
      recordStep('Then', 'InferredType', data);
      return createThenBuilder();
    },
  };
}

function createExampleBuilder(): ExampleBuilder {
  return {
    given<T>(data: ExtractData<T>): GivenBuilder {
      recordStep('Given', 'InferredType', data);
      return createGivenBuilder();
    },
    when<W>(data: ExtractData<W>): WhenBuilder {
      recordStep('When', 'InferredType', data);
      return createWhenBuilder();
    },
  };
}

export function example(name: string): ExampleBuilder;
export function example(name: string, id: string): ExampleBuilder;
export function example(name: string, id?: string): ExampleBuilder {
  recordExample(name, id);
  return createExampleBuilder();
}

type ErrorType = 'IllegalStateError' | 'ValidationError' | 'NotFoundError';

export function thenError(errorType: ErrorType, message?: string): void {
  recordErrorStep(errorType, message);
}

export const SliceType = {
  COMMAND: 'command' as const,
  QUERY: 'query' as const,
  REACT: 'react' as const,
} as const;

export interface SliceTypeValueInterface {
  readonly value: 'command' | 'query' | 'react';
}

export function data(items: DataItem[]): void {
  const slice = getCurrentSlice();
  if (!slice) throw new Error('No active slice for data configuration');

  const sliceType = slice.type;

  if (sliceType === SliceType.QUERY) {
    const hasSink = items.some((item) => '__type' in item && item.__type === 'sink');
    if (hasSink) {
      throw new Error('Query slices cannot have data sinks, only sources');
    }
  }

  setSliceData(items);
}

export { narrative as flow };
