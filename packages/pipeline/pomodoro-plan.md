# Pipeline Package - Pomodoro Plan

## TODO

### Phase 9: Remove Dual Caches - Pure Event Sourcing (Pomodoros 71-87)

**Goal**: Remove `nodeStatusCache` and `itemStatusCache` from PipelineServer. All runtime state derived from Emmett projections via `PipelineReadModel`.

**Current State** (dual source of truth):
```
Commands → Cache (mutable) + Emmett Events → Projections
                  ↓                              ↓
          Used for lookups              Also stores same data
```

**Target State** (single source of truth):
```
Commands → Emmett Events → Projections → ReadModel queries
```

---

#### Pomodoro 71: Add getNodeStatus query (test)

| Value | Query node status from projection |
| Approach | `getNodeStatus(correlationId, commandName)` returns status or null |
| Size | S |

```typescript
it('should return null when no node status exists', async () => {
  const result = await readModel.getNodeStatus('c1', 'CreateUser');
  expect(result).toBeNull();
});

it('should return node status from NodeStatus collection', async () => {
  const collection = database.collection<WithId<NodeStatusDocument>>('NodeStatus');
  await collection.insertOne({
    _id: 'ns-c1-CreateUser',
    correlationId: 'c1',
    commandName: 'CreateUser',
    status: 'running',
    pendingCount: 1,
    endedCount: 0,
  });

  const result = await readModel.getNodeStatus('c1', 'CreateUser');
  expect(result).toEqual({
    correlationId: 'c1',
    commandName: 'CreateUser',
    status: 'running',
    pendingCount: 1,
    endedCount: 0,
  });
});
```

---

#### Pomodoro 72: Add getNodeStatus query (implement)

| Value | Can query node status from projection |
| Approach | Query NodeStatus collection with filter |
| Size | S |
| Files | `src/store/pipeline-read-model.ts` |

---

#### Pomodoro 73: Add getItemStatus query (test)

| Value | Query item status from projection |
| Approach | `getItemStatus(correlationId, commandType, itemKey)` returns ItemStatusDocument or null |
| Size | S |

```typescript
it('should return null when no item status exists', async () => {
  const result = await readModel.getItemStatus('c1', 'CreateUser', 'item1');
  expect(result).toBeNull();
});

it('should return item status from ItemStatus collection', async () => {
  const collection = database.collection<WithId<ItemStatusDocument>>('ItemStatus');
  await collection.insertOne({
    _id: 'is-c1-CreateUser-item1',
    correlationId: 'c1',
    commandType: 'CreateUser',
    itemKey: 'item1',
    currentRequestId: 'r1',
    status: 'running',
    attemptCount: 1,
  });

  const result = await readModel.getItemStatus('c1', 'CreateUser', 'item1');
  expect(result).toMatchObject({
    correlationId: 'c1',
    commandType: 'CreateUser',
    itemKey: 'item1',
    attemptCount: 1,
  });
});
```

---

#### Pomodoro 74: Add getItemStatus query (implement)

| Value | Can query item status from projection |
| Approach | Query ItemStatus collection with filter |
| Size | S |
| Files | `src/store/pipeline-read-model.ts` |

---

#### Pomodoro 75: Replace previousStatus lookup (test)

| Value | Get previousStatus from projection instead of cache |
| Approach | Verify `updateNodeStatus` emits correct previousStatus |
| Size | M |

Existing tests should pass with projection-based previousStatus lookup.

---

#### Pomodoro 76: Replace previousStatus lookup (implement)

| Value | Remove nodeStatusCache usage in updateNodeStatus |
| Approach | Query `readModel.getNodeStatus()` for previousStatus |
| Size | M |
| Files | `src/server/pipeline-server.ts` lines 468-478 |

