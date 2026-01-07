# Kanban Todo Example

Full-stack Kanban todo application demonstrating narrative-driven code generation with event sourcing.

---

## What You'll Learn

By working through this example, you will:

1. Define domain behavior using narrative files with commands, queries, and business rules
2. Generate an event-sourced GraphQL server with Apollo and Emmett
3. Generate a React frontend with GraphQL codegen and atomic design components
4. Orchestrate multi-stage pipelines with retry logic and validation

---

## Prerequisites

- Node.js 18+
- pnpm
- At least one AI provider API key (Anthropic, OpenAI, Gemini, or X.AI)

---

## Quick Start

```bash
# Step 1: Navigate to example
cd examples/kanban-todo

# Step 2: Install dependencies
pnpm install

# Step 3: Run the generation pipeline
pnpm auto

# Step 4: Start the application
pnpm start
```

After running, open http://localhost:5173 for the React app and http://localhost:4000/graphql for the GraphQL playground.

---

## Project Structure

```
kanban-todo/
├── auto.config.ts              # Pipeline configuration
├── package.json                # Dependencies and scripts
├── narratives/                 # Domain definitions
│   ├── todo-list.narrative.ts  # Commands, queries, rules
│   ├── homepage.narrative.ts   # UI experiences
│   └── structure.narrative.ts  # Layout specifications
├── .context/                   # Generated schemas (after pipeline)
│   ├── schema.json             # Parsed narrative schema
│   ├── schema.graphql          # GraphQL schema
│   └── auto-ia-scheme.json     # Information architecture
├── server/                     # Generated server (after pipeline)
└── client/                     # Generated client (after pipeline)
```

---

## Step-by-Step Walkthrough

### Step 1: Understanding the Narratives

The `narratives/` directory contains three files that define the application:

**todo-list.narrative.ts** - Core domain logic:
- `AddTodo` command → emits `TodoAdded` event
- `MarkTodoInProgress` command → emits `TodoMarkedInProgress` event
- `MarkTodoComplete` command → emits `TodoMarkedComplete` event
- `AllTodos` query → reads from `Todos` projection
- `TodoListSummary` query → reads from `TodoSummary` projection

**homepage.narrative.ts** - UI experiences:
- Kanban board with three columns (To Do, In Progress, Done)
- Task cards with status indicators and timestamps
- Theme toggle, celebration animations, statistics dashboard

**structure.narrative.ts** - Layout specifications:
- Navigation bar, main content area, responsive breakpoints

### Step 2: Running the Pipeline

```bash
pnpm auto
```

The pipeline executes these stages:

1. **SchemaExported** - Parses narratives into `.context/schema.json`
2. **GenerateServer** - Scaffolds Apollo/Emmett server structure
3. **SliceGenerated** - For each slice, AI implements command handlers
4. **ServerChecked** - Validates types, tests, and linting
5. **GenerateIA** - Creates information architecture for frontend
6. **GenerateClient** - Scaffolds React application
7. **ComponentGenerated** - AI implements each component

### Step 3: Exploring Generated Code

**Server** (`server/src/`):
```
domain/flows/todo-list/
├── adds-a-new-todo/
│   ├── commands.ts      # AddTodo command type
│   ├── events.ts        # TodoAdded event type
│   ├── state.ts         # TodoState type
│   ├── decide.ts        # Command handler logic
│   ├── evolve.ts        # State evolution from events
│   └── mutation.resolver.ts
├── marks-todo-as-complete/
├── moves-todo-to-in-progress/
├── views-all-todos/
│   ├── projection.ts    # Todos read model
│   └── query.resolver.ts
└── views-completion-summary/
```

**Client** (`client/src/`):
```
components/
├── molecules/           # TaskCard, ColumnHeader, ThemeToggle
├── organisms/           # KanbanBoard, StatisticsDashboard
└── pages/               # TodoDashboardPage
graphql/
├── queries.ts           # AllTodos, TodoListSummary
└── mutations.ts         # AddTodo, MarkTodoInProgress, MarkTodoComplete
```

### Step 4: Running the Application

```bash
# Start both server and client
pnpm start

# Or run individually:
cd server && pnpm start    # GraphQL server on port 4000
cd client && pnpm dev      # React app on port 5173
```

---

## Key Concepts Demonstrated

### Event Sourcing Pattern

Commands produce events, events evolve state:

```typescript
// decide.ts - Command handler
export const decide = (command: AddTodo, state: TodoState[]) => {
  return { type: 'TodoAdded', data: { todoId: command.data.todoId, ... } };
};

// evolve.ts - State evolution
export const evolve = (state: TodoState[], event: TodoAdded) => {
  return [...state, { todoId: event.data.todoId, status: 'pending', ... }];
};
```

### Narrative-Driven Development

Business rules become test specifications:

```typescript
// In narrative file
rule('todos can be added to the list', () => {
  example('user adds a todo')
    .when<AddTodo>({ description: 'Buy milk' })
    .then<TodoAdded>({ todoId: 'todo-1', description: 'Buy milk' });
});

// Generated test
it('todos can be added to the list', () => {
  const result = decide({ type: 'AddTodo', data: { description: 'Buy milk' } }, []);
  expect(result.type).toBe('TodoAdded');
});
```

### Pipeline Orchestration

The `auto.config.ts` defines event-driven workflows:

```typescript
define('kanban-todo')
  .on('SchemaExported')
  .emit('GenerateServer', (e) => ({ schemaPath: e.data.outputPath }))

  .on('SliceGenerated')
  .emit('ImplementSlice', (e) => ({ slicePath: e.data.path }))

  .on('SliceImplementationFailed')
  .when((e) => e.data.attempt < 4)
  .emit('ImplementSlice', (e) => ({ ...e.data, errors: e.data.errors }))
```

---

## Commands Reference

| Command | Description |
|---------|-------------|
| `pnpm auto` | Run full generation pipeline |
| `pnpm auto:debug` | Run pipeline with debug output |
| `pnpm start` | Start server and client |
| `pnpm clean` | Reset generated files |

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| Server | Apollo Server, TypeGraphQL, Emmett, SQLite |
| Client | React 18, Apollo Client, Vite, Tailwind CSS |
| DnD | @hello-pangea/dnd |
| Components | Radix UI, shadcn/ui patterns |
| Animations | Framer Motion |

---

## Troubleshooting

### Pipeline fails at SliceImplementation

**Cause**: AI provider rate limiting or network issues

**Solution**: Re-run the pipeline; it resumes from failed slices:
```bash
pnpm auto
```

### TypeScript errors after generation

**Cause**: Incomplete generation or missing dependencies

**Solution**:
```bash
cd server && pnpm install && pnpm build
cd ../client && pnpm install && pnpm build
```

### GraphQL schema mismatch

**Cause**: Client codegen out of sync with server

**Solution**:
```bash
cd client && pnpm codegen
```

---

## Next Steps

After completing this example:

1. Modify `narratives/todo-list.narrative.ts` to add new commands (e.g., `DeleteTodo`)
2. Run `pnpm auto` to regenerate with your changes
3. Explore the pipeline configuration in `auto.config.ts`
4. Try the [questionnaires example](../questionnaires/) for a more complex domain
