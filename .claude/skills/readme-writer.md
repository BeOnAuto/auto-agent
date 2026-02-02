# README Generation & Maintenance

> Generate and maintain README.md files synchronized with repository content.

## When to Use

- Creating a new README (package or root)
- Updating README after code changes
- Validating existing README accuracy

---

## Scatter-Gather Workflow

**USE WHEN:**

- Package has no README yet
- Package has changed significantly since last README update
- Package is complex (multiple directories, many exports)
- You need comprehensive understanding before writing

**SKIP WHEN:**

- Simple updates (version bump, new export)
- README exists and only needs section updates
- Package is trivial (single file, few exports)

### Phase 1: Scatter

Create a `scatter.md` file in each directory that describes its contents.

#### For each subdirectory in the package:

```bash
# List all directories (excluding node_modules, dist, .git)
find . -type d -not -path '*/node_modules/*' -not -path '*/dist/*' -not -path '*/.git/*' -not -name '.*'
```

**For each directory**, read all source files and create `scatter.md`:

```markdown
# {directory_name}

## Purpose

{One sentence: what this directory is responsible for}

## Files

| File       | Purpose        | Exports            |
| ---------- | -------------- | ------------------ |
| {filename} | {what it does} | {exported symbols} |

## Key Types

{List interfaces, types, classes with brief descriptions}

## Dependencies

- Internal: {imports from other directories in this package}
- External: {imports from node_modules or other packages}

## Notes

{Anything notable: patterns used, complexity, TODOs found}
```

#### For root-level files:

Create `scatter.md` at package root covering:

```markdown
# Package Root

## package.json

- Name: {name}
- Description: {description}
- Version: {version}
- Main entry: {main/module/exports}
- Bin: {if CLI}
- Scripts: {key scripts}
- Dependencies: {count and notable ones}

## Configuration Files

| File             | Purpose                    |
| ---------------- | -------------------------- |
| tsconfig.json    | {compiler options summary} |
| eslint.config.js | {rules summary}            |
| vitest.config.ts | {test setup}               |
| {other configs}  | {purpose}                  |

## Entry Point Analysis

{What src/index.ts exports - this is the public API}
```

### Phase 2: Gather

Combine all scatter.md files into a single `gather.md` at the package root.

```bash
# Collect all scatter files
find . -name 'scatter.md' -type f
```

**gather.md structure:**

```markdown
# {Package Name} - Code Analysis

## Overview

- Package: {name}
- Type: {Library/CLI/Command Handler/Example}
- Entry: {main entry point}

## Public API

{From root scatter.md - what's exported from index.ts}

## Architecture

### Directory Structure

{Tree view of directories}

### Module Breakdown

{For each scatter.md, include a summary}

#### {directory_name}

{Content from that directory's scatter.md}

---

## Cross-Cutting Concerns

- Patterns: {common patterns observed}
- Dependencies: {shared dependencies}
- Testing: {test coverage, test patterns}

## README Considerations

- Template: {A/B/C/D/E/F based on analysis}
- Key features to highlight: {list}
- Complex areas needing explanation: {list}
- Example candidates: {code that would make good examples}
```

### Phase 3: Generate README

Spawn a sub-agent with this prompt:

```
You are generating a README.md for a package.

READ the attached gather.md thoroughly - it contains a complete analysis of the codebase.

FOLLOW the README Generation & Maintenance skill (attached) to:
1. Select the correct template based on the package type
2. Fill in all template variables from the gather.md analysis
3. Generate complete, accurate documentation

The gather.md contains:
- Package metadata and configuration
- All exports and their purposes
- Directory structure and responsibilities
- Cross-cutting patterns and concerns

Use this information to create a README that accurately represents the codebase.

Output ONLY the README.md content.
```

**Attach to sub-agent:**

1. The `gather.md` file
2. This skill file (for template selection and formatting rules)

### Phase 4: Cleanup

After README.md is created and validated:

```bash
# Remove all scatter and gather files
find . -name 'scatter.md' -type f -delete
find . -name 'gather.md' -type f -delete
```

### Scatter-Gather Quick Reference

