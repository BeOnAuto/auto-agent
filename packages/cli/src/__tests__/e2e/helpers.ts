import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import type {
  PipelineResponse,
  PipelineSnapshot,
  PositionalMessage,
  RegistryResponse,
  SessionInfo,
  StatsResponse,
  CommandAck,
  GoldenMaster,
  SanitizedEvent,
} from './types';

export interface ServerContext {
  process: ChildProcess;
  baseUrl: string;
  port: number;
}

export async function startServer(exampleDir: string, timeoutMs = 30000): Promise<ServerContext> {
  const serverProcess = spawn('pnpm', ['auto:debug'], {
    cwd: exampleDir,
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, NODE_ENV: 'test' },
  });

  return new Promise<ServerContext>((resolve, reject) => {
    const timeout = setTimeout(() => {
      serverProcess.kill('SIGTERM');
      reject(new Error(`Server failed to start within ${timeoutMs}ms`));
    }, timeoutMs);

    let outputBuffer = '';

    const handleOutput = (data: Buffer): void => {
      const output = data.toString();
      outputBuffer += output;

      const portMatch = outputBuffer.match(/Message bus server started on port (\d+)/);
      if (portMatch !== null) {
        const port = parseInt(portMatch[1], 10);
        const baseUrl = `http://localhost:${port}`;

        const checkServer = (): void => {
          void fetch(`${baseUrl}/registry`)
            .then(() => {
              clearTimeout(timeout);
              resolve({ process: serverProcess, baseUrl, port });
            })
            .catch(() => {
              setTimeout(checkServer, 500);
            });
        };
        checkServer();
      }
    };

    serverProcess.stdout?.on('data', handleOutput);
    serverProcess.stderr?.on('data', handleOutput);

    serverProcess.on('error', (error: Error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}

export async function stopServer(context: ServerContext): Promise<void> {
  if (
    context.process !== null &&
    typeof context.process.pid === 'number' &&
    context.process.pid > 0 &&
    !context.process.killed
  ) {
    context.process.kill('SIGTERM');

    await new Promise<void>((resolve) => {
      const cleanup = (): void => resolve();
      context.process.on('exit', cleanup);
      setTimeout(() => {
        context.process.kill('SIGKILL');
        cleanup();
      }, 5000);
    });
  }
}

export async function fetchRegistry(baseUrl: string): Promise<RegistryResponse> {
  const response = await fetch(`${baseUrl}/registry`);
  return response.json() as Promise<RegistryResponse>;
}

export async function fetchPipeline(baseUrl: string): Promise<PipelineResponse> {
  const response = await fetch(`${baseUrl}/pipeline`);
  return response.json() as Promise<PipelineResponse>;
}

export async function fetchSessions(baseUrl: string): Promise<SessionInfo[]> {
  const response = await fetch(`${baseUrl}/sessions`);
  return response.json() as Promise<SessionInfo[]>;
}

export async function fetchMessages(baseUrl: string, count = 500): Promise<PositionalMessage[]> {
  const response = await fetch(`${baseUrl}/messages?count=${count}`);
  return response.json() as Promise<PositionalMessage[]>;
}

export async function fetchStats(baseUrl: string): Promise<StatsResponse> {
  const response = await fetch(`${baseUrl}/stats`);
  return response.json() as Promise<StatsResponse>;
}

export async function dispatchCommand(
  baseUrl: string,
  commandType: string,
  data: Record<string, unknown> = {},
): Promise<CommandAck> {
  const response = await fetch(`${baseUrl}/command`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: commandType, data }),
  });
  return response.json() as Promise<CommandAck>;
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function waitForPipelineCompletion(
  baseUrl: string,
  timeoutMs: number,
  criticalNodes: string[] = ['ExportSchema', 'GenerateServer'],
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    const pipeline = await fetchPipeline(baseUrl);

    const completed = criticalNodes.every((name) => {
      const node = pipeline.nodes.find((n) => n.id === name || n.name === name);
      return node !== undefined && (node.status === 'pass' || node.status === 'fail');
    });

    if (completed) return;

    await delay(500);
  }

  throw new Error(`Pipeline did not complete within ${timeoutMs}ms`);
}

