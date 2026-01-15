import type { ClientSpecNode, Example, Model, Rule, Slice, Spec, Step } from '../index';

function hasValidId(item: { id?: string }): boolean {
  return item.id !== undefined && item.id !== '';
}

function hasStepIds(steps: Step[]): boolean {
  return steps.every((step) => hasValidId(step));
}

function hasExampleIds(examples: Example[]): boolean {
  return examples.every((example) => hasValidId(example) && hasStepIds(example.steps));
}

function hasRuleIds(rules: Rule[]): boolean {
  return rules.every((rule) => hasValidId(rule) && hasExampleIds(rule.examples));
}

function hasSpecIds(specs: Spec[]): boolean {
  return specs.every((spec) => hasValidId(spec) && hasRuleIds(spec.rules));
}

function hasServerSpecIds(slice: Slice): boolean {
  if (!('server' in slice) || slice.server?.specs === undefined || !Array.isArray(slice.server.specs)) return true;
  return hasSpecIds(slice.server.specs);
}

function hasClientSpecNodeIds(nodes: ClientSpecNode[]): boolean {
  return nodes.every((node) => {
    if (!hasValidId(node)) return false;
    if (node.type === 'describe' && node.children) {
      return hasClientSpecNodeIds(node.children);
    }
    return true;
  });
}

function hasClientSpecIds(slice: Slice): boolean {
  if (!('client' in slice) || slice.client?.specs === undefined || !Array.isArray(slice.client.specs)) return true;
  return hasClientSpecNodeIds(slice.client.specs);
}

function hasDataIds(slice: Slice): boolean {
  if (!('server' in slice) || !slice.server?.data) return true;

  // Validate the data wrapper has an ID
  if (!hasValidId(slice.server.data)) return false;

  // Validate each item in the items array
  if (!Array.isArray(slice.server.data.items)) return true;

  return slice.server.data.items.every((item) => {
    if (!hasValidId(item)) return false;
    if ('destination' in item && item._withState) {
      return hasValidId(item._withState);
    }
    return true;
  });
}

function hasSliceIds(slice: Slice): boolean {
  return hasValidId(slice) && hasServerSpecIds(slice) && hasClientSpecIds(slice) && hasDataIds(slice);
}

export function hasAllIds(specs: Model): boolean {
  return specs.narratives.every((narrative) => hasValidId(narrative) && narrative.slices.every(hasSliceIds));
}
