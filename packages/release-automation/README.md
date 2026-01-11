# @auto-engineer/release-automation

Automated release management with changesets and conventional commits.

## Features

- ✅ **Automated changeset generation** from conventional commits
- ✅ **AI-powered changelogs** with Claude CLI, Anthropic API, or simple fallback
- ✅ **Git hook integration** for pre-push automation
- ✅ **GitHub Actions support** for CI/CD workflows
- ✅ **Configurable** via environment variables or config files
- ✅ **OSS-friendly** with free tier AI options and simple fallback
- ✅ **Library + CLI** - use programmatically or from command line

## Installation

```bash
pnpm add -D @auto-engineer/release-automation
```

## Quick Start

### CLI Usage

```bash
# Generate changeset from conventional commits
release-automation generate

# Preview without creating file
release-automation generate --dry-run

# Check if changesets exist
release-automation check --verbose

# Force simple changelog (no AI)
release-automation generate --provider simple
```

### Library Usage

```typescript
import {
  getCommitsSinceLastChangeset,
  parseConventionalCommits,
  determineBumpType,
  generateChangelog,
  createChangesetFile,
  discoverPackages,
} from '@auto-engineer/release-automation';

// Get commits since last changeset
const commitHashes = getCommitsSinceLastChangeset();

// Parse conventional commits
const commits = parseConventionalCommits(commitHashes);

// Determine semver bump type
const bumpType = determineBumpType(commits); // 'major' | 'minor' | 'patch'

// Generate AI changelog
const description = await generateChangelog(commits);

// Discover packages from changeset config
const packages = await discoverPackages();

// Create changeset file
createChangesetFile({ bumpType, commits, description }, packages);
```

## CLI Commands

### `generate`

Generate changeset from conventional commits.

```bash
release-automation generate [options]

Options:
  --since <ref>           Git reference to compare against
  --provider <type>       Changelog provider (claude-cli|anthropic-api|simple|auto) (default: "auto")
  --no-amend              Do not amend the last commit
  --dry-run               Preview changeset without creating file
  --config <path>         Path to release config file
  --changeset-dir <path>  Changeset directory (default: .changeset)
  --packages <names>      Comma-separated package names (overrides config)
```

**Exit codes:**
- `0` - Success
- `1` - General error
- `10` - No changesets found (with `--require-changesets`)
- `11` - No commits to process
- `12` - No conventional commits found
- `20` - Configuration error
- `30` - Git error

### `check`

Check for pending changesets or commits that need changesets.

```bash
release-automation check [options]

Options:
  --since <ref>          Check commits since this reference
  -v, --verbose          Show detailed information
  --require-changesets   Exit with error if no changesets exist
```

## Configuration

### Environment Variables

```bash
# Enable/disable features
AUTO_CHANGESET_ENABLED=true|false           # Enable auto-changeset (default: true)
AUTO_CHANGESET_AMEND=true|false             # Auto-amend commits (default: true)

# Changelog generation
AUTO_CHANGESET_PROVIDER=auto|claude-cli|anthropic-api|simple  # Provider (default: auto)
ANTHROPIC_API_KEY=sk-ant-...                # For anthropic-api provider

# Paths
AUTO_CHANGESET_CONFIG_PATH=.changeset/config.json  # Changeset config path
AUTO_CHANGESET_DIR=.changeset                      # Changeset directory

# Package discovery
AUTO_CHANGESET_PACKAGES=@pkg/a,@pkg/b       # Override package discovery
```

### Config File

Create `.release-automation.json`:

```json
{
  "changesetConfigPath": ".changeset/config.json",
  "changelogProvider": "auto",
  "autoAmend": true,
  "changesetDir": ".changeset"
}
```

Or add to `package.json`:

```json
{
  "releaseAutomation": {
    "changelogProvider": "auto",
    "autoAmend": true
  }
}
```

## Changelog Providers

The package tries providers in order until one succeeds:

### 1. Claude CLI (Fastest)

Requires `claude` in PATH.

```bash
# Check availability
which claude

# Install Claude CLI
# See: https://docs.anthropic.com/claude/docs/claude-cli
```

