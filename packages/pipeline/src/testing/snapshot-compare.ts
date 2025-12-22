export interface SnapshotDiff {
  type: 'match' | 'mismatch' | 'missing' | 'extra';
  index: number;
  expected?: string;
  actual?: string;
}

export interface SnapshotResult {
  matches: boolean;
  differences: SnapshotDiff[];
  expectedCount: number;
  actualCount: number;
}

export function compareEventSequence(expected: string[], actual: string[]): SnapshotResult {
  const differences: SnapshotDiff[] = [];
  const maxLen = Math.max(expected.length, actual.length);

  for (let i = 0; i < maxLen; i++) {
    const expectedItem = expected[i];
    const actualItem = actual[i];

    if (expectedItem === undefined) {
      differences.push({
        type: 'extra',
        index: i,
        actual: actualItem,
      });
    } else if (actualItem === undefined) {
      differences.push({
        type: 'missing',
        index: i,
        expected: expectedItem,
      });
    } else if (expectedItem !== actualItem) {
      differences.push({
        type: 'mismatch',
        index: i,
        expected: expectedItem,
        actual: actualItem,
      });
    }
  }

  return {
    matches: differences.length === 0,
    differences,
    expectedCount: expected.length,
    actualCount: actual.length,
  };
}

export function containsSubsequence(sequence: string[], subsequence: string[]): boolean {
  if (subsequence.length === 0) return true;
  if (sequence.length === 0) return false;

  let subIndex = 0;
  for (const item of sequence) {
    if (item === subsequence[subIndex]) {
      subIndex++;
      if (subIndex === subsequence.length) {
        return true;
      }
    }
  }
  return false;
}

export function findMissingEvents(sequence: string[], required: string[]): string[] {
  const present = new Set(sequence);
  return required.filter((r) => !present.has(r));
}

export function findUnexpectedEvents(sequence: string[], allowed: string[]): string[] {
  const allowedSet = new Set(allowed);
  return sequence.filter((s) => !allowedSet.has(s));
}

export function formatSnapshotDiff(result: SnapshotResult): string {
  if (result.matches) {
    return `✓ Event sequence matches (${result.expectedCount} events)`;
  }

  const lines: string[] = [
    `✗ Event sequence mismatch:`,
    `  Expected: ${result.expectedCount} events`,
    `  Actual: ${result.actualCount} events`,
    `  Differences:`,
  ];

  for (const diff of result.differences) {
    switch (diff.type) {
      case 'mismatch':
        lines.push(`    [${diff.index}] Expected "${diff.expected}", got "${diff.actual}"`);
        break;
      case 'missing':
        lines.push(`    [${diff.index}] Missing "${diff.expected}"`);
        break;
      case 'extra':
        lines.push(`    [${diff.index}] Unexpected "${diff.actual}"`);
        break;
    }
  }

  return lines.join('\n');
}
