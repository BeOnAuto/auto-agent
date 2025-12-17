import { Model, Slice, Spec, Rule } from '../index';

function hasValidId(item: { id?: string }): boolean {
  return item.id !== undefined && item.id !== '';
}

function hasRuleIds(rules: Rule[]): boolean {
  return rules.every((rule) => hasValidId(rule));
}

function hasSpecIds(specs: Spec[]): boolean {
  return specs.every((spec) => hasRuleIds(spec.rules));
}

function hasServerSpecIds(slice: Slice): boolean {
  if (!('server' in slice) || slice.server?.specs === undefined || !Array.isArray(slice.server.specs)) return true;
  return hasSpecIds(slice.server.specs);
}

function hasClientSpecIds(_slice: Slice): boolean {
  return true;
}

function hasSliceIds(slice: Slice): boolean {
  return hasValidId(slice) && hasServerSpecIds(slice) && hasClientSpecIds(slice);
}

export function hasAllIds(specs: Model): boolean {
  return specs.narratives.every((narrative) => hasValidId(narrative) && narrative.slices.every(hasSliceIds));
}
