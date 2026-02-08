# JobGraphProcessor Plugin Implementation Plan

## Overview

Create a new plugin package `@auto-engineer/job-graph-processor` that processes directed acyclic graphs (DAGs) of jobs with dependency tracking, parallel dispatch, and configurable failure policies.

## Package Location

```
/Users/sam/code/auto/2/auto-engineer-2/packages/job-graph-processor/
```

Following the pattern of `@auto-engineer/pipeline` which already uses Emmett with projections.

**This package lives in the auto-engineer-2 repo** (not on.auto-2).

---

## Infrastructure Context (Key Discovery)

### Current State

Plugins receive only the Command object - they don't get access to shared infrastructure like Emmett or MessageBus.

However, **pipeline handlers** already receive a `PipelineContext`:

```typescript
// packages/pipeline/src/runtime/context.ts
interface PipelineContext {
  emit: (type: string, data: unknown) => Promise<void>;
  sendCommand: (type: string, data: unknown) => Promise<void>;
  correlationId: string;
  startPhased?: (handler, event) => Promise<void>;
}
```

### Required Enhancement

Extend `PipelineContext` to include Emmett event store access, then pass enriched context to plugin handlers:

```typescript
// Extended PipelineContext
interface PipelineContext {
  emit: (type: string, data: unknown) => Promise<void>;
  sendCommand: (type: string, data: unknown) => Promise<void>;
  correlationId: string;
  startPhased?: (handler, event) => Promise<void>;
  // NEW: Shared Emmett access
  eventStore: EventStore;
  messageBus: MessageBus;
}
```

### Handler Signature Change

Plugin command handlers will receive context as second parameter:

```typescript
// Current (plugins)
handle: async (command: Command) => Promise<Event | Event[]>;

// Enhanced (with context)
handle: async (command: Command, context: PipelineContext) =>
  Promise<Event | Event[]>;
```

### Key Files to Modify

| File                                               | Change                                      |
| -------------------------------------------------- | ------------------------------------------- |
| `packages/pipeline/src/runtime/context.ts`         | Add `eventStore`, `messageBus` to interface |
| `packages/pipeline/src/plugins/handler-adapter.ts` | Pass context to adapted handlers            |
| `packages/pipeline/src/server/pipeline-server.ts`  | Create enriched context with Emmett         |
| `packages/message-bus/src/define-command.ts`       | Update handler signature type               |

---

## Architecture

### Core Types (`src/types.ts`)

```typescript
type JobStatus = "pending" | "dispatched" | "succeeded" | "failed" | "skipped";
type GraphStatus = "processing" | "completed" | "failed";
type FailurePolicy = "halt" | "skip-dependents" | "continue";

interface Job {
  id: string;
  dependsOn: readonly string[];
  target: string;
  payload: unknown;
  timeoutMs?: number; // Optional per-job timeout (default: none)
  retries?: number; // Max retry attempts on dispatch failure (default: 0)
  backoffMs?: number; // Initial backoff between retries (default: 100)
  maxBackoffMs?: number; // Max backoff cap for exponential backoff (default: 5000)
}

interface JobState {
  jobId: string;
  status: JobStatus;
  dispatchedAt?: number;
  completedAt?: number;
  error?: string;
}

interface GraphState {
  graphId: string;
  status: GraphStatus;
  failurePolicy: FailurePolicy;
  jobs: Map<string, JobState>;
  createdAt: number;
  completedAt?: number;
}
```

### Commands

| Command         | Payload                             | Purpose                          |
| --------------- | ----------------------------------- | -------------------------------- |
| `graph.process` | `{ graphId, jobs, failurePolicy? }` | Entry point - submit a job graph |

**Note:** No `job.completed` or `job.failed` commands needed. The processor subscribes to domain events via `onCorrelation()` and infers success/failure from event types.

### Events

| Event             | Payload                                                | When Emitted                        |
| ----------------- | ------------------------------------------------------ | ----------------------------------- |
| `job.dispatched`  | `{ graphId, jobId, target, payload }`                  | Job sent to runner                  |
| `job.skipped`     | `{ graphId, jobId, reason, failedDependencyId? }`      | Job skipped due to policy           |
| `job.timedOut`    | `{ graphId, jobId, timeoutMs }`                        | Job exceeded timeout                |
| `graph.processed` | `{ graphId, jobStates, duration }`                     | All jobs reached terminal state     |
| `graph.failed`    | `{ graphId, reason, failedJobId?, error?, jobStates }` | Graph failed (validation or policy) |

