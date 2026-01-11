# Automated Release Workflow

This repository uses an **automated changeset workflow** powered by conventional commits and AI-generated changelogs.

## How It Works

1. **Commit your changes** using conventional commit format:
   - `feat(scope): description` → Minor version bump
   - `fix(scope): description` → Patch version bump
   - `feat!:` or `BREAKING CHANGE:` → Major version bump

2. **Pre-push automation**:
   - When you run `git push`, a pre-push hook automatically:
     - Scans your commits since the last release
     - Determines the version bump type (major/minor/patch)
     - Uses Claude CLI to generate user-friendly changelog bullets
     - Creates a changeset file in this directory
     - Amends your commit to include the changeset

3. **GitHub Actions publish**:
   - When changes are merged to `main`, GitHub Actions:
     - Detects changeset files
     - Runs `changeset version` to bump all package versions
     - Publishes to npm
     - Creates git tags for each package
     - Creates a GitHub release

## Manual Changeset Creation (Not Recommended)

If you need to manually create a changeset, you can still create a `.md` file in this directory with the format:

```md
---
"@auto-engineer/cli": patch
"@auto-engineer/narrative": patch
---

- Your changelog entry here
```

## Requirements

- **Conventional commits** are enforced by commitlint
- **Claude CLI** must be available in your PATH for changelog generation
- All packages use **fixed versioning** (they all bump together)

## Troubleshooting

If the pre-push hook fails:
- Check that `claude` CLI is installed and in your PATH
- Ensure your commits follow conventional commit format
- You can bypass the hook with `git push --no-verify` (not recommended)
