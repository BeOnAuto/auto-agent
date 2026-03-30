---
name: auto-build
description: Build application code from an Auto narrative model. Use when the user asks to build, generate, scaffold, or implement code from their model, or when working with vertical slices, resolvers, components, or tests derived from the model.
version: 0.1.0
---

# Building Applications from Narrative Models

The narrative model (`.auto-agent/model.json`) is the single source of truth for your application. It expresses **what** the application does; you translate it to **how**.

## Core Concepts

**Narratives** group scenes into complete user journeys (e.g., "Flower Shop Order Fulfillment").

**Scenes** group moments into coherent interaction sequences (e.g., "Browse and Select Flowers"). A scene represents a unit of business value — all moments within it must work together.

**Moments** are the atomic units. Each moment is either a `command` (state change via mutation) or a `query` (data retrieval). Each moment becomes **one vertical slice** in the codebase.

**Messages** define data contracts: `command` (input), `event` (output), `state` (persisted), `query` (lookup params). Their `fields` arrays define the schema.

## Architecture: Vertical Slices

Each moment is a self-contained vertical slice with high cohesion internally and low coupling to other slices. Slices communicate through events and shared state, never by importing each other directly.

### Directory Structure

```
src/
  narratives/<narrative-slug>/
    scenes/<scene-slug>/
      moments/<moment-slug>/
        server/
          handler.ts            # GraphQL resolver + business logic
          handler.test.ts       # Given-When-Then tests from server.specs
        client/
          <MomentName>.tsx      # React component (json-render + Apollo)
          <MomentName>.stories.tsx
          <MomentName>.test.tsx
      scene.acceptance.test.ts  # Cross-moment acceptance test for the scene
  shared/
    graphql/
      schema.ts                 # Merged GraphQL type definitions
      resolvers.ts              # Merged resolver map
    db/
      repository.ts             # Repository interface + implementation
      event-log.ts              # Append-only event log
    components/                 # Shared UI primitives if needed
```

Slug derivation: `"Place Order"` → `place-order`, `"CreateBouquetDraft"` → `create-bouquet-draft`.

## Reading the Model

Fetch the model using `auto_get_model`. Key paths:

- `model.narratives[]` — top-level journeys with `sceneIds`
- `model.scenes[]` — each has `moments[]`
- `model.messages[]` — data contracts (type: command/event/state/query)
- `moment.type` — `"command"` or `"query"`
- `moment.request` — the GraphQL operation string (mutation or query)
- `moment.server.specs` — gherkin test scenarios
- `moment.server.data.items` — event targets and stream patterns
- `moment.client.ui.spec` — json-render compatible UI specification
- `moment.mappings` — field derivations between request and messages

## Backend: Event-Driven with CQRS

**Command moments** → GraphQL mutations. Each handler validates input, executes business logic via a repository, emits domain events, and returns a `MutationResponse`.

**Query moments** → GraphQL queries. Each handler reads from the database via a repository and returns projected state.

The database is the source of truth for state. Events are emitted alongside state changes for observability, testing, and inter-slice communication. An append-only event log stores all events but the database tables hold canonical state.

DDD patterns apply: repository pattern for data access, domain services for cross-cutting logic, CQRS for separating reads from writes.

See `references/backend-patterns.md` for complete resolver templates, type mapping rules, and repository patterns.

## Frontend: json-render.dev + React + Apollo

The model's `client.ui.spec` is directly compatible with [json-render.dev](https://json-render.dev) — the spec format (`root`, `elements`, `type`, `props`, `children`, `visible`, `repeat`, `$state`, `$item`) matches json-render's schema.

**Approach for each moment's UI:**

1. **Render the spec directly** using `@json-render/react` + `@json-render/shadcn` (39 pre-built shadcn/ui components). This gets the UI structure working immediately with minimal tokens.
2. **Wire data** using Apollo hooks: `useMutation` for command moments, `useQuery` for query moments. The `moment.request` field contains the exact GraphQL operation to use.
3. **Adapt event handlers**: Transform `on: { click: { action: "submit" } }` to json-render's `ActionProvider` pattern.
4. **Enhance**: Add business logic, loading/error states, and any customization beyond what the spec provides.
5. **Export if needed**: `@json-render/code-generation` can export standalone React components with zero json-render runtime dependency.

See `references/frontend-patterns.md` for json-render setup, Apollo wiring, and Storybook patterns.

## Testing Strategy

Three levels of testing ensure both individual slice correctness and cross-slice cohesion.

### 1. Per-Slice Unit Tests (from `server.specs`)

Each moment's `server.specs` contains gherkin rules with Given/When/Then steps:
- **Given** steps → set up precondition state (the `text` field names a message, `docString` provides sample data)
- **When** steps → execute the command or query
- **Then** steps → assert expected events or state changes

### 2. Per-Scene Acceptance Tests

After all moments in a scene are built, test the full flow by executing moments in order against the real GraphQL endpoint. This verifies that data flows correctly across moments within a scene.

### 3. Run All Tests After Building

After generating code, run the full test suite and fix any failures before moving on.

See `references/testing-patterns.md` for concrete test templates and the gherkin-to-test translation rules.

## Build Process

### Full Build (first run or no deltas)

1. Fetch model via `auto_get_model`
2. Generate shared infrastructure: GraphQL schema from messages, TypeScript types, repository interfaces
3. For each narrative → scene → moment:
   - Create the slice directory structure
   - Generate server handler from moment type, specs, data, and mappings
   - Generate client component from `client.ui.spec` using json-render
   - Generate tests from `server.specs` gherkin scenarios
4. Generate per-scene acceptance tests
5. Run all tests
6. Start dev servers if applicable
7. Report endpoints via `auto_update_endpoints`

### Incremental Build (deltas exist)

1. Fetch deltas via `auto_get_changes` (returns added/updated/removed entities, then clears)
2. For each change:
   - `added` moment/scene → generate new slice
   - `updated` moment/scene → regenerate affected slice
   - `removed` moment/scene → remove slice directory
3. Regenerate shared types if any messages changed
4. Run tests for affected slices + their scene acceptance tests
5. Report updated endpoints

### Model Correction Loop

While building, if you detect inconsistencies in the model (missing message references, type mismatches, incomplete specs):
1. Fix the issue in the model JSON
2. Send the corrected model via `auto_send_model` — the server validates and may apply further corrections
3. Use the returned corrected model to continue building
4. Always validate corrections with the server before proceeding

## Project Scaffold

When building for the first time and no project structure exists, you have full agency to scaffold the project. Here are typical defaults for guidance (the developer may direct you otherwise):

- **Runtime**: React, Apollo Client, GraphQL
- **Build**: Vite, TypeScript
- **UI**: json-render with shadcn components, Tailwind CSS
- **Testing**: Vitest, Storybook
- **Server**: Apollo Server, repository pattern over database

These are starting points, not requirements. Follow the developer's preferences if they differ.