**Note:** No `job.completed` or `job.failed` events needed from the processor. The processor listens to domain events from runners; it doesn't emit redundant status events.

### Handlers

| Handler               | Responsibility                                                                   |
| --------------------- | -------------------------------------------------------------------------------- |
| `ProcessGraphHandler` | Validate graph, initialize state, dispatch ready jobs, subscribe to correlations |

**Event Listener (internal, not a command handler):**

| Function                | Responsibility                                                                                          |
| ----------------------- | ------------------------------------------------------------------------------------------------------- |
| `handleJobEvent(event)` | Parse correlationId, determine success/failure, update state, dispatch ready jobs, apply failure policy |

The processor uses `eventBus.onCorrelation()` to listen for domain events, not command handlers.

### Dispatch Pattern

The handler receives infrastructure via `PipelineContext`:

```typescript
// Handler receives context automatically
handle: async (command: Command, context: PipelineContext) => {
  // Use context.sendCommand to dispatch jobs
  await context.sendCommand(job.target, {
    ...job.payload,
    correlationId: `graph:${graphId}:${job.id}`,
  });

  // Use context.eventStore to append events
  await context.eventStore.appendToStream(`job-graph-${graphId}`, [event]);

  // Use context.messageBus for correlation subscriptions
  context.messageBus.onCorrelationPrefix(`graph:${graphId}:`, handleJobEvent);
};
```

No manual dependency injection needed - context is provided by PipelineServer.

### Event Sourcing with Emmett

**Stream structure:** `job_graph-{graphId}` (one stream per graph aggregate)

**Event Store Events** (using Emmett Event type pattern):

```typescript
import { Event } from "@event-driven-io/emmett";

// Graph lifecycle
export type GraphSubmitted = Event<
  "GraphSubmitted",
  {
    graphId: string;
    jobs: Job[];
    failurePolicy: FailurePolicy;
    submittedAt: Date;
  }
>;
export type GraphCompleted = Event<
  "GraphCompleted",
  { graphId: string; duration: number; completedAt: Date }
>;
export type GraphFailed = Event<
  "GraphFailed",
  { graphId: string; reason: string; failedJobId?: string; error?: string }
>;

// Job lifecycle
export type JobDispatched = Event<
  "JobDispatched",
  { jobId: string; target: string; correlationId: string; dispatchedAt: Date }
>;
export type JobSucceeded = Event<
  "JobSucceeded",
  { jobId: string; result?: unknown; completedAt: Date }
>;
export type JobFailed = Event<
  "JobFailed",
  { jobId: string; error: string; failedAt: Date }
>;
export type JobSkipped = Event<
  "JobSkipped",
  { jobId: string; reason: string; failedDependencyId?: string }
>;
export type JobTimedOut = Event<
  "JobTimedOut",
  { jobId: string; timeoutMs: number }
>;
export type JobRetried = Event<
  "JobRetried",
  { jobId: string; attempt: number; backoffMs: number }
>;

// Union type
export type JobGraphEvent =
  | GraphSubmitted
  | GraphCompleted
  | GraphFailed
  | JobDispatched
  | JobSucceeded
  | JobFailed
  | JobSkipped
  | JobTimedOut
  | JobRetried;
```

**State as Discriminated Union:**

```typescript
export type PendingGraphState = {
  status: "pending";
  jobs: Map<string, JobState>;
};
export type ProcessingGraphState = {
  status: "processing";
  jobs: Map<string, JobState>;
  failurePolicy: FailurePolicy;
};
export type CompletedGraphState = {
  status: "completed";
  jobs: Map<string, JobState>;
  completedAt: Date;
};
export type FailedGraphState = {
  status: "failed";
  jobs: Map<string, JobState>;
  reason: string;
};

export type GraphState =
  | PendingGraphState
  | ProcessingGraphState
  | CompletedGraphState
  | FailedGraphState;
```

**Evolve function:**

