# Pipeline Package Testing Analysis

## Source: CLI E2E Snapshots Analysis

This document captures the findings from analyzing the CLI's E2E test snapshots to inform how we test the pipeline package's orchestration capabilities.

---

## Snapshot Files Analyzed

| File                           | Purpose                             | Key Insights                                                        |
| ------------------------------ | ----------------------------------- | ------------------------------------------------------------------- |
| `registry.snapshot.json`       | Expected `/registry` response       | 11 event handlers, 16 command handlers, full metadata               |
| `pipeline-graph.snapshot.json` | Expected `/pipeline` response       | 11 nodes, 13 edges, `commandToEvents` and `eventToCommand` mappings |
| `event-stream.snapshot.json`   | Full event sequence from workflow   | ~200+ events showing scatter-gather, retry, phased execution        |
| `golden-master.snapshot.json`  | Complete baseline + execution state | Too large to load fully, contains status progression                |

---

## Registry Response Shape

```typescript
interface RegistryResponse {
  eventHandlers: string[]; // ['SchemaExported', 'SliceGenerated', ...]
  commandHandlers: string[]; // ['CheckClient', 'CheckLint', 'CheckTests', ...]
  commandsWithMetadata: Array<{
    id: string; // '@auto-engineer/narrative/export:schema'
    name: string; // 'ExportSchema'
    alias: string; // 'export:schema'
    description: string; // 'Export flow schemas to context directory'
    package: string; // '@auto-engineer/narrative'
    version: string; // '0.13.1'
    category: string; // 'export'
    icon: string; // 'download'
  }>;
  folds: string[]; // [] (empty in kanban example)
}
```

**Event Handlers (11):**

- SchemaExported, SliceGenerated, SliceImplemented, ServerGenerated
- IAGenerated, ClientGenerated, ComponentImplemented, ComponentImplementationFailed
- ClientChecked

**Command Handlers (16):**

- CheckClient, CheckLint, CheckTests, CheckTypes
- CopyExample, ExportSchema, GenerateClient, GenerateIA, GenerateServer
- ImplementClient, ImplementComponent, ImplementServer, ImplementSlice
- ImportDesignSystem, StartClient, StartServer

---

## Pipeline Graph Response Shape

```typescript
interface PipelineResponse {
  nodes: Array<{
    id: string; // '@auto-engineer/narrative/export:schema'
    name: string; // 'ExportSchema'
    title: string; // 'Export Schema'
    alias: string; // 'export:schema'
    description: string;
    package: string;
    version: string;
    category: string;
    icon: string;
    status: 'None' | 'idle' | 'running' | 'pass' | 'fail';
  }>;
  edges: Array<{
    from: string; // '@auto-engineer/narrative/export:schema'
    to: string; // '@auto-engineer/server-generator-apollo-emmett/generate:server'
  }>;
  commandToEvents: Record<string, string[]>; // { 'CheckTypes': ['TypeCheckPassed', 'TypeCheckFailed'] }
  eventToCommand: Record<string, string>; // { 'TypeCheckPassed': 'CheckTypes' }
}
```

**Key Edges (showing workflow):**

1. `export:schema` → `generate:server`
2. `generate:server` → `implement:slice`
3. `implement:slice` → `check:tests`, `check:types`, `check:lint` (scatter)
4. `check:tests`, `check:types`, `check:lint` → `implement:slice` (retry loop)
5. `generate:server` → `generate:ia`, `start:server` (parallel)
6. `generate:ia` → `generate:client`
7. `generate:client` → `implement:component`, `start:client`

---

## Event Stream Analysis

### Event Types and Counts (from partial analysis)

| Event Type             | Count | Notes                                        |
| ---------------------- | ----- | -------------------------------------------- |
| SchemaExported         | 2     | Initial + possibly retry                     |
| SliceGenerated         | 10+   | One per slice (5 slices × retries)           |
| ServerGenerationFailed | 1     | pnpm install failure                         |
| ServerGenerated        | 1     | Success after retry                          |
| SliceImplemented       | 31    | Multiple implementations per slice (retries) |
| TypeCheckPassed        | 24    | After successful checks                      |
| TypeCheckFailed        | ?     | Triggers retry                               |
| TestsCheckPassed       | 31    | One per slice implementation                 |
| LintCheckPassed        | 25    | One per slice implementation                 |
| ComponentImplemented   | 58    | All components across phases                 |

### Workflow Sequence Pattern

