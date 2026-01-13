import type { BumpType, ConventionalCommit } from '../../types/index.js';

/**
 * Determine the semver bump type from commits
 * Priority: breaking > feat > fix
 */
export function determineBumpType(commits: ConventionalCommit[]): BumpType {
  // Check for breaking changes
  if (hasBreakingChanges(commits)) {
    return 'major';
  }

  // Check for features
  if (hasFeatures(commits)) {
    return 'minor';
  }

  // Default to patch
  return 'patch';
}

/**
 * Check if commits contain breaking changes
 */
export function hasBreakingChanges(commits: ConventionalCommit[]): boolean {
  return commits.some((c) => c.breaking);
}

/**
 * Check if commits contain features
 */
export function hasFeatures(commits: ConventionalCommit[]): boolean {
  return commits.some((c) => c.type === 'feat');
}
