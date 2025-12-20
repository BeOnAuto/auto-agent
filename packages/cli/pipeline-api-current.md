# Pipeline API Documentation

## Overview

The pipeline is an **event-driven reactive system** where:

- **Events** are emitted when something happens (e.g., `SchemaExported`, `SliceGenerated`)
- **Commands** are instructions to do something (e.g., `GenerateServer`, `ImplementSlice`)
- **Handlers** listen for events and dispatch commands in response

---

## Core API Functions

### 1. `on<EventType>('EventName', handler)` — Listen for a single event

**Purpose:** Register a handler that fires when a specific event occurs.

**Signature:**

```typescript
on<T extends Event>(eventType: string, handler: (event: T) => Command | Command[] | void)
```

**What the handler can return:**

- A single command → dispatches that command
- An array of commands → dispatches all of them
- Nothing → no dispatch

---

### 2. `dispatch<CommandType>('CommandName', data)` — Send a command

**Purpose:** Create and queue a command to be executed.

**Signature:**

```typescript
dispatch<T extends Command>(commandType: string, data: T['data']): Command
```

**Usage:** Always used inside an `on` handler to respond to events by triggering work.

---

### 3. `dispatch.parallel([commands])` — Send multiple commands concurrently

**Purpose:** Execute multiple commands at the same time without waiting.

**Signature:**

```typescript
dispatch.parallel<T extends Command>(commands: T[]): DispatchAction
```

**When to use:** When you have independent work that can run simultaneously.

---

### 4. `on.settled<Cmd1, Cmd2, ...>(['Cmd1', 'Cmd2', ...], handler)` — Wait for multiple commands to complete

**Purpose:** Execute a handler only after ALL specified commands have finished (success or failure).

**Signature:**

```typescript
on.settled<T, U, V>(
  commandTypes: ['CmdT', 'CmdU', 'CmdV'],
  dispatch<TargetCommand>(['TargetCommand'], (events, send) => {
    // events = { CmdT: Event[], CmdU: Event[], CmdV: Event[] }
    // send() dispatches a command
    return { persist: boolean }
  })
)
```

**Special return value:**

- `{ persist: false }` → Handler won't fire again for future matching commands
- `{ persist: true }` → Handler stays active for the next round of those commands

---

## The Kanban-Todo Pipeline — Step by Step

Here's what the config is trying to achieve, expressed as a sequence:

### Phase 1: Schema → Server Generation

1. **When `SchemaExported` fires:**
   - Dispatch `GenerateServer` with the schema path and destination

2. **When `SliceGenerated` fires (for each slice):**
   - Dispatch `ImplementSlice` to have AI implement that slice
   - Pass `attemptNumber: 0` indicating first attempt

3. **When `SliceImplemented` fires:**
   - Dispatch three checks in parallel:
     - `CheckTests` — run tests for that slice
     - `CheckTypes` — run type checking for that slice
     - `CheckLint` — run linting for that slice (with auto-fix)

4. **When ALL THREE checks settle (via `on.settled`):**
   - Collect any failures from tests, types, or lint
   - If no failures → clear retry state, done with this slice
   - If failures AND retry count < 4 → dispatch `ImplementSlice` again with error messages and incremented attempt number
   - If failures AND retry count >= 4 → give up, clear retry state
   - Return `{ persist: true }` to keep watching for future check completions

### Phase 2: Server Generated → IA + Dev Server

5. **When `ServerGenerated` fires:**
   - Dispatch two commands in parallel:
     - `GenerateIA` — generate information architecture
     - `StartServer` — start the dev server

### Phase 3: IA → Client Generation

6. **When `IAGenerated` fires:**
   - Dispatch `GenerateClient` with the IA schema, GraphQL schema, and Figma variables

### Phase 4: Client Generated → Component Implementation (Phased)

7. **When `ClientGenerated` fires:**
   - Store the list of components and target directory in module-level state
   - Filter for `molecule` components
   - Mark the `molecule` phase as dispatched
   - Dispatch in parallel:
     - One `ImplementComponent` command per molecule
     - One `StartClient` command to start the client dev server

8. **When `ComponentImplemented` or `ComponentImplementationFailed` fires:**
   - Mark the component as processed or failed
   - Call `tryAdvanceToNextPhase()`:
     - Check if all components of the current phase are done
     - If yes and next phase not yet dispatched → dispatch all components of next phase
   - The phase order is: `molecule` → `organism` → `page`

