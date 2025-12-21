# Pipeline System Architecture

> **TL;DR:** A fluent API with succinct pipeline definitions, zero manual state management, and full graph visualization support.
>
> **[Jump to the complete example →](#4-complete-example-kanban-pipeline)**

---

## Table of Contents

- [Executive Summary](#executive-summary)
- [1. The Problem](#1-the-problem)
  - [What We're Building](#what-were-building)
  - [Current State](#current-state)
  - [Requirements](#requirements)
- [2. Design Philosophy](#2-design-philosophy)
  - [The API Should Read Like a Description](#the-api-should-read-like-a-description)
  - [Three Complexity Levels](#three-complexity-levels)
  - [Familiar Mental Models](#familiar-mental-models)
- [3. Complete API Specification](#3-complete-api-specification)
  - [3.1 Pipeline Builder](#31-pipeline-builder)
  - [3.2 Trigger Builder](#32-trigger-builder)
  - [3.3 Emit Chain](#33-emit-chain)
  - [3.4 Run Builder (Scatter)](#34-run-builder-scatter)
  - [3.5 Gather Builder (Await Results)](#35-gather-builder-await-results)
  - [3.6 Failure Context (The Retry API)](#36-failure-context-the-retry-api)
  - [3.7 ForEach Builder (Phased Execution)](#37-foreach-builder-phased-execution)
  - [3.8 Context Types](#38-context-types)
  - [3.9 Handler Context](#39-handler-context-for-handle)
  - [3.10 Helper Function](#310-helper-function)
- [4. Complete Example: Kanban Pipeline](#4-complete-example-kanban-pipeline)
- [5. Side-by-Side Comparison](#5-side-by-side-comparison)
- [6. Graph Extraction](#6-graph-extraction)
  - [Graph IR Structure](#graph-ir-structure)
  - [Example Output](#example-output)
  - [Visualization](#visualization)
- [7. Pattern Templates (Optional)](#7-pattern-templates-optional-extension)
- [8. Runtime Behavior](#8-runtime-behavior)
  - [8.1 Execution Flow](#81-execution-flow)
  - [8.2 State Management](#82-state-management)
- [9. Summary](#10-summary)

---

## Executive Summary

This document specifies a fluent API for defining event-driven pipelines that orchestrate AI-powered code generation workflows. The API is designed to:

1. **Read like English** — Pipeline definitions describe _what happens_, not _how to wire it_
2. **Handle real complexity** — Scatter-gather-retry and phased execution are first-class primitives
3. **Enable visualization** — Static graph extraction without running the pipeline
4. **Run anywhere** — Same definition works locally and on Cloudflare

---

## 1. The Problem

### What We're Building

The **Pipeline System** orchestrates dozens of AI-powered plugins into coherent workflows. A pipeline configuration defines:

- Which events trigger which commands
- How to handle failures and retries
- How work flows through phases
- When to run things in parallel vs. sequentially

### Current State

Today, pipeline configs are imperative TypeScript with:

```typescript
// Scattered mutable state
const sliceRetryState = new Map<string, number>()
let clientComponents = []
const processedComponents = new Set()
const failedComponents = new Set()
const dispatchedPhases = new Set()

// Implicit event relationships
on('SliceImplemented', (e) => dispatch('CheckTests', {...}))
on('SliceImplemented', (e) => dispatch('CheckTypes', {...}))
on('SliceImplemented', (e) => dispatch('CheckLint', {...}))

// Complex aggregation with unclear semantics
on.settled(['CheckTests', 'CheckTypes', 'CheckLint'],
  dispatch(['ImplementSlice'], (events, send) => {
    const failures = findCheckFailures(events)
    // ... 30 more lines of retry logic
  })
)
```

**Problems:**

- Hard to understand the flow
- Impossible to visualize without execution
- Easy to introduce bugs in state management
- Boilerplate for common patterns (retry, phases)

### Requirements

| ID  | Requirement                                         |
| --- | --------------------------------------------------- |
| R1  | **Easy to write** — New pipeline in <30 mins        |
| R2  | **Plugin compatible** — Commands in, events out     |
| R3  | **Runs locally** — Single-process, no cloud needed  |
| R4  | **Runs on Cloudflare** — Workers, DO, D1, Queues    |
| R5  | **Visualizable** — Static graph extraction          |
| R6  | **Status queryable** — Current state at any time    |
| R7  | **Full history** — Every event stored for debugging |

---

## 2. Design Philosophy

### The API Should Read Like a Description

**Bad:** Assembly instructions

```typescript
.scatter([...]).gatherBy(...).retryUntilSuccess({...})
```

**Good:** A description of what happens

```typescript
.run([...]).awaitAll({ key: ... }).onFailure(ctx => ctx.retry(...))
```

### Three Complexity Levels

| Level          | Use Case        | Example                                 |
| -------------- | --------------- | --------------------------------------- |
| **Simple**     | Event → Command | `.on('A').emit('B', {...})`             |
| **Structured** | Common patterns | `.run([...]).awaitAll().onFailure(...)` |
| **Custom**     | Unique logic    | `.handle(ctx => { ... })`               |

### Familiar Mental Models

| Pattern                        | Inspired By              |
| ------------------------------ | ------------------------ |
| `.forEach(...).groupInto(...)` | JavaScript array methods |
| `.run([...]).awaitAll()`       | Promise.all              |
| `.when(predicate)`             | Stream filtering         |
| `.onFailure(...)`              | Error handlers           |

---

## 3. Complete API Specification

### 3.1 Pipeline Builder

```typescript
function define(name: string): PipelineBuilder;

interface PipelineBuilder {
  // ─────────────────────────────────────────────────────────────────────────
  // METADATA
  // ─────────────────────────────────────────────────────────────────────────

  version(v: string): this;
  description(d: string): this;

  // ─────────────────────────────────────────────────────────────────────────
  // STATE (optional, for custom handlers)
  // ─────────────────────────────────────────────────────────────────────────

  withState<S>(initializers: StateInitializers<S>): PipelineBuilder<S>;

  // ─────────────────────────────────────────────────────────────────────────
  // NAMED DEFINITIONS
  // ─────────────────────────────────────────────────────────────────────────

  /** Define a reusable correlation key extractor */
  key(name: string, extractor: (event: Event) => string): this;

  // ─────────────────────────────────────────────────────────────────────────
  // EVENT HANDLERS
  // ─────────────────────────────────────────────────────────────────────────

  /** Start a handler chain for an event type */
  on<E extends EventType>(eventType: E): TriggerBuilder<E>;

  // ─────────────────────────────────────────────────────────────────────────
  // TERMINAL
  // ─────────────────────────────────────────────────────────────────────────

  build(): Pipeline;
}
```

### 3.2 Trigger Builder

After `.on('EventType')`, you can filter, emit, or define complex patterns.

```typescript
interface TriggerBuilder<E> {
  // ─────────────────────────────────────────────────────────────────────────
  // FILTERING
  // ─────────────────────────────────────────────────────────────────────────

  /** Only proceed if predicate returns true */
  when(predicate: (event: E) => boolean): this;

  // ─────────────────────────────────────────────────────────────────────────
  // SIMPLE EMIT
  // One or more commands in parallel
  // ─────────────────────────────────────────────────────────────────────────

  /** Emit a command (multiple .emit() calls = parallel execution) */
  emit<C extends CommandType>(commandType: C, data: CommandData<C> | ((event: E) => CommandData<C>)): EmitChain<E>;

  // ─────────────────────────────────────────────────────────────────────────
  // SCATTER-GATHER PATTERN
  // Run multiple commands, wait for all, handle results
  // ─────────────────────────────────────────────────────────────────────────

  /** Run multiple commands in parallel */
  run(commands: CommandSpec[] | ((event: E) => CommandSpec[])): RunBuilder<E>;

  // ─────────────────────────────────────────────────────────────────────────
  // PHASED EXECUTION PATTERN
  // Process items in sequential groups
  // ─────────────────────────────────────────────────────────────────────────

  /** Iterate over a collection from the event */
  forEach<T>(selector: (event: E) => T[]): ForEachBuilder<E, T>;

  // ─────────────────────────────────────────────────────────────────────────
  // CUSTOM HANDLER
  // Full imperative access for unique cases
  // ─────────────────────────────────────────────────────────────────────────

  /** Custom handler with full context access */
  handle(handler: (event: E, ctx: HandlerContext) => void, meta?: { emits?: string[] }): ChainTerminal;
}
```

### 3.3 Emit Chain

Multiple `.emit()` calls create parallel commands.

```typescript
interface EmitChain<E> {
  /** Add another parallel command */
  emit<C extends CommandType>(commandType: C, data: CommandData<C> | ((event: E) => CommandData<C>)): this;

  /** Start a new event handler */
  on<E2 extends EventType>(eventType: E2): TriggerBuilder<E2>;

  /** End the pipeline definition */
  build(): Pipeline;
}
```

**Example: Parallel dispatch**

```typescript
.on('ServerGenerated')
  .emit('GenerateIA', { modelPath: '...' })
  .emit('StartServer', { serverDirectory: '...' })
  // Both commands run in parallel
```

### 3.4 Run Builder (Scatter)

After `.run([...])`, define how to gather and handle results.

```typescript
interface RunBuilder<E> {
  /** Wait for all commands to complete, grouped by key */
  awaitAll(config: {
    /** Correlation key (name or extractor function) */
    key: string | ((event: Event) => string);
    /** Timeout in milliseconds */
    timeout?: number;
  }): GatherBuilder<E>;

  /** Don't wait — fire and forget */
  done(): ChainTerminal;
}
```

### 3.5 Gather Builder (Await Results)

After `.awaitAll()`, handle success or failure.

```typescript
interface GatherBuilder<E> {
  /** Handle when any command fails */
  onFailure(handler: (ctx: FailureContext) => void): GatherComplete<E>;

  /** Handle when all commands succeed */
  onSuccess(handler: (ctx: SuccessContext) => void): GatherComplete<E>;

  /** Handle all completions (custom logic) */
  onComplete(handler: (ctx: CompleteContext) => void): GatherComplete<E>;
}

interface GatherComplete<E> {
  /** Add success handler (if failure was defined first) */
  onSuccess(handler: (ctx: SuccessContext) => void): this;

  /** Add failure handler (if success was defined first) */
  onFailure(handler: (ctx: FailureContext) => void): this;

  /** Start a new event handler */
  on<E2 extends EventType>(eventType: E2): TriggerBuilder<E2>;

  /** End the pipeline definition */
  build(): Pipeline;
}
```

### 3.6 Failure Context (The Retry API)

The failure handler receives a context with retry capabilities.

```typescript
interface FailureContext {
  // ─────────────────────────────────────────────────────────────────────────
  // CORRELATION INFO
  // ─────────────────────────────────────────────────────────────────────────

  /** The correlation key for this group */
  key: string;

  /** Current attempt number (1-based) */
  attempt: number;

  // ─────────────────────────────────────────────────────────────────────────
  // FAILURE INFO
  // ─────────────────────────────────────────────────────────────────────────

  /** All failure events */
  failures: Event[];

  /** Concatenated error text from all failures */
  errorText: string;

  /** All events (success and failure) */
  all: Event[];

  /** Events grouped by command type */
  byCommand: Record<string, Event[]>;

  // ─────────────────────────────────────────────────────────────────────────
  // RETRY ACTION
  // ─────────────────────────────────────────────────────────────────────────

  /** Retry a command with new data */
  retry<C extends CommandType>(
    commandType: C,
    config: {
      /** Maximum retry attempts */
      maxAttempts: number;
      /** Command data */
      data: CommandData<C>;
      /** Backoff strategy */
      backoff?: 'none' | 'linear' | 'exponential';
      /** Base delay in ms (default: 1000) */
      backoffMs?: number;
    },
  ): void;

  // ─────────────────────────────────────────────────────────────────────────
  // EMIT (for non-retry actions)
  // ─────────────────────────────────────────────────────────────────────────

  /** Emit a command (for notifications, etc.) */
  emit<C extends CommandType>(commandType: C, data: CommandData<C>): void;
}

interface SuccessContext {
  key: string;
  attempt: number;
  successes: Event[];
  all: Event[];
  byCommand: Record<string, Event[]>;
  emit<C extends CommandType>(commandType: C, data: CommandData<C>): void;
}
```

### 3.7 ForEach Builder (Phased Execution)

For processing collections in sequential phases.

```typescript
interface ForEachBuilder<E, T> {
  /** Group items into sequential phases */
  groupInto<P extends string>(phases: readonly P[], classifier: (item: T) => P): PhasedBuilder<E, T, P>;

  /** Process all items in parallel (no phases) */
  emit(builder: (item: T, ctx: ItemContext<E>) => CommandSpec): ItemTrackingBuilder<E, T>;
}

interface PhasedBuilder<E, T, P> {
  /** How to run each phase */
  runSequentially(config?: {
    /** Stop if any item in a phase fails (default: true) */
    stopOnFailure?: boolean;
  }): PhasedEmitBuilder<E, T, P>;
}

interface PhasedEmitBuilder<E, T, P> {
  /** What command to emit for each item */
  emit(builder: (item: T, phase: P, ctx: ItemContext<E>) => CommandSpec): PhasedTrackingBuilder<E, T, P>;
}

interface PhasedTrackingBuilder<E, T, P> {
  /** How to track item completion */
  completeWhen(config: {
    /** Event type indicating success */
    success: string;
    /** Event type indicating failure */
    failure: string;
    /** Extract item key from completion event */
    key: (event: Event) => string;
  }): PhasedHooksBuilder<E, T, P>;
}

interface PhasedHooksBuilder<E, T, P> {
  /** Run before the first phase starts */
  beforeFirstGroup(handler: (ctx: PhaseHookContext<E>) => void): this;

  /** Run before a specific phase starts */
  beforeGroup(phase: P, handler: (ctx: PhaseHookContext<E>) => void): this;

  /** Run after a specific phase completes */
  afterGroup(phase: P, handler: (ctx: PhaseCompleteContext<E, P>) => void): this;

  /** Run when a phase fails (only if stopOnFailure is true) */
  onGroupFailed(phase: P, handler: (ctx: PhaseFailedContext<E, P>) => void): this;

  /** Run after all phases complete */
  afterAll(handler: (ctx: AllCompleteContext<E>) => void): this;

  /** Start a new event handler */
  on<E2 extends EventType>(eventType: E2): TriggerBuilder<E2>;

  /** End the pipeline definition */
  build(): Pipeline;
}
```

### 3.8 Context Types

```typescript
interface ItemContext<E> {
  event: E;
  index: number;
}

interface PhaseHookContext<E> {
  event: E;
  emit<C extends CommandType>(commandType: C, data: CommandData<C>): void;
}

interface PhaseCompleteContext<E, P> {
  event: E;
  phase: P;
  completed: string[]; // Item keys that completed
  emit<C extends CommandType>(commandType: C, data: CommandData<C>): void;
}

interface PhaseFailedContext<E, P> {
  event: E;
  phase: P;
  failed: string[]; // Item keys that failed
  completed: string[]; // Item keys that completed
  emit<C extends CommandType>(commandType: C, data: CommandData<C>): void;
}

interface AllCompleteContext<E> {
  event: E;
  phases: { phase: string; completed: string[] }[];
  emit<C extends CommandType>(commandType: C, data: CommandData<C>): void;
}
```

### 3.9 Handler Context (for `.handle()`)

```typescript
interface HandlerContext {
  /** Emit a command */
  emit<C extends CommandType>(commandType: C, data: CommandData<C>): void;

  /** Run state (if declared with .withState()) */
  state: S;

  /** Run metadata */
  runId: string;
  eventId: string;
  timestamp: Date;
}
```

### 3.10 Helper Function

```typescript
/** Create a command specification */
function cmd<C extends CommandType>(type: C, data: CommandData<C> | ((event: Event) => CommandData<C>)): CommandSpec;
```

---

## 4. Complete Example: Kanban Pipeline

```typescript
import { define, cmd } from '@auto-engineer/pipeline';

const pipeline = define('kanban-pipeline')
  .version('1.0.0')
  .description('Full-stack Kanban app generation from schema')

  // Define a reusable correlation key
  .key('bySlice', (e) => e.data.slicePath ?? e.data.targetDirectory ?? '')

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 1: Schema → Server Generation
  // ═══════════════════════════════════════════════════════════════════════════

  .on('SchemaExported')
  .emit('GenerateServer', {
    modelPath: './.context/schema.json',
    destination: '.',
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 1b: Implement Each Slice
  // ═══════════════════════════════════════════════════════════════════════════

  .on('SliceGenerated')
  .emit('ImplementSlice', (e) => ({
    slicePath: e.data.slicePath,
    context: {
      attemptNumber: 0,
      previousOutputs: 'errors',
    },
    aiOptions: { maxTokens: 2000 },
  }))

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 1c: Check & Retry Loop
  // "Run all checks. If any fail, retry the slice implementation."
  // ═══════════════════════════════════════════════════════════════════════════

  .on('SliceImplemented')
  .run((e) => [
    cmd('CheckTests', { targetDirectory: e.data.slicePath, scope: 'slice' }),
    cmd('CheckTypes', { targetDirectory: e.data.slicePath, scope: 'slice' }),
    cmd('CheckLint', { targetDirectory: e.data.slicePath, scope: 'slice', fix: true }),
  ])
  .awaitAll({ key: 'bySlice', timeout: 300_000 })
  .onFailure((ctx) => {
    ctx.retry('ImplementSlice', {
      maxAttempts: 5,
      backoff: 'exponential',
      backoffMs: 1000,
      data: {
        slicePath: ctx.key,
        context: {
          attemptNumber: ctx.attempt,
          previousOutputs: ctx.errorText,
        },
        aiOptions: { maxTokens: 2000 },
      },
    });
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 2: Server Generated → IA + Dev Server (Parallel)
  // ═══════════════════════════════════════════════════════════════════════════

  .on('ServerGenerated')
  .emit('GenerateIA', {
    modelPath: './.context/schema.json',
    outputDir: './.context',
  })
  .emit('StartServer', {
    serverDirectory: './server',
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 3: IA Generated → Client Generation
  // ═══════════════════════════════════════════════════════════════════════════

  .on('IAGenerated')
  .emit('GenerateClient', {
    targetDir: './client',
    iaSchemaPath: './.context/auto-ia-scheme.json',
    gqlSchemaPath: './.context/schema.graphql',
    figmaVariablesPath: './.context/figma-file.json',
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 4a: Client Generated — Fallback for malformed data
  // ═══════════════════════════════════════════════════════════════════════════

  .on('ClientGenerated')
  .when((e) => !e.data?.components?.length)
  .emit('ImplementComponent', {
    projectDir: './client',
    iaSchemeDir: './.context',
    designSystemPath: './.context/design-system.md',
    componentType: 'molecule',
    filePath: 'client/src/components/molecules/Example.tsx',
    componentName: 'Example.tsx',
    aiOptions: { maxTokens: 3000 },
  })
  .emit('StartClient', { clientDirectory: './client' })

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 4b: Client Generated — Phased Component Implementation
  // "For each component, group into phases, run sequentially."
  // ═══════════════════════════════════════════════════════════════════════════

  .on('ClientGenerated')
  .when((e) => e.data?.components?.length > 0)
  .forEach((e) => e.data.components)
  .groupInto(['molecule', 'organism', 'page'], (c) => c.type)
  .runSequentially({ stopOnFailure: true })
  .emit((component, phase, ctx) =>
    cmd('ImplementComponent', {
      projectDir: ctx.event.data.targetDir,
      iaSchemeDir: './.context',
      designSystemPath: './.context/design-system.md',
      componentType: phase,
      filePath: component.filePath,
      componentName: component.filePath.split('/').pop()?.replace('.tsx', '') ?? 'Unknown',
      aiOptions: { maxTokens: 3000 },
    }),
  )
  .completeWhen({
    success: 'ComponentImplemented',
    failure: 'ComponentImplementationFailed',
    key: (e) => e.data.filePath,
  })
  .beforeFirstGroup((ctx) => {
    ctx.emit('StartClient', { clientDirectory: './client' });
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 5: Client Checks → Project-Level Fix
  // ═══════════════════════════════════════════════════════════════════════════

  .on('ClientChecked')
  .when((e) => e.data.tsErrors > 0 || e.data.buildErrors > 0 || e.data.consoleErrors > 0)
  .emit('ImplementClient', (e) => ({
    projectDir: './client',
    iaSchemeDir: './.context',
    designSystemPath: './.context/design-system.md',
    failures: [
      ...(e.data.tsErrorDetails ?? []),
      ...(e.data.buildErrorDetails ?? []),
      ...(e.data.consoleErrorDetails ?? []),
    ],
  }))

  .build();
```

---

## 5. Side-by-Side Comparison

### Original (Scatter-Gather-Retry): ~50 lines

```typescript
// Module state
const sliceRetryState = new Map<string, number>()
const MAX_RETRIES = 4

// Three separate handlers
on('SliceImplemented', (e) => dispatch('CheckTests', {...}))
on('SliceImplemented', (e) => dispatch('CheckTypes', {...}))
on('SliceImplemented', (e) => dispatch('CheckLint', {...}))

// Complex aggregation
on.settled(['CheckTests', 'CheckTypes', 'CheckLint'],
  dispatch(['ImplementSlice'], (events, send) => {
    const failures = findCheckFailures(events)
    const slicePath = getSlicePath(failures, events)

    if (!hasAnyFailures(failures)) {
      sliceRetryState.delete(slicePath)
      return { persist: false }
    }

    const currentAttempt = sliceRetryState.get(slicePath) ?? 0
    if (currentAttempt >= MAX_RETRIES) {
      sliceRetryState.delete(slicePath)
      return { persist: false }
    }

    sliceRetryState.set(slicePath, currentAttempt + 1)
    send({
      type: 'ImplementSlice',
      data: {
        slicePath,
        context: {
          attemptNumber: currentAttempt + 1,
          previousOutputs: collectErrorMessages(failures),
        },
      },
    })
    return { persist: true }
  })
)

// Plus 4 helper functions (~30 lines)
function findCheckFailures(events) {...}
function hasAnyFailures(failures) {...}
function getSlicePath(failures, events) {...}
function collectErrorMessages(failures) {...}
```

### New: 14 lines

```typescript
.on('SliceImplemented')
  .run(e => [
    cmd('CheckTests', { targetDirectory: e.data.slicePath, scope: 'slice' }),
    cmd('CheckTypes', { targetDirectory: e.data.slicePath, scope: 'slice' }),
    cmd('CheckLint',  { targetDirectory: e.data.slicePath, scope: 'slice', fix: true }),
  ])
  .awaitAll({ key: 'bySlice', timeout: 300_000 })
  .onFailure(ctx => {
    ctx.retry('ImplementSlice', {
      maxAttempts: 5,
      backoff: 'exponential',
      data: {
        slicePath: ctx.key,
        context: { attemptNumber: ctx.attempt, previousOutputs: ctx.errorText },
      },
    })
  })
```

### Original (Phased Execution): ~70 lines

```typescript
// Module state
let clientComponents = []
let clientTargetDir = ''
const processedComponents = new Set()
const dispatchedPhases = new Set()
const failedComponents = new Set()
const componentPhaseOrder = ['molecule', 'organism', 'page']

// Handler
on('ClientGenerated', (e) => {
  clientComponents = e.data.components
  clientTargetDir = e.data.targetDir
  processedComponents.clear()
  dispatchedPhases.clear()
  failedComponents.clear()
  dispatchedPhases.add('molecule')

  const molecules = clientComponents.filter(c => c.type === 'molecule')
  const commands = molecules.map(c => dispatch('ImplementComponent', {...}))
  return dispatch.parallel([...commands, dispatch('StartClient', {...})])
})

on('ComponentImplemented', (e) => {
  processedComponents.add(e.data.filePath)
  return tryAdvanceToNextPhase()
})

on('ComponentImplementationFailed', (e) => {
  failedComponents.add(e.data.filePath)
  return tryAdvanceToNextPhase()
})

// Plus 4 helper functions (~40 lines)
function getComponentsOfType(type) {...}
function areAllProcessed(type) {...}
function dispatchComponentsOfType(type) {...}
function tryAdvanceToNextPhase() {...}
```

### New: 18 lines

```typescript
.on('ClientGenerated')
  .when(e => e.data?.components?.length > 0)
  .forEach(e => e.data.components)
  .groupInto(['molecule', 'organism', 'page'], c => c.type)
  .runSequentially({ stopOnFailure: true })
  .emit((component, phase, ctx) => cmd('ImplementComponent', {
    projectDir: ctx.event.data.targetDir,
    componentType: phase,
    filePath: component.filePath,
    componentName: component.filePath.split('/').pop()?.replace('.tsx', ''),
    aiOptions: { maxTokens: 3000 },
  }))
  .completeWhen({
    success: 'ComponentImplemented',
    failure: 'ComponentImplementationFailed',
    key: e => e.data.filePath,
  })
  .beforeFirstGroup(ctx => {
    ctx.emit('StartClient', { clientDirectory: './client' })
  })
```

### Summary

| Metric                 | Original   | New       |
| ---------------------- | ---------- | --------- |
| Scatter-Gather-Retry   | ~80 lines  | 14 lines  |
| Phased Execution       | ~110 lines | 18 lines  |
| Module state variables | 7          | 0         |
| Helper functions       | 8          | 0         |
| Total                  | ~220 lines | ~60 lines |

---

## 6. Graph Extraction

Every fluent construct produces a graph node:

```typescript
const graph = pipeline.toGraph();
```

### Graph IR Structure

```typescript
interface GraphIR {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

interface GraphNode {
  id: string;
  type: 'trigger' | 'emit' | 'run' | 'await' | 'retry' | 'forEach' | 'phase' | 'track' | 'handler';
  label: string;
  config: Record<string, unknown>;
}

interface GraphEdge {
  from: string;
  to: string;
  type: 'triggers' | 'produces' | 'onSuccess' | 'onFailure' | 'retries' | 'nextPhase';
  label?: string;
}
```

### Example Output

```json
{
  "nodes": [
    { "id": "t1", "type": "trigger", "label": "SliceImplemented" },
    {
      "id": "r1",
      "type": "run",
      "label": "Run Checks",
      "config": { "commands": ["CheckTests", "CheckTypes", "CheckLint"] }
    },
    { "id": "a1", "type": "await", "label": "Await All", "config": { "key": "bySlice", "timeout": 300000 } },
    {
      "id": "y1",
      "type": "retry",
      "label": "Retry ImplementSlice",
      "config": { "command": "ImplementSlice", "maxAttempts": 5 }
    },

    { "id": "t2", "type": "trigger", "label": "ClientGenerated" },
    { "id": "f1", "type": "forEach", "label": "For Each Component" },
    { "id": "p1", "type": "phase", "label": "Phase: molecule" },
    { "id": "p2", "type": "phase", "label": "Phase: organism" },
    { "id": "p3", "type": "phase", "label": "Phase: page" },
    { "id": "k1", "type": "track", "label": "Track Completion" }
  ],
  "edges": [
    { "from": "t1", "to": "r1", "type": "triggers" },
    { "from": "r1", "to": "a1", "type": "produces" },
    { "from": "a1", "to": "y1", "type": "onFailure" },
    { "from": "y1", "to": "t1", "type": "retries", "label": "ImplementSlice" },

    { "from": "t2", "to": "f1", "type": "triggers" },
    { "from": "f1", "to": "p1", "type": "produces" },
    { "from": "p1", "to": "k1", "type": "produces" },
    { "from": "k1", "to": "p2", "type": "nextPhase" },
    { "from": "p2", "to": "k1", "type": "produces" },
    { "from": "k1", "to": "p3", "type": "nextPhase" }
  ]
}
```

### Visualization

```
┌──────────────────────────────────────────────────────────────────┐
│                     Scatter-Gather-Retry                         │
│                                                                  │
│  ┌─────────────────┐                                             │
│  │SliceImplemented │                                             │
│  └────────┬────────┘                                             │
│           │                                                      │
│           ▼                                                      │
│  ┌─────────────────┐                                             │
│  │   Run Checks    │ ─────┬─────┬─────┐                          │
│  └────────┬────────┘      │     │     │                          │
│           │               ▼     ▼     ▼                          │
│           │            Tests  Types  Lint                        │
│           │               │     │     │                          │
│           │               └─────┴─────┘                          │
│           ▼                     │                                │
│  ┌─────────────────┐            │                                │
│  │    Await All    │◄───────────┘                                │
│  │   (by slice)    │                                             │
│  └────────┬────────┘                                             │
│           │                                                      │
│     ┌─────┴─────┐                                                │
│     ▼           ▼                                                │
│ [Success]  [Failure]                                             │
│     │           │                                                │
│     │           ▼                                                │
│     │    ┌─────────────┐                                         │
│     │    │   Retry     │──────────┐                              │
│     │    │ImplementSlice│         │                              │
│     │    └─────────────┘         │                              │
│     │           ▲                 │                              │
│     │           └─────────────────┘                              │
│     ▼                        (loop)                              │
│  [ Done ]                                                        │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                     Phased Execution                             │
│                                                                  │
│  ┌─────────────────┐                                             │
│  │ ClientGenerated │                                             │
│  └────────┬────────┘                                             │
│           │                                                      │
│           ▼                                                      │
│  ┌─────────────────┐                                             │
│  │   For Each      │                                             │
│  │   Component     │                                             │
│  └────────┬────────┘                                             │
│           │                                                      │
│  ┌────────┴────────────────────────────────────────┐             │
│  │                   PHASES                         │             │
│  │  ┌──────────┐   ┌──────────┐   ┌──────────┐     │             │
│  │  │ molecule │──▶│ organism │──▶│   page   │     │             │
│  │  │ (N items)│   │ (N items)│   │ (N items)│     │             │
│  │  └────┬─────┘   └────┬─────┘   └────┬─────┘     │             │
│  │       │              │              │           │             │
│  │       ▼              ▼              ▼           │             │
│  │    [Track]        [Track]        [Track]        │             │
│  │    success?       success?       success?       │             │
│  │       │              │              │           │             │
│  │   ────┴──────────────┴──────────────┴───        │             │
│  │         │ stopOnFailure = true │                │             │
│  │         ▼                      ▼                │             │
│  │    [Continue]              [HALT]               │             │
│  └─────────────────────────────────────────────────┘             │
└──────────────────────────────────────────────────────────────────┘
```

---

## 7. Pattern Templates (Optional Extension)

For maximum brevity, provide pre-built patterns:

```typescript
import { define, cmd, patterns } from '@auto-engineer/pipeline';

const pipeline = define('kanban-pipeline')
  .on('SliceImplemented')
  .use(
    patterns.checkAndRetry({
      checks: (e) => [
        cmd('CheckTests', { target: e.data.slicePath }),
        cmd('CheckTypes', { target: e.data.slicePath }),
        cmd('CheckLint', { target: e.data.slicePath }),
      ],
      key: (e) => e.data.targetDirectory,
      retryCommand: 'ImplementSlice',
      maxAttempts: 5,
      retryData: (ctx) => ({
        slicePath: ctx.key,
        context: { attempt: ctx.attempt, errors: ctx.errorText },
      }),
    }),
  )

  .on('ClientGenerated')
  .when((e) => e.data?.components?.length > 0)
  .use(
    patterns.phased({
      items: (e) => e.data.components,
      phases: ['molecule', 'organism', 'page'],
      phaseOf: (c) => c.type,
      emit: (c, phase, ctx) =>
        cmd('ImplementComponent', {
          filePath: c.filePath,
          projectDir: ctx.event.data.targetDir,
        }),
      track: {
        success: 'ComponentImplemented',
        failure: 'ComponentImplementationFailed',
        key: (e) => e.data.filePath,
      },
      stopOnFailure: true,
      beforeFirstPhase: (ctx) => ctx.emit('StartClient', {}),
    }),
  )

  .build();
```

---

## 8. Runtime Behavior

### 8.1 Execution Flow

```
1. Event arrives (e.g., SliceImplemented)
2. Find matching .on() handlers
3. For each handler:
   a. Evaluate .when() predicate
   b. If passes, execute the chain:
      - .emit() → queue command(s)
      - .run() → queue multiple commands
      - .awaitAll() → register barrier
      - .forEach() → expand items, register phase tracking
   c. Execute queued commands via plugins
   d. Plugins emit completion events
4. Barrier evaluation:
   - .awaitAll() checks if all commands for key completed
   - If complete: invoke .onSuccess() or .onFailure()
   - .onFailure() may call ctx.retry() → queue retry command
5. Phase tracking:
   - Track item completion events
   - When phase complete: check stopOnFailure, advance to next
6. Loop until no more events to process
```

### 8.2 State Management

The runtime manages all state internally:

| State                | Managed By                       | User Visible?     |
| -------------------- | -------------------------------- | ----------------- |
| Retry attempt counts | `.awaitAll().onFailure()`        | Via `ctx.attempt` |
| Correlation groups   | `.awaitAll({ key: ... })`        | Via `ctx.key`     |
| Phase progress       | `.groupInto().runSequentially()` | Via phase hooks   |
| Item completion      | `.completeWhen()`                | Via phase hooks   |

No module-level state needed in user code.

---

## 9. Summary

The Pipeline API provides:

| Level          | API                                        | Use Case          |
| -------------- | ------------------------------------------ | ----------------- |
| Simple         | `.on().emit()`                             | Event → Command   |
| Parallel       | `.emit().emit()`                           | Multiple commands |
| Scatter-Gather | `.run().awaitAll().onFailure()`            | Check & retry     |
| Phased         | `.forEach().groupInto().runSequentially()` | Sequential phases |
| Custom         | `.handle()`                                | Unique logic      |

**Key benefits:**

- **70% less code** than original
- **Zero manual state** management
- **Reads like English** — `.run().awaitAll().onFailure()`
- **Static graph extraction** for visualization
- **Runs anywhere** — local and cloud