```
1. SCATTER: For each directory → create scatter.md
   - Read all .ts/.js files
   - Document exports, types, purpose
   - Note dependencies and patterns

2. GATHER: Combine into single gather.md
   - Merge all scatter.md content
   - Add cross-cutting analysis
   - Identify template type

3. GENERATE: Sub-agent creates README
   - Input: gather.md + this skill
   - Output: README.md

4. CLEANUP: Delete scatter.md and gather.md files
```

---

## Quick Reference: Template Selection

```
IF path is root `README.md`             → Template F (Root Landing Page)
ELSE IF path contains `/examples/`      → Template D (Example Project)
ELSE IF exports `COMMANDS` array        → Template A (Command Handler)
ELSE IF package.json has `bin` field    → Template C (CLI Entry Point)
ELSE IF path matches `src/**/README.md` → Template E (Subfolder Module)
ELSE                                    → Template B (Utility/Library)
```

---

## Before Starting: Gather Context

```bash
# Package info
cat package.json 2>/dev/null | head -80

# Main exports
cat src/index.ts src/index.js 2>/dev/null | head -150

# Existing README
cat README.md 2>/dev/null

# Examples and tests
ls -la examples/ test/ tests/ __tests__/ 2>/dev/null
cat examples/*.ts 2>/dev/null | head -100

# CI and config
ls .github/workflows/ 2>/dev/null
cat .env.example 2>/dev/null | head -50

# License
head -5 LICENSE 2>/dev/null

# For monorepo root: list all packages
ls packages/ 2>/dev/null
for pkg in packages/*/package.json; do cat "$pkg" | jq '{name, description}' 2>/dev/null; done
```

---

## Step 1: Analyze Package

### 1.1 Read package.json

```
EXTRACT:
- name           → {{PACKAGE_NAME}}
- description    → {{DESCRIPTION}} (if present)
- keywords       → {{TAGS}} (if present)
- version        → {{VERSION}}
- bin            → indicates CLI tool (Template C)
- dependencies   → list for Dependencies section
- exports        → subpath exports like "/node"
- workspaces     → indicates monorepo (Template F for root)
```

### 1.2 Read src/index.ts

```
SCAN for these patterns:

COMMANDS array:
  export const COMMANDS = [...]
  → Template A; extract command handlers

Type exports:
  export type { FooCommand, BarEvent } from './...'
  → List in API Reference

Function exports:
  export { functionName } from './...'
  export const functionName = ...
  → List in API Reference

Class exports:
  export { ClassName } from './...'
  → Document constructor and methods
```

### 1.3 Read src/types.ts (if exists)

```
EXTRACT:
- Interface definitions → document in API Reference
- Type aliases → document in API Reference
- Zod schemas → note validation rules
```

### 1.4 Read \*.specs.ts files

```
USE FOR:
- Usage examples (copy real test code patterns)
- Expected behavior documentation
- Edge cases to mention
```

---

## Step 2: Select Template

Apply the decision tree from Quick Reference. Then proceed to the matching template section.

---

## Template A: Command Handler Package

**USE WHEN:** Package exports a `COMMANDS` array.

### Data to Extract

| Data              | Source                                   | Variable            |
| ----------------- | ---------------------------------------- | ------------------- |
| Package name      | package.json `name`                      | `{{PACKAGE_NAME}}`  |
| Commands          | COMMANDS array items                     | `{{COMMAND_LIST}}`  |
| Command types     | Exported `*Command` types                | `{{COMMAND_TYPES}}` |
| Event types       | Exported `*Event` types                  | `{{EVENT_TYPES}}`   |
| CLI alias         | COMMANDS[n].alias or COMMANDS[n].command | `{{CLI_ALIAS}}`     |
| Handler functions | Exported `*Handler`                      | `{{HANDLERS}}`      |

### Output Template