```typescript
export const evolve = (state: GraphState, event: JobGraphEvent): GraphState => {
  switch (event.type) {
    case "GraphSubmitted":
      return {
        status: "processing",
        jobs: initializeJobs(event.data.jobs),
        failurePolicy: event.data.failurePolicy,
      };
    case "JobDispatched":
      return {
        ...state,
        jobs: updateJob(state.jobs, event.data.jobId, "dispatched"),
      };
    case "JobSucceeded":
      return {
        ...state,
        jobs: updateJob(state.jobs, event.data.jobId, "succeeded"),
      };
    // ... etc
  }
};
```

**No mutable repository** - state is always derived from events via `CommandHandler` or `aggregateStream`.

**Recovery:** On restart, replay events from event store to rebuild state.

### Validator

`GraphValidator.validate(jobs)` checks:

1. Unique job IDs
2. All dependency IDs exist in graph
3. No self-references
4. No cycles (DAG validation via DFS)
5. Non-empty target strings

---

## State Machines

### Job States

```
pending → dispatched → succeeded
                    → failed
pending → skipped (via policy)
```

### Graph States

```
(new) → processing → completed (all succeeded/skipped)
                  → failed (validation error OR halt policy OR job failures)
```

---

## Sequence Diagram: Typical Flow (with correlationId)

```
┌─────────────┐     ┌───────────────────┐     ┌──────────────────┐     ┌───────────┐
│   Client    │     │ JobGraphProcessor │     │    EventBus      │     │  Runner   │
└──────┬──────┘     └─────────┬─────────┘     └────────┬─────────┘     └─────┬─────┘
       │                      │                        │                     │
       │  ProcessGraph(g1,    │                        │                     │
       │    jobs: [A, B→A])   │                        │                     │
       │─────────────────────►│                        │                     │
       │                      │                        │                     │
       │                      │ validate, init state   │                     │
       │                      │                        │                     │
       │                      │ subscribe:             │                     │
       │                      │ onCorrelation(         │                     │
       │                      │   'graph:g1:A',        │                     │
       │                      │   handleJobEvent)      │                     │
       │                      │───────────────────────►│                     │
       │                      │                        │                     │
       │                      │ dispatch: BuildAtom    │                     │
       │                      │ correlationId:         │                     │
       │                      │   'graph:g1:A'         │                     │
       │                      │─────────────────────────────────────────────►│
       │                      │                        │                     │
       │                      │                        │     (runner works)  │
       │                      │                        │                     │
       │                      │                        │  AtomBuilt(...)     │
       │                      │                        │  correlationId:     │
       │                      │                        │◄────'graph:g1:A'────│
       │                      │                        │                     │
       │                      │  handleJobEvent(       │                     │
       │                      │◄───AtomBuilt)──────────│                     │
       │                      │                        │                     │
       │                      │ parse: graphId=g1,     │                     │
       │                      │        jobId=A         │                     │
       │                      │ mark A: succeeded      │                     │
       │                      │ check deps: B ready    │                     │
       │                      │                        │                     │
       │                      │ subscribe:             │                     │
       │                      │ onCorrelation(         │                     │
       │                      │   'graph:g1:B', ...)   │                     │
       │                      │───────────────────────►│                     │
       │                      │                        │                     │
       │                      │ dispatch: BuildMolecule│                     │
       │                      │ correlationId:         │                     │
       │                      │   'graph:g1:B'         │                     │
       │                      │─────────────────────────────────────────────►│
       │                      │                        │                     │
       │                      │                        │  MoleculeBuilt(...) │
       │                      │                        │◄────────────────────│
       │                      │                        │                     │
       │                      │◄───MoleculeBuilt───────│                     │
       │                      │                        │                     │
       │                      │ mark B: succeeded      │                     │
       │                      │ graph complete!        │                     │
       │                      │                        │                     │
       │  GraphProcessed(g1)  │                        │                     │
       │◄─────────────────────│                        │                     │
       │                      │                        │                     │
```

**Key points:**

1. Processor subscribes to `onCorrelation('graph:g1:A', ...)` BEFORE dispatching
2. Runner emits its normal domain event (e.g., `AtomBuilt`) with inherited correlationId
3. EventBus routes the event to the processor via correlation subscription
4. Processor parses correlationId to identify graphId + jobId
5. Runner is **completely unaware** of the job graph

### Failure Flow (halt policy)