### Phase 5: Client Checks → Retry on Errors

9. **When `ClientChecked` fires:**
   - If there are TS errors, build errors, or console errors:
     - Dispatch `ImplementClient` with the failure details to retry

---

## State Management

The config uses **module-level state** to coordinate multi-step workflows:

| Variable              | Type                      | Purpose                                  |
| --------------------- | ------------------------- | ---------------------------------------- |
| `sliceRetryState`     | `Map<string, number>`     | Tracks retry count per slice path        |
| `clientComponents`    | `Array<{type, filePath}>` | All components from client generation    |
| `clientTargetDir`     | `string`                  | Where the client code lives              |
| `processedComponents` | `Set<string>`             | Successfully implemented component paths |
| `dispatchedPhases`    | `Set<string>`             | Phases that have already been kicked off |
| `failedComponents`    | `Set<string>`             | Components that failed implementation    |
| `MAX_RETRIES`         | `4`                       | Maximum retry attempts for slices        |

---

## Key Patterns

| Pattern              | How It's Used                                                        |
| -------------------- | -------------------------------------------------------------------- |
| **Event chaining**   | `on('A', ...) → dispatch('B') → on('B', ...) → dispatch('C')`        |
| **Parallel fan-out** | `dispatch.parallel([...commands])` to run multiple independent tasks |
| **Aggregation**      | `on.settled(['X', 'Y', 'Z'], ...)` to wait for multiple results      |
| **Retry loop**       | Track attempt count in state, re-dispatch with error context         |
| **Phased execution** | Use sets to track completion, advance when all of phase done         |

---

## Helper Functions in the Config

| Function                         | Purpose                                                                          |
| -------------------------------- | -------------------------------------------------------------------------------- |
| `getComponentsOfType(type)`      | Filter `clientComponents` by molecule/organism/page                              |
| `areAllProcessed(type)`          | Check if every component of a type is done (processed or failed, but not failed) |
| `dispatchComponentsOfType(type)` | Create and dispatch `ImplementComponent` for all components of a type            |
| `tryAdvanceToNextPhase()`        | Walk the phase order, dispatch next phase if current is complete                 |
| `findCheckFailures(events)`      | Extract failure events from the settled events record                            |
| `hasAnyFailures(failures)`       | Boolean check for any test/type/lint failures                                    |
| `getSlicePath(failures, events)` | Get the target directory from failure or success events                          |
| `collectErrorMessages(failures)` | Concatenate all error messages for retry context                                 |

---

## Visual Flow

```
SchemaExported
    │
    ▼
GenerateServer
    │
    ├──► SliceGenerated (per slice)
    │        │
    │        ▼
    │    ImplementSlice
    │        │
    │        ▼
    │    SliceImplemented
    │        │
    │        ├──► CheckTests  ──┐
    │        ├──► CheckTypes  ──┼──► on.settled ──► retry if failures
    │        └──► CheckLint   ──┘
    │
    ▼
ServerGenerated
    │
    ├──► GenerateIA ──► IAGenerated ──► GenerateClient
    │                                        │
    └──► StartServer                         ▼
                                      ClientGenerated
                                             │
                                             ├──► StartClient
                                             │
                                             ▼
                                      ImplementComponent (molecules)
                                             │
                                             ▼
                                      ComponentImplemented
                                             │
                                             ▼
                                      ImplementComponent (organisms)
                                             │
                                             ▼
                                      ComponentImplemented
                                             │
                                             ▼
                                      ImplementComponent (pages)
```

---

## Full Example: Kanban-Todo Pipeline Config

