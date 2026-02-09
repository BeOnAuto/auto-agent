import type { Spec } from '@auto-engineer/narrative';

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
