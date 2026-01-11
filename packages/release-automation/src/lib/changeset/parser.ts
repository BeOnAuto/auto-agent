import type { CommitType, ConventionalCommit } from '../../types/index.js';
import { getCommitMessage } from '../git/commits.js';

const CONVENTIONAL_PATTERN = /^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\(([^)]+)\))?: (.+)/;

/**
 * Parse a conventional commit message
 */
export function parseConventionalCommit(
  hash: string,
  getMessage: (hash: string) => string = getCommitMessage,
): ConventionalCommit | null {
  try {
    const fullMessage = getMessage(hash);

    // Parse conventional commit format: type(scope): subject
    const match = fullMessage.match(CONVENTIONAL_PATTERN);

    if (!match) {
      return null; // Not a conventional commit
    }

    const [, type, , scope, subject] = match;
    const body = fullMessage.split('\n').slice(1).join('\n').trim();
    const breaking = extractBreakingChange(fullMessage);

    return {
      hash,
      type: type as CommitType,
      scope,
      subject,
      body,
      breaking,
      fullMessage,
    };
  } catch (error) {
    console.warn(`Warning: Could not parse commit ${hash}:`, (error as Error).message);
    return null;
  }
}

/**
 * Parse multiple commits
 */
export function parseConventionalCommits(
  hashes: string[],
  getMessage?: (hash: string) => string,
): ConventionalCommit[] {
  return hashes
    .map((hash) => parseConventionalCommit(hash, getMessage))
    .filter((c): c is ConventionalCommit => c !== null);
}

/**
 * Validate conventional commit format
 */
export function isConventionalCommit(message: string): boolean {
  return CONVENTIONAL_PATTERN.test(message);
}

/**
 * Extract breaking change info from commit
 */
export function extractBreakingChange(message: string): boolean {
  return message.includes('BREAKING CHANGE:') || message.includes('!:');
}