```
1. ExportSchema command
   └── SchemaExported event

2. SchemaExported triggers GenerateServer
   └── SliceGenerated × N (one per slice)
   └── ServerGenerated (when all slices generated)

3. SliceGenerated triggers ImplementSlice (per slice)
   └── SliceImplemented event

4. SliceImplemented triggers SCATTER:
   ├── CheckTests → TestsCheckPassed | TestsCheckFailed
   ├── CheckTypes → TypeCheckPassed | TypeCheckFailed
   └── CheckLint  → LintCheckPassed | LintCheckFailed

5. on.settled(['CheckTests', 'CheckTypes', 'CheckLint']) GATHER:
   └── If any failed AND attempts < MAX_RETRIES:
       └── ImplementSlice with error context → goto step 3
   └── If all passed OR max retries exceeded:
       └── Continue (no dispatch)

6. ServerGenerated triggers PARALLEL:
   ├── GenerateIA → IAGenerated
   └── StartServer → ServerStarted

7. IAGenerated triggers GenerateClient
   └── ClientGenerated event (with components list)

8. ClientGenerated triggers PHASED EXECUTION:
   Phase 1: molecules (parallel)
     └── ImplementComponent × N → ComponentImplemented × N
   Phase 2: organisms (parallel, after ALL molecules complete)
     └── ImplementComponent × N → ComponentImplemented × N
   Phase 3: pages (parallel, after ALL organisms complete)
     └── ImplementComponent × N → ComponentImplemented × N
```

---

## Orchestration Patterns to Test

### 1. Scatter-Gather Pattern

**Trigger:** `SliceImplemented` event
**Scatter:** Dispatch `CheckTests`, `CheckTypes`, `CheckLint` in parallel
**Gather:** Wait for all 3 to complete (via correlationId tracking)
**Decision:** Fire `ImplementSlice` with errors if any check failed

```typescript
// Test scenario
it('should scatter 3 checks and gather results', async () => {
  // Send ImplementSlice command
  await dispatchCommand('ImplementSlice', { slicePath: './test-slice' });

  // Wait for SliceImplemented event
  await waitForEvent('SliceImplemented');

  // Verify all 3 checks were dispatched
  const messages = await getMessages();
  const checkCommands = messages.filter(
    (m) => m.messageType === 'command' && ['CheckTests', 'CheckTypes', 'CheckLint'].includes(m.message.type),
  );
  expect(checkCommands).toHaveLength(3);

  // Verify same correlationId
  const correlationIds = new Set(checkCommands.map((c) => c.message.correlationId));
  expect(correlationIds.size).toBe(1);
});
```

### 2. Retry Loop Pattern

**Trigger:** `on.settled` handler fires with failures
**Action:** Dispatch `ImplementSlice` with error context
**Limit:** MAX_RETRIES = 4

```typescript
// Test scenario
it('should retry up to MAX_RETRIES times on failure', async () => {
  // Configure CheckTypes to fail first 3 times
  mockHandler('CheckTypes', (cmd, attempt) =>
    attempt < 3 ? { type: 'TypeCheckFailed', data: { errors: 'TS2322' } } : { type: 'TypeCheckPassed', data: {} },
  );

  await dispatchCommand('ImplementSlice', { slicePath: './test' });
  await waitForSettled(10000);

  const events = await getEvents();
  const typeCheckEvents = events.filter((e) => e.type.includes('TypeCheck'));

  // Should have 3 failures then 1 success
  expect(typeCheckEvents.map((e) => e.type)).toEqual([
    'TypeCheckFailed',
    'TypeCheckFailed',
    'TypeCheckFailed',
    'TypeCheckPassed',
  ]);
});

it('should stop retrying after MAX_RETRIES', async () => {
  // Configure CheckTypes to always fail
  mockHandler('CheckTypes', () => ({ type: 'TypeCheckFailed', data: {} }));

  await dispatchCommand('ImplementSlice', { slicePath: './test' });
  await waitForSettled(10000);

  const events = await getEvents();
  const implementSliceCommands = events.filter((e) => e.type === 'SliceImplemented');

  // Should have MAX_RETRIES + 1 attempts (initial + retries)
  expect(implementSliceCommands.length).toBeLessThanOrEqual(5); // 1 + MAX_RETRIES
});
```

### 3. Phased Execution Pattern

**Trigger:** `ClientGenerated` event with components list
**Phases:** `['molecule', 'organism', 'page']`
**Gate:** All items in phase N must complete before phase N+1 starts

```typescript
// Test scenario
it('should execute phases in order', async () => {
  const dispatchOrder: string[] = [];

  mockHandler('ImplementComponent', (cmd) => {
    dispatchOrder.push(cmd.data.componentType);
    return { type: 'ComponentImplemented', data: cmd.data };
  });

  await dispatchCommand('GenerateClient', {});
  // Mock returns: { components: [
  //   { type: 'molecule', filePath: 'm1.tsx' },
  //   { type: 'organism', filePath: 'o1.tsx' },
  //   { type: 'page', filePath: 'p1.tsx' },
  // ]}

  await waitForAllComponentsImplemented(10000);

  // Verify order: all molecules before any organisms
  const moleculeIndices = dispatchOrder.map((t, i) => (t === 'molecule' ? i : -1)).filter((i) => i >= 0);
  const organismIndices = dispatchOrder.map((t, i) => (t === 'organism' ? i : -1)).filter((i) => i >= 0);

  expect(Math.max(...moleculeIndices)).toBeLessThan(Math.min(...organismIndices));
});
```

