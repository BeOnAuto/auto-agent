# Frontend Patterns Reference

## json-render.dev Overview

The model's `client.ui.spec` uses the [json-render](https://json-render.dev) spec format. Key packages:

- `@json-render/core` — schema definition, catalog, prompt generation, state store, prop expressions
- `@json-render/react` — React renderer, StateProvider, ActionProvider, VisibilityProvider, ValidationProvider
- `@on.auto/ui-components` — 60+ shadcn/ui-backed components with json-render adapters (catalog + component implementations). This is the component registry that maps spec types to real React components.

### Installing the component stack
```bash
npm install @json-render/core @json-render/react @on.auto/ui-components
```

## Spec Format

The `client.ui.spec` on each moment has this structure:

```json
{
  "root": "layout-root",
  "elements": {
    "layout-root": {
      "type": "Stack",
      "props": { "direction": "vertical", "gap": "none", "className": "..." },
      "children": ["child-id-1", "child-id-2"]
    },
    "child-id-1": {
      "type": "Input",
      "props": {
        "label": { "$state": "/formFields/nameLabel" },
        "placeholder": "Enter name"
      }
    },
    "some-button": {
      "type": "Button",
      "props": { "label": "Submit" },
      "on": { "click": { "action": "submit", "target": "MomentName" } }
    }
  },
  "state": {
    "formFields": { "nameLabel": "Full Name" }
  }
}
```

## Data Binding Expressions

These work identically in json-render and the model spec:

| Expression | Meaning |
|---|---|
| `{ "$state": "/path/to/value" }` | Read from state using JSON Pointer path |
| `{ "$item": "field" }` | Access current repeat item field |
| `{ "$index": true }` | Zero-based index in repeat context |
| `{ "$bindState": "/path" }` | Two-way binding (reads and writes) |
| `{ "$bindItem": "field" }` | Two-way bind within repeat scope |
| `{ "$cond": condition, "$then": val1, "$else": val2 }` | Conditional props |
| `{ "$template": "Hello, ${/user/name}!" }` | String interpolation |

## Rendering a Moment's UI

### Step 1: Render the spec directly

```tsx
import { Renderer } from '@json-render/react'
import { StateProvider } from '@json-render/react'
import { registry } from './registry'

export function CreateBouquetDraft() {
  const spec = /* moment's client.ui.spec (without the state key) */
  const initialState = /* moment's client.ui.spec.state */

  return (
    <StateProvider initialState={initialState}>
      <Renderer spec={spec} registry={registry} />
    </StateProvider>
  )
}
```

### Step 2: Set up the component registry

Use `@on.auto/ui-components` for the pre-built shadcn/ui component adapters:

```tsx
import { catalog } from '@on.auto/ui-components'
import { components } from '@on.auto/ui-components/components'
import { defineCatalog } from '@json-render/core'
import { schema } from '@json-render/react/schema'
import { defineRegistry } from '@json-render/react'

const jrCatalog = defineCatalog(schema, { components: catalog, actions: {} })
export const { registry } = defineRegistry(jrCatalog, { components })
```

This maps 60+ component types (Stack, Card, Input, Button, Text, Heading, Badge, Avatar, DataTable, KPICard, Sidebar, Callout, etc.) to real shadcn/ui React components with full state binding support.

### Step 3: Wire event handlers via ActionProvider

The model's `on` handlers need to be translated to json-render's action model:

```tsx
import { ActionProvider } from '@json-render/react'
import { useMutation, gql } from '@apollo/client'

const PLACE_ORDER = gql`
  mutation PlaceOrder($input: PlaceOrderInput!) {
    placeOrder(input: $input) { success error { type message } }
  }
`

export function PlaceOrder() {
  const [placeOrder, { loading }] = useMutation(PLACE_ORDER)

  const actionHandlers = {
    submit: async (state) => {
      await placeOrder({
        variables: { input: { bouquetId: state.bouquetId, customerId: state.customerId } }
      })
    }
  }

  return (
    <StateProvider initialState={initialState}>
      <ActionProvider handlers={actionHandlers}>
        <Renderer spec={spec} registry={registry} />
      </ActionProvider>
    </StateProvider>
  )
}
```

### Step 4: Wire queries for data-fetching moments

For query moments, use Apollo's `useQuery`:

```tsx
import { useQuery, gql } from '@apollo/client'

const GET_AVAILABLE_FLOWERS = gql`
  query GetAvailableFlowers {
    getAvailableFlowers { flowerId name category price stock }
  }
`

export function ViewAvailableFlowers() {
  const { data, loading, error } = useQuery(GET_AVAILABLE_FLOWERS)

  const initialState = {
    ...specState,
    flowers: data?.getAvailableFlowers ?? [],
    loading,
    error: error?.message
  }

  return (
    <StateProvider initialState={initialState}>
      <Renderer spec={spec} registry={registry} />
    </StateProvider>
  )
}
```

## Extracting the GraphQL Operation

Each moment's `request` field contains the exact GraphQL operation string. Parse it to get:
- The operation type (mutation/query)
- The operation name
- The variables and their types
- The selected return fields

Use this directly in your `gql` template literal.

## Element Type Reference

Common element types from the model specs:

| Type | Maps to | Key props |
|---|---|---|
| `Stack` | Flex container | `direction`, `gap`, `className`, `align`, `justify` |
| `Input` | Form input | `label`, `placeholder`, `inputType`, `checks` (validation) |
| `Button` | Action button | `label`, `variant`, `on.click` |
| `Text` | Text display | `content`, `className` |
| `Heading` | Heading element | `level` (1-6), `content` |
| `Badge` | Status/label | `variant`, `content` |
| `Avatar` | Avatar | `name`, `size` |

## Repeat Pattern

For list rendering, elements use the `repeat` property:

```json
{
  "type": "Stack",
  "repeat": { "statePath": "/flowers", "key": "flowerId" },
  "children": ["flower-card"]
}
```

Inside repeated children, use `{ "$item": "fieldName" }` to access the current item.

## Visibility Pattern

Conditional rendering uses the `visible` property:

```json
{
  "type": "Text",
  "visible": { "$state": "/error", "op": "neq", "value": null },
  "props": { "content": { "$state": "/error" }, "className": "text-red-500" }
}
```

## Storybook Stories

For each component, generate a Storybook story:

```tsx
import type { Meta, StoryObj } from 'storybook/react'
import { CreateBouquetDraft } from './CreateBouquetDraft'

const meta: Meta<typeof CreateBouquetDraft> = {
  component: CreateBouquetDraft,
}
export default meta

type Story = StoryObj<typeof CreateBouquetDraft>

export const Default: Story = {}

export const WithData: Story = {
  args: {
    initialFlowers: [
      { flowerId: 'f1', name: 'Rose', category: 'classic', price: 5.99, stock: 100 }
    ]
  }
}
```

## Code Export

When you want to eject from json-render to standalone React:

```bash
npx @json-render/code-generation export --spec ./spec.json --output ./components/
```

This generates plain React components with no json-render runtime dependency. Useful when the component needs significant customization beyond what the spec provides.