```markdown
# {{PACKAGE_NAME}}

{{ONE_SENTENCE_SUMMARY}}

---

## Purpose

Without `{{PACKAGE_NAME}}`, you would have to {{PAINFUL_ALTERNATIVE}}.

{{1-2 paragraphs on pipeline role and design decisions}}

---

## Installation

\`\`\`bash
pnpm add {{PACKAGE_NAME}}
\`\`\`

## Quick Start

{{INTRO_SENTENCE}}

### 1. Register the handlers

\`\`\`typescript
import { COMMANDS } from '{{PACKAGE_NAME}}';
import { createMessageBus } from '@auto-engineer/message-bus';

const bus = createMessageBus();
COMMANDS.forEach(cmd => bus.register(cmd));
\`\`\`

### 2. Send a command

\`\`\`typescript
const result = await bus.send({
type: '{{COMMAND_TYPE}}',
data: { {{EXAMPLE_FIELDS}} },
});

console.log(result);
// → { type: '{{SUCCESS_EVENT}}', data: { {{RESULT_FIELDS}} } }
\`\`\`

{{CONCLUSION_SENTENCE}}

---

## How-to Guides

### Run via CLI

\`\`\`bash
auto {{CLI_ALIAS}} {{EXAMPLE_FLAGS}}
\`\`\`

### Run Programmatically

\`\`\`typescript
import { {{HANDLER_NAME}} } from '{{PACKAGE_NAME}}';

const result = await {{HANDLER_NAME}}.handle({
type: '{{COMMAND_TYPE}}',
data: { {{FIELDS}} },
requestId: 'req-123',
});
\`\`\`

### Handle Errors

\`\`\`typescript
if (result.type === '{{FAILURE_EVENT}}') {
console.error(result.data.error);
}
\`\`\`

### Enable Debug Logging

\`\`\`bash
DEBUG=auto:{{PACKAGE_SHORT_NAME}}:\* pnpm auto {{CLI_ALIAS}}
\`\`\`

---

## API Reference

### Exports

\`\`\`typescript
import { COMMANDS, {{HANDLER_NAMES}} } from '{{PACKAGE_NAME}}';

import type {
{{COMMAND_TYPES}},
{{EVENT_TYPES}},
} from '{{PACKAGE_NAME}}';
\`\`\`

### Commands

| Command | CLI Alias | Description |
| ------- | --------- | ----------- |

{{COMMAND_TABLE_ROWS}}

---

## Architecture

\`\`\`
src/
├── index.ts
├── commands/
│ └── {{COMMAND_FILES}}
└── {{OTHER_DIRS}}
\`\`\`

### Dependencies

| Package | Usage |
| ------- | ----- |

{{DEPENDENCY_TABLE_ROWS}}
```

### Validation Rules for Template A

```
□ COMMANDS array is documented
□ All exported types listed in API Reference
□ Quick Start shows complete import + usage
□ CLI alias matches actual COMMANDS config
□ Error handling example uses actual failure event name
```

---

## Template B: Utility/Library Package

**USE WHEN:** Package provides APIs without CLI commands or COMMANDS array.

### Data to Extract

| Data            | Source                 | Variable           |
| --------------- | ---------------------- | ------------------ |
| Package name    | package.json `name`    | `{{PACKAGE_NAME}}` |
| Main exports    | src/index.ts           | `{{EXPORTS}}`      |
| Interfaces      | src/types.ts           | `{{INTERFACES}}`   |
| Functions       | src/index.ts           | `{{FUNCTIONS}}`    |
| Subpath exports | package.json `exports` | `{{SUBPATHS}}`     |

### Output Template

