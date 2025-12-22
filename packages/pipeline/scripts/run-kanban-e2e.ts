import path from 'path';
import { fileURLToPath } from 'url';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { config } from 'dotenv';
import { PipelineServer } from '../src/server/pipeline-server';
import { loadPipelineConfig } from '../src/config/pipeline-config';
import kanbanTodoConfig from '../src/testing/fixtures/kanban-todo.config';
import { resetKanbanState } from '../src/testing/fixtures/kanban-full.pipeline';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PIPELINE_ROOT = path.resolve(__dirname, '..');
const PACKAGES_DIR = path.resolve(__dirname, '../..');
const EXAMPLE_DIR = path.resolve(PACKAGES_DIR, '../examples/kanban-todo');
const SNAPSHOTS_DIR = path.join(PIPELINE_ROOT, 'snapshots');

config({ path: path.join(PIPELINE_ROOT, '.env') });

interface StoredMessage {
  message: {
    type: string;
    data: Record<string, unknown>;
    requestId?: string;
    correlationId?: string;
  };
  position: string;
  revision: string;
  messageType: string;
  timestamp: string;
  sessionId?: string;
}

function formatTimestamp(): string {
  const now = new Date();
  return now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

interface LogOptions {
  data?: unknown;
  inline?: boolean;
  meta?: { requestId?: string; correlationId?: string };
}

function log(prefix: string, message: string, options: LogOptions = {}): void {
  const timestamp = new Date().toISOString().slice(11, 23);
  const color = prefix === 'EVENT' ? '\x1b[32m' : prefix === 'CMD' ? '\x1b[36m' : '\x1b[33m';
  const reset = '\x1b[0m';
  const gray = '\x1b[38;5;245m';

  const metaParts: string[] = [];
  if (options.meta?.correlationId) {
    metaParts.push(`corr:${options.meta.correlationId.slice(0, 8)}`);
  }
  if (options.meta?.requestId) {
    metaParts.push(`req:${options.meta.requestId.slice(0, 8)}`);
  }
  const metaStr = metaParts.length > 0 ? ` ${gray}[${metaParts.join(' ')}]${reset}` : '';

  if (options.inline && options.data !== undefined) {
    const dataStr = JSON.stringify(options.data);
    console.log(`${color}[${timestamp}] ${prefix}${reset} ${message}\n  ${metaStr} ${gray}${dataStr}${reset}`);
  } else {
    console.log(`${color}[${timestamp}] ${prefix}${reset} ${message}\n  ${metaStr}`);
    if (options.data !== undefined) {
      console.log(`  ${gray}${JSON.stringify(options.data, null, 2).split('\n').join('\n  ')}${reset}`);
    }
  }
}

async function pollAndStreamMessages(
  server: PipelineServer,
  seenPositions: Set<string>,
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

    for (const msg of messages) {
      if (!seenPositions.has(msg.position)) {
        seenPositions.add(msg.position);
        const prefix = msg.messageType === 'event' ? 'EVENT' : 'CMD';
        const isFailed = msg.message.type.includes('Failed');
        log(prefix, msg.message.type, {
          data: msg.message.data,
          inline: !isFailed,
          meta: {
            requestId: msg.message.requestId,
            correlationId: msg.message.correlationId,
          },
        });
      }
    }

    if (messages.length === lastMessageCount) {
      stableCount++;
      if (stableCount >= stableThreshold) {
        log('INFO', `Pipeline stable after ${stableThreshold} polls (${messages.length} messages)`);
        return messages;
      }
    } else {
      stableCount = 0;
      lastMessageCount = messages.length;
    }

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  log('INFO', `Timeout reached after ${timeoutMs}ms`);
  const response = await fetch(`http://localhost:${server.port}/messages`);
  return (await response.json()) as StoredMessage[];
}

async function main(): Promise<void> {
  console.log('\n\x1b[1m=== Kanban E2E Pipeline Runner ===\x1b[0m\n');

  if (process.env.ANTHROPIC_API_KEY === undefined) {
    console.error('\x1b[31mError: ANTHROPIC_API_KEY not set. Run: source .env\x1b[0m');
    process.exit(1);
  }

  log('INFO', 'Loading pipeline configuration...');
  const loaded = await loadPipelineConfig(kanbanTodoConfig);
  log('INFO', `Loaded ${loaded.handlers.length} handlers`);

  resetKanbanState();

  const server = new PipelineServer({ port: 0 });
  server.registerCommandHandlers(loaded.handlers);
  server.registerPipeline(loaded.pipeline);
  await server.start();

  log('INFO', `Server started on port ${server.port}`);
  log('INFO', `Target directory: ${EXAMPLE_DIR}`);

  console.log('\n\x1b[1m--- Pipeline Execution ---\x1b[0m\n');

  const dispatchResponse = await fetch(`http://localhost:${server.port}/command`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'ExportSchema',
      data: { directory: EXAMPLE_DIR },
    }),
  });

  const dispatchResult = (await dispatchResponse.json()) as { status: string; commandId: string };
  if (dispatchResult.status !== 'ack') {
    console.error('\x1b[31mFailed to dispatch ExportSchema\x1b[0m');
    await server.stop();
    process.exit(1);
  }

  const seenPositions = new Set<string>();
  const messages = await pollAndStreamMessages(server, seenPositions, 10 * 60 * 1000, 1000);

  await server.stop();

  console.log('\n\x1b[1m--- Summary ---\x1b[0m\n');

  const events = messages.filter((m) => m.messageType === 'event');
  const commands = messages.filter((m) => m.messageType === 'command');

  console.log(`Total messages: ${messages.length}`);
  console.log(`  Events: ${events.length}`);
  console.log(`  Commands: ${commands.length}`);

  const eventCounts = new Map<string, number>();
  for (const e of events) {
    eventCounts.set(e.message.type, (eventCounts.get(e.message.type) ?? 0) + 1);
  }

  console.log('\nEvent breakdown:');
  for (const [type, count] of [...eventCounts.entries()].sort((a, b) => b[1] - a[1])) {
    const isFailed = type.includes('Failed');
    const color = isFailed ? '\x1b[31m' : '\x1b[32m';
    console.log(`  ${color}${type}\x1b[0m: ${count}`);
  }

  if (!existsSync(SNAPSHOTS_DIR)) {
    mkdirSync(SNAPSHOTS_DIR, { recursive: true });
  }

  const timestamp = formatTimestamp();
  const snapshotPath = path.join(SNAPSHOTS_DIR, `e2e-run-${timestamp}.json`);

  const snapshot = {
    timestamp: new Date().toISOString(),
    config: {
      exampleDir: EXAMPLE_DIR,
      handlersLoaded: loaded.handlers.length,
    },
    summary: {
      totalMessages: messages.length,
      events: events.length,
      commands: commands.length,
      eventCounts: Object.fromEntries(eventCounts),
    },
    messages: messages.map((m) => ({
      type: m.message.type,
      data: m.message.data,
      messageType: m.messageType,
      position: m.position,
    })),
  };

  writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2));
  console.log(`\nSnapshot saved to: \x1b[36m${snapshotPath}\x1b[0m\n`);
}

main().catch((err) => {
  console.error('\x1b[31mFatal error:\x1b[0m', err);
  process.exit(1);
});