### 2. Anthropic API

Requires `ANTHROPIC_API_KEY` environment variable.

```bash
export ANTHROPIC_API_KEY=sk-ant-...
```

**Free tier:** $5 credit = 5000+ changeset generations (at ~$0.001 each)

**Get API key:** https://console.anthropic.com

### 3. Simple Fallback

Always available. Formats commit messages into bullet points:

- Groups by type (feat, fix, others)
- Adds scope formatting
- Limits to 5 items

## Git Hook Integration

Add to `.husky/pre-push`:

```bash
#!/bin/sh

# Check if enabled
if [ "${AUTO_CHANGESET_ENABLED:-true}" = "false" ]; then
  echo "⏭️  Auto-changeset disabled"
  exit 0
fi

# Generate changesets
pnpm release-automation generate

# Check exit code
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ] && [ $EXIT_CODE -ne 11 ] && [ $EXIT_CODE -ne 12 ]; then
  echo "❌ Failed to generate changeset"
  exit $EXIT_CODE
fi

# Amend commit if configured
if [ "${AUTO_CHANGESET_AMEND:-true}" = "true" ]; then
  if [ -n "$(git status --porcelain .changeset/*.md 2>/dev/null)" ]; then
    git add .changeset/*.md
    git commit --amend --no-edit --no-verify
    echo "✅ Changesets added to commit!"
  fi
fi
```

## GitHub Actions Integration

```yaml
- name: Check for changesets
  id: check_changesets
  run: |
    if pnpm release-automation check --require-changesets; then
      echo "has_changesets=true" >> $GITHUB_OUTPUT
    else
      EXIT_CODE=$?
      if [ $EXIT_CODE -eq 10 ]; then
        echo "has_changesets=false" >> $GITHUB_OUTPUT
      else
        exit $EXIT_CODE
      fi
    fi

- name: Version packages
  if: steps.check_changesets.outputs.has_changesets == 'true'
  run: |
    pnpm changeset version
    git add .
    git commit -m "chore: version packages"
    git push
```

## Library API

### Git Operations

```typescript
import {
  getCommitsSinceLastChangeset,
  getCommitsInRange,
  getAllCommits,
  getCommitsSinceLastTag,
  getLastChangesetCommit,
  getLastReleaseTag,
  getCommitMessage,
  isGitRepository,
} from '@auto-engineer/release-automation';

// Get commits since last changeset
const commits = getCommitsSinceLastChangeset('.changeset');

// Get commits in range
const commits = getCommitsInRange('v1.0.0', 'HEAD');

// Check if in git repo
if (isGitRepository()) {
  // ...
}
```

### Conventional Commit Parsing

```typescript
import {
  parseConventionalCommit,
  parseConventionalCommits,
  isConventionalCommit,
  extractBreakingChange,
} from '@auto-engineer/release-automation';

// Parse single commit
const commit = parseConventionalCommit('abc123');

// Parse multiple commits
const commits = parseConventionalCommits(['abc123', 'def456']);

// Validate format
if (isConventionalCommit('feat(cli): add feature')) {
  // Valid
}

// Check for breaking changes
if (extractBreakingChange('feat!: breaking change')) {
  // Has breaking change
}
```

### Semver Logic

```typescript
import {
  determineBumpType,
  hasBreakingChanges,
  hasFeatures,
} from '@auto-engineer/release-automation';

const commits = parseConventionalCommits(hashes);

// Determine bump type (major > minor > patch)
const bumpType = determineBumpType(commits);

// Check for breaking changes
if (hasBreakingChanges(commits)) {
  // Major version bump
}

// Check for features
if (hasFeatures(commits)) {
  // Minor version bump
}
```

### Changelog Generation

```typescript
import { generateChangelog } from '@auto-engineer/release-automation';

const commits = parseConventionalCommits(hashes);

// Generate with auto provider selection
const changelog = await generateChangelog(commits);

// Force specific provider
const changelog = await generateChangelog(commits, {
  changelogProvider: 'simple',
});

// Use Anthropic API
const changelog = await generateChangelog(commits, {
  changelogProvider: 'anthropic-api',
  anthropicApiKey: 'sk-ant-...',
});
```

