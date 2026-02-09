import type { Model, Narrative, Slice, Spec } from '@auto-engineer/narrative';

type StepBuckets = { given: string[]; when: string[]; then: string[] };

export function walkStepsByKeyword(specs: Spec[]): StepBuckets {
  const given = new Set<string>();
  const when = new Set<string>();
  const then = new Set<string>();

  for (const spec of specs) {
    for (const rule of spec.rules) {
      for (const example of rule.examples) {
        let lastMajor: 'given' | 'when' | 'then' = 'given';
        for (const step of example.steps) {
          if (!('text' in step)) continue;
          const keyword = step.keyword;
          if (keyword === 'Given') lastMajor = 'given';
          else if (keyword === 'When') lastMajor = 'when';
          else if (keyword === 'Then') lastMajor = 'then';
          const bucket = keyword === 'And' ? lastMajor : (keyword.toLowerCase() as 'given' | 'when' | 'then');
          if (bucket === 'given') given.add(step.text);
          else if (bucket === 'when') when.add(step.text);
          else then.add(step.text);
        }
      }
    }
  }

  return { given: [...given], when: [...when], then: [...then] };
}

function getServerSpecs(slice: Slice): Spec[] {
  if ('server' in slice && slice.server) return slice.server.specs;
  return [];
}

export function getReferencedMessageNames(slice: Slice): string[] {
  const names = new Set<string>();
  const specs = getServerSpecs(slice);
  const buckets = walkStepsByKeyword(specs);
  for (const text of [...buckets.given, ...buckets.when, ...buckets.then]) {
    names.add(text);
  }
  if ('server' in slice && slice.server?.data?.items) {
    for (const item of slice.server.data.items) {
      names.add(item.target.name);
    }
  }
  return [...names];
}

export function findEventSource(flows: Narrative[], eventName: string): { flowName: string; sliceName: string } | null {
  for (const flow of flows) {
    for (const slice of flow.slices) {
      if (slice.type !== 'command') continue;
      const buckets = walkStepsByKeyword(slice.server.specs);
      if (buckets.then.includes(eventName)) {
        return { flowName: flow.name, sliceName: slice.name };
      }
    }
  }
  return null;
}

export function findCommandSource(
  flows: Narrative[],
  commandName: string,
): { flowName: string; sliceName: string } | null {
  for (const flow of flows) {
    for (const slice of flow.slices) {
      if (slice.type !== 'command') continue;
      const buckets = walkStepsByKeyword(slice.server.specs);
      if (buckets.when.includes(commandName)) {
        return { flowName: flow.name, sliceName: slice.name };
      }
    }
  }
  return null;
}

type SourceLocation = { flowName: string; sliceName: string };

export function getEventSourceMap(slice: Slice, flows: Narrative[]): Record<string, SourceLocation> {
  const specs = getServerSpecs(slice);
  if (specs.length === 0) return {};

  const buckets = walkStepsByKeyword(specs);
  const consumedEvents: string[] = [];

  if (slice.type === 'command') {
    consumedEvents.push(...buckets.given);
  } else if (slice.type === 'react' || slice.type === 'query') {
    consumedEvents.push(...buckets.given, ...buckets.when);
  }

  const result: Record<string, SourceLocation> = {};
  for (const eventName of consumedEvents) {
    const source = findEventSource(flows, eventName);
    if (source) result[eventName] = source;
  }
  return result;
}

export function getCommandSourceMap(slice: Slice, flows: Narrative[]): Record<string, SourceLocation> {
  if (slice.type !== 'react') return {};

  const specs = getServerSpecs(slice);
  if (specs.length === 0) return {};

  const buckets = walkStepsByKeyword(specs);
  const result: Record<string, SourceLocation> = {};
  for (const cmdName of buckets.then) {
    const source = findCommandSource(flows, cmdName);
    if (source) result[cmdName] = source;
  }
  return result;
}

export function getReferencedIntegrations(slice: Slice, integrations?: Model['integrations']): Model['integrations'] {
  if (!integrations || !slice.via || slice.via.length === 0) return undefined;
  const viaSet = new Set(slice.via);
  const filtered = integrations.filter((i) => viaSet.has(i.name));
  return filtered.length > 0 ? filtered : undefined;
}

export function computeSharedTypesHash(messages: Model['messages']): string {
  const unionFields: string[] = [];
  for (const msg of messages) {
    for (const field of msg.fields) {
      if (field.type.includes("'") && field.type.includes('|')) {
        unionFields.push(`${msg.name}.${field.name}:${field.type}`);
      }
    }
  }
  return unionFields.join('|');
}
