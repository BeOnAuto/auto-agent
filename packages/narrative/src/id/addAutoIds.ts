import type { ClientSpecNode, Example, Model, Module, Rule, Slice, Spec, Step } from '../index';
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

function processDataItems(slice: Slice): Slice {
  if (!('server' in slice) || !slice.server?.data || !Array.isArray(slice.server.data)) return slice;

  const modifiedSlice = structuredClone(slice);
  if ('server' in modifiedSlice && modifiedSlice.server?.data && Array.isArray(modifiedSlice.server.data)) {
    modifiedSlice.server.data = modifiedSlice.server.data.map((item) => {
      const itemCopy = { ...item };
      ensureId(itemCopy);
      if ('destination' in itemCopy && itemCopy._withState) {
        itemCopy._withState = { ...itemCopy._withState };
        ensureId(itemCopy._withState);
      }
      return itemCopy;
    });
  }
  return modifiedSlice;
}

function processSlice(slice: Slice): Slice {
  let sliceCopy = { ...slice };
  ensureId(sliceCopy);
  sliceCopy = processServerSpecs(sliceCopy);
  sliceCopy = processClientSpecs(sliceCopy);
  sliceCopy = processDataItems(sliceCopy);
  return sliceCopy;
}

function processModules(modules: Module[]): Module[] {
  return modules.map((module) => {
    const moduleCopy = { ...module };
    if (module.isDerived) {
      moduleCopy.id = module.sourceFile;
    } else {
      ensureId(moduleCopy);
    }
    return moduleCopy;
  });
}

export function addAutoIds(specs: Model): Model {
  const result = structuredClone(specs);
  result.narratives = result.narratives.map((narrative) => {
    const narrativeCopy = { ...narrative };
    ensureId(narrativeCopy);
    narrativeCopy.slices = narrative.slices.map(processSlice);
    return narrativeCopy;
  });
  if (result.modules) {
    result.modules = processModules(result.modules);
  }
  return result;
}
