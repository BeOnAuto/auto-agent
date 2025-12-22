import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync, existsSync } from 'fs';
import { config } from 'dotenv';
import { PipelineServer } from '../server/pipeline-server';
import { loadPipelineConfig } from '../config/pipeline-config';
import kanbanTodoConfig from './fixtures/kanban-todo.config';
import { resetKanbanState } from './fixtures/kanban-full.pipeline';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PIPELINE_ROOT = path.resolve(__dirname, '../..');
const PACKAGES_DIR = path.resolve(__dirname, '../../..');
const EXAMPLE_DIR = path.resolve(PACKAGES_DIR, '../examples/kanban-todo');
const CLI_SNAPSHOTS_DIR = path.join(PACKAGES_DIR, 'cli/src/__tests__/e2e/__snapshots__/kanban-todo');

config({ path: path.join(PIPELINE_ROOT, '.env') });

interface StoredMessage {
  message: {
    type: string;
    data: Record<string, unknown>;
  };
  position: string;
  revision: string;
  messageType: string;
}

interface CliEventSnapshot {
  type: string;
  data: Record<string, unknown>;
  position: string;
}

function loadCliEventStream(): CliEventSnapshot[] | null {
  const snapshotPath = path.join(CLI_SNAPSHOTS_DIR, 'event-stream.snapshot.json');
  if (!existsSync(snapshotPath)) {
    console.log(`Event stream snapshot not found: ${snapshotPath}`);
    return null;
  }
  const content = readFileSync(snapshotPath, 'utf-8');
  return JSON.parse(content) as CliEventSnapshot[];
}

async function waitForPipelineCompletion(
  server: PipelineServer,
  timeoutMs: number,
  pollIntervalMs: number,
): Promise<StoredMessage[]> {
  const startTime = Date.now();
  let lastMessageCount = 0;
  let stableCount = 0;
  const stableThreshold = 15;

  while (Date.now() - startTime < timeoutMs) {
    const response = await fetch(`http://localhost:${server.port}/messages`);
    const messages = (await response.json()) as StoredMessage[];

    if (messages.length === lastMessageCount) {
      stableCount++;
      if (stableCount >= stableThreshold) {
        console.log(`  Pipeline stable after ${stableThreshold} polls`);
        return messages;
      }
    } else {
      if (stableCount > 0) {
        console.log(`  New activity after ${stableCount} stable polls`);
      }
      stableCount = 0;
      lastMessageCount = messages.length;
      console.log(`  Messages: ${messages.length}`);
    }

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  console.log(`  Timeout reached after ${timeoutMs}ms`);
  const response = await fetch(`http://localhost:${server.port}/messages`);
  return (await response.json()) as StoredMessage[];
}

describe('Real Execution E2E', () => {
  let server: PipelineServer;

  beforeAll(async () => {
    const loaded = await loadPipelineConfig(kanbanTodoConfig);

    console.log('=== Environment Check ===');
    console.log(`ANTHROPIC_API_KEY set: ${process.env.ANTHROPIC_API_KEY !== undefined}`);
    console.log(`Example directory: ${EXAMPLE_DIR}`);
    console.log(`Example exists: ${existsSync(EXAMPLE_DIR)}`);
    console.log(`Handlers loaded: ${loaded.handlers.length}`);
    console.log(`Handler names: ${loaded.handlers.map((h) => h.name).join(', ')}`);

    server = new PipelineServer({ port: 0 });
    server.registerCommandHandlers(loaded.handlers);
    server.registerPipeline(loaded.pipeline);
    await server.start();

    console.log(`Server started on port ${server.port}`);
  }, 60000);

  afterAll(async () => {
    await server.stop();
  });

  beforeEach(() => {
    resetKanbanState();
  });

  describe('Full Pipeline Execution', () => {
    it(
      'should execute ExportSchema and trigger full pipeline chain',
      async () => {
        console.log('\n=== Dispatching ExportSchema ===');
        console.log(`Target directory: ${EXAMPLE_DIR}`);

        const dispatchResponse = await fetch(`http://localhost:${server.port}/command`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'ExportSchema',
            data: {
              directory: EXAMPLE_DIR,
            },
          }),
        });

        const dispatchResult = (await dispatchResponse.json()) as { status: string; commandId: string };
        console.log(`Dispatch response: ${JSON.stringify(dispatchResult)}`);
        expect(dispatchResult.status).toBe('ack');

        console.log('\n=== Waiting for pipeline completion (5 minute timeout) ===');
        const messages = await waitForPipelineCompletion(server, 5 * 60 * 1000, 2000);

        console.log(`\n=== Pipeline Results ===`);
        console.log(`Total messages: ${messages.length}`);

        const events = messages.filter((m) => m.messageType === 'event');
        const commands = messages.filter((m) => m.messageType === 'command');

        console.log(`Events: ${events.length}`);
        console.log(`Commands: ${commands.length}`);

        console.log('\n=== Event Types (in order) ===');
        events.forEach((e, i) => {
          console.log(`  ${i + 1}. ${e.message.type}`);
          if (e.message.type.includes('Failed')) {
            console.log(`      Error: ${JSON.stringify(e.message.data)}`);
          }
        });

        console.log('\n=== Command Types (in order) ===');
        commands.forEach((c, i) => {
          console.log(`  ${i + 1}. ${c.message.type}`);
        });

        const cliEvents = loadCliEventStream();
        if (cliEvents !== null) {
          console.log('\n=== CLI Event Types (for comparison) ===');
          const cliEventTypes = [...new Set(cliEvents.map((e) => e.type))];
          cliEventTypes.forEach((t) => {
            const count = cliEvents.filter((e) => e.type === t).length;
            console.log(`  ${t}: ${count}`);
          });

          console.log('\n=== Pipeline Event Types (for comparison) ===');
          const pipelineEventTypes = [...new Set(events.map((e) => e.message.type))];
          pipelineEventTypes.forEach((t) => {
            const count = events.filter((e) => e.message.type === t).length;
            console.log(`  ${t}: ${count}`);
          });

          console.log('\n=== Event Type Comparison ===');
          const cliTypeSet = new Set(cliEventTypes);
          const pipelineTypeSet = new Set(pipelineEventTypes);

          const missingFromPipeline = cliEventTypes.filter((t) => !pipelineTypeSet.has(t));
          const extraInPipeline = pipelineEventTypes.filter((t) => !cliTypeSet.has(t));

          console.log(`Missing from pipeline: ${missingFromPipeline.join(', ') || 'none'}`);
          console.log(`Extra in pipeline: ${extraInPipeline.join(', ') || 'none'}`);
        }

        expect(events.length).toBeGreaterThan(0);

        const hasSchemaExported = events.some((e) => e.message.type === 'SchemaExported');
        expect(hasSchemaExported).toBe(true);
      },
      10 * 60 * 1000,
    );
  });
});
