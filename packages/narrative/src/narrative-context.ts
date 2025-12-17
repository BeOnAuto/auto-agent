import createDebug from 'debug';
import type { DataSinkItem, DataSourceItem, DataItem, DataSink, DataSource } from './types';
import type { GivenTypeInfo } from './loader/ts-utils';
import { Narrative, Slice, CommandSlice, QuerySlice, ExperienceSlice } from './index';
import type { ClientSpecNode } from './schema';
import type { z } from 'zod';
import type { StepSchema, ExampleSchema, SpecSchema, RuleSchema } from './schema';

type Step = z.infer<typeof StepSchema>;
type Example = z.infer<typeof ExampleSchema>;
type Spec = z.infer<typeof SpecSchema>;
type Rule = z.infer<typeof RuleSchema>;

const debug = createDebug('auto:narrative:context:given-types');

type MajorKeyword = 'Given' | 'When' | 'Then';

interface NarrativeContext {
  narrative: Narrative;
  currentSliceIndex: number | null;
  currentSpecTarget: 'client' | 'server' | null;
  currentSpecIndex: number | null;
  currentRuleIndex: number | null;
  currentExampleIndex: number | null;
  clientSpecStack: ClientSpecNode[];
  lastMajorKeyword: MajorKeyword | null;
}

let context: NarrativeContext | null = null;
let givenTypesByFile: Map<string, GivenTypeInfo[]> = new Map();
let whenTypesByFile: Map<string, GivenTypeInfo[]> = new Map();
let thenTypesByFile: Map<string, GivenTypeInfo[]> = new Map();
const givenCallCounters: Map<string, number> = new Map();
const whenCallCounters: Map<string, number> = new Map();
const thenCallCounters: Map<string, number> = new Map();

export function setGivenTypesByFile(types: Map<string, GivenTypeInfo[]>): void {
  const whenTypes = types.get('__whenTypes') as Map<string, GivenTypeInfo[]> | undefined;
  if (whenTypes) {
    whenTypesByFile = whenTypes;
    types.delete('__whenTypes');
  }

  const thenTypes = types.get('__thenTypes') as Map<string, GivenTypeInfo[]> | undefined;
  if (thenTypes) {
    thenTypesByFile = thenTypes;
    types.delete('__thenTypes');
  }

  givenTypesByFile = types;
  givenCallCounters.clear();
  whenCallCounters.clear();
  thenCallCounters.clear();
}

export function startNarrative(name: string, id?: string): Narrative {
  const sourceFile = (globalThis as Record<string, unknown>).__aeCurrentModulePath as string | undefined;
  if (sourceFile !== null && sourceFile !== undefined && sourceFile !== '') {
    givenCallCounters.set(sourceFile, 0);
    whenCallCounters.set(sourceFile, 0);
    thenCallCounters.set(sourceFile, 0);
  }

  const narrative: Narrative = {
    name,
    id,
    slices: [],
    ...(typeof sourceFile === 'string' ? { sourceFile } : {}),
  };
  context = {
    narrative,
    currentSliceIndex: null,
    currentSpecTarget: null,
    currentSpecIndex: null,
    currentRuleIndex: null,
    currentExampleIndex: null,
    clientSpecStack: [],
    lastMajorKeyword: null,
  };
  return narrative;
}

export function getCurrentNarrative(): Narrative | null {
  return context?.narrative ?? null;
}

export function clearCurrentNarrative(): void {
  context = null;
}

export function getCurrentSlice(): Slice | null {
  if (!context || context.currentSliceIndex === null) return null;
  return context.narrative.slices[context.currentSliceIndex] ?? null;
}

export function addSlice(slice: Slice): void {
  if (!context) throw new Error('No active narrative');
  context.narrative.slices.push(slice);
  context.currentSliceIndex = context.narrative.slices.length - 1;
}

function getServerSpecs(slice: Slice): Spec[] | undefined {
  if ('server' in slice) {
    return slice.server?.specs;
  }
  return undefined;
}

function getCurrentSpec(slice: Slice): Spec | undefined {
  if (!context || context.currentSpecIndex === null) return undefined;
  const specs = getServerSpecs(slice);
  if (!specs) return undefined;
  return specs[context.currentSpecIndex];
}

function getCurrentExample(slice: Slice): Example | undefined {
  if (
    !context ||
    context.currentSpecIndex === null ||
    context.currentRuleIndex === null ||
    context.currentExampleIndex === null
  ) {
    return undefined;
  }

  const spec = getCurrentSpec(slice);
  if (!spec) return undefined;

  return spec.rules[context.currentRuleIndex]?.examples[context.currentExampleIndex];
}

export function startClientBlock(slice: Slice): void {
  if (!context) throw new Error('No active flow context');

  if (slice.type === 'command' || slice.type === 'query' || slice.type === 'experience') {
    slice.client = {
      specs: [],
    };
    context.currentSpecTarget = 'client';
    context.clientSpecStack = [];
  }
}

