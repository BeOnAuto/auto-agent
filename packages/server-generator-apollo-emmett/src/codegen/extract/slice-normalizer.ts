import type { Slice, Spec } from '@auto-engineer/narrative';
import type { MessageDefinition } from '../types';
import {
  type CommandRef,
  type ErrorRef,
  type EventRef,
  extractGwtFromSpecs,
  type GwtConditionWithRule,
  getSliceType,
  type QueryActionRef,
  type SliceType,
  type StateRef,
} from './step-converter';

interface NormalizedExample {
  description: string;
  given: EventRef[];
  when: CommandRef | EventRef[] | QueryActionRef;
  then: Array<EventRef | StateRef | CommandRef | ErrorRef>;
}

interface NormalizedRule {
  description: string;
  examples: NormalizedExample[];
}

interface NormalizedSpecs {
  name: string;
  rules: NormalizedRule[];
}

function gwtToNormalizedExample(gwt: GwtConditionWithRule): NormalizedExample {
  return {
    description: gwt.description,
    given: gwt.given,
    when: gwt.when,
    then: gwt.then,
  };
}

function groupGwtByRule(gwtResults: GwtConditionWithRule[]): Map<string, GwtConditionWithRule[]> {
  const grouped = new Map<string, GwtConditionWithRule[]>();
  for (const gwt of gwtResults) {
    const existing = grouped.get(gwt.ruleDescription) ?? [];
    existing.push(gwt);
    grouped.set(gwt.ruleDescription, existing);
  }
  return grouped;
}

function normalizeReactPatternB(rules: NormalizedRule[], allMessages: MessageDefinition[]): void {
  for (const rule of rules) {
    for (const example of rule.examples) {
      if (!Array.isArray(example.when)) continue;
      const originalWhen = example.when[0];
      const whenRef = originalWhen?.eventRef;
      if (!whenRef) continue;
      const isRealEvent = allMessages.some((m) => m.type === 'event' && m.name === whenRef);
      if (isRealEvent) continue;
      const triggerIdx = example.given.findIndex((ref) =>
        allMessages.some((m) => m.type === 'event' && m.name === ref.eventRef),
      );
      if (triggerIdx === -1) continue;
      const triggerRef = example.given[triggerIdx];
      example.when = [triggerRef];
      example.given = example.given.filter((_, i) => i !== triggerIdx);
      const isRealCommand = allMessages.some((m) => m.type === 'command' && m.name === whenRef);
      if (isRealCommand) {
        example.then = [{ commandRef: whenRef, exampleData: originalWhen.exampleData }];
      }
    }
  }
}

function normalizeSpecsForTemplate(
  specs: Spec[],
  sliceType: SliceType,
  allMessages?: MessageDefinition[],
): NormalizedSpecs | null {
  if (specs.length === 0) return null;

  const gwtResults = extractGwtFromSpecs(specs, sliceType);
  const groupedByRule = groupGwtByRule(gwtResults);

  const featureName = specs[0]?.feature ?? '';

  const rules: NormalizedRule[] = Array.from(groupedByRule.entries()).map(([ruleName, gwts]) => ({
    description: ruleName,
    examples: gwts.map(gwtToNormalizedExample),
  }));

  if (sliceType === 'react' && allMessages) {
    normalizeReactPatternB(rules, allMessages);
  }

  return {
    name: featureName,
    rules,
  };
}

type SliceWithServer = Slice & { server?: { specs?: Spec[] } };
type NormalizedSlice<T extends SliceWithServer> = Omit<T, 'server'> & {
  server?: Omit<T['server'], 'specs'> & { specs?: NormalizedSpecs | null };
};

export function normalizeSliceForTemplate<T extends SliceWithServer>(
  slice: T,
  allMessages?: MessageDefinition[],
): NormalizedSlice<T> {
  if (!('server' in slice) || !slice.server?.specs) {
    return slice as NormalizedSlice<T>;
  }

  const sliceType = getSliceType(slice);
  const normalizedSpecs = normalizeSpecsForTemplate(slice.server.specs, sliceType, allMessages);

  return {
    ...slice,
    server: {
      ...slice.server,
      specs: normalizedSpecs,
    },
  } as NormalizedSlice<T>;
}
