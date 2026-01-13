import { execSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Get all commits since the last changeset was created
 */
export function getCommitsSinceLastChangeset(changesetDir = '.changeset'): string[] {
  try {
    const changesetPath = join(process.cwd(), changesetDir);

    if (!existsSync(changesetPath)) {
      // Changeset directory doesn't exist, get all commits
      return getAllCommits();
    }

    const files = readdirSync(changesetPath).filter((f) => f.endsWith('.md') && f !== 'README.md');

    if (files.length === 0) {
      // No changesets exist, fallback to last tag
      return getCommitsSinceLastTag();
    }

    // Get the most recent changeset file by git commit time
    const latestChangeset = files
      .map((f) => ({
        file: f,
        time: execSync(`git log -1 --format=%ct -- ${changesetDir}/${f}`, {
          encoding: 'utf8',
          cwd: process.cwd(),
        }).trim(),
      }))
      .sort((a, b) => Number(b.time) - Number(a.time))[0];

    // Get commits since that changeset was added
    const changesetCommit = execSync(`git log -1 --format=%H -- ${changesetDir}/${latestChangeset.file}`, {
      encoding: 'utf8',
      cwd: process.cwd(),
    }).trim();

    return getCommitsInRange(changesetCommit, 'HEAD');
  } catch (error) {
    console.warn('Warning: Could not get commits since last changeset:', (error as Error).message);
    return [];
  }
}

/**
 * Get commits in a specific range
 */
export function getCommitsInRange(since: string, until = 'HEAD'): string[] {
  try {
    const commits = execSync(`git log ${since}..${until} --format=%H`, {
      encoding: 'utf8',
      cwd: process.cwd(),
    })
      .trim()
      .split('\n')
      .filter(Boolean);

    return commits;
  } catch (error) {
    console.warn(`Warning: Could not get commits in range ${since}..${until}:`, (error as Error).message);
    return [];
  }
}

/**
 * Get all commits in the repository
 */
export function getAllCommits(): string[] {
  try {
    const commits = execSync('git log --format=%H', {
      encoding: 'utf8',
      cwd: process.cwd(),
    })
      .trim()
      .split('\n')
      .filter(Boolean);

    return commits;
  } catch (error) {
    console.warn('Warning: Could not get all commits:', (error as Error).message);
    return [];
  }
}

/**
 * Get commits since the last release tag
 */
export function getCommitsSinceLastTag(): string[] {
  try {
    const lastTag = execSync('git describe --tags --abbrev=0', {
      encoding: 'utf8',
      cwd: process.cwd(),
    }).trim();

    return getCommitsInRange(lastTag, 'HEAD');
  } catch {
    // No tags exist, get all commits
    return getAllCommits();
  }
}

/**
 * Get the most recent changeset commit hash
 */
export function getLastChangesetCommit(changesetDir = '.changeset'): string | null {
  try {
    const changesetPath = join(process.cwd(), changesetDir);

    if (!existsSync(changesetPath)) {
      return null;
    }

    const files = readdirSync(changesetPath).filter((f) => f.endsWith('.md') && f !== 'README.md');

    if (files.length === 0) {
      return null;
    }

    // Get the most recent changeset file
    const latestChangeset = files
      .map((f) => ({
        file: f,
        time: execSync(`git log -1 --format=%ct -- ${changesetDir}/${f}`, {
          encoding: 'utf8',
          cwd: process.cwd(),
        }).trim(),
      }))
      .sort((a, b) => Number(b.time) - Number(a.time))[0];

    const commit = execSync(`git log -1 --format=%H -- ${changesetDir}/${latestChangeset.file}`, {
      encoding: 'utf8',
      cwd: process.cwd(),
    }).trim();

    return commit;
  } catch {
    return null;
  }
}

/**
 * Get the most recent release tag
 */
export function getLastReleaseTag(): string | null {
  try {
    const tag = execSync('git describe --tags --abbrev=0', {
      encoding: 'utf8',
      cwd: process.cwd(),
    }).trim();

    return tag;
  } catch {
    return null;
  }
}

/**
 * Get commit message for a specific hash
 */
export function getCommitMessage(hash: string): string {
  try {
    const message = execSync(`git log -1 --format=%B ${hash}`, {
      encoding: 'utf8',
      cwd: process.cwd(),
    }).trim();

    return message;
  } catch (error) {
    throw new Error(`Failed to get commit message for ${hash}: ${(error as Error).message}`);
  }
}

/**
 * Check if we're in a git repository
 */
export function isGitRepository(): boolean {
  try {
    execSync('git rev-parse --git-dir', {
      encoding: 'utf8',
      cwd: process.cwd(),
      stdio: 'pipe',
    });
    return true;
  } catch {
    return false;
  }
}