```typescript
import { autoConfig, on, dispatch } from '@auto-engineer/cli';
import type { ExportSchemaEvents } from '@auto-engineer/narrative';
import type {
  GenerateServerCommand,
  GenerateServerEvents,
  SliceGeneratedEvent,
} from '@auto-engineer/server-generator-apollo-emmett';
import type { ImplementSliceEvents, ImplementSliceCommand } from '@auto-engineer/server-implementer';
import type {
  CheckTestsCommand,
  CheckTypesCommand,
  CheckLintCommand,
  TestsCheckFailedEvent,
  TypeCheckFailedEvent,
  LintCheckFailedEvent,
} from '@auto-engineer/server-checks';
import type { GenerateIACommand, GenerateIAEvents } from '@auto-engineer/information-architect';
import type { ImplementClientCommand } from '@auto-engineer/frontend-implementer';
import type { GenerateClientCommand, GenerateClientEvents } from '@auto-engineer/frontend-generator-react-graphql';
import type { CheckClientEvents } from '@auto-engineer/frontend-checks';
import type {
  ImplementComponentCommand,
  ComponentImplementedEvent,
  ComponentImplementationFailedEvent,
} from '@auto-engineer/component-implementer';
import type { StartServerCommand, StartClientCommand } from '@auto-engineer/dev-server';
import * as path from 'path';
import createDebug from 'debug';

const debug = createDebug('auto:config:component');

const sliceRetryState = new Map<string, number>();
const MAX_RETRIES = 4;

type ComponentType = 'molecule' | 'organism' | 'page';
const componentPhaseOrder: ComponentType[] = ['molecule', 'organism', 'page'];

let clientComponents: Array<{ type: string; filePath: string }> = [];
let clientTargetDir = '';
const processedComponents = new Set<string>();
const dispatchedPhases = new Set<string>();
const failedComponents = new Set<string>();

interface CheckFailures {
  testsCheckFailed?: TestsCheckFailedEvent;
  typeCheckFailed?: TypeCheckFailedEvent;
  lintCheckFailed?: LintCheckFailedEvent;
}

type EventsType = Record<
  string,
  Array<{
    type: string;
    data: { targetDirectory?: string; errors?: string };
  }>
>;

export default autoConfig({
  fileId: 'todoK4nB2',

  plugins: [
    '@auto-engineer/server-checks',
    '@auto-engineer/design-system-importer',
    '@auto-engineer/server-generator-apollo-emmett',
    '@auto-engineer/narrative',
    '@auto-engineer/frontend-checks',
    '@auto-engineer/frontend-implementer',
    '@auto-engineer/component-implementer',
    '@auto-engineer/information-architect',
    '@auto-engineer/frontend-generator-react-graphql',
    '@auto-engineer/server-implementer',
    '@auto-engineer/dev-server',
  ],
  aliases: {},
  pipeline: () => {
    function getComponentsOfType(type: string) {
      return clientComponents.filter((c) => c.type === type);
    }

    function areAllProcessed(type: string): boolean {
      const components = getComponentsOfType(type);
      if (components.length === 0) return false;

      const allDone = components.every((c) => processedComponents.has(c.filePath) || failedComponents.has(c.filePath));

      if (!allDone) return false;

      const anyFailed = components.some((c) => failedComponents.has(c.filePath));

      return !anyFailed;
    }

    function dispatchComponentsOfType(type: ComponentType) {
      const components = getComponentsOfType(type);
      const commands = components.map((component) => {
        const componentName = path.basename(component.filePath).replace('.tsx', '');
        return dispatch<ImplementComponentCommand>('ImplementComponent', {
          projectDir: clientTargetDir,
          iaSchemeDir: './.context',
          designSystemPath: './.context/design-system.md',
          componentType: type,
          filePath: component.filePath,
          componentName,
          aiOptions: { maxTokens: 3000 },
        });
      });
      return dispatch.parallel(commands);
    }

    function tryAdvanceToNextPhase() {
      for (let i = 0; i < componentPhaseOrder.length - 1; i++) {
        const currentPhase = componentPhaseOrder[i];
        const nextPhase = componentPhaseOrder[i + 1];
        const allProcessed = areAllProcessed(currentPhase);
        const alreadyDispatched = dispatchedPhases.has(nextPhase);
        if (allProcessed && !alreadyDispatched) {
          dispatchedPhases.add(nextPhase);
          return dispatchComponentsOfType(nextPhase);
        }
      }
      return [];
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Phase 1: Schema Export → Server Generation
    // ─────────────────────────────────────────────────────────────────────────

    on<ExportSchemaEvents>('SchemaExported', () =>
      dispatch<GenerateServerCommand>('GenerateServer', {
        modelPath: './.context/schema.json',
        destination: '.',
      }),
    );

    on<SliceGeneratedEvent>('SliceGenerated', (e) =>
      dispatch<ImplementSliceCommand>('ImplementSlice', {
        slicePath: e.data.slicePath,
        context: {
          previousOutputs: 'errors',
          attemptNumber: 0,
        },
        aiOptions: { maxTokens: 2000 },
      }),
    );

    on<ImplementSliceEvents>('SliceImplemented', (e) =>
      dispatch<CheckTestsCommand>('CheckTests', {
        targetDirectory: e.data.slicePath,
        scope: 'slice',
      }),
    );

    on<ImplementSliceEvents>('SliceImplemented', (e) =>
      dispatch<CheckTypesCommand>('CheckTypes', {
        targetDirectory: e.data.slicePath,
        scope: 'slice',
      }),
    );

    on<ImplementSliceEvents>('SliceImplemented', (e) =>
      dispatch<CheckLintCommand>('CheckLint', {
        targetDirectory: e.data.slicePath,
        scope: 'slice',
        fix: true,
      }),
    );

    // ─────────────────────────────────────────────────────────────────────────
    // Retry Logic: Wait for all checks, retry on failure
    // ─────────────────────────────────────────────────────────────────────────

    on.settled<CheckTestsCommand, CheckTypesCommand, CheckLintCommand>(
      ['CheckTests', 'CheckTypes', 'CheckLint'],
      dispatch<ImplementSliceCommand>(['ImplementSlice'], (events, send) => {
        const failures = findCheckFailures(events);
        const slicePath = getSlicePath(failures, events);

        if (!hasAnyFailures(failures)) {
          sliceRetryState.delete(slicePath);
          return { persist: false };
        }

        const currentAttempt = sliceRetryState.get(slicePath) ?? 0;

        if (currentAttempt >= MAX_RETRIES) {
          sliceRetryState.delete(slicePath);
          return { persist: false };
        }

        sliceRetryState.set(slicePath, currentAttempt + 1);

        send({
          type: 'ImplementSlice',
          data: {
            slicePath,
            context: {
              previousOutputs: collectErrorMessages(failures),
              attemptNumber: currentAttempt + 1,
            },
            aiOptions: { maxTokens: 2000 },
          },
        });

        return { persist: true };
      }),
    );

    // ─────────────────────────────────────────────────────────────────────────
    // Phase 2: Server Generated → IA Generation + Dev Server
    // ─────────────────────────────────────────────────────────────────────────

    on<GenerateServerEvents>('ServerGenerated', () => [
      dispatch<GenerateIACommand>('GenerateIA', {
        modelPath: './.context/schema.json',
        outputDir: './.context',
      }),
      dispatch<StartServerCommand>('StartServer', {
        serverDirectory: './server',
      }),
    ]);

    // ─────────────────────────────────────────────────────────────────────────
    // Phase 3: IA Generated → Client Generation
    // ─────────────────────────────────────────────────────────────────────────

    on<GenerateIAEvents>('IAGenerated', () =>
      dispatch<GenerateClientCommand>('GenerateClient', {
        targetDir: './client',
        iaSchemaPath: './.context/auto-ia-scheme.json',
        gqlSchemaPath: './.context/schema.graphql',
        figmaVariablesPath: './.context/figma-file.json',
      }),
    );

    // ─────────────────────────────────────────────────────────────────────────
    // Phase 4: Client Generated → Phased Component Implementation
    // ─────────────────────────────────────────────────────────────────────────

    on<GenerateClientEvents>('ClientGenerated', (e) => {
      if (e.type !== 'ClientGenerated') return;

      if (e.data === null || e.data === undefined || !Array.isArray(e.data.components)) {
        return [
          dispatch<ImplementComponentCommand>('ImplementComponent', {
            projectDir: './client',
            iaSchemeDir: './.context',
            designSystemPath: './.context/design-system.md',
            componentType: 'molecule',
            filePath: 'client/src/components/molecules/Example.tsx',
            componentName: 'Example.tsx',
            aiOptions: { maxTokens: 3000 },
          }),
          dispatch<StartClientCommand>('StartClient', {
            clientDirectory: './client',
          }),
        ];
      }

      debug('ClientGenerated event received');
      debug('Total components: %d', e.data.components.length);
      debug(
        'Component types: %o',
        e.data.components.map((c) => c.type),
      );

      clientComponents = e.data.components;
      clientTargetDir = e.data.targetDir;
      processedComponents.clear();
      dispatchedPhases.clear();
      failedComponents.clear();

      const molecules = clientComponents.filter((c) => c.type === 'molecule');
      debug('Found %d molecules', molecules.length);
      debug(
        'Molecule paths: %o',
        molecules.map((m) => m.filePath),
      );

      dispatchedPhases.add('molecule');

      const componentCommands = molecules.map((component) => {
        const componentName = path.basename(component.filePath).replace('.tsx', '');
        return dispatch<ImplementComponentCommand>('ImplementComponent', {
          projectDir: clientTargetDir,
          iaSchemeDir: './.context',
          designSystemPath: './.context/design-system.md',
          componentType: 'molecule',
          filePath: component.filePath,
          componentName,
          aiOptions: { maxTokens: 3000 },
        });
      });

      const startClientCommand = dispatch<StartClientCommand>('StartClient', {
        clientDirectory: './client',
      });

      return dispatch.parallel([...componentCommands, startClientCommand]);
    });

    const handleComponentProcessed = (e: ComponentImplementedEvent | ComponentImplementationFailedEvent) => {
      if (e.data === null || e.data === undefined || e.data.filePath === null || e.data.filePath === undefined) {
        return [];
      }

      if (e.type === 'ComponentImplemented') {
        processedComponents.add(e.data.filePath);
      } else {
        failedComponents.add(e.data.filePath);
      }

      return tryAdvanceToNextPhase();
    };

    on<ComponentImplementedEvent>('ComponentImplemented', handleComponentProcessed);
    on<ComponentImplementationFailedEvent>('ComponentImplementationFailed', handleComponentProcessed);

    // ─────────────────────────────────────────────────────────────────────────
    // Phase 5: Client Checks → Retry on Errors
    // ─────────────────────────────────────────────────────────────────────────

    on<CheckClientEvents>('ClientChecked', (e) => {
      if (e.type === 'ClientChecked') {
        const hasErrors = e.data.tsErrors > 0 || e.data.buildErrors > 0 || e.data.consoleErrors > 0;

        if (hasErrors) {
          const failures = [
            ...(e.data.tsErrorDetails || []),
            ...(e.data.buildErrorDetails || []),
            ...(e.data.consoleErrorDetails || []),
          ];
          return dispatch<ImplementClientCommand>('ImplementClient', {
            projectDir: './client',
            iaSchemeDir: './.context',
            designSystemPath: './.context/design-system.md',
            failures,
          });
        }
      }
    });
  },
});

function findCheckFailures(events: EventsType): CheckFailures {
  const checkTests = events.CheckTests as Array<
    TestsCheckFailedEvent | { type: string; data: { targetDirectory: string } }
  >;
  const checkTypes = events.CheckTypes as Array<
    TypeCheckFailedEvent | { type: string; data: { targetDirectory: string } }
  >;
  const checkLint = events.CheckLint as Array<
    LintCheckFailedEvent | { type: string; data: { targetDirectory: string } }
  >;

  return {
    testsCheckFailed: checkTests.find((e): e is TestsCheckFailedEvent => e.type === 'TestsCheckFailed'),
    typeCheckFailed: checkTypes.find((e): e is TypeCheckFailedEvent => e.type === 'TypeCheckFailed'),
    lintCheckFailed: checkLint.find((e): e is LintCheckFailedEvent => e.type === 'LintCheckFailed'),
  };
}

function hasAnyFailures(failures: CheckFailures): boolean {
  return (
    failures.testsCheckFailed !== undefined ||
    failures.typeCheckFailed !== undefined ||
    failures.lintCheckFailed !== undefined
  );
}

function getSlicePath(failures: CheckFailures, events: EventsType): string {
  return (
    failures.testsCheckFailed?.data.targetDirectory ??
    failures.typeCheckFailed?.data.targetDirectory ??
    failures.lintCheckFailed?.data.targetDirectory ??
    (events.CheckTests[0]?.data.targetDirectory as string) ??
    ''
  );
}

function collectErrorMessages(failures: CheckFailures): string {
  const errorMessages: string[] = [];
  if (failures.testsCheckFailed !== undefined) {
    errorMessages.push(failures.testsCheckFailed.data.errors);
  }
  if (failures.typeCheckFailed !== undefined) {
    errorMessages.push(failures.typeCheckFailed.data.errors);
  }
  if (failures.lintCheckFailed !== undefined) {
    errorMessages.push(failures.lintCheckFailed.data.errors);
  }
  return errorMessages.join('\n');
}
```
