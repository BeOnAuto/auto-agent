import type { Narrative } from '../../index';

export function collectMessageKeysFromNarratives(narratives: Narrative[]): Set<string> {
  const usedKeys = new Set<string>();

  for (const narrative of narratives) {
    for (const slice of narrative.slices) {
      collectMessageKeysFromSlice(slice, usedKeys);
    }
  }

  return usedKeys;
}

function collectMessageKeysFromSlice(slice: Narrative['slices'][number], usedKeys: Set<string>): void {
  if (slice.type !== 'command' && slice.type !== 'query' && slice.type !== 'react') {
    return;
  }

  const specs = slice.server?.specs;
  if (!Array.isArray(specs)) {
    return;
  }

  for (const spec of specs) {
    if (!spec.rules || !Array.isArray(spec.rules)) {
      continue;
    }

    for (const rule of spec.rules) {
      if (!rule.examples || !Array.isArray(rule.examples)) {
        continue;
      }

      for (const example of rule.examples) {
        if (!example.steps || !Array.isArray(example.steps)) {
          continue;
        }

        for (const step of example.steps) {
          collectMessageKeyFromStep(step, usedKeys);
        }
      }
    }
  }
}

function collectMessageKeyFromStep(step: { keyword?: string; text?: string }, usedKeys: Set<string>): void {
  if (!('text' in step) || !step.text) {
    return;
  }

  const keyword = step.keyword;
  if (keyword === 'Given' || keyword === 'And') {
    usedKeys.add(`event:${step.text}`);
    usedKeys.add(`state:${step.text}`);
  } else if (keyword === 'When') {
    usedKeys.add(`command:${step.text}`);
  } else if (keyword === 'Then') {
    usedKeys.add(`event:${step.text}`);
    usedKeys.add(`state:${step.text}`);
  }
}