```markdown
# {{PACKAGE_NAME}}

{{ONE_SENTENCE_SUMMARY}}

---

## Purpose

Without `{{PACKAGE_NAME}}`, you would have to {{PAINFUL_ALTERNATIVE}}.

{{Design philosophy paragraph}}

## Key Concepts

- **{{CONCEPT_1}}**: {{DEFINITION_1}}
- **{{CONCEPT_2}}**: {{DEFINITION_2}}

---

## Installation

\`\`\`bash
pnpm add {{PACKAGE_NAME}}
\`\`\`

## Quick Start

\`\`\`typescript
import { {{MAIN_EXPORT}} } from '{{PACKAGE_NAME}}';

const result = {{MAIN_EXPORT}}({{ARGS}});
console.log(result);
// → {{EXPECTED_OUTPUT}}
\`\`\`

---

## How-to Guides

### {{TASK_1}}

\`\`\`typescript
{{SOLUTION_1}}
\`\`\`

### {{TASK_2}}

\`\`\`typescript
{{SOLUTION_2}}
\`\`\`

---

## API Reference

### Package Exports

\`\`\`typescript
import { {{EXPORTS}} } from '{{PACKAGE_NAME}}';
{{#IF_SUBPATHS}}
import { {{SUBPATH_EXPORTS}} } from '{{PACKAGE_NAME}}/{{SUBPATH}}';
{{/IF_SUBPATHS}}
\`\`\`

### Functions

#### `{{FUNCTION_NAME}}({{PARAMS}}): {{RETURN_TYPE}}`

{{DESCRIPTION}}

**Parameters:**

| Parameter | Type | Description |
| --------- | ---- | ----------- |

{{PARAM_TABLE_ROWS}}

**Returns:** `{{RETURN_TYPE}}` - {{RETURN_DESCRIPTION}}

**Example:**

\`\`\`typescript
const result = {{FUNCTION_NAME}}({{EXAMPLE_ARGS}});
\`\`\`

### Interfaces

#### `{{INTERFACE_NAME}}`

\`\`\`typescript
interface {{INTERFACE_NAME}} {
{{PROPERTIES}}
}
\`\`\`

---

## Architecture

\`\`\`
src/
├── index.ts
{{FILE_TREE}}
\`\`\`

### Dependencies

**Monorepo:** {{WORKSPACE_DEPS_OR_NONE}}

**External:**

| Package | Usage |
| ------- | ----- |

{{EXTERNAL_DEPS_TABLE}}
```

### Validation Rules for Template B

```
□ All exported functions documented with signatures
□ All exported interfaces documented
□ Quick Start produces visible output
□ Subpath exports documented if present
□ No CLI-specific sections (this is a library)
```

---

## Template C: CLI Entry Point

**USE WHEN:** Package has `bin` field in package.json.

### Data to Extract

| Data         | Source              | Variable           |
| ------------ | ------------------- | ------------------ |
| Package name | package.json `name` | `{{PACKAGE_NAME}}` |
| Binary name  | package.json `bin`  | `{{BIN_NAME}}`     |
| Commands     | CLI implementation  | `{{CLI_COMMANDS}}` |
| Options      | CLI implementation  | `{{CLI_OPTIONS}}`  |

### Output Template

```markdown
# {{PACKAGE_NAME}}

{{ONE_SENTENCE_SUMMARY}}

---

## Purpose

{{What this CLI does and when to use it}}

---

## Installation

\`\`\`bash

# Global

npm install -g {{PACKAGE_NAME}}

# Or via npx

npx {{PACKAGE_NAME}}
\`\`\`

## Quick Start

\`\`\`bash

# Step 1: Create a project

{{BIN_NAME}} {{MAIN_COMMAND}}

# Step 2: Navigate and install

cd {{PROJECT_NAME}}
pnpm install

# Step 3: Run

pnpm dev
\`\`\`

---

## How-to Guides

### {{TASK_1}}

\`\`\`bash
{{COMMAND_1}}
\`\`\`

### {{TASK_2}}

\`\`\`bash
{{COMMAND_2}}
\`\`\`

### Configure for CI/CD

\`\`\`bash
{{BIN_NAME}} {{COMMAND}} --non-interactive
\`\`\`

---

## CLI Reference

### Commands

#### `{{BIN_NAME}} {{COMMAND}}`

{{DESCRIPTION}}

\`\`\`bash
{{BIN_NAME}} {{COMMAND}} [options]
\`\`\`

| Option | Alias | Type | Default | Description |
| ------ | ----- | ---- | ------- | ----------- |

{{OPTIONS_TABLE_ROWS}}

### Configuration File

\`\`\`typescript
// {{CONFIG_FILE}}
export default {
{{CONFIG_FIELDS}}
};
\`\`\`

---

## Troubleshooting

### {{ISSUE_1}}

**Symptom:** {{SYMPTOM_1}}

**Cause:** {{CAUSE_1}}

**Solution:**

\`\`\`bash
{{FIX_1}}
\`\`\`

### Enable Debug Logging

\`\`\`bash
DEBUG=auto:\* {{BIN_NAME}} {{COMMAND}}
\`\`\`

---

## Architecture

### Dependencies

| Package | Usage |
| ------- | ----- |

{{DEPENDENCY_TABLE_ROWS}}
```

