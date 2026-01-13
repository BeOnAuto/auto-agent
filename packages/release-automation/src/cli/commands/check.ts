import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { Command } from 'commander';
import {
  getCommitsSinceLastChangeset,
  isGitRepository,
  loadConfig,
  parseConventionalCommits,
} from '../../lib/index.js';
import { EXIT_CODE, logError, logInfo, logSuccess } from '../utils/index.js';

export const checkCommand = new Command('check')
  .description('Check for pending changesets or commits that need changesets')
  .option('--since <ref>', 'Check commits since this reference')
  .option('-v, --verbose', 'Show detailed information')
  .option('--require-changesets', 'Exit with error if no changesets exist')
  .action(async (options) => {
    try {
      // Check if we're in a git repository
      if (!isGitRepository()) {
        logError('Not a git repository');
        process.exit(EXIT_CODE.GIT_ERROR);
      }

      // Load configuration
      const config = await loadConfig();

      // Check for existing changesets
      const changesetPath = join(process.cwd(), config.changesetDir);
      const hasChangesets = checkForChangesets(changesetPath);

      if (options.verbose) {
        if (hasChangesets) {
          logSuccess('Changesets exist');
          listChangesets(changesetPath);
        } else {
          logInfo('No changesets found');
        }
      }

      // Check for commits that need changesets
      const commitHashes = getCommitsSinceLastChangeset(config.changesetDir);
      const commits = parseConventionalCommits(commitHashes);

      if (options.verbose) {
        if (commits.length > 0) {
          logInfo(`Found ${commits.length} commit(s) that may need changesets`);
        } else {
          logInfo('No commits need changesets');
        }
      }

      // Exit based on options
      if (options.requireChangesets) {
        if (!hasChangesets) {
          logError('No changesets found (use --require-changesets)');
          process.exit(EXIT_CODE.NO_CHANGESETS);
        }
      }

      if (hasChangesets) {
        logSuccess('Changesets detected');
      } else {
        logInfo('No changesets to process');
      }

      process.exit(EXIT_CODE.SUCCESS);
    } catch (error) {
      logError(`Failed to check changesets: ${(error as Error).message}`);
      process.exit(EXIT_CODE.ERROR);
    }
  });

function checkForChangesets(changesetPath: string): boolean {
  if (!existsSync(changesetPath)) {
    return false;
  }

  const files = readdirSync(changesetPath).filter((f) => f.endsWith('.md') && f !== 'README.md');

  return files.length > 0;
}

function listChangesets(changesetPath: string): void {
  const files = readdirSync(changesetPath).filter((f) => f.endsWith('.md') && f !== 'README.md');

  console.log(`\nChangesets (${files.length}):`);
  for (const file of files) {
    console.log(`  - ${file}`);
  }
}
