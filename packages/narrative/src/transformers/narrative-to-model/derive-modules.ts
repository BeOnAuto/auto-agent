import type { Message, Module, Narrative } from '../../index';

const DEFAULT_SOURCE_FILE = 'generated.narrative.ts';

export function deriveModules(narratives: Narrative[], messages: Message[]): Module[] {
  const bySourceFile = groupNarrativesBySourceFile(narratives);

  return Array.from(bySourceFile.entries()).map(([sourceFile, narrs], index) => {
    const narrativeIds = narrs.map((n, i) => n.id ?? `__derived_${index}_${i}_${n.name}`);
    const messageRefs = messages
      .map((m) => ({ kind: m.type, name: m.name }))
      .sort((a, b) => `${a.kind}:${a.name}`.localeCompare(`${b.kind}:${b.name}`));

    return {
      sourceFile,
      isDerived: true,
      contains: { narrativeIds },
      declares: { messages: messageRefs },
    };
  });
}

function groupNarrativesBySourceFile(narratives: Narrative[]): Map<string, Narrative[]> {
  const groups = new Map<string, Narrative[]>();

  for (const narrative of narratives) {
    const sourceFile = narrative.sourceFile ?? DEFAULT_SOURCE_FILE;
    if (!groups.has(sourceFile)) {
      groups.set(sourceFile, []);
    }
    groups.get(sourceFile)!.push(narrative);
  }

  return groups;
}
