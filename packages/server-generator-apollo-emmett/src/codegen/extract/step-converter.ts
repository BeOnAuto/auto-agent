import type { Example, Slice, Spec } from '@auto-engineer/narrative';
import {
  type CommandRef,
  detectQueryAction,
  type ErrorRef,
  type EventRef,
  getSliceType,
  isQueryAction,
  isStepWithDocString,
  isStepWithError,
  type MajorKeyword,
  type QueryActionRef,
  resolveMajorKeyword,
  type SliceType,
  type StateRef,
} from './step-types';

export type { CommandRef, EventRef, StateRef, ErrorRef, SliceType, QueryActionRef };
export { getSliceType, isQueryAction };

export interface GwtResult {
  given: EventRef[];
  when: CommandRef | EventRef[] | QueryActionRef;
  then: Array<EventRef | StateRef | CommandRef | ErrorRef>;
  description: string;
}

interface ParsedSteps {
  given: EventRef[];
  whenItems: Array<{ text: string; exampleData: Record<string, unknown> }>;
  thenItems: Array<{ text: string; exampleData: Record<string, unknown> }>;
  thenErrors: ErrorRef[];
}

function parseSteps(example: Example): ParsedSteps {
  const given: EventRef[] = [];
  const whenItems: Array<{ text: string; exampleData: Record<string, unknown> }> = [];
  const thenItems: Array<{ text: string; exampleData: Record<string, unknown> }> = [];
  const thenErrors: ErrorRef[] = [];

  let effectiveKeyword: MajorKeyword = 'Given';

  for (const step of example.steps) {
    if (isStepWithError(step)) {
      thenErrors.push({ errorType: step.error.type, message: step.error.message });
      continue;
    }

    if (!isStepWithDocString(step)) continue;

    effectiveKeyword = resolveMajorKeyword(step.keyword, effectiveKeyword);
    const exampleData = step.docString ?? {};

    if (effectiveKeyword === 'Given') {
      given.push({ eventRef: step.text, exampleData });
    } else if (effectiveKeyword === 'When') {
      whenItems.push({ text: step.text, exampleData });
    } else if (effectiveKeyword === 'Then') {
      thenItems.push({ text: step.text, exampleData });
    }
  }

  return { given, whenItems, thenItems, thenErrors };
}

function buildGwtResult(sliceType: SliceType, parsed: ParsedSteps, description: string, slice?: Slice): GwtResult {
  const { given, whenItems, thenItems, thenErrors } = parsed;

  if (sliceType === 'command') {
    return {
      given,
      when: { commandRef: whenItems[0]?.text ?? '', exampleData: whenItems[0]?.exampleData ?? {} },
      then: [...thenItems.map((t) => ({ eventRef: t.text, exampleData: t.exampleData })), ...thenErrors],
      description,
    };
  }

  if (sliceType === 'react') {
    return {
      given,
      when: whenItems.map((w) => ({ eventRef: w.text, exampleData: w.exampleData })),
      then: [...thenItems.map((t) => ({ commandRef: t.text, exampleData: t.exampleData })), ...thenErrors],
      description,
    };
  }

  if (sliceType === 'query' && slice && whenItems.length > 0) {
    const firstWhenText = whenItems[0]?.text ?? '';
    if (detectQueryAction(firstWhenText, slice)) {
      return {
        given,
        when: { queryAction: firstWhenText, args: whenItems[0]?.exampleData ?? {} },
        then: [...thenItems.map((t) => ({ stateRef: t.text, exampleData: t.exampleData })), ...thenErrors],
        description,
      };
    }
  }

  // Pattern 1: Event-based (default for queries without slice context, or when When is an event)
  return {
    given,
    when: whenItems.map((w) => ({ eventRef: w.text, exampleData: w.exampleData })),
    then: [...thenItems.map((t) => ({ stateRef: t.text, exampleData: t.exampleData })), ...thenErrors],
    description,
  };
}

export function stepsToGwt(example: Example, sliceType: SliceType, slice?: Slice): GwtResult {
  const parsed = parseSteps(example);
  return buildGwtResult(sliceType, parsed, example.name, slice);
}

export interface GwtConditionWithRule extends GwtResult {
  ruleDescription: string;
}

export function extractGwtFromSpecs(specs: Spec[], sliceType: SliceType, slice?: Slice): GwtConditionWithRule[] {
  const results: GwtConditionWithRule[] = [];

  for (const spec of specs) {
    for (const rule of spec.rules) {
      for (const example of rule.examples) {
        const gwt = stepsToGwt(example, sliceType, slice);
        results.push({
          ...gwt,
          ruleDescription: rule.name,
        });
      }
    }
  }

  return results;
}

export function extractGwtSpecsFromSlice(slice: Slice): GwtConditionWithRule[] {
  if (!('server' in slice)) return [];
  const specs = slice.server?.specs;
  if (!Array.isArray(specs) || specs.length === 0) return [];
  return extractGwtFromSpecs(specs, getSliceType(slice), slice);
}
