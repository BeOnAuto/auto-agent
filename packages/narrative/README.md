# @auto-engineer/narrative

TypeScript DSL for defining business narratives using BDD patterns with Given/When/Then syntax.

---

## Purpose

Without `@auto-engineer/narrative`, you would have to manually structure behavioral specifications, write boilerplate for command/query definitions, and handle the conversion between specification code and JSON models.

This package enables developers to express system behavior through narratives containing slices (commands, queries, reactions, experiences). Each slice supports client and server specifications using Gherkin-style Given/When/Then syntax.

---

## Installation

```bash
pnpm add @auto-engineer/narrative
```

## Quick Start

```typescript
import { flow, command, specs, rule, example, type Event, type Command } from '@auto-engineer/narrative';

type OrderPlaced = Event<'OrderPlaced', { orderId: string }>;
type PlaceOrder = Command<'PlaceOrder', { productId: string }>;

flow('Orders', () => {
  command('Place order')
    .server(() => {
      specs('Order placement', () => {
        rule('Valid orders are processed', () => {
          example('User places order')
            .when<PlaceOrder>({ productId: 'p-001' })
            .then<OrderPlaced>({ orderId: 'o-001' });
        });
      });
    });
});
```

---

## How-to Guides

### Define a Command Slice

```typescript
import { flow, command, specs, rule, example } from '@auto-engineer/narrative';

flow('Users', () => {
  command('Create user')
    .stream('user-${userId}')
    .server(() => {
      specs('User creation', () => {
        rule('Valid users created', () => {
          example('New user')
            .when({ name: 'John' })
            .then({ userId: 'u-001' });
        });
      });
    });
});
```

### Define a Query Slice

```typescript
import { flow, query, describe, it, data, source } from '@auto-engineer/narrative';

flow('Products', () => {
  query('View products')
    .client(() => {
      describe('Product list', () => {
        it('displays all products');
      });
    })
    .server(() => {
      data([source().state('Products').fromProjection('ProductsProjection', 'id')]);
    });
});
```

### Define Data Sinks and Sources

```typescript
import { flow, command, data, sink, source } from '@auto-engineer/narrative';

flow('Payments', () => {
  command('Process payment')
    .server(() => {
      data([
        sink().event('PaymentProcessed').toStream('payment-${paymentId}'),
        source().state('Account').fromProjection('Accounts', 'accountId'),
      ]);
    });
});
```

### Load Narratives from File System

```typescript
import { getNarratives } from '@auto-engineer/narrative';
import { NodeFileStore } from '@auto-engineer/file-store';

const vfs = new NodeFileStore();
const result = await getNarratives({ vfs, root: '/path/to/src' });
const model = result.toModel();
```

---

## API Reference

### Package Exports

```typescript
import {
  flow, narrative,
  command, query, react, experience,
  specs, rule, example, describe, it, should,
  client, server, data,
  sink, source,
  getNarratives, modelToNarrative,
  addAutoIds, hasAllIds,
  gql,
  type Event, type Command, type State,
} from '@auto-engineer/narrative';

import { COMMANDS, exportSchemaCommandHandler } from '@auto-engineer/narrative/node';
```

### Entry Points

| Entry Point | Import Path | Description |
|-------------|-------------|-------------|
| Main | `@auto-engineer/narrative` | Core DSL and types |
| Node | `@auto-engineer/narrative/node` | Command handlers |

### Slice Types

| Type | Description | Client | Server |
|------|-------------|--------|--------|
| `command` | User actions that modify state | Yes | Yes |
| `query` | Read operations | Yes | Yes |
| `react` | Event reactions | No | Yes |
| `experience` | UI-only behaviors | Yes | No |

### Message Types

```typescript
type Event<Type extends string, Data> = { type: Type; data: Data };
type Command<Type extends string, Data> = { type: Type; data: Data };
type State<Type extends string, Data> = { type: Type; data: Data };
```

---

## Architecture

```
src/
├── index.ts
├── node.ts
├── narrative.ts
├── fluent-builder.ts
├── schema.ts
├── types.ts
├── data-narrative-builders.ts
├── loader/
├── transformers/
├── id/
└── commands/
```

### Key Concepts

- **Narratives**: Business capabilities containing slices
- **Slices**: Behavioral units (command, query, react, experience)
- **Specifications**: BDD-style Given/When/Then assertions
- **Data Flow**: Sinks (outbound) and Sources (inbound)

### Dependencies

| Package | Usage |
|---------|-------|
| `@auto-engineer/file-store` | Virtual file system |
| `@auto-engineer/id` | ID generation |
| `@auto-engineer/message-bus` | Command/Event types |
| `zod` | Schema validation |
| `typescript` | AST parsing |
| `graphql` | GraphQL query parsing |
