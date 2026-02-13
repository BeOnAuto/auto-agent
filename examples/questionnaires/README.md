# Questionnaires Example

Full-stack questionnaire application demonstrating end-to-end code generation with complex domain logic and multi-step workflows.

---

## What You'll Learn

By working through this example, you will:

1. Model complex domain logic with commands, queries, events, and state projections
2. Define rich UI experiences with dashboard analytics and form workflows
3. Configure multi-stage pipelines with automatic retry on validation failures
4. Integrate AI-powered implementation with design system constraints

---

## Prerequisites

- Node.js 20.0.0 or higher
- pnpm 8.15.4 or higher
- At least one AI provider API key (Anthropic, OpenAI, Gemini, or X.AI)

---

## Quick Start

```bash
# Step 1: Navigate to example
cd examples/questionnaires

# Step 2: Copy environment template
cp .env.example .env

# Step 3: Add your API key to .env
# ANTHROPIC_API_KEY=your-key

# Step 4: Install dependencies
pnpm install

# Step 5: Run the generation pipeline
pnpm auto export:schema
```

After the pipeline completes, start the application:
```bash
cd server && pnpm start    # Port 4000
cd client && pnpm dev      # Port 5173
```

---

## Project Structure

```
questionnaires/
├── auto.config.ts              # Pipeline configuration
├── .env.example                # Environment template
├── narratives/
│   ├── questionnaires.narrative.ts   # Core domain
│   ├── homepage.narrative.ts         # Dashboard experiences
│   └── structure.narrative.ts        # App shell layout
├── .context/
│   ├── design-system.md        # Available UI components
│   ├── figma-file.json         # Design tokens
│   └── shadcn-filter.ts        # Component filtering
├── server/                     # Generated (after pipeline)
└── client/                     # Generated (after pipeline)
```

---

## Step-by-Step Walkthrough

### Step 1: Understanding the Domain

The `questionnaires.narrative.ts` defines a survey completion workflow:

**Commands (mutations):**
| Command | Event | Description |
|---------|-------|-------------|
| `SendQuestionnaireLink` | `QuestionnaireLinkSent` | Send survey to participant |
| `SubmitAnswer` | `QuestionAnswered` | Record an answer |
| `SubmitQuestionnaire` | `QuestionnaireSubmitted` | Finalize submission |

**Queries:**
| Query | Projection | Description |
|-------|------------|-------------|
| `ViewQuestionnaire` | `QuestionnaireProgress` | Current progress and answers |
| `QuestionnaireReadyForSubmission` | `QuestionnaireConfig` | Check completion status |

**Business Rules:**
- Participants receive a unique link to their questionnaire
- Answers can only be submitted before final submission
- Attempted edits after submission emit `QuestionnaireEditRejected`

### Step 2: Understanding the UI Experiences

The `homepage.narrative.ts` defines dashboard analytics:

- **Home Screen**: Active surveys, recent responses, completion rates
- **Response Analytics**: Charts, filtering, real-time updates
- **Survey Completion Tracker**: Progress visualization, target setting
- **Response History**: Filtering, export, detailed views

### Step 3: Running the Pipeline

```bash
pnpm auto export:schema
```

The pipeline executes:

```
SchemaExported
    └─► GenerateServer
            └─► SliceGenerated (per slice)
                    └─► ImplementSlice
                            └─► CheckTests + CheckTypes + CheckLint
                                    └─► ImplementSlice (retry on failures)
    └─► GenerateIA
            └─► GenerateClient
                    └─► ImplementClient
                            └─► CheckClient
                                    └─► ImplementClient (retry)
```

### Step 4: Running Individual Commands

```bash
# Export schema from narratives
pnpm auto export:schema

# Generate server from schema
pnpm auto generate:server --schema-path=./.context/schema.json --destination=.

# Generate IA schema
pnpm auto generate:ia --output-dir=./.context --flow-files=./narratives/questionnaires.narrative.ts

# Generate React client
pnpm auto generate:client \
  --starter-dir=../../packages/frontend-generator-react-graphql/shadcn-starter \
  --target-dir=./client \
  --ia-schema-path=./.context/auto-ia-scheme.json \
  --gql-schema-path=./.context/schema.graphql \
  --figma-variables-path=./.context/figma-file.json
```

---

## Key Concepts Demonstrated

### State Projections

Events are projected into read models:

```typescript
// QuestionnaireProgress projection
interface QuestionnaireProgress {
  questionnaireId: string;
  status: 'pending' | 'in_progress' | 'submitted';
  currentQuestion: number;
  remainingQuestions: number;
  answers: Answer[];
}
```

### Retry Logic with Error Context

Failed implementations are retried with accumulated errors:

```typescript
.on('SliceImplementationFailed')
.when((e) => e.data.attempt < 4)
.emit('ImplementSlice', (e) => ({
  slicePath: e.data.slicePath,
  errors: e.data.errors,  // Passed to AI for context
  attempt: e.data.attempt + 1,
}))
```

### Design System Integration

The `.context/design-system.md` constrains AI implementation:

```markdown
## Available Components

- accordion - Component
- alert - Component
- alert-dialog - Component
- button - Component
...
```

---

## Commands Reference

| Command | Description |
|---------|-------------|
| `pnpm auto export:schema` | Run full pipeline |
| `pnpm auto:debug export:schema` | Run with debug output |
| `pnpm auto generate:server` | Generate server only |
| `pnpm auto generate:ia` | Generate IA schema |
| `pnpm auto generate:client` | Generate client only |

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Anthropic Claude API key |
| `OPENAI_API_KEY` | OpenAI API key |
| `GEMINI_API_KEY` | Google Gemini API key |
| `XAI_API_KEY` | X.AI Grok API key |
| `DEFAULT_AI_PROVIDER` | Default provider |
| `DEFAULT_AI_MODEL` | Default model name |
| `DEBUG` | Enable debug logging (`auto:*`) |

---

## Plugins Used

| Plugin | Purpose |
|--------|---------|
| `@auto-engineer/narrative` | Narrative DSL and schema export |
| `@auto-engineer/server-generator-apollo-emmett` | Server scaffolding |
| `@auto-engineer/server-implementer` | AI server implementation |
| `@auto-engineer/server-checks` | Server validation |
| `@auto-engineer/information-architect` | IA schema generation |
| `@auto-engineer/generate-react-client` | React client scaffolding |

---

## Troubleshooting

### Missing API key error

**Solution**: Ensure `.env` contains a valid API key:
```bash
cp .env.example .env
# Edit .env and add your key
```

### Pipeline hangs at ImplementSlice

**Cause**: Large model responses or rate limiting

**Solution**: Enable debug logging:
```bash
DEBUG=auto:* pnpm auto export:schema
```

### Client codegen fails

**Cause**: Schema mismatch between server and client

**Solution**: Regenerate the GraphQL schema:
```bash
pnpm auto generate:server --schema-path=./.context/schema.json --destination=.
cd client && pnpm codegen
```

---

## Next Steps

After completing this example:

1. Add new commands to `questionnaires.narrative.ts` (e.g., `SkipQuestion`)
2. Extend the dashboard in `homepage.narrative.ts`
3. Compare with the simpler [kanban-todo example](../kanban-todo/)
4. Explore the pipeline configuration patterns in `auto.config.ts`
