---
name: auto-build
description: Build application code from an Auto narrative model. Use when the user asks to build, generate, scaffold, or implement code from their model, or when working with vertical slices, resolvers, components, or tests derived from the model.
version: 0.1.0
---

# Building Applications from Narrative Models

The narrative model (`.auto-agent/model.json`) is the single source of truth for your application. It expresses **what** the application does; you translate it to **how**.

> **Read [`references/ndd-structure.md`](references/ndd-structure.md) first.** It is the canonical structural reference for Domain → Narrative → Scene → Moment, including how each level maps to model fields, how to handle transitions between scenes, and the anti-patterns you must reject.

## Core Concepts

NDD organises every system into four levels:

```
Domain (business capability)
└── Narrative (goal thread)
    └── Scene (single outcome)
        └── Moment (single step toward that outcome)
```

**Domain** — The top-level model **is** the domain. The workspace's `capability`, `actors`, and `entities` describe a coherent business capability area (e.g., "Concert Booking"). Every narrative below reuses these.

**Narratives** are goal threads — cohesive groups of related scene outcomes that fulfil a broader user or business goal (e.g., "Getting Tickets").

**Scenes** are outcomes — each scene is a single self-contained outcome that becomes true (e.g., "Tickets reserved," "Fan added to waitlist"). All moments within a scene work together to deliver that outcome.

**Moments** are the atomic units — each moment is one step toward the scene's outcome. Each moment is one of `command` (state change via mutation), `query` (data retrieval), `react` (system responds to event), or `experience` (UI-only). Command, query, and react moments each become **one vertical slice** in the codebase.

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

## Reading the Model (staged extraction)

**Do NOT call `auto_get_model`** — it returns the full model (often >100K chars) which overwhelms context. Instead use targeted extraction tools:

### Step 1: Get the overview (~10K chars)
Call `auto_get_model_overview` to understand the full scope:
- Requirements, assumptions, actors, entities
- Narratives with descriptions, outcomes, and scene IDs
- Scenes with moment names, types, descriptions (no UI specs)
- Message names and field names (no full types)
- App shell description and design brief

This tells you WHAT to build — the complete structure in one compact call.

### Step 2: Get design tokens
Call `auto_get_design` to get the theme and app shell:
- `theme.colors` (light/dark mode with oklch values)
- `theme.font`, `theme.radius`, `theme.shadow`, `theme.animation`
- `appShell` (layout name, chrome, navigation, brand placement)
- `brief` (visual direction description)

Generate `theme.css` with CSS custom properties immediately. The model's theme is authoritative — use it for all styling decisions.

### Step 3: Build scene by scene
For each scene, call `auto_get_scene_detail(sceneName)` to get:
- Full scene object with all moments expanded
- Each moment's `client.ui.spec` (json-render wireframe)
- Each moment's `client.specs` (BDD test specs)
- Each moment's `server.specs` and `server.data`
- Related messages (data contracts referenced by the scene's moments)

Build one scene at a time, keeping context focused.

### Key paths within a scene detail
- `scene.moments[].type` — `"command"`, `"query"`, `"experience"`, or `"react"`
- `scene.moments[].client.ui.spec` — json-render flat element map (`root`, `elements`, `state`)
- `scene.moments[].client.specs` — BDD `describe`/`it` test specs
- `scene.moments[].server.specs` — gherkin Given/When/Then scenarios
- `scene.moments[].server.data.items` — event targets and stream patterns
- `relatedMessages` — data contracts (command/event/state/query messages with full field types)

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

### Design Quality

All generated UI must follow the premium design patterns in `references/design-patterns.md`. Key rules:
- Use `Geist`, `Satoshi`, or `Outfit` fonts — never Inter or Roboto
- Neutral Zinc/Slate palette with max 1 accent color (saturation < 80%)
- Double-Bezel (Doppelrand) pattern for major cards and containers
- Custom cubic-bezier transitions — no `linear` or `ease-in-out`
- Scroll entry animations, skeleton loaders, proper empty/error states
- Responsive: collapse to single-column below 768px
- No AI aesthetic cliches (neon glows, pure black, oversaturated gradients)

Apply these patterns while preserving the structural intent of the model's `client.ui.spec`. The spec provides layout and data binding; the design patterns provide visual polish.

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

### 4. Browser Verification (after each scene)

After completing all moments in a scene, verify the running application works end-to-end:

**If browser MCP tools are available** (e.g., `chrome-devtools`):
1. Navigate to the frontend URL: `mcp__chrome-devtools__navigate_page` to `http://localhost:5173`
2. Take a screenshot: `mcp__chrome-devtools__take_screenshot` to visually verify the page rendered correctly
3. Check for console errors: `mcp__chrome-devtools__list_console_messages`
4. If the scene involves user interaction, use `mcp__chrome-devtools__click`, `mcp__chrome-devtools__fill`, etc. to walk through the flow

**If browser tools are NOT available**, fall back to:
1. `curl` the frontend URL to verify it returns HTML
2. Query the GraphQL endpoint directly to verify resolvers work:
   ```bash
   curl -s http://localhost:4000/graphql \
     -H 'Content-Type: application/json' \
     -d '{"query":"{ <queryFromMoment> }"}'
   ```
3. For mutations, send test data and verify the response
4. Suggest to the developer: "Install a browser MCP server (e.g., chrome-devtools) for visual verification of the running app."

**GraphQL endpoint testing** (always, regardless of browser availability):
- After building each scene's backend, send the actual GraphQL operations from each moment's `request` field against the running server
- Verify the responses match expected shapes from the gherkin specs
- This catches schema mismatches, resolver errors, and data flow issues early

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