export function endClientBlock(): void {
  if (context) {
    if (context.clientSpecStack.length > 0) {
      const unclosedCount = context.clientSpecStack.length;
      const unclosedTitles = context.clientSpecStack
        .map((n) => {
          if (n.title !== undefined && n.title !== '') return n.title;
          if (n.id !== undefined && n.id !== '') return n.id;
          return 'unnamed';
        })
        .join(', ');
      throw new Error(`${unclosedCount} unclosed describe block(s): ${unclosedTitles}`);
    }
    context.currentSpecTarget = null;
    context.clientSpecStack = [];
  }
}

export function startServerBlock(slice: Slice, description: string = ''): void {
  if (!context) throw new Error('No active flow context');

  if (slice.type === 'command') {
    slice.server = {
      description,
      specs: [],
      data: undefined,
    };
  } else if (slice.type === 'query') {
    slice.server = {
      description,
      specs: [],
      data: undefined,
    };
  } else if (slice.type === 'react') {
    slice.server = {
      description: description || undefined,
      specs: [],
      data: undefined,
    };
  }

  context.currentSpecTarget = 'server';
}

export function endServerBlock(): void {
  if (context) {
    context.currentSpecTarget = null;
  }
}

function addServerSpec(slice: Slice, feature: string): void {
  if ('server' in slice && slice.server != null) {
    const newSpec: Spec = {
      type: 'gherkin',
      feature,
      rules: [],
    };
    slice.server.specs.push(newSpec);
    if (context) context.currentSpecIndex = slice.server.specs.length - 1;
  }
}

export function pushSpec(feature: string): void {
  if (!context || !context.currentSpecTarget) throw new Error('No active spec target');
  const slice = getCurrentSlice();
  if (!slice) throw new Error('No active slice');

  if (context.currentSpecTarget === 'server') {
    addServerSpec(slice, feature);
  }
}

export function pushDescribe(id?: string, title?: string): void {
  if (!context) throw new Error('No active narrative context');

  const describeNode: ClientSpecNode = {
    type: 'describe',
    ...(id !== undefined && id !== '' ? { id } : {}),
    ...(title !== undefined && title !== '' ? { title } : {}),
    children: [],
  };

  context.clientSpecStack.push(describeNode);
}

function validateSliceSupportsClientSpecs(slice: Slice): void {
  if (slice.type !== 'command' && slice.type !== 'query' && slice.type !== 'experience') {
    throw new Error('Client specs can only be added to command, query, or experience slices');
  }
}

function addNodeToParentOrRoot(node: ClientSpecNode, slice: CommandSlice | QuerySlice | ExperienceSlice): void {
  if (!context) return;

  if (context.clientSpecStack.length === 0) {
    slice.client.specs.push(node);
  } else {
    const parent = context.clientSpecStack[context.clientSpecStack.length - 1];
    if (parent.type === 'describe') {
      if (!parent.children) parent.children = [];
      parent.children.push(node);
    }
  }
}

export function popDescribe(): void {
  if (!context) throw new Error('No active narrative context');
  if (context.clientSpecStack.length === 0) throw new Error('No active describe block');

  const completedDescribe = context.clientSpecStack.pop();
  if (!completedDescribe) return;

  const slice = getCurrentSlice();
  if (!slice) throw new Error('No active slice');

  validateSliceSupportsClientSpecs(slice);
  addNodeToParentOrRoot(completedDescribe, slice as CommandSlice | QuerySlice | ExperienceSlice);
}

export function recordIt(id?: string, title: string = ''): void {
  if (!context) throw new Error('No active narrative context');

  const itNode: ClientSpecNode = {
    type: 'it',
    ...(id !== undefined && id !== '' ? { id } : {}),
    title,
  };

  const slice = getCurrentSlice();
  if (!slice) throw new Error('No active slice');

  validateSliceSupportsClientSpecs(slice);
  addNodeToParentOrRoot(itNode, slice as CommandSlice | QuerySlice | ExperienceSlice);
}

export function setQueryRequest(request: string): void {
  const slice = getCurrentSlice();
  if (!slice || slice.type !== 'query') throw new Error('Request can only be set on query slices');
  slice.request = request;
}

export function setSliceData(data: DataItem[]): void {
  const slice = getCurrentSlice();
  if (!slice) throw new Error('No active slice');
  const sinks = data.filter((item): item is DataSinkItem => item.__type === 'sink');
  const sources = data.filter((item): item is DataSourceItem => item.__type === 'source');

  if (slice.type === 'command') {
    // Command slices only have sinks in their data
    slice.server.data = sinks.length > 0 ? sinks : undefined;
  } else if (slice.type === 'query') {
    // Query slices only have sources in their data
    slice.server.data = sources.length > 0 ? sources : undefined;
  } else if (slice.type === 'react') {
    slice.server.data = data.length > 0 ? stripTypeDiscriminator(data) : undefined;
  }
}

function stripTypeDiscriminator(items: DataItem[]): (DataSink | DataSource)[] {
  return items.map((item) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { __type, ...rest } = item;
    return rest as DataSink | DataSource;
  });
}