```typescript
private async updateNodeStatus(correlationId: string, commandName: string, status: NodeStatus): Promise<void> {
  const existing = await this.eventStoreContext.readModel.getNodeStatus(correlationId, commandName);
  const previousStatus: NodeStatus = existing?.status ?? 'idle';
  await this.emitNodeStatusChanged(correlationId, commandName, status, previousStatus);
  await this.broadcastNodeStatusChanged(correlationId, commandName, status, previousStatus);
}
```

---

#### Pomodoro 77: Replace hasCorrelation check (test)

| Value | Detect new correlationId via projection |
| Approach | Test that PipelineRunStarted is emitted only for new correlationIds |
| Size | M |

Existing broadcast tests should pass with projection-based detection.

---

#### Pomodoro 78: Replace hasCorrelation check (implement)

| Value | Remove nodeStatusCache.has() check |
| Approach | Use `readModel.hasCorrelation()` instead |
| Size | M |
| Files | `src/server/pipeline-server.ts` line 874 |

```typescript
const isNewCorrelationId = !(await this.eventStoreContext.readModel.hasCorrelation(command.correlationId));
```

---

#### Pomodoro 79: Replace item creation/update logic (test)

| Value | Get/create item status from projection |
| Approach | Test item creation with correct attemptCount from projection |
| Size | M |

```typescript
it('should increment attemptCount on retry', async () => {
  // First command creates item with attemptCount=1
  // Second command (same itemKey) should have attemptCount=2
});
```

---

#### Pomodoro 80: Replace item creation/update logic (implement)

| Value | Remove itemStatusCache from getOrCreateItemStatus |
| Approach | Query projection for existing item, derive attemptCount |
| Size | M |
| Files | `src/server/pipeline-server.ts` lines 520-565 |

```typescript
private async getOrCreateItemStatus(
  correlationId: string,
  commandType: string,
  itemKey: string,
  requestId: string,
): Promise<{ attemptCount: number }> {
  const existing = await this.eventStoreContext.readModel.getItemStatus(correlationId, commandType, itemKey);
  const attemptCount = (existing?.attemptCount ?? 0) + 1;

  await this.emitItemStatusChanged(
    correlationId,
    commandType,
    itemKey,
    requestId,
    'running',
    attemptCount,
  );

  return { attemptCount };
}
```

---

#### Pomodoro 81: Replace item update logic (test)

| Value | Update item status via events only |
| Approach | Test item status update emits event with correct data |
| Size | S |

Existing tests should pass with event-only updates.

---

#### Pomodoro 82: Replace item update logic (implement)

| Value | Remove itemStatusCache from updateItemStatus |
| Approach | Query projection for currentRequestId and attemptCount, emit event |
| Size | S |
| Files | `src/server/pipeline-server.ts` lines 567-591 |

```typescript
private async updateItemStatus(
  correlationId: string,
  commandType: string,
  itemKey: string,
  status: 'running' | 'success' | 'error',
): Promise<void> {
  const existing = await this.eventStoreContext.readModel.getItemStatus(correlationId, commandType, itemKey);
  if (existing !== null) {
    await this.emitItemStatusChanged(
      correlationId,
      commandType,
      itemKey,
      existing.currentRequestId,
      status,
      existing.attemptCount,
    );
  }
}
```

---

#### Pomodoro 83: Remove nodeStatusCache field

| Value | Single source of truth |
| Approach | Delete the field declaration |
| Size | S |
| Files | `src/server/pipeline-server.ts` line 465 |

---

#### Pomodoro 84: Remove itemStatusCache field

| Value | Single source of truth |
| Approach | Delete the field declaration |
| Size | S |
| Files | `src/server/pipeline-server.ts` line 466 |

---

#### Pomodoro 85: Remove ItemStatus interface (if unused)

| Value | Clean up dead code |
| Approach | Delete if no longer referenced |
| Size | S |
| Files | `src/server/pipeline-server.ts` lines 44-51 |

---

#### Pomodoro 86: Remove latestCorrelationId field