### Validation Rules for Template C

```
□ Troubleshooting section is REQUIRED (not optional)
□ All CLI commands documented with options table
□ Quick Start shows complete workflow from install to running output
□ Configuration file format documented if applicable
□ Non-interactive mode documented for CI/CD
```

---

## Template D: Example Project

**USE WHEN:** Path contains `/examples/`.

### Data to Extract

| Data          | Source                    | Variable            |
| ------------- | ------------------------- | ------------------- |
| Example name  | Directory name            | `{{EXAMPLE_NAME}}`  |
| Purpose       | README or auto.config.ts  | `{{PURPOSE}}`       |
| Prerequisites | package.json engines/deps | `{{PREREQUISITES}}` |
| Commands      | package.json scripts      | `{{SCRIPTS}}`       |
| Narratives    | narratives/\*.ts files    | `{{NARRATIVES}}`    |

### Output Template

```markdown
# {{EXAMPLE_NAME}}

{{ONE_SENTENCE_DESCRIPTION}}

**Estimated time:** ~10 minutes

---

## What You'll Learn

- {{LEARNING_OUTCOME_1}}
- {{LEARNING_OUTCOME_2}}
- {{LEARNING_OUTCOME_3}}

## Prerequisites

- Node.js {{NODE_VERSION}}+
- pnpm {{PNPM_VERSION}}+
  {{ADDITIONAL_PREREQUISITES}}

---

## Tutorial: Running This Example

### Step 1: Install Dependencies

\`\`\`bash
cd examples/{{EXAMPLE_NAME}}
pnpm install
\`\`\`

### Step 2: Configure Environment

\`\`\`bash
cp .env.example .env

# Edit .env with required values

\`\`\`

### Step 3: Run the Pipeline

\`\`\`bash
pnpm auto
\`\`\`

{{EXPLANATION_OF_WHAT_HAPPENS}}

### Step 4: Start the Application

\`\`\`bash
pnpm start
\`\`\`

### Step 5: Explore the Generated Code

{{KEY_FILES_TO_EXAMINE}}

---

## How-to Guides

### Run Individual Commands

\`\`\`bash
{{INDIVIDUAL_COMMANDS}}
\`\`\`

### Reset and Start Fresh

\`\`\`bash
pnpm clean
\`\`\`

### Enable Debug Output

\`\`\`bash
DEBUG=auto:\* pnpm auto
\`\`\`

---

## Reference

### Project Structure

\`\`\`
{{EXAMPLE_NAME}}/
├── auto.config.ts
├── package.json
├── narratives/
│ └── {{NARRATIVE_FILES}}
├── .context/
├── server/
└── client/
\`\`\`

### Domain Model

**Commands:**

| Command | Description |
| ------- | ----------- |

{{COMMAND_TABLE_ROWS}}

**Events:**

| Event | Description |
| ----- | ----------- |

{{EVENT_TABLE_ROWS}}

---

## Explanation

### How the Pipeline Works

{{CONCEPTUAL_EXPLANATION}}

### Why This Architecture?

{{DESIGN_RATIONALE}}
```

### Validation Rules for Template D

```
□ Estimated time is realistic (test it)
□ Tutorial has exactly 5 steps maximum
□ Each step produces observable output
□ .env.example is mentioned if environment variables required
□ pnpm clean command works
```

---

## Template E: Subfolder Module

**USE WHEN:** README is for an internal module at `src/**/README.md`.

### Output Template