export async function recordStatusProgression(
  baseUrl: string,
  timeoutMs: number,
  pollIntervalMs = 500,
): Promise<PipelineSnapshot[]> {
  const statusHistory: PipelineSnapshot[] = [];
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    const pipeline = await fetchPipeline(baseUrl);
    statusHistory.push({
      timestamp: Date.now(),
      nodes: pipeline.nodes.map((n) => ({ id: n.id, status: n.status })),
    });

    const allCompleted = pipeline.nodes.every((n) => n.status === 'pass' || n.status === 'fail' || n.status === 'None');

    if (allCompleted && pipeline.nodes.some((n) => n.status === 'pass' || n.status === 'fail')) {
      break;
    }

    await delay(pollIntervalMs);
  }

  return statusHistory;
}

export function sanitizeEventData(data: Record<string, unknown>): Record<string, unknown> {
  const sanitized = { ...data };
  delete sanitized.timestamp;
  delete sanitized.requestId;
  delete sanitized.correlationId;
  delete sanitized._frameworkChildCorrelationId;
  return sanitized;
}

export function extractEventSequence(messages: PositionalMessage[]): SanitizedEvent[] {
  return messages
    .filter((m) => m.messageType === 'event')
    .map((e) => ({
      type: e.message.type,
      data: sanitizeEventData(e.message.data),
      position: e.position,
    }));
}

export async function writeSnapshot(snapshotDir: string, filename: string, data: unknown): Promise<void> {
  await fs.mkdir(snapshotDir, { recursive: true });
  const filePath = path.join(snapshotDir, filename);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

export async function readSnapshot<T>(snapshotDir: string, filename: string): Promise<T | null> {
  const filePath = path.join(snapshotDir, filename);
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

export async function createGoldenMaster(baseUrl: string, timeoutMs: number): Promise<GoldenMaster> {
  const registrySnapshot = await fetchRegistry(baseUrl);
  const pipelineSnapshot = await fetchPipeline(baseUrl);
  const sessionsSnapshot = await fetchSessions(baseUrl);

  await dispatchCommand(baseUrl, 'ExportSchema', {});

  const statusProgression = await recordStatusProgression(baseUrl, timeoutMs);

  const finalMessages = await fetchMessages(baseUrl, 500);
  const finalPipeline = await fetchPipeline(baseUrl);
  const finalStats = await fetchStats(baseUrl);

  return {
    baseline: {
      registry: registrySnapshot,
      pipeline: pipelineSnapshot,
      sessions: sessionsSnapshot,
    },
    execution: {
      statusProgression,
      events: finalMessages.filter((m) => m.messageType === 'event'),
      commands: finalMessages.filter((m) => m.messageType === 'command'),
    },
    final: {
      pipeline: finalPipeline,
      stats: finalStats,
    },
  };
}

export function groupEventsByCorrelationId(events: PositionalMessage[]): Map<string, PositionalMessage[]> {
  const groups = new Map<string, PositionalMessage[]>();

  for (const event of events) {
    const correlationId = event.message.correlationId ?? 'uncorrelated';
    const group = groups.get(correlationId) ?? [];
    group.push(event);
    groups.set(correlationId, group);
  }

  return groups;
}

export function extractEventTypes(events: PositionalMessage[]): string[] {
  return events.map((e) => e.message.type);
}

export function compareEventSets(expected: string[], actual: string[]): { missing: string[]; extra: string[] } {
  const expectedSet = new Set(expected);
  const actualSet = new Set(actual);

  const missing = expected.filter((e) => !actualSet.has(e));
  const extra = actual.filter((e) => !expectedSet.has(e));

  return { missing, extra };
}

export function validateSequentialDependencies(events: PositionalMessage[], dependencies: [string, string][]): boolean {
  const positions = new Map<string, number>();

  events.forEach((e, index) => {
    if (!positions.has(e.message.type)) {
      positions.set(e.message.type, index);
    }
  });

  return dependencies.every(([before, after]) => {
    const beforePos = positions.get(before);
    const afterPos = positions.get(after);
    if (beforePos === undefined || afterPos === undefined) return true;
    return beforePos < afterPos;
  });
}