| Value | Derive from LatestRunProjection |
| Approach | Query LatestRun projection instead |
| Size | S |
| Files | `src/server/pipeline-server.ts` lines 67, 877 |

---

#### Pomodoro 87: Final verification and cleanup

| Value | All tests pass, no dual state |
| Approach | Run full test suite, verify 100% coverage |
| Size | M |

**Success Criteria:**
1. ✅ `nodeStatusCache` field removed
2. ✅ `itemStatusCache` field removed
3. ✅ `ItemStatus` interface removed (if unused)
4. ✅ `latestCorrelationId` derived from projection
5. ✅ All state queries go through `PipelineReadModel`
6. ✅ All tests pass with 100% coverage
7. ✅ No mutable Maps tracking runtime state in PipelineServer

---

### Phase 3: Phased Execution Pattern (Pomodoros 27-34)

#### Pomodoro 27: ForEachBuilder Interface & TriggerBuilder.forEach()

| Value | Entry point to phased execution pattern |
| Approach | TriggerBuilder.forEach() returns ForEachBuilder |
| Size | S |

```typescript
it('should return ForEachBuilder from TriggerBuilder.forEach()', () => {
  type ItemsEvent = { data: { items: Array<{ id: string }> } };
  const builder = define('test')
    .on('ItemsReady')
    .forEach((e: ItemsEvent) => e.data.items);

  expect(builder).toBeDefined();
  expect(typeof builder.groupInto).toBe('function');
});
```

---

#### Pomodoro 28: ForEachBuilder.groupInto() with phases

| Value | Define execution phases for items |
| Approach | groupInto() accepts phase names and classifier |
| Size | M |

```typescript
it('should configure phases with groupInto()', () => {
  type Item = { id: string; type: 'critical' | 'normal' };
  const pipeline = define('test')
    .on('ItemsReady')
    .forEach((e: { data: { items: Item[] } }) => e.data.items)
    .groupInto(['critical', 'normal'], (item: Item) => item.type)
    .process('ProcessItem', (item: Item) => ({ itemId: item.id }))
    .build();

  const handler = pipeline.descriptor.handlers[0] as ForEachPhasedDescriptor;
  expect(handler.phases).toEqual(['critical', 'normal']);
});
```

---

#### Pomodoro 29: PhasedBuilder.process() with emit factory

| Value | Define command emission for each item |
| Approach | process() accepts commandType and data factory |
| Size | S |

```typescript
it('should configure emitFactory with process()', () => {
  type Item = { id: string };
  const pipeline = define('test')
    .on('ItemsReady')
    .forEach((e: { data: { items: Item[] } }) => e.data.items)
    .groupInto(['phase1'], () => 'phase1')
    .process('ProcessItem', (item: Item) => ({ itemId: item.id }))
    .build();

  const handler = pipeline.descriptor.handlers[0] as ForEachPhasedDescriptor;
  expect(typeof handler.emitFactory).toBe('function');
});
```

---

#### Pomodoro 30: PhasedBuilder.stopOnFailure()

| Value | Configure failure behavior |
| Approach | stopOnFailure() sets flag in descriptor |
| Size | S |

```typescript
it('should set stopOnFailure flag', () => {
  const pipeline = define('test')
    .on('ItemsReady')
    .forEach((e: { data: { items: unknown[] } }) => e.data.items)
    .groupInto(['phase1'], () => 'phase1')
    .process('ProcessItem', () => ({}))
    .stopOnFailure()
    .build();

  const handler = pipeline.descriptor.handlers[0] as ForEachPhasedDescriptor;
  expect(handler.stopOnFailure).toBe(true);
});
```

---

#### Pomodoro 31: PhasedBuilder.onComplete()

| Value | Configure completion events |
| Approach | onComplete() sets success/failure event types |
| Size | M |