```markdown
# {{MODULE_NAME}}

{{ONE_SENTENCE_DESCRIPTION}}

---

## Files

| File | Purpose |
| ---- | ------- |

{{FILE_TABLE_ROWS}}

---

## API Reference

### {{FILENAME}}.ts

**Exports:**

- `{{EXPORT_1}}` - {{DESCRIPTION_1}}
- `{{EXPORT_2}}` - {{DESCRIPTION_2}}

### Types

#### `{{TYPE_NAME}}`

\`\`\`typescript
interface {{TYPE_NAME}} {
{{PROPERTIES}}
}
\`\`\`

---

## Usage

\`\`\`typescript
import { {{EXPORT}} } from './{{FILE}}';

const result = {{EXPORT}}({{ARGS}});
\`\`\`
```

### Validation Rules for Template E

```
□ All files in the folder are listed
□ All exports are documented
□ Usage example uses relative imports (internal module)
□ No installation section (internal module)
```

---

## Template F: Root Landing Page

**USE WHEN:** Path is the repository root `README.md`.

This template differs from package READMEs. The root README serves as:

- Marketing landing page (first impression)
- Navigation hub (find the right package)
- Quick start gateway (zero to running)
- Trust signal (badges, activity, community)

### The 5-Second Rule

When a developer lands on your repo, they must understand within 5 seconds:

1. What is this?
2. Does it solve my problem?
3. How hard is it to use?

If these questions remain unanswered "above the fold," they bounce.

### Data to Extract

| Data         | Source                                | Variable             |
| ------------ | ------------------------------------- | -------------------- |
| Project name | Root package.json or directory        | `{{PROJECT_NAME}}`   |
| Tagline      | package.json description              | `{{TAGLINE}}`        |
| Packages     | packages/\*/package.json              | `{{PACKAGES_TABLE}}` |
| Examples     | examples/\*/package.json              | `{{EXAMPLES_TABLE}}` |
| License      | LICENSE file                          | `{{LICENSE_TYPE}}`   |
| Owner/Repo   | git remote or package.json repository | `{{OWNER}}/{{REPO}}` |

### Badge Selection (Root README)

Include badges that signal project health and make adoption decisions easy.

**Priority order** (include only if source exists, max 6):

| Priority | Badge      | Include If                       | Format                                                                                                            |
| -------- | ---------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| 1        | Build      | `.github/workflows/*.yml` exists | `[![Build](https://img.shields.io/github/actions/workflow/status/{{OWNER}}/{{REPO}}/ci.yml?style=flat-square)]()` |
| 2        | License    | `LICENSE` file exists            | `[![License](https://img.shields.io/badge/license-{{LICENSE}}-blue?style=flat-square)](LICENSE)`                  |
| 3        | npm        | Main package published           | `[![npm](https://img.shields.io/npm/v/{{MAIN_PKG}}?style=flat-square)]()`                                         |
| 4        | Coverage   | Coverage configured              | `[![Coverage](https://img.shields.io/codecov/c/github/{{OWNER}}/{{REPO}}?style=flat-square)]()`                   |
| 5        | TypeScript | `tsconfig.json` exists           | `[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue?style=flat-square)]()`                         |
| 6        | Discord    | Community link exists            | `[![Discord](https://img.shields.io/discord/{{SERVER_ID}}?style=flat-square)]()`                                  |

**Rules:**

- All badges on single line
- Always use `?style=flat-square`
- Maximum 6 badges
- Green "passing" badges signal health; broken badges erode trust

### Output Template

