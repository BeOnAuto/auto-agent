# @auto-engineer/cli

Command-line interface for Auto Engineer, a tool for building applications with Narrative Driven Development.

---

## Purpose

The CLI orchestrates a pipeline-based architecture that loads plugins, starts development servers, and synchronizes files between local development and remote sandboxes. It serves as the primary entry point for running Auto Engineer workflows.

---

## Installation

```bash
# Global
npm install -g @auto-engineer/cli

# Or via npx
npx @auto-engineer/cli
```

## Quick Start

```bash
# Step 1: Create a config file
cat > auto.config.ts << 'EOF'
import { define } from '@auto-engineer/pipeline';

export const plugins = [
  '@auto-engineer/narrative',
  '@auto-engineer/server-generator-apollo-emmett',
];

export const pipeline = define('my-pipeline')
  .on('SchemaExported')
  .emit('GenerateServer', (e) => ({
    modelPath: e.data.outputPath,
    destination: e.data.directory,
  }))
  .build();
EOF

# Step 2: Start the server
auto start

# Step 3: View the pipeline diagram
auto diagram
```

---

## How-to Guides

### Start the Pipeline Server

```bash
auto start
# or simply
auto
```

### Dispatch a Command

```bash
auto dispatch GenerateServer --data '{"modelPath": "./schema.json", "destination": "."}'
```

### Check Server Status

```bash
auto status
```

### Connect to Existing Server

```bash
auto dispatch MyCommand --host http://localhost:5555 --data '{}'
```

### Configure for CI/CD

```bash
auto start --port 8080 --config ./ci.config.ts
```

---

## CLI Reference

### Commands

#### `auto start`

Start the pipeline server with loaded config (default command).

```bash
auto start [options]
```

| Option | Alias | Type | Default | Description |
|--------|-------|------|---------|-------------|
| `--port` | `-p` | number | 5555 | Server port |
| `--debug` | `-d` | boolean | false | Enable debug mode |
| `--config` | `-c` | string | auto.config.ts | Path to config file |

#### `auto dispatch <command>`

Dispatch a command to the pipeline server.

```bash
auto dispatch <command> [options]
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--data` | string | `{}` | Command data as JSON |
| `--host` | string | localhost | Connect to existing server |

#### `auto status`

Check pipeline server health and registry status.

```bash
auto status
```

#### `auto diagram`

Open the pipeline diagram in a browser.

```bash
auto diagram
```

### Configuration File

```typescript
// auto.config.ts
import { define } from '@auto-engineer/pipeline';

export const fileId = 'my-project';

export const plugins = [
  '@auto-engineer/narrative',
  '@auto-engineer/server-generator-apollo-emmett',
];

export const pipeline = define('my-pipeline')
  .on('SchemaExported')
  .emit('GenerateServer', (e) => ({
    modelPath: e.data.outputPath,
    destination: e.data.directory,
  }))
  .build();
```

---

## Troubleshooting

### Server Won't Start

**Symptom:** `No pipeline config found` error

**Cause:** Missing auto.config.ts file in current directory

**Solution:**

```bash
# Create a minimal config
cat > auto.config.ts << 'EOF'
export const plugins = [];
export const pipeline = { nodes: [] };
EOF
```

### Port Already in Use

**Symptom:** Server fails to bind to port

**Cause:** Another process is using the port

**Solution:**

```bash
auto start --port 5556
```

### Plugin Not Loading

**Symptom:** Command handlers not found

**Cause:** Plugin package not installed or COMMANDS not exported

**Solution:**

```bash
pnpm add @auto-engineer/my-plugin
```

### Enable Debug Logging

```bash
DEBUG=auto:* auto start
```

---

## Architecture

```
src/
├── index.ts
├── file-syncer/
│   └── index.ts
└── bin/
    └── auto.js
```

### Server Endpoints

| Endpoint | Description |
|----------|-------------|
| `/health` | Server health check |
| `/registry` | List registered handlers |
| `/pipeline` | Pipeline state |
| `/pipeline/diagram` | Visual diagram |
| `/events` | SSE stream |
| `ws://<syncPort>` | File sync WebSocket |

### Dependencies

| Package | Usage |
|---------|-------|
| `@auto-engineer/pipeline` | Pipeline server infrastructure |
| `@auto-engineer/narrative` | File discovery for sync |
| `@auto-engineer/file-store` | Virtual file system |
| `commander` | CLI argument parsing |
| `socket.io` | WebSocket communication |
| `chokidar` | File system watching |