```typescript
it('should configure completion events', () => {
  type Item = { id: string };
  const pipeline = define('test')
    .on('ItemsReady')
    .forEach((e: { data: { items: Item[] } }) => e.data.items)
    .groupInto(['phase1'], () => 'phase1')
    .process('ProcessItem', (item: Item) => ({ itemId: item.id }))
    .onComplete({
      success: 'AllItemsProcessed',
      failure: 'ProcessingFailed',
      itemKey: (e: { data: { itemId: string } }) => e.data.itemId,
    })
    .build();

  const handler = pipeline.descriptor.handlers[0] as ForEachPhasedDescriptor;
  expect(handler.completion.successEvent).toBe('AllItemsProcessed');
  expect(handler.completion.failureEvent).toBe('ProcessingFailed');
});
```

---

#### Pomodoro 32: Chaining from PhasedBuilder

| Value | Continue pipeline definition after phased |
| Approach | PhasedBuilder returns to chain |
| Size | S |

```typescript
it('should chain on() from PhasedBuilder', () => {
  const pipeline = define('test')
    .on('ItemsReady')
    .forEach((e: { data: { items: unknown[] } }) => e.data.items)
    .groupInto(['phase1'], () => 'phase1')
    .process('ProcessItem', () => ({}))
    .onComplete({ success: 'Done', failure: 'Failed', itemKey: () => '' })
    .on('Done')
    .emit('Notify', {})
    .build();

  expect(pipeline.descriptor.handlers).toHaveLength(2);
});
```

---

#### Pomodoro 33: Default stopOnFailure behavior

| Value | Sensible defaults |
| Approach | stopOnFailure defaults to false |
| Size | S |

```typescript
it('should default stopOnFailure to false', () => {
  const pipeline = define('test')
    .on('ItemsReady')
    .forEach((e: { data: { items: unknown[] } }) => e.data.items)
    .groupInto(['phase1'], () => 'phase1')
    .process('ProcessItem', () => ({}))
    .onComplete({ success: 'Done', failure: 'Failed', itemKey: () => '' })
    .build();

  const handler = pipeline.descriptor.handlers[0] as ForEachPhasedDescriptor;
  expect(handler.stopOnFailure).toBe(false);
});
```

---

#### Pomodoro 34: Phase 3 Integration Test

| Value | Validate complete phased pipeline |
| Approach | Integration test with realistic scenario |
| Size | M |

```typescript
it('should create complete phased execution pipeline', () => {
  type Component = { path: string; priority: 'high' | 'medium' | 'low' };
  type ComponentEvent = { data: { components: Component[] } };

  const pipeline = define('component-processor')
    .version('1.0.0')
    .description('Process components in priority phases')
    .on('ComponentsGenerated')
    .when((e: ComponentEvent) => e.data.components.length > 0)
    .forEach((e: ComponentEvent) => e.data.components)
    .groupInto(['high', 'medium', 'low'], (c: Component) => c.priority)
    .process('ImplementComponent', (c: Component) => ({ componentPath: c.path }))
    .stopOnFailure()
    .onComplete({
      success: 'AllComponentsImplemented',
      failure: 'ComponentImplementationFailed',
      itemKey: (e: { data: { componentPath: string } }) => e.data.componentPath,
    })
    .build();

  expect(pipeline.descriptor.name).toBe('component-processor');
  const handler = pipeline.descriptor.handlers[0] as ForEachPhasedDescriptor;
  expect(handler.type).toBe('foreach-phased');
  expect(handler.phases).toEqual(['high', 'medium', 'low']);
  expect(handler.stopOnFailure).toBe(true);
});
```

---

### Phase 4: Custom Handlers (Pomodoros 35-37)

#### Pomodoro 35: TriggerBuilder.handle() basic

| Value | Escape hatch for imperative logic |
| Approach | handle() accepts async handler function |
| Size | S |

