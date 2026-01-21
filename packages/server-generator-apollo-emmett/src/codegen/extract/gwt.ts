import type { Slice } from '@auto-engineer/narrative';
import type { CommandRef, EventRef, GwtCondition } from '../types';
import { extractGwtSpecsFromSlice, type GwtConditionWithRule, type QueryActionRef } from './step-converter';

export function buildCommandGwtMapping(slice: Slice): Record<string, (GwtCondition & { failingFields?: string[] })[]> {
  if (slice.type !== 'command') {
    return {};
  }

  const gwtSpecs = extractGwtSpecsFromSlice(slice);
  const mapping = buildCommandMapping(gwtSpecs);
  return enhanceMapping(mapping);
}

function isCommandRef(when: CommandRef | EventRef[] | QueryActionRef): when is CommandRef {
  return !Array.isArray(when) && 'commandRef' in when;
}

function buildCommandMapping(gwtSpecs: GwtConditionWithRule[]) {
  const mapping: Record<string, GwtCondition[]> = {};

  for (const gwt of gwtSpecs) {
    if (!isCommandRef(gwt.when)) {
      continue;
    }
    const command = gwt.when.commandRef;
    if (typeof command === 'string' && command.length > 0) {
      mapping[command] = mapping[command] ?? [];
      mapping[command].push({
        given: gwt.given,
        when: gwt.when,
        then: gwt.then,
        description: gwt.description,
        ruleDescription: gwt.ruleDescription,
      });
    }
  }

  return mapping;
}

function enhanceMapping(mapping: Record<string, GwtCondition[]>) {
  const enhancedMapping: Record<string, (GwtCondition & { failingFields?: string[] })[]> = {};

  for (const command in mapping) {
    const conditions = mapping[command];
    const successfulData = findSuccessfulExampleData(conditions);

    enhancedMapping[command] = conditions.map((gwt) => ({
      ...gwt,
      failingFields: findFailingFields(gwt, successfulData),
    }));
  }

  return enhancedMapping;
}

function findSuccessfulExampleData(gwts: GwtCondition[]): Record<string, unknown> {
  const successful = gwts.find((gwt) => gwt.then.some((t) => typeof t === 'object' && t !== null && 'eventRef' in t));
  const whenData = Array.isArray(successful?.when) ? successful?.when[0]?.exampleData : successful?.when?.exampleData;
  return typeof whenData === 'object' && whenData !== null ? whenData : {};
}

function findFailingFields(gwt: GwtCondition, successfulData: Record<string, unknown>): string[] {
  const hasError = gwt.then.some((t) => typeof t === 'object' && t !== null && 'errorType' in t);

  if (!hasError) return [];

  const whenData = Array.isArray(gwt.when) ? gwt.when[0]?.exampleData : gwt.when?.exampleData;
  if (typeof whenData !== 'object' || whenData === null) return [];

  return Object.entries(whenData)
    .filter(([key, val]) => {
      const successVal = successfulData[key];
      return val === '' && successVal !== '' && successVal !== undefined;
    })
    .map(([key]) => key);
}
