# Support Files

Shared design system assets for Auto Engineer examples.

---

## Purpose

This directory provides pre-configured design system files that other examples copy into their `.context/` directories. These files are consumed by the `@auto-engineer/design-system-importer` package and frontend generation plugins.

---

## Directory Structure

```
support-files/
├── .env.example          # Environment variable template
└── .context/
    ├── design-system.md    # Component documentation
    ├── figma-file.json     # Figma design tokens (~44MB)
    └── shadcn-filter.ts    # Component filtering logic
```

---

## File Descriptions

### .env.example

Template for Auto Engineer environment variables:

```bash
# AI Provider Keys
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
GEMINI_API_KEY=
XAI_API_KEY=

# Defaults
DEFAULT_AI_PROVIDER=anthropic
DEFAULT_AI_MODEL=claude-sonnet-4-20250514

# Debug
DEBUG=auto:*
```

### .context/design-system.md

Generated markdown listing 55+ shadcn/ui components:

| Category | Components |
|----------|------------|
| Form | button, checkbox, input, select, switch, textarea, slider |
| Layout | accordion, card, dialog, drawer, sheet, tabs, separator |
| Navigation | breadcrumb, menubar, navigation-menu, pagination |
| Data | avatar, badge, calendar, data-table, table |
| Feedback | alert, alert-dialog, progress, skeleton, toast, tooltip |

### .context/figma-file.json

Raw Figma API export containing design tokens:

- **Spacing**: `spacing/0`, `spacing/px`, `spacing/1`...`spacing/96`
- **Dimensions**: `w-0`, `h-0`, `h-px`, `w-full`, `h-screen`
- **Scopes**: GAP, WIDTH_HEIGHT configurations

### .context/shadcn-filter.ts

Filter function for processing Figma components during import:

**Excludes:**
- Generic names: `image`, `slot`, `logo`, `icon`
- Internal components: `toolbar`, `stepper`, `sidebar`

**Includes:**
- Valid component names (1-3 words, alphabetic)
- `INSTANCE` type components
- Hierarchy depth ≤ 3

**Transforms:**
- Converts to lowercase kebab-case
- Deduplicates and sorts

---

## Usage

### Copying to a Project

From another example directory:

```bash
rm -rf .context && mkdir .context && cp ../support-files/.context/* ./.context
```

The `kanban-todo` example includes this in its clean script:

```bash
pnpm clean  # Runs the copy automatically
```

### Using with Design System Importer

```bash
auto import:design-system \
  --output-dir=./.context \
  --strategy=WITH_COMPONENT_SETS \
  --filter-path=./shadcn-filter.ts
```

### Pipeline Integration

In `auto.config.ts`, reference these files:

```typescript
.on('IAGenerated')
.emit('GenerateClient', () => ({
  figmaVariablesPath: resolvePath('./.context/figma-file.json'),
}))

.emit('ImplementComponent', (c) => ({
  designSystemPath: resolvePath('./.context/design-system.md'),
}))
```

---

## Regenerating Files

To regenerate from a Figma source:

```bash
# Set credentials
export FIGMA_PERSONAL_TOKEN=your-token
export FIGMA_FILE_ID=your-file-id

# Run importer
auto import:design-system \
  --output-dir=./.context \
  --strategy=WITH_ALL_FIGMA_INSTANCES \
  --filter-path=./shadcn-filter.ts
```

**Import Strategies:**

| Strategy | Description |
|----------|-------------|
| `WITH_COMPONENTS` | Individual components only |
| `WITH_COMPONENT_SETS` | Component sets (default) |
| `WITH_ALL_FIGMA_INSTANCES` | Full document traversal |

---

## Related Packages

| Package | Relationship |
|---------|--------------|
| `@auto-engineer/design-system-importer` | Consumes filter, produces design-system.md |
| `@auto-engineer/frontend-generator-react-graphql` | Uses figma-file.json for tokens |
| `@auto-engineer/component-implementer` | Uses design-system.md for constraints |
| `@auto-engineer/information-architect` | References component list for IA |
