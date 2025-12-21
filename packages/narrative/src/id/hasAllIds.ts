import { Model, Slice, Spec, Rule, Example, Step, ClientSpecNode } from '../index';

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

function hasSliceIds(slice: Slice): boolean {
  return hasValidId(slice) && hasServerSpecIds(slice) && hasClientSpecIds(slice);
}

export function hasAllIds(specs: Model): boolean {
  return specs.narratives.every((narrative) => hasValidId(narrative) && narrative.slices.every(hasSliceIds));
}