### Package Discovery

```typescript
import {
  discoverPackages,
  readChangesetConfig,
  getFixedGroupPackages,
} from '@auto-engineer/release-automation';

// Discover from changeset config
const packages = await discoverPackages('.changeset/config.json');

// Read config
const config = await readChangesetConfig();

// Get fixed group packages
const packages = getFixedGroupPackages(config);
```

### Changeset Writer

```typescript
import {
  createChangesetFile,
  generateChangesetFrontmatter,
  generateChangesetFilename,
} from '@auto-engineer/release-automation';

// Create changeset file
const result = createChangesetFile(
  {
    bumpType: 'minor',
    commits,
    description: 'Changelog content',
  },
  ['@pkg/a', '@pkg/b'],
  '.changeset'
);

console.log(result.filename); // 'auto-a1b2c3d4.md'
console.log(result.path);     // '/path/to/.changeset/auto-a1b2c3d4.md'

// Generate frontmatter
const frontmatter = generateChangesetFrontmatter(
  ['@pkg/a', '@pkg/b'],
  'minor'
);
```

### Configuration Loading

```typescript
import { loadConfig } from '@auto-engineer/release-automation';

// Load from all sources (env, file, defaults)
const config = await loadConfig();

// Override specific values
const config = await loadConfig({
  changelogProvider: 'simple',
  autoAmend: false,
});
```

## Conventional Commit Format

This package follows the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

**Types:**
- `feat` - New feature (minor bump)
- `fix` - Bug fix (patch bump)
- `docs` - Documentation changes
- `style` - Code style changes (formatting, etc)
- `refactor` - Code refactoring
- `perf` - Performance improvements
- `test` - Test changes
- `build` - Build system changes
- `ci` - CI configuration changes
- `chore` - Other changes
- `revert` - Revert previous commit

**Breaking changes:**
- Add `!` after type: `feat!: breaking change`
- Add footer: `BREAKING CHANGE: description`

## Examples

### Example 1: Basic Usage

```bash
# Make some commits
git commit -m "feat(cli): add new command"
git commit -m "fix(server): resolve connection issue"

# Generate changeset
pnpm release-automation generate

# Output:
# ✅ Found 2 valid conventional commit(s)
# 📊 Determined version bump: minor
# ✨ Generating changelog...
# ✅ Created changeset: auto-a1b2c3d4.md
```

### Example 2: Dry Run

```bash
pnpm release-automation generate --dry-run

# Output:
# 📋 Changeset Preview:
# ---
# Bump type: minor
# Packages: @auto-engineer/cli, @auto-engineer/server
#
# Changelog:
# - Added new command functionality
# - Fixed connection stability issues
# ---
```

### Example 3: CI/CD Check

```bash
# Check if changesets exist (for CI)
pnpm release-automation check --require-changesets

# Exit code 0 if changesets exist
# Exit code 10 if no changesets
```

## Troubleshooting

### "No conventional commits found"

Ensure commits follow the format:

```bash
# ✅ Good
git commit -m "feat(cli): add feature"
git commit -m "fix: bug fix"

# ❌ Bad
git commit -m "added feature"
git commit -m "WIP"
```

### "Failed to discover packages"

Check that `.changeset/config.json` exists and has a `fixed` array:

```json
{
  "fixed": [["@auto-engineer/*", "create-auto-app"]]
}
```

### "Claude CLI not found"

Install Claude CLI or set `ANTHROPIC_API_KEY`:

```bash
# Option 1: Install Claude CLI
# See: https://docs.anthropic.com/claude/docs/claude-cli

# Option 2: Use Anthropic API
export ANTHROPIC_API_KEY=sk-ant-...

# Option 3: Use simple mode
pnpm release-automation generate --provider simple
```

## Development

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Run tests (when implemented)
pnpm test

# Type check
pnpm type-check

# Watch mode
pnpm test:watch
```

## License

MIT

## Related

- [Changesets](https://github.com/changesets/changesets)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Anthropic API](https://docs.anthropic.com/)
