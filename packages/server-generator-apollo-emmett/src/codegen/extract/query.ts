import type { Slice } from '@auto-engineer/narrative';
import type { EventRef, StateRef } from '../types';
import { extractGwtFromSpecs } from './step-converter';

interface QueryGwtCondition {
  description: string;
  given?: EventRef[];
  when: EventRef[];
  then: Array<StateRef>;
}

export function buildQueryGwtMapping(slice: Slice): QueryGwtCondition[] {
  if (slice.type !== 'query') return [];

  const specs = slice.server?.specs;
  if (!Array.isArray(specs) || specs.length === 0) return [];

  const gwtResults = extractGwtFromSpecs(specs, 'query');

  return gwtResults.map((gwt) => {
    const whenEvents: EventRef[] = Array.isArray(gwt.when) ? gwt.when : [];
    const thenStates = gwt.then.filter((i): i is StateRef => 'stateRef' in i);

    return {
      description: gwt.description,
      given: gwt.given.length > 0 ? gwt.given : undefined,
      when: whenEvents,
      then: thenStates,
    };
  });
}
