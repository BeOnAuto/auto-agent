import { generateAutoId } from './generators';
import { Model, Slice, Spec, Rule, Example } from '../index';

function ensureId(item: { id?: string }): void {
  if (item.id === undefined || item.id === '') {
    item.id = generateAutoId();
  }
}

function processExamples(examples: Example[]): Example[] {
  return examples.map((example) => {
    const exampleCopy = { ...example };
    ensureId(exampleCopy);
    return exampleCopy;
  });
}

function processRules(rules: Rule[]): Rule[] {
  return rules.map((rule) => {
    const ruleCopy = { ...rule };
    ensureId(ruleCopy);
    ruleCopy.examples = processExamples(rule.examples);
    return ruleCopy;
  });
}

function processSpecs(specs: Spec[]): Spec[] {
  return specs.map((spec) => ({
    ...spec,
    rules: processRules(spec.rules),
  }));
}

function processServerSpecs(slice: Slice): Slice {
  if (!('server' in slice) || slice.server?.specs === undefined || !Array.isArray(slice.server.specs)) return slice;

  const modifiedSlice = structuredClone(slice);
  if (
    'server' in modifiedSlice &&
    modifiedSlice.server?.specs !== undefined &&
    Array.isArray(modifiedSlice.server.specs)
  ) {
    modifiedSlice.server.specs = processSpecs(modifiedSlice.server.specs);
  }
  return modifiedSlice;
}

function processClientSpecs(slice: Slice): Slice {
  // Client specs use string rules (no IDs needed), so nothing to process
  return slice;
}

function processSlice(slice: Slice): Slice {
  let sliceCopy = { ...slice };
  ensureId(sliceCopy);
  sliceCopy = processServerSpecs(sliceCopy);
  sliceCopy = processClientSpecs(sliceCopy);
  return sliceCopy;
}

export function addAutoIds(specs: Model): Model {
  const result = structuredClone(specs);
  result.narratives = result.narratives.map((narrative) => {
    const narrativeCopy = { ...narrative };
    ensureId(narrativeCopy);
    narrativeCopy.slices = narrative.slices.map(processSlice);
    return narrativeCopy;
  });
  return result;
}