```typescript
it('should capture custom handler', () => {
  const handler = async (e: { data: unknown }) => {
    console.log(e);
  };
  const pipeline = define('test').on('CustomEvent').handle(handler).build();

  const desc = pipeline.descriptor.handlers[0] as CustomHandlerDescriptor;
  expect(desc.type).toBe('custom');
  expect(desc.handler).toBe(handler);
});
```

---

#### Pomodoro 36: handle() with declaredEmits

| Value | Graph introspection support |
| Approach | Optional second param for declared emits |
| Size | S |

```typescript
it('should capture declaredEmits for graph introspection', () => {
  const pipeline = define('test')
    .on('CustomEvent')
    .handle(async () => {}, { emits: ['EventA', 'EventB'] })
    .build();

  const desc = pipeline.descriptor.handlers[0] as CustomHandlerDescriptor;
  expect(desc.declaredEmits).toEqual(['EventA', 'EventB']);
});
```

---

#### Pomodoro 37: Phase 4 Integration & Chaining

| Value | Complete custom handler support |
| Approach | Chaining from handle() |
| Size | S |

```typescript
it('should chain on() from handle()', () => {
  const pipeline = define('test')
    .on('EventA')
    .handle(async () => {})
    .on('EventB')
    .emit('CommandB', {})
    .build();

  expect(pipeline.descriptor.handlers).toHaveLength(2);
});
```

---

### Phase 5: Graph Extraction (Pomodoros 38-42)

#### Pomodoro 38: GraphIR type definition

| Value | Intermediate representation for visualization |
| Approach | Define nodes and edges types |
| Size | S |

```typescript
it('should define GraphIR with nodes and edges', () => {
  const graph: GraphIR = {
    nodes: [
      { id: 'evt:Start', type: 'event', label: 'Start' },
      { id: 'cmd:Process', type: 'command', label: 'Process' },
    ],
    edges: [{ from: 'evt:Start', to: 'cmd:Process', label: 'triggers' }],
  };
  expect(graph.nodes).toHaveLength(2);
});
```

---

#### Pomodoro 39: Pipeline.toGraph() basic

| Value | Extract graph from pipeline |
| Approach | toGraph() method on Pipeline |
| Size | M |

```typescript
it('should extract graph from emit handler', () => {
  const pipeline = define('test').on('Start').emit('Process', {}).build();

  const graph = pipeline.toGraph();
  expect(graph.nodes.some((n) => n.id === 'evt:Start')).toBe(true);
  expect(graph.nodes.some((n) => n.id === 'cmd:Process')).toBe(true);
});
```

---

#### Pomodoro 40: toGraph() with run-await handlers

| Value | Graph extraction for scatter-gather |
| Approach | Include await relationships |
| Size | M |

---

#### Pomodoro 41: toGraph() with foreach-phased handlers

| Value | Graph extraction for phased execution |
| Approach | Include phase groupings |
| Size | M |

---

#### Pomodoro 42: toGraph() with custom handlers

| Value | Graph extraction using declaredEmits |
| Approach | Use declaredEmits for edges |
| Size | S |

---

### Phase 6: Cloud Abstractions (Pomodoros 43-48)

(Deferred - interfaces only, no runtime implementation yet)

---

### Phase 7: Pipeline Runtime (Pomodoros 49-54)

(Deferred - requires Phase 6 abstractions)

---

## DONE

### Phase 8: CLI Integration (Pomodoros 67-70) ✅

Pomodoro 67-70 complete. E2E tests validate CLI parity.

### Pomodoro 69-70: E2E Tests for CLI Parity

Implemented:

- 8 E2E tests validating endpoint compatibility
- Tests for `/registry`, `/pipeline`, `/sessions`, `/messages`, `/stats`, `/command`
- Tests for command execution and event routing through pipeline
- Tests for pipeline chain with multiple handlers

All 99 tests pass with 100% coverage.

---

### Pomodoro 67-68: Enhanced /pipeline Response

Implemented:

