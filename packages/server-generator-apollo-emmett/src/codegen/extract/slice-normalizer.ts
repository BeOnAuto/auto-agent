import type { Slice, Spec } from '@auto-engineer/narrative';
import {
  type CommandRef,
  type ErrorRef,
  type EventRef,
  extractGwtFromSpecs,
  type GwtConditionWithRule,
  getSliceType,
  type SliceType,
  type StateRef,
} from './step-converter';

interface NormalizedExample {
  description: string;
  given: EventRef[];
  when: CommandRef | EventRef[];
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

function normalizeSpecsForTemplate(specs: Spec[], sliceType: SliceType): NormalizedSpecs | null {
  if (specs.length === 0) return null;

  const gwtResults = extractGwtFromSpecs(specs, sliceType);
  const groupedByRule = groupGwtByRule(gwtResults);

  const featureName = specs[0]?.feature ?? '';

  const rules: NormalizedRule[] = Array.from(groupedByRule.entries()).map(([ruleName, gwts]) => ({
    description: ruleName,
    examples: gwts.map(gwtToNormalizedExample),
  }));

  return {
    name: featureName,
    rules,
  };
}

type SliceWithServer = Slice & { server?: { specs?: Spec[] } };
type NormalizedSlice<T extends SliceWithServer> = Omit<T, 'server'> & {
  server?: Omit<T['server'], 'specs'> & { specs?: NormalizedSpecs | null };
};

export function normalizeSliceForTemplate<T extends SliceWithServer>(slice: T): NormalizedSlice<T> {
  if (!('server' in slice) || !slice.server?.specs) {
    return slice as NormalizedSlice<T>;
  }

  const sliceType = getSliceType(slice);
  const normalizedSpecs = normalizeSpecsForTemplate(slice.server.specs, sliceType);

  return {
    ...slice,
    server: {
      ...slice.server,
      specs: normalizedSpecs,
    },
  } as NormalizedSlice<T>;
}
