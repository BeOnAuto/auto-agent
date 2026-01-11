import type { ChangelogProvider, ConventionalCommit } from '../../../types/index.js';

export class SimpleProvider implements ChangelogProvider {
  name = 'simple';

  async isAvailable(): Promise<boolean> {
    return true; // Always available
  }

  async generate(commits: ConventionalCommit[]): Promise<string> {
    // Group commits by type
    const features = commits.filter((c) => c.type === 'feat');
    const fixes = commits.filter((c) => c.type === 'fix');
    const others = commits.filter((c) => !['feat', 'fix'].includes(c.type));

    const lines: string[] = [];

    // Add features first
    if (features.length > 0) {
      lines.push(...features.map((c) => formatCommit(c)));
    }

    // Add fixes
    if (fixes.length > 0) {
      lines.push(...fixes.map((c) => formatCommit(c)));
    }

    // Add others if we have room (limit to 5 total)
    if (others.length > 0 && lines.length < 5) {
      lines.push(...others.map((c) => formatCommit(c)).slice(0, 5 - lines.length));
    }

    return lines.slice(0, 5).join('\n');
  }
}

function formatCommit(commit: ConventionalCommit): string {
  const scope = commit.scope ? `**${commit.scope}**: ` : '';
  return `- ${scope}${commit.subject}`;
}
