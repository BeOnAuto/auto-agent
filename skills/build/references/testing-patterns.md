# Testing Patterns Reference

## Translating Gherkin Specs to Tests

Each moment's `server.specs` contains gherkin-style rules. The structure is:

```json
{
  "type": "gherkin",
  "rules": [{
    "name": "Rule description",
    "examples": [{
      "name": "Example name",
      "steps": [
        { "keyword": "Given", "text": "BouquetDraftState", "docString": { "bouquetId": "b1", "status": "draft" } },
        { "keyword": "When", "text": "CreateBouquetDraft", "docString": { "customerId": "c1", "flowers": null } },
        { "keyword": "Then", "text": "BouquetDraftCreated", "docString": { "bouquetId": "b1", "customerId": "c1" } }
      ]
    }]
  }]
}
```

### Translation Rules

- **Given** steps: The `text` names a message (state or event). The `docString` is sample data. Set up this state in your test — seed the database or repository stub with this data.
- **When** steps: The `text` names a command or query message. The `docString` is the input data. Execute the handler with this input.
- **Then** steps: The `text` names an event or state message. The `docString` is the expected output. Assert that this event was emitted or this state exists.

### Per-Slice Unit Test Template

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { placeOrder } from './handler'
import { createTestContext } from '../../../shared/testing/context'

describe('Place Order', () => {
  let context: TestContext

  beforeEach(() => {
    context = createTestContext()
  })

  it('Successful order placement', async () => {
    // Given: BouquetDraftState exists
    await context.db.seed('bouquet_drafts', {
      bouquetId: 'b1',
      customerId: 'c1',
      status: 'draft',
    })

    // When: PlaceOrder command
    const result = await placeOrder(
      null,
      { input: { bouquetId: 'b1', customerId: 'c1' } },
      context
    )

    // Then: OrderPlaced event emitted
    expect(result).toEqual({ success: true, error: null })
    expect(context.eventBus.emitted).toContainEqual({
      type: 'OrderPlaced',
      payload: expect.objectContaining({
        bouquetId: 'b1',
        customerId: 'c1',
      }),
    })
  })
})
```

### Multiple Examples = Multiple Tests

Each example in a rule becomes its own `it()` block. The example `name` becomes the test description:

```typescript
describe('Create bouquet draft validation and creation', () => {
  it('Successful bouquet draft creation', async () => {
    // steps from example[0]
  })

  it('Rejects duplicate bouquet for same customer', async () => {
    // steps from example[1]
  })
})
```

### Test Context Helper

Create a shared test context that provides stubs for the database, event bus, and other dependencies:

```typescript
export function createTestContext(): TestContext {
  const db = createInMemoryDb()
  const eventBus = createTestEventBus()

  return {
    db,
    eventBus,
    generateId: () => 'test-id-' + Math.random().toString(36).slice(2),
  }
}

function createTestEventBus() {
  const emitted: Array<{ type: string; payload: unknown }> = []
  return {
    emit: async (type: string, payload: unknown) => {
      emitted.push({ type, payload })
    },
    emitted,
    getEvents: async (type: string) =>
      emitted.filter((e) => e.type === type),
  }
}
```

## Per-Scene Acceptance Tests

After all moments in a scene are built, create an acceptance test that exercises the full flow.

### What These Test

- Data flows correctly across moments within a scene
- Moments compose to deliver the scene's business value
- The system works end-to-end through the GraphQL layer

### Template

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createTestServer } from '../../../shared/testing/server'

describe('Scene: Browse and Select Flowers', () => {
  let server: TestServer
  let query: GraphQLQueryFn
  let mutate: GraphQLMutateFn

  beforeAll(async () => {
    server = await createTestServer()
    query = server.query
    mutate = server.mutate
  })

  afterAll(async () => {
    await server.stop()
  })

  it('completes the full browse-and-select flow', async () => {
    // Moment 1: View Available Flowers (query)
    const flowers = await query(`
      query { getAvailableFlowers { flowerId name price } }
    `)
    expect(flowers.data.getAvailableFlowers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ flowerId: expect.any(String) }),
      ])
    )

    // Moment 2: Create Bouquet Draft (command)
    const flowerId = flowers.data.getAvailableFlowers[0].flowerId
    const result = await mutate(`
      mutation CreateBouquetDraft($input: CreateBouquetDraftInput!) {
        createBouquetDraft(input: $input) { success error { type message } }
      }
    `, {
      input: { customerId: 'c1', flowers: [{ flowerId, quantity: 3 }] }
    })
    expect(result.data.createBouquetDraft.success).toBe(true)

    // Moment 3: View Bouquet Draft (query) — verifies data flowed from command
    const draft = await query(`
      query { getBouquetDraft { bouquetId customerId flowers { flowerId quantity } } }
    `)
    expect(draft.data.getBouquetDraft).toEqual(
      expect.objectContaining({
        customerId: 'c1',
        flowers: [{ flowerId, quantity: 3 }],
      })
    )
  })
})
```

### Scene Test Design Principles

- Execute moments in the order they appear in the scene
- Use output from earlier moments as input to later moments (proving data flow)
- Assert on the final observable state, not intermediate steps
- Use the actual GraphQL operations from each moment's `request` field
- Seed any prerequisite data that would normally come from other scenes

## Event Assertion Patterns

When testing that events were emitted correctly:

```typescript
// Assert exact event
expect(context.eventBus.emitted).toContainEqual({
  type: 'OrderPlaced',
  payload: {
    orderId: expect.any(String),
    bouquetId: 'b1',
    customerId: 'c1',
    flowers: [{ flowerId: 'f1', quantity: 3 }],
    totalPrice: 17.97,
  },
})

// Assert event count
const orderEvents = context.eventBus.emitted.filter(e => e.type === 'OrderPlaced')
expect(orderEvents).toHaveLength(1)

// Assert event ordering
const events = context.eventBus.emitted.map(e => e.type)
expect(events).toEqual(['BouquetDraftCreated', 'OrderPlaced'])
```

## DocString as Test Fixtures

The `docString` objects in gherkin steps are sample data. Use them directly as test fixtures:

```json
{ "keyword": "Given", "text": "FlowerInventory", "docString": { "flowerId": "f1", "name": "Rose", "price": 5.99, "stock": 100 } }
```

Translates to:

```typescript
await context.db.seed('flower_inventory', {
  flowerId: 'f1',
  name: 'Rose',
  price: 5.99,
  stock: 100,
})
```

Fields with `null` values in docStrings indicate the field should be generated or is optional — don't include them in assertions.
