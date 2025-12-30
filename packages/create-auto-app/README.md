# create-auto-app

CLI scaffolding tool for creating new Auto Engineer applications.

---

## Purpose

This tool generates complete project structures with templates, dependencies, and configuration. It provides both interactive prompts and command-line options for quick project scaffolding.

---

## Installation

```bash
# Global
npm install -g create-auto-app

# Or via npx
npx create-auto-app
```

## Quick Start

```bash
# Step 1: Create a project
npx create-auto-app my-app

# Step 2: Navigate and install
cd my-app
pnpm install

# Step 3: Run
pnpm dev
```

---

## How-to Guides

### Create with Template

```bash
create-auto-app my-shop --template=kanban-todo
```

### Create Minimal Project

```bash
create-auto-app my-app --preset=minimal
```

### Scaffold in Current Directory

```bash
create-auto-app . --preset=full
```

### Use Specific Package Manager

```bash
create-auto-app my-app --use-pnpm
create-auto-app my-app --use-yarn
create-auto-app my-app --use-npm
```

### Skip Dependency Installation

```bash
create-auto-app my-app --no-install
```

### Configure for CI/CD

```bash
create-auto-app my-app --preset=full --no-install --use-pnpm
```

---

## CLI Reference

### Commands

#### `create-auto-app [project-name]`

Create a new Auto Engineer project.

```bash
create-auto-app [project-name] [options]
```

| Option | Alias | Type | Default | Description |
|--------|-------|------|---------|-------------|
| `--template` | `-t` | string | - | Use a specific template |
| `--preset` | `-p` | string | full | Package preset (minimal, full) |
| `--no-install` | - | boolean | false | Skip dependency installation |
| `--use-npm` | - | boolean | false | Force npm |
| `--use-yarn` | - | boolean | false | Force yarn |
| `--use-pnpm` | - | boolean | false | Force pnpm |

### Available Templates

| Template | Description |
|----------|-------------|
| `questionnaires` | Survey and questionnaire management system |
| `kanban-todo` | Kanban-style todo list with drag-and-drop |

### Presets

| Preset | Description |
|--------|-------------|
| `minimal` | Narrative and server generator only |
| `full` | All Auto Engineer packages |

---

## Troubleshooting

### Directory Already Exists

**Symptom:** Error about existing directory

**Cause:** Project directory already exists with files

**Solution:**

```bash
# Overwrite existing directory
create-auto-app my-app --force
# Or choose a different name
create-auto-app my-new-app
```

### Template Not Found

**Symptom:** Template not recognized

**Cause:** Invalid template name

**Solution:**

```bash
# List available templates
create-auto-app --help
# Use valid template name
create-auto-app my-app --template=kanban-todo
```

### Package Manager Not Found

**Symptom:** Installation fails

**Cause:** Specified package manager not installed

**Solution:**

```bash
# Install pnpm
npm install -g pnpm
# Then create project
create-auto-app my-app --use-pnpm
```

### Enable Debug Logging

```bash
DEBUG=create-auto-app:* create-auto-app my-app
```

---

## Architecture

```
src/
├── index.ts
├── templates.ts
├── project.ts
└── utils.ts
templates/
├── kanban-todo/
└── questionnaires/
```

### Generated Project Structure

```
my-app/
├── narratives/
├── .context/
├── server/
├── client/
├── auto.config.ts
├── package.json
├── pnpm-workspace.yaml
└── .gitignore
```

### Dependencies

| Package | Usage |
|---------|-------|
| `@auto-engineer/id` | Generate unique project IDs |
| `commander` | CLI argument parsing |
| `inquirer` | Interactive prompts |
| `chalk` | Terminal styling |
| `ora` | Loading spinners |
| `execa` | Execute shell commands |
| `fs-extra` | File system operations |