- Added `folds: []` to `/registry` response
- Added `commandToEvents` mapping from command handlers
- Added `eventToCommand` mapping from pipeline handlers
- Added `PipelineNode` shape with `id`, `name`, `title`, `status`
- 4 new tests for response shapes

All 91 tests pass with 100% coverage.

---

### Pomodoro 53-54: AwaitTracker

Implemented:

- `AwaitTracker` class for scatter-gather completion tracking
- `startAwaiting()` to register pending keys
- `markComplete()` to mark individual keys as done
- `isComplete()` to check if all keys are done
- `getResults()` to collect results and clear tracking
- 7 tests for await tracking functionality
- Exported from package index

All 87 tests pass with 100% coverage.

---

### Pomodoro 55-66: PipelineServer

Implemented:

- `PipelineServer` class with HTTP endpoints
- `/health`, `/registry`, `/pipeline`, `/messages`, `/sessions`, `/stats` endpoints
- `POST /command` with command handler validation and 404 for unknown commands
- Event routing through registered pipelines
- Custom handler context support (emit, sendCommand)
- Command handlers returning multiple events
- Integration test for complete workflow
- 16 tests for server functionality
- Exports added to public API

All 80 tests pass with 100% coverage.

---

### Pomodoro 51-52: Run-await and ForEach-phased Runtime

Implemented:

- `handleEvent()` for run-await handlers with command dispatch
- Data factory support in static run-await commands
- ForEach-phased item processing with phase ordering
- Custom handler receives PipelineContext

All 80 tests pass with 100% coverage.

---

### Pomodoro 45-50: PipelineRuntime Core

Implemented:

- `PipelineRuntime` class with descriptor and handler index
- `getHandlersForEvent()` for O(1) handler lookup by event type
- `getMatchingHandlers()` with predicate filtering
- `handleEvent()` for emit and custom handlers
- Data factory resolution for emit handlers
- 7 tests for runtime functionality

All 59 tests pass with 100% coverage.

---

### Pomodoro 43-44: PipelineContext & RuntimeConfig

Implemented:

- `PipelineContext` interface with `emit()`, `sendCommand()`, `correlationId`
- `RuntimeConfig` interface with optional `defaultTimeout`
- 4 tests for context/config types

---

### Pomodoro 38-42: Phase 5 Graph Extraction

Implemented:

- `GraphIR` type with `nodes` and `edges` arrays
- `GraphNode` with `id`, `type` ('event' | 'command'), `label`
- `GraphEdge` with `from`, `to`, optional `label`
- `Pipeline.toGraph()` method for all handler types
- Emit handler graph extraction
- Run-await handler graph extraction with success/failure events
- Foreach-phased handler graph extraction with completion events
- Custom handler graph extraction using `declaredEmits`
- Node deduplication
- 9 tests for graph functionality

All 46 tests pass with 100% coverage.

---

### Pomodoro 35-37: Phase 4 Custom Handlers

Implemented:

- `TriggerBuilder.handle()` with async handler function
- `handle()` with `declaredEmits` option for graph introspection
- `HandleChain` for chaining `on()` and `build()`
- 3 tests for custom handler functionality

All 37 tests pass with 100% coverage.

---

### Pomodoro 27-34: Phase 3 Phased Execution Pattern

Implemented:

- `TriggerBuilder.forEach()` returns `ForEachBuilder`
- `ForEachBuilder.groupInto()` with phase classifier
- `PhasedBuilder.process()` with emit factory
- `PhasedChain.stopOnFailure()` optional flag
- `PhasedChain.onComplete()` with success/failure events
- `PhasedTerminal` for chaining
- Integration test with complete phased pipeline

All 34 tests pass with 100% coverage.

---

### Pomodoro 19-26: Phase 2 Scatter-Gather Pattern

Implemented:

