import type { Example, Slice, Spec } from '@auto-engineer/narrative';
import {
  type CommandExample,
  type ErrorRef,
  type EventExample,
  getSliceType,
  isStepWithDocString,
  isStepWithError,
  type MajorKeyword,
  resolveMajorKeyword,
  type SliceType,
  type StateExample,
} from './step-types';

export type { CommandExample, ErrorRef, EventExample, SliceType, StateExample };
export { getSliceType };

export interface GwtResult {
  given: EventExample[];
  when: CommandExample | EventExample[];
  then: Array<EventExample | StateExample | CommandExample | ErrorRef>;
  description: string;
}

interface ParsedSteps {
  given: EventExample[];
  whenItems: Array<{ text: string; exampleData: Record<string, unknown> }>;
  thenItems: Array<{ text: string; exampleData: Record<string, unknown> }>;
  thenErrors: ErrorRef[];
}

function parseSteps(example: Example): ParsedSteps {
  const given: EventExample[] = [];
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

function buildGwtResult(sliceType: SliceType, parsed: ParsedSteps, description: string): GwtResult {
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

  return {
    given,
    when: whenItems.map((w) => ({ eventRef: w.text, exampleData: w.exampleData })),
    then: [...thenItems.map((t) => ({ stateRef: t.text, exampleData: t.exampleData })), ...thenErrors],
    description,
  };
}

export function stepsToGwt(example: Example, sliceType: SliceType): GwtResult {
  const parsed = parseSteps(example);
  return buildGwtResult(sliceType, parsed, example.name);
}

export interface GwtConditionWithRule extends GwtResult {
  ruleDescription: string;
}

export function extractGwtFromSpecs(specs: Spec[], sliceType: SliceType): GwtConditionWithRule[] {
  const results: GwtConditionWithRule[] = [];

  for (const spec of specs) {
    for (const rule of spec.rules) {
      for (const example of rule.examples) {
        const gwt = stepsToGwt(example, sliceType);
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
  return extractGwtFromSpecs(specs, getSliceType(slice));
}
