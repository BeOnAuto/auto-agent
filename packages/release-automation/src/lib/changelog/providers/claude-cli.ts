import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ChangelogProvider, ConventionalCommit } from '../../../types/index.js';

export class ClaudeCliProvider implements ChangelogProvider {
  name = 'claude-cli';

  async isAvailable(): Promise<boolean> {
    try {
      execSync('which claude', { stdio: 'pipe' });
      return true;
    } catch {
      return false;
    }
  }

  async generate(commits: ConventionalCommit[]): Promise<string> {
    const prompt = buildPrompt(commits);
    const tempFile = join(process.cwd(), `.changeset-prompt-${Date.now()}.txt`);

    try {
      writeFileSync(tempFile, prompt);

      const result = execSync(`claude -p "$(cat ${tempFile})"`, {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      return result.trim();
    } finally {
      // Always cleanup temp file
      try {
        execSync(`rm ${tempFile}`);
      } catch {
        // Ignore cleanup errors
      }
    }
  }
}

function buildPrompt(commits: ConventionalCommit[]): string {
  const commitSummary = commits
    .map((c) => `- ${c.type}${c.scope ? `(${c.scope})` : ''}: ${c.subject}\n  ${c.body || '(no additional details)'}`)
    .join('\n\n');

  return `You are analyzing git commits to generate a changelog entry. Here are the commits:

${commitSummary}

Generate a concise changelog description as bullet points. Rules:
- Use 2-5 bullet points maximum
- Focus on user-facing changes and impact
- Group related changes together
- Use clear, non-technical language where possible
- Start each bullet with a dash and capitalize the first word
- Do NOT include commit hashes, types, or scopes
- Do NOT use markdown formatting besides the dashes

Example format:
- Added user authentication with OAuth support
- Fixed critical bug in data synchronization
- Improved performance of search queries by 50%

Now generate the changelog for the commits above:`;
}