- `TriggerBuilder.run()` returns `RunBuilder`
- `run()` accepts static `CommandDispatch[]` or factory function
- `RunBuilder.awaitAll()` with key extractor and optional timeout
- `GatherBuilder.onSuccess()` with `SuccessContext`
- `GatherBuilder.onFailure()` with `FailureContext`
- Chaining: `on()` and `build()` from `GatherBuilder`
- Integration test with complete scatter-gather pipeline

New types added:

- `SuccessContext<T>` - results, duration, triggerEvent
- `FailureContext<T>` - failures, successes, triggerEvent
- `GatherEventConfig<T>` - eventType, dataFactory

All 26 tests pass with 100% coverage.

---

### Pomodoro 13, 15, 18: Remaining Phase 1 features

- emit() with data factory
- when() predicate for conditional execution
- Integration test with complete pipeline

All Phase 1 tests pass with 100% coverage.

---

### Pomodoro 6-12, 14, 16, 17: Builder API (batched)

Implemented:

- define() entry point
- version() and description()
- build() returns frozen Pipeline
- on() returns TriggerBuilder
- emit() with static data
- EmitChain.build() captures handler
- Parallel emit() chain
- EmitChain.on() continues chain
- key() named extractors

All tests pass with 100% coverage.

---

### Pomodoro 5: PipelineDescriptor Type

| Value | Pipeline structure definition |
| Approach | Interface with metadata + handlers array |
| Size | S |

```typescript
it('should create PipelineDescriptor', () => {
  const descriptor: PipelineDescriptor = {
    name: 'test-pipeline',
    version: '1.0.0',
    keys: new Map(),
    handlers: [],
  };
  expect(descriptor.name).toBe('test-pipeline');
});
```

---

### Pomodoro 4: dispatch() Helper

| Value | Ergonomic CommandDispatch creation |
| Approach | Simple factory function |
| Size | S |

```typescript
it('should create CommandDispatch via dispatch()', () => {
  const cmd = dispatch('CheckTests', { targetDirectory: './src' });
  expect(cmd).toEqual({
    commandType: 'CheckTests',
    data: { targetDirectory: './src' },
  });
});
```

---

### Pomodoro 3: CommandDispatch Type

| Value | Dispatch instruction type |
| Approach | Simple interface with commandType + data |
| Size | S |

```typescript
it('should create CommandDispatch with static data', () => {
  const cmd: CommandDispatch = {
    commandType: 'CheckTests',
    data: { targetDirectory: './src', scope: 'slice' },
  };
  expect(cmd).toEqual({
    commandType: 'CheckTests',
    data: { targetDirectory: './src', scope: 'slice' },
  });
});

it('should create CommandDispatch with data factory', () => {
  const cmd: CommandDispatch = {
    commandType: 'ImplementSlice',
    data: (e) => ({ slicePath: e.data.path }),
  };
  const event: Event = { type: 'SliceGenerated', data: { path: './slice' } };
  const resolved = typeof cmd.data === 'function' ? cmd.data(event) : cmd.data;
  expect(resolved).toEqual({ slicePath: './slice' });
});
```

---

### Pomodoro 2: Core Types

| Value | Foundation types |
| Approach | Re-export message-bus types + add pipeline types |
| Size | S |

```typescript
it('should re-export Command and Event from message-bus', () => {
  const cmd: Command = { type: 'Test', data: {} };
  const evt: Event = { type: 'TestDone', data: {} };
  expect(cmd.type).toBe('Test');
  expect(evt.type).toBe('TestDone');
});
```

---

### Pomodoro 1: Package Scaffold

| Value | Foundation for all work |
| Approach | Copy patterns from `@auto-engineer/id` |
| Size | S |

**Files:**

- `package.json` - deps: `@auto-engineer/message-bus: workspace:*`
- `tsconfig.json` - extends base, composite: true
- `tsconfig.test.json` - includes \*.specs.ts
- `vitest.config.ts` - 100% coverage thresholds
- `src/index.ts` - empty export