```markdown
# {{PROJECT_NAME}}

{{ONE_LINE_TAGLINE}}

{{BADGES}}

---

## What is {{PROJECT_NAME}}?

{{2-3 paragraphs explaining:}}

- What problem this solves (be specific about the pain point)
- Who it's for (target developer persona)
- How it works at a high level (the mechanism, not implementation)

---

## Quick Start

Get from zero to running in under 2 minutes:

\`\`\`bash
npx {{CLI_PACKAGE}} my-project
cd my-project
pnpm install
pnpm dev
\`\`\`

{{One sentence: what just happened, what the user should see}}

**Next steps:**

- [Tutorial: Build your first {{THING}}](./examples/{{FIRST_EXAMPLE}})
- [Core concepts](./docs/concepts.md)

---

## Packages

### Core

| Package                | Description     |
| ---------------------- | --------------- |
| [`{{name}}`]({{path}}) | {{description}} |

{{CORE_PACKAGES_ROWS}}

### Generators

| Package | Description |
| ------- | ----------- |

{{GENERATOR_PACKAGES_ROWS}}

### Utilities

| Package | Description |
| ------- | ----------- |

{{UTILITY_PACKAGES_ROWS}}

---

## Examples

| Example                | Description     | Complexity                         |
| ---------------------- | --------------- | ---------------------------------- |
| [`{{name}}`]({{path}}) | {{description}} | {{Beginner/Intermediate/Advanced}} |

{{EXAMPLES_ROWS}}

---

## How It Works

\`\`\`mermaid
flowchart LR
A[{{INPUT}}] --> B[{{PROCESS_1}}]
B --> C[{{PROCESS_2}}]
C --> D[{{OUTPUT}}]
\`\`\`

{{2-3 sentence explanation of the diagram}}

---

## Documentation

| Resource                                     | Description                        |
| -------------------------------------------- | ---------------------------------- |
| [Getting Started](./docs/getting-started.md) | First-time setup and core concepts |
| [API Reference](./docs/api.md)               | Complete API documentation         |
| [Architecture](./docs/architecture.md)       | How it works under the hood        |
| [Contributing](./CONTRIBUTING.md)            | Guidelines for contributors        |

---

## Development

### Prerequisites

- Node.js {{NODE_VERSION}}+
- pnpm {{PNPM_VERSION}}+

### Setup

\`\`\`bash
git clone https://github.com/{{OWNER}}/{{REPO}}.git
cd {{REPO}}
pnpm install
pnpm build
\`\`\`

### Commands

| Command      | Description            |
| ------------ | ---------------------- |
| `pnpm build` | Build all packages     |
| `pnpm test`  | Run all tests          |
| `pnpm dev`   | Start development mode |
| `pnpm lint`  | Lint all packages      |

---

## Contributing

Contributions welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

{{IF CODE_OF_CONDUCT.md exists:}}
This project follows our [Code of Conduct](CODE_OF_CONDUCT.md).
{{/IF}}

---

## License

{{LICENSE_TYPE}} © {{YEAR}} {{AUTHOR}}

See [LICENSE](LICENSE) for details.
```

### Validation Rules for Template F

```
□ Quick Start works from fresh clone (actually test it)
□ Quick Start completes in <2 minutes
□ All packages in monorepo listed with accurate descriptions
□ All examples listed with complexity ratings
□ Mermaid diagram reflects actual architecture (not aspirational)
□ Badges ≤ 6, all on single line
□ No marketing language without evidence
□ All doc links actually exist
□ Prerequisites match actual requirements (check engines field)
```

### Root README Anti-Patterns

| Pattern                       | Problem              | Fix                          |
| ----------------------------- | -------------------- | ---------------------------- |
| "Powerful/Revolutionary/Best" | Empty marketing      | Remove or add benchmarks     |
| 10+ badges                    | Visual noise         | Reduce to 6 max              |
| Quick start > 5 steps         | Too much friction    | Simplify or link to tutorial |
| Broken doc links              | Erodes trust         | Verify all links exist       |
| Outdated package list         | Confusion            | Regenerate from packages/    |
| ASCII architecture            | Hard to update       | Use Mermaid                  |
| No examples section           | Can't learn by doing | Add examples/ and list       |
| Wall of text intro            | Won't be read        | 2-3 focused paragraphs       |

---

## Update Procedures

### When to Update

| Trigger                | Sections to Update                |
| ---------------------- | --------------------------------- |
| Version bump           | Version badge                     |
| New export             | API section, possibly Usage       |
| New example file       | Examples table (F) or Usage links |
| New package added      | Packages table (F)                |
| CI workflow changes    | Build badge URL                   |
| New `.env.example` var | Configuration section             |
| LICENSE changes        | License section + badge           |
| File moved/deleted     | All internal links                |
| README > 6 months old  | Full review                       |

### Diff Rules

