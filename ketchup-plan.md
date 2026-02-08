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

## TODO

(empty — all bursts complete)

## DONE

### Bottle: Graph Processor (MessageBus Integration)

- [x] submit rejects duplicate graph submissions (92ee8ae1)
- [x] submit rejects invalid graph (93b90bee)
- [x] submit dispatches ready jobs and returns dispatching event (10f0214a)
- [x] process correlated events and emit graph.completed (e956b347)
- [x] dispatch dependent jobs when deps complete via correlation (56093d10)
- [x] ignore correlated events after graph completes (89c8c5a7)
- [x] ignore events with unrecognized correlationId format (cb294531)
- [x] apply halt policy when job fails via correlation (59779996)
- [x] export createGraphProcessor from index (dedcabe5)


### Bottle: Infrastructure Context Enhancement (pipeline)

- [x] Burst -1a: Add eventStore to PipelineContext interface (61122ec4)
- [x] Burst -1b: Add messageBus to PipelineContext interface (61122ec4)
- [x] Burst -1c: Update handler-adapter to pass context to handler (61122ec4)
- [x] Burst -1d: Update defineCommandHandler signature to accept optional context (61122ec4)
- [x] Burst -1e: Update PipelineServer.createContext() to include eventStore (61122ec4)

### Bottle: EventBus Correlation Subscriptions (message-bus)

- [x] Burst 0a: EventBus.onCorrelation() - subscribe by exact correlationId (8e178818)
- [x] Burst 0b: EventBus.onCorrelationPrefix() - subscribe by correlationId prefix (24a7197e)

### Bottle: Package Setup and Core Types

- [x] Burst 1: Create package.json, tsconfig.json, vitest.config.ts (52ec7e7e)
- [x] Burst 2: Core types defined inline in evolve.ts and graph-validator.ts (emergent design)

### Bottle: Graph Validation

- [x] Burst 3-7: GraphValidator with all checks (b82e4ac0)

### Bottle: Evolve Module (Events, State, Queries)

- [x] getReadyJobs returns root jobs after graph submission (0e78904f)
- [x] getReadyJobs unlocks dependents after job succeeds (ff6823c6)
- [x] isGraphComplete returns true when all jobs succeeded (106139ad)
- [x] isGraphComplete returns false when jobs still pending (5d365b74)
- [x] getReadyJobs returns empty before graph submission (24c8a5dd)
- [x] isGraphComplete returns false before graph submission (c5a150e3)
- [x] evolve ignores events for unknown job IDs (95bb1295)
- [x] evolve ignores job events before graph submission (d97abc28)
- [x] isGraphComplete treats failed jobs as terminal (1c5660ee)
- [x] isGraphComplete treats skipped jobs as terminal (20657f4c)
- [x] isGraphComplete treats timed-out jobs as terminal (d3843559)
- [x] getTransitiveDependents query function (d12ad238)

### Bottle: Event Listener

- [x] parseCorrelationId extracts graphId and jobId (43b57579)
- [x] isJobFailure detects failure from payload error (951446de)
- [x] classifyJobEvent maps domain events to evolve events (a9ed7169)
- [x] applyPolicy halt skips all pending jobs (ed51ebc3)
- [x] applyPolicy skip-dependents skips transitive deps (ededa69a)
- [x] applyPolicy continue returns no skip events (9bc2035e)
- [x] handleJobEvent composes classify, evolve, policy, completion (c82c9489)

### Bottle: ProcessGraphHandler

- [x] handleProcessGraph returns graph.failed on invalid graph (24571e92)
- [x] handleProcessGraph dispatches ready jobs for valid graph (a6f6d1c3)

### Bottle: Failure Policy (continue)

- [x] getReadyJobs treats failed deps as resolved under continue policy (fe4a4791)

### Bottle: Timeouts

- [x] Timeout manager tracks and fires per-job timers (fb8e1aab)

### Bottle: Retry Logic

- [x] Retry manager with exponential backoff and max cap (b49b742b)

### Bottle: Integration

- [x] Public API exports in index.ts (bcd28976)
- [x] Diamond dependency graph integration test (be927228)
- [x] Halt and skip-dependents failure policy integration tests (028481d2)
- [x] Continue policy unlocks dependents integration test (1124c5f6)
- [x] Timeout fires and evolve treats timed-out as terminal (e2622e75)
- [x] Retry with backoff and max retries integration test (6358d3b6)

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