export function recordRule(name: string, id?: string): void {
  if (!context || context.currentSpecIndex === null) throw new Error('No active spec context');
  const slice = getCurrentSlice();
  if (!slice) throw new Error('No active slice');

  const spec = getCurrentSpec(slice);
  if (!spec) throw new Error('No active specs for current slice');

  const newRule: Rule = {
    id,
    name,
    examples: [],
  };
  spec.rules.push(newRule);
  context.currentRuleIndex = spec.rules.length - 1;
}

export function recordExample(name: string, id?: string): void {
  if (!context || context.currentSpecIndex === null || context.currentRuleIndex === null) {
    throw new Error('No active rule context');
  }
  const slice = getCurrentSlice();
  if (!slice) throw new Error('No active slice');

  const spec = getCurrentSpec(slice);
  if (!spec) throw new Error('No active specs for current slice');

  const rule = spec.rules[context.currentRuleIndex];
  const newExample: Example = {
    id,
    name,
    steps: [],
  };
  rule.examples.push(newExample);
  context.currentExampleIndex = rule.examples.length - 1;
  context.lastMajorKeyword = null;
}

type StepKeyword = 'Given' | 'When' | 'Then' | 'And';
type ErrorType = 'IllegalStateError' | 'ValidationError' | 'NotFoundError';

function isValidSourceFile(sourceFile: string | null | undefined): sourceFile is string {
  return sourceFile !== null && sourceFile !== undefined && sourceFile !== '';
}

function isValidMatchingType(
  matchingType: import('./loader/ts-utils').GivenTypeInfo | undefined,
): matchingType is import('./loader/ts-utils').GivenTypeInfo {
  return matchingType !== null && matchingType !== undefined && matchingType.typeName !== '';
}

function resolveEffectiveKeyword(keyword: StepKeyword): MajorKeyword {
  if (keyword !== 'And') {
    return keyword;
  }
  return context?.lastMajorKeyword ?? 'Given';
}

function getTypesByFileForKeyword(keyword: MajorKeyword): Map<string, GivenTypeInfo[]> {
  if (keyword === 'Given') return givenTypesByFile;
  if (keyword === 'When') return whenTypesByFile;
  return thenTypesByFile;
}

function getCountersForKeyword(keyword: MajorKeyword): Map<string, number> {
  if (keyword === 'Given') return givenCallCounters;
  if (keyword === 'When') return whenCallCounters;
  return thenCallCounters;
}

function getTypeNameFromAST(effectiveKeyword: MajorKeyword): string | null {
  const sourceFile = context?.narrative.sourceFile;
  if (!isValidSourceFile(sourceFile)) {
    return null;
  }

  const typesByFile = getTypesByFileForKeyword(effectiveKeyword);
  const counters = getCountersForKeyword(effectiveKeyword);

  const currentCount = counters.get(sourceFile) ?? 0;
  counters.set(sourceFile, currentCount + 1);

  const types = typesByFile.get(sourceFile) || [];
  const matchingType = types[currentCount];

  if (isValidMatchingType(matchingType)) {
    debug(
      'AST match for %s keyword %s at ordinal %d: %s',
      sourceFile,
      effectiveKeyword,
      currentCount,
      matchingType.typeName,
    );
    return matchingType.typeName;
  }

  debug('No AST match for %s keyword %s at ordinal %d', sourceFile, effectiveKeyword, currentCount);
  return null;
}

function getActiveExampleContext(): { example: Example } {
  if (
    !context ||
    context.currentSpecIndex === null ||
    context.currentRuleIndex === null ||
    context.currentExampleIndex === null
  ) {
    throw new Error('No active example context');
  }
  const slice = getCurrentSlice();
  if (!slice) throw new Error('No active slice');
  const example = getCurrentExample(slice);
  if (!example) throw new Error('No active example for current slice');
  return { example };
}

export function recordStep(keyword: StepKeyword, text: string, data: unknown): void {
  const { example } = getActiveExampleContext();
  const effectiveKeyword = resolveEffectiveKeyword(keyword);

  if (keyword !== 'And') {
    context!.lastMajorKeyword = keyword as MajorKeyword;
  }

  const shouldInferType = text === 'InferredType';
  const typeName = shouldInferType ? (getTypeNameFromAST(effectiveKeyword) ?? 'InferredType') : text;

  const docString = typeof data === 'object' && data !== null ? (data as Record<string, unknown>) : undefined;

  const step: Step = {
    keyword,
    text: typeName,
    ...(docString !== undefined && Object.keys(docString).length > 0 ? { docString } : {}),
  };

  example.steps.push(step);
}

export function recordErrorStep(errorType: ErrorType, message?: string): void {
  const { example } = getActiveExampleContext();

  context!.lastMajorKeyword = 'Then';

  const step: Step = {
    keyword: 'Then',
    error: {
      type: errorType,
      ...(message !== undefined ? { message } : {}),
    },
  };

  example.steps.push(step);
}