```
┌─────────────┐     ┌───────────────────┐     ┌──────────────────┐     ┌───────────┐
│   Client    │     │ JobGraphProcessor │     │    EventBus      │     │  Runner   │
└──────┬──────┘     └─────────┬─────────┘     └────────┬─────────┘     └─────┬─────┘
       │                      │                        │                     │
       │  ProcessGraph(g1,    │                        │                     │
       │    jobs: [A, B→A],   │                        │                     │
       │    policy: 'halt')   │                        │                     │
       │─────────────────────►│                        │                     │
       │                      │                        │                     │
       │                      │ subscribe + dispatch A │                     │
       │                      │─────────────────────────────────────────────►│
       │                      │                        │                     │
       │                      │                        │  AtomFailed(error)  │
       │                      │                        │  correlationId:     │
       │                      │                        │◄────'graph:g1:A'────│
       │                      │                        │                     │
       │                      │◄───AtomFailed──────────│                     │
       │                      │                        │                     │
       │                      │ parse correlationId    │                     │
       │                      │ mark A: failed         │                     │
       │                      │ policy: halt           │                     │
       │                      │ mark B: skipped        │                     │
       │                      │ mark graph: failed     │                     │
       │                      │                        │                     │
       │  GraphFailed(g1,     │                        │                     │
       │    failedJobId: A)   │                        │                     │
       │◄─────────────────────│                        │                     │
```

### Correlation Options: How Does The Processor Know A Job Completed?

**Option A: Callback Commands (Protocol-Aware Runners)**

Runners explicitly call back with `JobCompleted(graphId, jobId)`:

```
Processor                          Runner
    │                                 │
    │  dispatch(target, payload,      │
    │           graphId, jobId)       │
    │────────────────────────────────►│
    │                                 │
    │                                 │ (does work)
    │                                 │
    │   JobCompleted(graphId, jobId)  │
    │◄────────────────────────────────│
```

**Pros:** Explicit, simple correlation
**Cons:** Runners must know about job graph protocol

---

**Option B: Event Subscription (Protocol-Agnostic Runners)** ⭐ RECOMMENDED

Runners are unaware of job graphs. They emit their normal domain events.
The processor correlates via `correlationId` in message metadata.

```
Processor                          Runner                     Domain Events
    │                                 │                              │
    │  ImplementClient(payload)       │                              │
    │  metadata: {                    │                              │
    │    correlationId: "graph:g1:j1" │                              │
    │  }                              │                              │
    │────────────────────────────────►│                              │
    │                                 │                              │
    │                                 │ (does work, emits event)     │
    │                                 │                              │
    │                                 │  ClientImplemented(...)      │
    │                                 │  metadata: {                 │
    │                                 │    correlationId: "graph:g1:j1"
    │                                 │  }                           │
    │                                 │─────────────────────────────►│
    │                                 │                              │
    │◄─────────────────────────────────────────────────────────────────
    │  (processor subscribes to ALL events, filters by correlationId)
    │
    │  parse correlationId → graphId: g1, jobId: j1
    │  mark job j1 as succeeded
```

**How it works:**

1. **Dispatch:** Processor dispatches command with structured correlationId:

   ```typescript
   correlationId: `graph:${graphId}:${jobId}`;
   ```

2. **Inheritance:** `deriveEvent()` automatically copies correlationId from command to event (already in message-bus)

3. **Subscription:** Processor subscribes to a wildcard or specific event types:

   ```typescript
   // Option B1: Subscribe to terminal events for each target
   eventBus.on("client.implemented", this.handleDomainEvent);
   eventBus.on("client.failed", this.handleDomainEvent);

   // Option B2: Use middleware to intercept all events
   eventBus.use((event, next) => {
     if (event.metadata.correlationId?.startsWith("graph:")) {
       this.handleJobEvent(event);
     }
     next(event);
   });
   ```

4. **Correlation:** Parse the correlationId to find graphId + jobId:

   ```typescript
   handleDomainEvent(event: Event) {
     const match = event.metadata.correlationId?.match(/^graph:(.+):(.+)$/);
     if (!match) return;
     const [, graphId, jobId] = match;

     if (event.type.endsWith('.failed')) {
       this.markFailed(graphId, jobId, event.payload.error);
     } else {
       this.markSucceeded(graphId, jobId, event.payload);
     }
   }
   ```

**Pros:**

- Runners are completely decoupled - they just emit normal events
- Works with existing handlers that already follow the pattern
- Uses existing metadata infrastructure

**Cons:**

- Need to define which events are "terminal" for each target
- Slightly more complex correlation logic

---