**Preserve:**

- Custom sections not in this spec
- User-written prose in description
- Manually curated examples (unless imports broken)
- Acknowledgments/Credits sections
- Mermaid diagrams (unless architecture changed)

**Update:**

- Version numbers if hardcoded
- API docs when exports change
- Links to moved files
- Badge URLs when CI changes
- Package/example tables when contents change

**Add:**

- New sections when triggers detected
- New packages/examples to tables

**Remove:**

- References to deleted files
- API docs for removed exports
- Badges for removed services
- Packages/examples no longer present

---

## Validation Checklist (All Templates)

### Code Blocks

- [ ] Language specified (`typescript`, `bash`, etc.)
- [ ] Imports reference actual exports
- [ ] No `$` or `>` prompt prefix
- [ ] No `#` comments that break copy-paste
- [ ] Examples 3-10 lines with expected output

### Links

- [ ] Internal links resolve to existing files
- [ ] Cross-package: relative paths (`../other-package/README.md`)
- [ ] External: full URLs with HTTPS

### Content

- [ ] Package name matches manifest exactly
- [ ] License matches LICENSE file
- [ ] No marketing fluff without evidence
- [ ] Purpose uses "Without X, you would have to Y"

### Visual

- [ ] Badges ≤ 6, single line, `?style=flat-square`
- [ ] Mermaid diagrams (not ASCII art)
- [ ] Tables aligned with pipes

---

## Anti-Pattern Detection

| Pattern            | Detection                           | Fix                      |
| ------------------ | ----------------------------------- | ------------------------ |
| Marketing fluff    | "best", "powerful", "revolutionary" | Remove or add benchmarks |
| Broken imports     | Import doesn't match export         | Regenerate from source   |
| Prompt prefix      | `$` or `>` in bash                  | Remove prefix            |
| Comment in install | `# comment` in bash                 | Remove comment           |
| Badge overload     | >6 badges or multiple lines         | Reduce to essentials     |
| Dead links         | `[text](path)` → 404                | Update or remove         |
| Outdated version   | Hardcoded ≠ manifest                | Use dynamic or remove    |
| Wall of text       | Paragraphs >5 sentences             | Break up, add headers    |

---

## Text Cleanup

### Words to DELETE

```
powerful, comprehensive, amazing, revolutionary, game-changing,
next-generation, enterprise-grade, best, robust, seamless,
cutting-edge, state-of-the-art, simply, just, easily, obviously
```

### Phrases to REWRITE

| Pattern              | Replace With               |
| -------------------- | -------------------------- |
| "Unfortunately"      | Rewrite neutrally          |
| "You'll want to"     | Imperative: "Configure..." |
| "Please see"         | "See"                      |
| "In order to"        | "To"                       |
| "It should be noted" | State directly             |
| "As you can see"     | DELETE                     |

### Voice by Section

| Section       | Voice             | Pronouns   |
| ------------- | ----------------- | ---------- |
| Quick Start   | Warm, guiding     | "you"      |
| How-to        | Direct, practical | "you"      |
| API Reference | Neutral, precise  | Impersonal |
| Architecture  | Thoughtful        | "we"       |

---

## Mermaid Diagram Rules

USE Mermaid for architecture. NEVER ASCII art.

| Content      | Diagram Type      |
| ------------ | ----------------- |
| Architecture | `flowchart TB`    |
| Data flow    | `flowchart LR`    |
| Sequences    | `sequenceDiagram` |
| Types        | `classDiagram`    |
| States       | `stateDiagram-v2` |

**Rules:**

- Max 10-15 nodes
- Descriptive labels (not A, B, C)
- Text description for accessibility
- LR for pipelines, TB for hierarchies

---

## Formatting Rules

1. **Blank lines**: Before headings, before/after code blocks, before lists
2. **Code blocks**: Always specify language; `bash` not `shell`
3. **Links**: Relative for internal (`[CONTRIBUTING](CONTRIBUTING.md)`)
4. **Badges**: Always `?style=flat-square`
5. **Tables**: Align with pipes, min 3 dashes (`---`)
6. **Headings**: Title case
