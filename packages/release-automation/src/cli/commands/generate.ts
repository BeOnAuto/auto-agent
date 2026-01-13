import { Command } from 'commander';
import ora from 'ora';
import {
  createChangesetFile,
  determineBumpType,
  discoverPackages,
  generateChangelog,
  getCommitsSinceLastChangeset,
  isGitRepository,
  loadConfig,
  parseConventionalCommits,
} from '../../lib/index.js';
import { EXIT_CODE, logError, logInfo, logStep, logSuccess, logWarning } from '../utils/index.js';

export const generateCommand = new Command('generate')
  .description('Generate changeset from conventional commits')
  .option('--since <ref>', 'Git reference to compare against')
  .option('--provider <type>', 'Changelog provider (claude-cli|anthropic-api|simple|auto)', 'auto')
  .option('--no-amend', 'Do not amend the last commit')
  .option('--dry-run', 'Preview changeset without creating file')
  .option('--config <path>', 'Path to release config file')
  .option('--changeset-dir <path>', 'Changeset directory (default: .changeset)')
  .option('--packages <names>', 'Comma-separated package names (overrides config)')
  .action(async (options) => {
    try {
      // Check if we're in a git repository
      if (!isGitRepository()) {
        logError('Not a git repository');
        process.exit(EXIT_CODE.GIT_ERROR);
      }

      logStep('Checking for commits that need changesets...');

      // Load configuration
      const config = await loadConfig({
        changelogProvider: options.provider,
        changesetDir: options.changesetDir,
        autoAmend: options.amend,
        packages: options.packages ? options.packages.split(',').map((p: string) => p.trim()) : undefined,
      });

      // Get commits since last changeset
      const commitHashes = getCommitsSinceLastChangeset(config.changesetDir);

      if (commitHashes.length === 0) {
        logInfo('No new commits found. Nothing to do.');
        process.exit(EXIT_CODE.NO_COMMITS);
      }

      logInfo(`Found ${commitHashes.length} commit(s) to process`);

      // Parse conventional commits
      const commits = parseConventionalCommits(commitHashes);

      // Warn about non-conventional commits
      const skippedCount = commitHashes.length - commits.length;
      if (skippedCount > 0) {
        logWarning(`Skipped ${skippedCount} non-conventional commit(s). Use format: type(scope): subject`);
      }

      if (commits.length === 0) {
        logError('No conventional commits found. Skipping changeset generation.');
        logInfo('Commits must follow format: type(scope): subject (e.g., feat(cli): add new command)');
        process.exit(EXIT_CODE.NO_CONVENTIONAL_COMMITS);
      }

      logSuccess(`Found ${commits.length} valid conventional commit(s)`);

      // Determine bump type
      const bumpType = determineBumpType(commits);
      logInfo(`Determined version bump: ${bumpType}`);

      // Generate changelog
      const spinner = ora('Generating changelog...').start();
      const description = await generateChangelog(commits, config);
      spinner.succeed('Changelog generated');

      // Discover packages
      let packages: string[];
      if (config.packages) {
        packages = config.packages;
      } else {
        packages = await discoverPackages(config.changesetConfigPath);
      }

      if (packages.length === 0) {
        logError('No packages found. Check your changeset config.');
        process.exit(EXIT_CODE.CONFIG_ERROR);
      }

      logInfo(`Found ${packages.length} package(s)`);

      // Preview mode
      if (options.dryRun) {
        console.log('\n📋 Changeset Preview:');
        console.log('---');
        console.log(`Bump type: ${bumpType}`);
        console.log(`Packages: ${packages.join(', ')}`);
        console.log('\nChangelog:');
        console.log(description);
        console.log('---');
        process.exit(EXIT_CODE.SUCCESS);
      }

      // Create changeset file
      const result = createChangesetFile(
        {
          bumpType,
          commits,
          description,
        },
        packages,
        config.changesetDir,
      );

      logSuccess(`Created changeset: ${result.filename}`);
      logInfo(`  Bump type: ${bumpType}`);
      logInfo(`  Commits: ${commits.length}`);

      console.log('\n📋 Changelog preview:');
      console.log('---');
      console.log(description);
      console.log('---');

      process.exit(EXIT_CODE.SUCCESS);
    } catch (error) {
      logError(`Failed to generate changeset: ${(error as Error).message}`);
      process.exit(EXIT_CODE.ERROR);
    }
  });