### 4. Parallel Dispatch Pattern

**Trigger:** `ServerGenerated` event
**Action:** Dispatch `GenerateIA` AND `StartServer` simultaneously

```typescript
// Test scenario
it('should dispatch parallel commands from single event', async () => {
  await dispatchCommand('GenerateServer', { modelPath: './schema.json' });
  await waitForEvent('ServerGenerated');

  const messages = await getMessages();
  const commandsAfterServerGenerated = messages
    .filter((m) => m.messageType === 'command')
    .filter((m) => ['GenerateIA', 'StartServer'].includes(m.message.type));

  expect(commandsAfterServerGenerated).toHaveLength(2);

  // Verify same correlationId (dispatched from same trigger)
  const correlationIds = new Set(commandsAfterServerGenerated.map((c) => c.message.correlationId));
  expect(correlationIds.size).toBe(1);
});
```

---

## Testing Approach for Pipeline Package

### Unit Tests (per component)

1. **SettledTracker** - Track commands, fire on completion
2. **EventCommandMapper** - Map events to source commands
3. **PhasedExecutor** - Gate phases, track completion
4. **EventLogger** - Write events to disk

### Integration Tests (component combinations)

1. **Runtime + SettledTracker** - Handler dispatches command, tracker fires
2. **Server + Runtime + Tracker** - HTTP request triggers full flow
3. **Server + Logger** - Events written to disk

### E2E Tests (full workflow)

1. **Scatter-Gather Test** - SliceImplemented → 3 checks → gather
2. **Retry Test** - Failed checks → retry loop → success
3. **Phased Test** - ClientGenerated → molecules → organisms → pages
4. **Snapshot Test** - Compare event sequence to CLI snapshot

### Mock Handlers

```typescript
interface MockHandlerConfig {
  [commandType: string]: (command: Command, attempt: number) => Event | Event[];
}

function createMockHandlers(config: MockHandlerConfig): CommandHandler[] {
  const attemptCounts = new Map<string, number>();

  return Object.entries(config).map(([name, factory]) => ({
    name,
    events: inferEventsFromFactory(factory),
    handle: async (cmd: Command) => {
      const key = `${name}:${JSON.stringify(cmd.data)}`;
      const attempt = (attemptCounts.get(key) ?? 0) + 1;
      attemptCounts.set(key, attempt);
      return factory(cmd, attempt);
    },
  }));
}
```

---

## Snapshot Comparison Strategy

### Event Type Sequence (order-aware)

```typescript
interface SequenceComparisonResult {
  match: boolean;
  missing: string[]; // Events in expected but not actual
  extra: string[]; // Events in actual but not expected
  orderViolations: Array<{
    // Events out of expected order
    event: string;
    expectedAfter: string;
    actuallyBefore: string;
  }>;
}
```

### Event Count Validation (order-agnostic)

```typescript
interface CountComparisonResult {
  match: boolean;
  mismatches: Array<{
    eventType: string;
    expected: number;
    actual: number;
  }>;
}
```

### Causal Chain Validation

Verify that events respect causal dependencies:

- `SchemaExported` BEFORE `SliceGenerated`
- `SliceImplemented` BEFORE `TestsCheckPassed`
- `ComponentImplemented(molecule)` BEFORE `ComponentImplemented(organism)`

```typescript
const causalDependencies: [string, string][] = [
  ['SchemaExported', 'SliceGenerated'],
  ['SliceGenerated', 'SliceImplemented'],
  ['SliceImplemented', 'TestsCheckPassed'],
  ['SliceImplemented', 'TypeCheckPassed'],
  ['SliceImplemented', 'LintCheckPassed'],
  ['ServerGenerated', 'IAGenerated'],
  ['IAGenerated', 'ClientGenerated'],
  ['ClientGenerated', 'ComponentImplemented'],
];
```

---

## File Locations

| Test Type         | Location                                          |
| ----------------- | ------------------------------------------------- |
| Unit tests        | `packages/pipeline/src/**/*.specs.ts`             |
| Integration tests | `packages/pipeline/src/**/*.integration.specs.ts` |
| E2E tests         | `packages/pipeline/src/server/*.e2e.specs.ts`     |
| Snapshot fixtures | `packages/pipeline/src/testing/__snapshots__/`    |
| Mock handlers     | `packages/pipeline/src/testing/mock-handlers.ts`  |
| Test utilities    | `packages/pipeline/src/testing/helpers.ts`        |
