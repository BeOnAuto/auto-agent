import type { ClientSpecNode, Example, Model, Rule, Slice, Spec, Step } from '../index';
import { generateAutoId } from './generators';

function ensureId(item: { id?: string }): void {
  if (item.id === undefined || item.id === '') {
    item.id = generateAutoId();
  }
}

function processSteps(steps: Step[]): Step[] {
  return steps.map((step) => {
    const stepCopy = { ...step };
    ensureId(stepCopy);
    return stepCopy;
  });
}

function processExamples(examples: Example[]): Example[] {
  return examples.map((example) => {
    const exampleCopy = { ...example };
    ensureId(exampleCopy);
    exampleCopy.steps = processSteps(example.steps);
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
  return specs.map((spec) => {
    const specCopy = { ...spec };
    ensureId(specCopy);
    specCopy.rules = processRules(spec.rules);
    return specCopy;
  });
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

function processClientSpecNodes(nodes: ClientSpecNode[]): ClientSpecNode[] {
  return nodes.map((node) => {
    const nodeCopy = { ...node };
    ensureId(nodeCopy);
    if (nodeCopy.type === 'describe' && nodeCopy.children) {
      nodeCopy.children = processClientSpecNodes(nodeCopy.children);
    }
    return nodeCopy;
  });
}

function processClientSpecs(slice: Slice): Slice {
  if (!('client' in slice) || slice.client?.specs === undefined || !Array.isArray(slice.client.specs)) return slice;

  const modifiedSlice = structuredClone(slice);
  if ('client' in modifiedSlice && modifiedSlice.client?.specs !== undefined) {
    modifiedSlice.client.specs = processClientSpecNodes(modifiedSlice.client.specs);
  }
  return modifiedSlice;
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