**Option C: Hybrid - Job Definition Specifies Completion Event**

```typescript
interface Job {
  id: string;
  dependsOn: string[];
  target: string;              // command to dispatch
  completionEvent?: string;    // event that signals completion (optional)
  failureEvent?: string;       // event that signals failure (optional)
  payload: unknown;
}

// Example:
{
  id: 'impl-client',
  target: 'client.implement',
  completionEvent: 'client.implemented',
  failureEvent: 'client.failed',
  payload: { name: 'LoginClient' }
}
```

The processor subscribes to the specified events and correlates via correlationId.

---

### Recommendation

**Use Option B** (event subscription with correlationId) because:

1. Downstream handlers stay decoupled - they don't need to know about job graphs
2. Already works with your existing `deriveEvent()` pattern that inherits correlationId
3. No protocol coupling between job graph and domain handlers

### Success vs Failure Detection

Check `event.payload.error`:

```typescript
function handleJobEvent(event: Event) {
  const { graphId, jobId } = parseCorrelationId(event.metadata.correlationId);

  if (event.payload && "error" in event.payload && event.payload.error) {
    // Failure - payload has error field
    this.markFailed(graphId, jobId, String(event.payload.error));
  } else {
    // Success - no error field
    this.markSucceeded(graphId, jobId, event.payload);
  }
}
```

---

## Failure Policies

| Policy            | Behavior                                                     |
| ----------------- | ------------------------------------------------------------ |
| `halt`            | Stop immediately, skip all pending jobs, emit `graph.failed` |
| `skip-dependents` | Skip transitive dependents of failed job, continue others    |
| `continue`        | Treat failure as completion, dispatch dependents normally    |

---

## Critical Files to Reference

**auto-engineer-2 repo:**
| File | Pattern to Follow |
|------|-------------------|
| `packages/pipeline/src/store/pipeline-event-store.ts` | Emmett event store with inline projections |
| `packages/pipeline/src/projections/phased-execution-projection.ts` | Projection evolve function pattern |
| `packages/pipeline/src/runtime/context.ts` | PipelineContext interface |
| `packages/pipeline/src/plugins/handler-adapter.ts` | Handler adaptation |
| `packages/pipeline/src/server/pipeline-server.ts` | Infrastructure wiring |
| `packages/server-checks/src/commands/check-lint.ts` | `defineCommandHandler()` pattern |
| `packages/message-bus/src/define-command.ts` | Command handler definition |

**Emmett docs (local):**
| File | Pattern |
|------|---------|
| `/Users/sam/code/emmett/src/docs/snippets/gettingStarted/events.ts` | Event definitions |
| `/Users/sam/code/emmett/src/docs/snippets/gettingStarted/shoppingCart.ts` | State & evolve |
| `/Users/sam/code/emmett/src/docs/snippets/gettingStarted/commandHandler.ts` | CommandHandler |
| `/Users/sam/code/emmett/src/docs/api-reference/decider.md` | Decider pattern |
| `/Users/sam/code/emmett/src/docs/guides/projections.md` | Projections |
| `/Users/sam/code/emmett/src/docs/api-reference/eventstore.md` | Event store API |

## Emmett Integration

**Dependencies to add:**

```json
{
  "@event-driven-io/emmett": "latest",
  "@event-driven-io/emmett-sqlite": "latest"
}
```

**Local Emmett Docs:** `/Users/sam/code/emmett/src/docs`

### Pattern 1: Event Definitions (Discriminated Union)

```typescript
// From /snippets/gettingStarted/events.ts
import { Event } from '@event-driven-io/emmett';

export type GraphSubmitted = Event<
  'GraphSubmitted',
  { graphId: string; jobIds: string[]; submittedAt: Date }
>;

export type JobDispatched = Event<
  'JobDispatched',
  { graphId: string; jobId: string; dispatchedAt: Date }
>;

export type JobGraphEvent = GraphSubmitted | JobDispatched | /* ... */;
```

### Pattern 2: State as Discriminated Union

