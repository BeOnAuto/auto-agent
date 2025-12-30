import type { Slice } from '@auto-engineer/narrative';
import { extractGwtSpecsFromSlice } from './step-converter';
import type { EventExample, StateExample } from './step-types';

interface QueryGwtCondition {
  description: string;
  given?: EventExample[];
  when: EventExample[];
  then: Array<{ stateRef: string; exampleData: Record<string, unknown> }>;
}

export function buildQueryGwtMapping(slice: Slice): QueryGwtCondition[] {
  if (slice.type !== 'query') return [];

  const gwtSpecs = extractGwtSpecsFromSlice(slice);

  return gwtSpecs.map((gwt) => {
    const givenEvents = Array.isArray(gwt.given) ? gwt.given.filter((i): i is EventExample => 'eventRef' in i) : [];
    const whenEvents = Array.isArray(gwt.when) ? gwt.when.filter((i): i is EventExample => 'eventRef' in i) : [];

    return {
      description: gwt.description,
      given: givenEvents.length > 0 ? givenEvents : undefined,
      when: whenEvents,
      then: gwt.then.filter((i): i is StateExample => 'stateRef' in i),
    };
  });
}
