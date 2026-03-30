# Backend Patterns Reference

## Type Mapping

When translating message field types to GraphQL SDL and TypeScript:

| Message field type | GraphQL SDL | TypeScript |
|---|---|---|
| `string` | `String` | `string` |
| `number` | `Float` | `number` |
| `boolean` | `Boolean` | `boolean` |
| `Date` | `DateTimeISO` | `Date` |
| `ID` | `ID` | `string` |
| `string[]` | `[String!]` | `string[]` |
| `number[]` | `[Float!]` | `number[]` |
| `{field:type}` | Custom input/object type | Inline interface |
| `{field:type}[]` | `[CustomType!]` | Array of inline interface |
| `"a" \| "b"` | `enum` (PascalCase name) | String union |

Nullable fields (containing `| null` in type) omit the `!` suffix in GraphQL.

## MutationResponse Pattern

All command mutations return a standard response:

```graphql
type MutationResponse {
  success: Boolean!
  error: MutationError
}

type MutationError {
  type: String!
  message: String!
}
```

## Command Moment → Mutation Resolver

Given a command moment like:
- `moment.type: "command"`
- `moment.name: "Place Order"`
- `moment.request: "mutation PlaceOrder($input: PlaceOrderInput!) { placeOrder(input: $input) { success error { type message } } }"`
- Matching command message: `{ type: "command", name: "PlaceOrder", fields: [{name: "bouquetId", type: "string"}, {name: "customerId", type: "string"}] }`
- Event target from `server.data.items`: `{ target: { type: "Event", name: "OrderPlaced" }, destination: { type: "stream", pattern: "orders-${orderId}" } }`

```typescript
import type { MutationResolvers } from '../../shared/graphql/types'
import type { PlaceOrderInput } from './types'
import { OrderRepository } from './repository'
import { EventBus } from '../../shared/events/event-bus'

export const placeOrder: MutationResolvers['placeOrder'] = async (
  _,
  { input },
  context
) => {
  try {
    const repository = new OrderRepository(context.db)
    const eventBus = context.eventBus

    const orderId = context.generateId()
    const order = {
      orderId,
      bouquetId: input.bouquetId,
      customerId: input.customerId,
      status: 'placed',
    }

    await repository.save(order)

    await eventBus.emit('OrderPlaced', {
      orderId,
      bouquetId: input.bouquetId,
      customerId: input.customerId,
    })

    return { success: true, error: null }
  } catch (error) {
    return {
      success: false,
      error: { type: 'VALIDATION', message: error.message },
    }
  }
}
```

## Query Moment → Query Resolver

Given a query moment like:
- `moment.type: "query"`
- `moment.name: "View Pending Orders"`
- `moment.request: "query GetPendingOrders { getPendingOrders { orderId bouquetId customerId status } }"`
- Matching state message: `{ type: "state", name: "OrderPending", fields: [...] }`
- Data source from `server.data.items`: `{ target: { type: "State", name: "OrderPending" }, origin: { type: "projection", name: "pendingOrders" } }`

```typescript
import type { QueryResolvers } from '../../shared/graphql/types'
import { OrderRepository } from './repository'

export const getPendingOrders: QueryResolvers['getPendingOrders'] = async (
  _,
  args,
  context
) => {
  const repository = new OrderRepository(context.db)
  return repository.findPending()
}
```

Return type rules based on `server.data.items[].origin`:
- **Singleton** (`singleton: true`) → single non-null object (`Type!`)
- **ID lookup** (`idField` present) → nullable single object (`Type`)
- **Collection** (default) → non-null array (`[Type!]!`)

## Repository Pattern

Each slice that persists data gets a repository. The repository abstracts database access:

```typescript
export class OrderRepository {
  constructor(private db: DatabaseClient) {}

  async save(order: Order): Promise<void> {
    await this.db.query(
      `INSERT INTO orders (order_id, bouquet_id, customer_id, status)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (order_id) DO UPDATE SET status = $4`,
      [order.orderId, order.bouquetId, order.customerId, order.status]
    )
  }

  async findById(orderId: string): Promise<Order | null> {
    const result = await this.db.query(
      'SELECT * FROM orders WHERE order_id = $1',
      [orderId]
    )
    return result.rows[0] ?? null
  }

  async findPending(): Promise<Order[]> {
    const result = await this.db.query(
      "SELECT * FROM orders WHERE status = 'placed'"
    )
    return result.rows
  }
}
```

## Event Bus Pattern

Events are emitted for observability, testing, and inter-slice communication. The event bus writes to an append-only event log alongside the state changes:

```typescript
export class EventBus {
  constructor(private db: DatabaseClient) {}

  async emit(eventType: string, payload: Record<string, unknown>): Promise<void> {
    await this.db.query(
      `INSERT INTO event_log (event_type, payload, created_at)
       VALUES ($1, $2, NOW())`,
      [eventType, JSON.stringify(payload)]
    )
    // Notify subscribers if any
  }

  async getEvents(eventType: string): Promise<DomainEvent[]> {
    const result = await this.db.query(
      'SELECT * FROM event_log WHERE event_type = $1 ORDER BY created_at',
      [eventType]
    )
    return result.rows
  }
}
```

## GraphQL Schema Assembly

Walk the model to build the complete schema:

1. Extract enums from string literal union fields across all messages
2. Build input types from command messages (used by mutations)
3. Build object types from state messages (returned by queries)
4. Build Mutation type with a field per command moment
5. Build Query type with a field per query moment
6. Add custom scalars (`DateTimeISO`, `JSON`) if referenced
7. Add the `MutationResponse` and `MutationError` types

## Field Mapping Rules

The `moment.mappings` array shows how fields are derived:

```json
{
  "source": { "type": "Server", "name": "@server", "field": "generated" },
  "target": { "type": "Event", "name": "OrderPlaced", "field": "orderId" }
}
```

This means `orderId` on the `OrderPlaced` event is server-generated (not from input). Use `context.generateId()` or equivalent for these fields.

Other mapping types:
- `source.type: "Query"` — field comes from a query result
- `source.type: "Event"` — field comes from a prior event
- `operator` field (eq, gte, lte, contains) — indicates a filter/comparison, not a direct mapping