```typescript
// From /snippets/gettingStarted/shoppingCart.ts
export type PendingGraph = { status: "Pending"; jobIds: string[] };
export type DispatchingGraph = {
  status: "Dispatching";
  jobIds: string[];
  dispatchedJobs: Set<string>;
};
export type CompletedGraph = {
  status: "Completed";
  jobIds: string[];
  completedAt: Date;
};

export type JobGraphState = PendingGraph | DispatchingGraph | CompletedGraph;

export const initialState = (): JobGraphState => ({
  status: "Pending",
  jobIds: [],
});

export const evolve = (
  state: JobGraphState,
  event: JobGraphEvent,
): JobGraphState => {
  switch (event.type) {
    case "GraphSubmitted":
      return { status: "Pending", jobIds: event.data.jobIds };
    case "JobDispatched":
      if (state.status === "Pending") return state;
      return {
        ...state,
        dispatchedJobs: new Set([...state.dispatchedJobs, event.data.jobId]),
      };
    // ...
  }
};
```

### Pattern 3: Command Handler (Automates Read-Decide-Append)

```typescript
// From /snippets/gettingStarted/commandHandler.ts
import { CommandHandler } from "@event-driven-io/emmett";

const handle = CommandHandler<JobGraphState, JobGraphEvent>({
  evolve,
  initialState,
  mapToStreamId: (graphId) => `job_graph-${graphId}`,
});

// Usage in handler:
await handle(context.eventStore, graphId, (state) => {
  // Return event(s) to append
  return {
    type: "JobDispatched",
    data: { graphId, jobId, dispatchedAt: new Date() },
  };
});
```

### Pattern 4: Decider (Business Logic)

```typescript
// From /api-reference/decider.md
import { IllegalStateError } from "@event-driven-io/emmett";

export const dispatchJob = (
  command: DispatchJobCommand,
  state: JobGraphState,
): JobGraphEvent => {
  if (state.status === "Pending")
    throw new IllegalStateError("Graph not ready");
  if (state.dispatchedJobs.has(command.data.jobId))
    throw new IllegalStateError("Already dispatched");

  return {
    type: "JobDispatched",
    data: {
      graphId: command.data.graphId,
      jobId: command.data.jobId,
      dispatchedAt: new Date(),
    },
  };
};
```

### Pattern 5: Single-Stream Projection

```typescript
// From /guides/projections.md
import { pongoSingleStreamProjection } from "@event-driven-io/emmett-postgresql";

const graphStateProjection = pongoSingleStreamProjection<
  GraphState,
  JobGraphEvent
>({
  collectionName: "job_graphs",
  canHandle: ["GraphSubmitted", "JobDispatched", "GraphCompleted"],
  evolve: (document, event) => {
    /* ... */
  },
});

// Register inline (same transaction):
const eventStore = getEventStore({
  projections: projections.inline([graphStateProjection]),
});
```

### Pattern 6: BDD-Style Testing

```typescript
// From /api-reference/decider.md
import { DeciderSpecification } from "@event-driven-io/emmett";

const spec = DeciderSpecification.for(jobGraphDecider);

it("dispatches job when graph is ready", () =>
  spec([{ type: "GraphSubmitted", data: { graphId: "g1", jobIds: ["j1"] } }])
    .when({ type: "DispatchJob", data: { graphId: "g1", jobId: "j1" } })
    .then([
      { type: "JobDispatched", data: expect.objectContaining({ jobId: "j1" }) },
    ]));
```

### Stream Naming Convention

- Format: `{aggregateName}-{id}`
- Example: `job_graph-graph-123`

---

## Implementation Bursts

### Bottle -1: Infrastructure Context Enhancement (pipeline)

Extend `PipelineContext` to share Emmett with plugins:

- [ ] Burst -1a: Add `eventStore` to PipelineContext interface [depends: none]
- [ ] Burst -1b: Add `messageBus` to PipelineContext interface [depends: -1a]
- [ ] Burst -1c: Update handler-adapter to pass context to handler [depends: -1b]
- [ ] Burst -1d: Update defineCommandHandler signature to accept optional context [depends: -1c]
- [ ] Burst -1e: Update PipelineServer.createContext() to include eventStore [depends: -1d]

---

### Bottle 0: EventBus Enhancement (message-bus)

Add correlation-based subscription to `@on.auto/message-bus`:

```typescript
// New method on EventBus
onCorrelation(
  correlationId: string,
  listener: (event: Event) => void
): Unsubscribe

// Usage:
const unsub = eventBus.onCorrelation('graph:g1:job-123', (event) => {
  // Called for ANY event with this correlationId
});
```

**Implementation approach:**

- Maintain a `Map<string, Set<listener>>` for correlation subscriptions
- In `notifyListeners()`, also check correlation subscribers
- Return unsubscribe function that removes from the map

