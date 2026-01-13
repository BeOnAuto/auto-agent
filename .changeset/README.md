# Automated Release Workflow

This repository uses an **automated changeset workflow** powered by the `@auto-engineer/release-automation` package, conventional commits, and AI-generated changelogs.

## How It Works

1. **Commit your changes** using conventional commit format:
   - `feat(scope): description` → Minor version bump
   - `fix(scope): description` → Patch version bump
   - `feat!:` or `BREAKING CHANGE:` → Major version bump

2. **Pre-push automation**:
   - When you run `git push`, a pre-push hook automatically:
     - Runs `release-automation generate` to scan commits
     - Determines the version bump type (major/minor/patch)
     - Generates changelogs using AI (Claude CLI → Anthropic API → Simple fallback)
     - Creates changeset files in this directory
     - Amends your commit to include the changesets (configurable)

3. **GitHub Actions publish**:
   - When changes are merged to `main`, GitHub Actions:
     - Runs `release-automation check` to detect changesets
     - Runs `changeset version` to bump all package versions
     - Publishes to npm via `pnpm release`
     - Creates git tags for each package
     - Creates a GitHub release with changelog

## Configuration

The release automation can be configured via environment variables:

### Enable/Disable

```bash
# Disable auto-changeset generation (bypass hook)
export AUTO_CHANGESET_ENABLED=false

# Disable auto-amend (generate changesets but don't amend commit)
export AUTO_CHANGESET_AMEND=false
```

### Changelog Generation

The package tries multiple methods in order:

1. **Claude CLI** (fastest, requires `claude` in PATH)
2. **Anthropic API** (requires `ANTHROPIC_API_KEY` env var)
3. **Simple fallback** (always works, formats commit messages)

```bash
# Force a specific provider
export AUTO_CHANGESET_PROVIDER=simple  # or claude-cli, anthropic-api, auto

# Set API key for Anthropic (free tier: $5 = 5000+ changesets)
export ANTHROPIC_API_KEY=sk-ant-...
```

### Advanced Configuration

```bash
# Custom changeset directory
export AUTO_CHANGESET_DIR=.changesets

# Custom changeset config path
export AUTO_CHANGESET_CONFIG_PATH=.changeset/config.json

# Override package list (comma-separated)
export AUTO_CHANGESET_PACKAGES="@auto-engineer/cli,@auto-engineer/narrative"
```

## Manual Usage

You can also use the CLI directly:

```bash
# Generate changeset (dry-run to preview)
pnpm release-automation generate --dry-run

# Generate with specific provider
pnpm release-automation generate --provider simple

# Check if changesets exist
pnpm release-automation check --verbose

# Get help
pnpm release-automation --help
pnpm release-automation generate --help
```

## Manual Changeset Creation

You can still manually create `.md` files in this directory:

```md
---
"@auto-engineer/cli": patch
"@auto-engineer/narrative": patch
---

- Your changelog entry here
```

## Requirements

- **Conventional commits** enforced by commitlint (format: `type(scope): subject`)
- **Fixed versioning** - all packages bump together (configured in `.changeset/config.json`)
- **Node.js 18+**

## For OSS Contributors

Three options for changelog generation:

1. **Use Claude CLI** (if you have it installed)
2. **Use Anthropic API** (free tier, 5000+ changesets on $5 credit)
   ```bash
   export ANTHROPIC_API_KEY=sk-ant-...
   ```
3. **Use simple mode** (no setup required, works automatically)

Or skip the hook entirely:
```bash
git push --no-verify
```

## Troubleshooting

**Pre-push hook fails:**
- Check conventional commit format: `type(scope): subject`
- Ensure `@auto-engineer/release-automation` is installed: `pnpm install`
- Try dry-run to see what would happen: `pnpm release-automation generate --dry-run`
- Disable temporarily: `AUTO_CHANGESET_ENABLED=false git push`
- Bypass hook: `git push --no-verify` (not recommended)

**No AI available:**
- The tool automatically falls back to simple formatting
- To get AI changelogs, install Claude CLI or set `ANTHROPIC_API_KEY`

**Want to disable auto-amend:**
- Set `AUTO_CHANGESET_AMEND=false` to generate changesets without amending commits
- Manually stage and commit: `git add .changeset/*.md && git commit`

## Package Documentation

For more details, see [`packages/release-automation/README.md`](../packages/release-automation/README.md)
