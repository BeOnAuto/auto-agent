# @auto-engineer/server-generator-nestjs

| | |
| --- | --- |
| **Status** | EXPERIMENTAL - NOT READY FOR PRODUCTION |
| **Stability** | APIs will change without notice |
| **Completeness** | Features may be incomplete or broken |

Generates complete NestJS servers from narrative domain models with CQRS, GraphQL, and MikroORM.

---

## Purpose

Without `@auto-engineer/server-generator-nestjs`, you would have to manually scaffold NestJS modules, wire up CQRS command/query handlers, configure GraphQL resolvers, define MikroORM entities, and write boilerplate test files for every domain slice.

This package takes a narrative model (JSON) describing your domain flows and slices, then generates a fully functional NestJS server with:

- CQRS pattern via `@nestjs/cqrs` for command and query separation
- GraphQL API via Apollo Server with auto-generated resolvers
- MikroORM entities with SQLite persistence
- Test scaffolds for each command handler

The generated server is immediately runnable and provides a foundation for domain-driven development.

---

## Installation

```bash
pnpm add @auto-engineer/server-generator-nestjs
```

## Quick Start

This package generates NestJS servers from domain models. Here is how to use it.

### 1. Register the handlers

```typescript
import { COMMANDS } from "@auto-engineer/server-generator-nestjs";
import { createMessageBus } from "@auto-engineer/message-bus";

const bus = createMessageBus();
COMMANDS.forEach((cmd) => bus.register(cmd));
```

### 2. Send a command

```typescript
const result = await bus.send({
  type: "GenerateServer",
  data: {
    modelPath: ".context/model.json",
    destination: ".",
  },
});

console.log(result);
// → { type: 'ServerGenerated', data: { serverDir: './server', ... } }
```

The command reads your model file, generates a complete NestJS server in the `server/` directory, and installs dependencies automatically.

---

## How-to Guides

### Run via CLI

```bash
auto generate:server --model-path=.context/model.json --destination=.
```

### Run Programmatically

```typescript
import { commandHandler } from "@auto-engineer/server-generator-nestjs";

const result = await commandHandler.handle({
  type: "GenerateServer",
  data: {
    modelPath: ".context/model.json",
    destination: "/path/to/project",
  },
  requestId: "req-123",
});
```

### Handle Errors

```typescript
if (result.type === "ServerGenerationFailed") {
  console.error(result.data.error);
}
```

### Handle Per-Slice Progress

The handler emits `SliceGeneratedEvent` for each domain slice processed:

```typescript
const events = await commandHandler.handle(command);

for (const event of events) {
  if (event.type === "SliceGenerated") {
    console.log(`Generated: ${event.data.flowName}.${event.data.sliceName}`);
  }
}
```

### Enable Debug Logging

```bash
DEBUG=auto:server-generator-nestjs:* pnpm auto generate:server
```

Available debug namespaces:

- `auto:server-generator-nestjs` - General operation logging
- `auto:server-generator-nestjs:schema` - Model parsing details
- `auto:server-generator-nestjs:files` - File copy operations
- `auto:server-generator-nestjs:deps` - Dependency installation
- `auto:server-generator-nestjs:scaffold` - Scaffold generation

---

## API Reference

### Exports

```typescript
import { COMMANDS } from "@auto-engineer/server-generator-nestjs";

import type {
  GenerateServerCommand,
  GenerateServerEvents,
  ServerGeneratedEvent,
  ServerGenerationFailedEvent,
  SliceGeneratedEvent,
} from "@auto-engineer/server-generator-nestjs";
```

### Commands

| Command          | CLI Alias         | Description                       |
| ---------------- | ----------------- | --------------------------------- |
| `GenerateServer` | `generate:server` | Generate NestJS server from model |

### Command Fields

| Field         | Type     | Required | Description                                |
| ------------- | -------- | -------- | ------------------------------------------ |
| `modelPath`   | `string` | Yes      | Path to the JSON model file                |
| `destination` | `string` | Yes      | Destination directory for generated server |

### Events

| Event                         | Description                      |
| ----------------------------- | -------------------------------- |
| `ServerGeneratedEvent`        | Emitted on successful generation |
| `ServerGenerationFailedEvent` | Emitted when generation fails    |
| `SliceGeneratedEvent`         | Emitted for each slice processed |

### ServerGeneratedEvent Data

```typescript
{
  modelPath: string;
  destination: string;
  serverDir: string;
  contextSchemaGraphQL?: string;
}
```

### ServerGenerationFailedEvent Data

```typescript
{
  modelPath: string;
  destination: string;
  error: string;
}
```

### SliceGeneratedEvent Data

```typescript
{
  flowName: string;
  sliceName: string;
  sliceType: string;
  schemaPath: string;
  slicePath: string;
}
```

---

## Architecture

```
src/
├── index.ts                    # Package entry point (exports COMMANDS)
├── commands/
│   └── generate-server.ts      # Main command handler
├── codegen/
│   ├── scaffoldFromSchema.ts   # Scaffold orchestrator
│   ├── entity-consolidation.ts # Entity field merging
│   ├── types.ts                # Core type definitions
│   ├── extract/                # Message/GWT extraction
│   │   ├── commands.ts         # Command extraction
│   │   ├── events.ts           # Event extraction
│   │   ├── states.ts           # State extraction
│   │   ├── fields.ts           # Field extraction
│   │   ├── gwt.ts              # GWT mapping builders
│   │   ├── graphql.ts          # GraphQL query parsing
│   │   └── imports.ts          # Cross-slice imports
│   ├── templates/              # EJS templates
│   │   ├── command/            # Command slice templates
│   │   ├── query/              # Query slice templates
│   │   ├── entity/             # Entity templates
│   │   └── module/             # NestJS module templates
│   └── utils/
│       └── path.ts             # Path utilities
└── shared/                     # Files copied to generated server
    ├── main.ts                 # NestJS bootstrap
    ├── mikro-orm.config.ts     # Database configuration
    └── graphql-types.ts        # Shared GraphQL types
```

### Generated Server Structure

The command generates the following structure:

```
server/
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── mikro-orm.config.ts
└── src/
    ├── main.ts
    └── domain/
        ├── shared/
        │   └── graphql-types.ts
        ├── {flow-name}/
        │   ├── {slice-name}/
        │   │   ├── command.ts
        │   │   ├── input.ts
        │   │   ├── handler.ts
        │   │   ├── handler.specs.ts
        │   │   └── resolver.ts
        │   └── entities/
        │       └── {entity}.entity.ts
        └── {flow-name}.module.ts
```

### Dependencies

**Monorepo:**

| Package                    | Usage                         |
| -------------------------- | ----------------------------- |
| `@auto-engineer/narrative` | Domain model type definitions |

**External:**

| Package             | Usage                       |
| ------------------- | --------------------------- |
| `@nestjs/cqrs`      | CQRS command/query pattern  |
| `@nestjs/graphql`   | GraphQL schema generation   |
| `@nestjs/apollo`    | Apollo Server integration   |
| `@mikro-orm/core`   | ORM for entity persistence  |
| `@mikro-orm/sqlite` | SQLite database driver      |
| `ejs`               | Template rendering engine   |
| `prettier`          | Generated code formatting   |
| `change-case`       | Naming convention utilities |
| `execa`             | Dependency installation     |

---

## Known Limitations

This generator is experimental. Current limitations include:

- Schema extraction is incomplete for complex slice types
- Generated code may require manual fixes
- Test coverage is minimal
- Only SQLite persistence is supported