- [ ] Burst 0a: EventBus.onCorrelation() - subscribe by exact correlationId [depends: none]
- [ ] Burst 0b: EventBus.onCorrelationPrefix() - subscribe by correlationId prefix (e.g., 'graph:') [depends: 0a]

---

### Bottle 1: Package Setup & Core Types

- [ ] Burst 1: Create package.json, tsconfig.json, vitest.config.ts [depends: 0b]
- [ ] Burst 2: Define core types (JobStatus, GraphStatus, FailurePolicy, Job, JobState, GraphState) [depends: 1]

### Bottle 2: Validation

- [ ] Burst 3: GraphValidator.validate() - unique IDs check [depends: 2]
- [ ] Burst 4: GraphValidator - dependency existence check [depends: 3]
- [ ] Burst 5: GraphValidator - self-reference check [depends: 4]
- [ ] Burst 6: GraphValidator - cycle detection (DFS) [depends: 5]
- [ ] Burst 7: GraphValidator - empty target check [depends: 6]

### Bottle 3: Commands

- [ ] Burst 8: ProcessGraph command factory [depends: 2]
- [ ] Burst 9: Commands index.ts [depends: 8]

### Bottle 4: Events

- [ ] Burst 10: JobDispatched event factory [depends: 2]
- [ ] Burst 11: JobSkipped event factory [depends: 2]
- [ ] Burst 12: JobTimedOut event factory [depends: 2]
- [ ] Burst 13: GraphProcessed event factory [depends: 2]
- [ ] Burst 14: GraphFailed event factory [depends: 2]
- [ ] Burst 15: Events index.ts [depends: 10-14]

### Bottle 5: Event Store Events (Emmett)

- [ ] Burst 16: Define GraphSubmitted event type [depends: 2]
- [ ] Burst 17: Define JobDispatched, JobSucceeded, JobFailed events [depends: 16]
- [ ] Burst 18: Define JobSkipped, JobTimedOut, JobRetried events [depends: 17]
- [ ] Burst 19: Define GraphCompleted, GraphFailed events [depends: 18]
- [ ] Burst 20: Event store setup with SQLite backend [depends: 19]

### Bottle 5b: Projection

- [ ] Burst 20a: GraphState projection - initialize from GraphSubmitted [depends: 20]
- [ ] Burst 20b: Projection - handle JobDispatched, update job status [depends: 20a]
- [ ] Burst 20c: Projection - handle JobSucceeded/Failed/Skipped/TimedOut [depends: 20b]
- [ ] Burst 20d: Projection - derive getReadyJobs from state [depends: 20c]
- [ ] Burst 20e: Projection - derive getTransitiveDependents [depends: 20d]
- [ ] Burst 20f: Projection - derive isGraphComplete [depends: 20e]

### Bottle 6: ProcessGraphHandler (Emmett command handler)

- [ ] Burst 21: Handler - validation and emit GraphFailed on invalid [depends: 7, 9, 15, 20f]
- [ ] Burst 22: Handler - idempotency via stream existence check [depends: 21]
- [ ] Burst 23: Handler - emit GraphSubmitted, subscribe correlations, dispatch ready jobs [depends: 22]

### Bottle 7: Event Listener (handleJobEvent)

- [ ] Burst 24: handleJobEvent - parse correlationId, identify graph+job [depends: 20f, 0b]
- [ ] Burst 25: handleJobEvent - determine success vs failure (check payload.error) [depends: 24]
- [ ] Burst 26: handleJobEvent - emit JobSucceeded, dispatch ready jobs [depends: 25]
- [ ] Burst 27: handleJobEvent - halt policy (emit JobSkipped for pending, emit GraphFailed) [depends: 26]
- [ ] Burst 28: handleJobEvent - skip-dependents policy [depends: 27]
- [ ] Burst 29: handleJobEvent - continue policy [depends: 28]
- [ ] Burst 30: handleJobEvent - check graph completion, emit GraphCompleted [depends: 29]

### Bottle 8: Timeouts

- [ ] Burst 31: Timeout manager - track timers per job (separate from event store) [depends: 20f]
- [ ] Burst 32: ProcessGraphHandler - start timeout timer when dispatching job [depends: 23, 31]
- [ ] Burst 33: handleJobEvent - clear timeout timer on completion [depends: 30, 32]
- [ ] Burst 34: Timeout handler - emit JobTimedOut when timer fires [depends: 33]

### Bottle 8b: Retry Logic

- [ ] Burst 34a: Retry manager - track retry attempts per job [depends: 20f]
- [ ] Burst 34b: On dispatch failure, schedule retry with backoff [depends: 34a]
- [ ] Burst 34c: Emit JobRetried event on retry attempt [depends: 34b]
- [ ] Burst 34d: After max retries, emit JobFailed [depends: 34c]

### Bottle 9: Integration

- [ ] Burst 35: Main index.ts with type maps [depends: 9, 15]
- [ ] Burst 36: Integration test - diamond dependency graph [depends: 23, 34d]
- [ ] Burst 37: Integration test - failure policies [depends: 36]
- [ ] Burst 38: Integration test - job timeout [depends: 37]
- [ ] Burst 39: Integration test - retry with backoff [depends: 38]
- [ ] Burst 40: Integration test - recovery from SQLite on restart [depends: 39]

---

## Verification

1. **Unit tests**: Each burst includes tests (100% coverage per ketchup rules)
2. **Integration test**: Full graph execution with all three failure policies
3. **Type check**: `pnpm type-check` passes in packages/job-graph-processor
4. **Test run**: `pnpm test` passes in packages/job-graph-processor
5. **Pipeline context tests**: Verify context includes eventStore and messageBus
6. **E2E test**: Register plugin in examples/kanban-todo/auto.config.ts, run a graph through the pipeline

### Test Commands

```bash
cd /Users/sam/code/auto/2/auto-engineer-2

# Run new package tests
pnpm --filter @auto-engineer/job-graph-processor test

# Type check
pnpm --filter @auto-engineer/job-graph-processor type-check

# Run full pipeline tests (includes context enhancement)
pnpm --filter @auto-engineer/pipeline test
```

---

## Example Usage

### Plugin Registration (auto.config.ts)

```typescript
// examples/my-project/auto.config.ts
export const plugins = [
  "@auto-engineer/job-graph-processor", // Register the plugin
  "@auto-engineer/server-checks",
  // ... other plugins
];
```

### Plugin Command Handler (receives context)

```typescript
// packages/job-graph-processor/src/commands/process-graph.ts
import { defineCommandHandler } from "@auto-engineer/message-bus";

export const commandHandler = defineCommandHandler({
  name: "ProcessGraph",
  handle: async (command, context) => {
    // context.eventStore - shared Emmett event store
    // context.messageBus - shared message bus
    // context.emit() - emit events
    // context.sendCommand() - dispatch commands
    // context.correlationId - for correlation tracking

    const { graphId, jobs, failurePolicy } = command.data;

    // Append to Emmett stream
    await context.eventStore.appendToStream(`job-graph-${graphId}`, [
      { type: "GraphSubmitted", data: { graphId, jobs, failurePolicy } },
    ]);

    // Subscribe to correlated events
    context.messageBus.onCorrelationPrefix(`graph:${graphId}:`, (event) => {
      // Handle job completion events...
    });

    // Dispatch ready jobs
    for (const job of getReadyJobs(jobs)) {
      await context.sendCommand(job.target, {
        ...job.payload,
        correlationId: `graph:${graphId}:${job.id}`,
      });
    }

    return { type: "GraphProcessing", data: { graphId } };
  },
});

export const COMMANDS = [commandHandler];
```

### Pipeline Integration

```typescript
// The pipeline definition triggers JobGraphProcessor
export const pipeline = define("my-pipeline")
  .on("BuildPlanCreated")
  .emit("ProcessGraph", (event) => ({
    graphId: event.data.planId,
    jobs: event.data.jobs,
    failurePolicy: "skip-dependents",
  }))
  .build();
```

### Workflow

1. Pipeline emits `ProcessGraph` command
2. JobGraphProcessor handler receives command + context
3. Handler validates graph, appends `GraphSubmitted` to Emmett
4. Handler subscribes to correlation events via `context.messageBus.onCorrelationPrefix()`
5. Handler dispatches ready jobs via `context.sendCommand()`
6. When downstream handlers emit events with inherited correlationId, JobGraphProcessor receives them
7. Handler updates state in Emmett, dispatches newly-ready jobs
8. When all jobs complete, emits `GraphProcessed` event
