import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import path from 'path';
import { fileURLToPath } from 'url';
import type { ServerContext } from './helpers';
import {
  startServer,
  stopServer,
  fetchRegistry,
  fetchPipeline,
  fetchSessions,
  fetchMessages,
  fetchStats,
  dispatchCommand,
  waitForPipelineCompletion,
  recordStatusProgression,
  extractEventSequence,
  writeSnapshot,
  createGoldenMaster,
  extractEventTypes,
  compareEventSets,
  validateSequentialDependencies,
  delay,
} from './helpers';
import type { PositionalMessage, GoldenMaster } from './types';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const KANBAN_TODO_DIR = path.resolve(__dirname, '..', '..', '..', '..', '..', 'examples', 'kanban-todo');
const SNAPSHOT_DIR = path.resolve(__dirname, '__snapshots__', 'kanban-todo');

const PIPELINE_TIMEOUT_MS = 600000;

describe.skip('Kanban-Todo Pipeline E2E Recording', () => {
  let server: ServerContext;

  beforeAll(async () => {
    server = await startServer(KANBAN_TODO_DIR, 30000);
  }, 35000);

  afterAll(async () => {
    await stopServer(server);
  }, 10000);

  describe('Baseline Endpoints', () => {
    it('GET /registry returns all expected handlers', async () => {
      const registry = await fetchRegistry(server.baseUrl);

      expect(registry.commandHandlers).toContain('ExportSchema');
      expect(registry.commandHandlers).toContain('GenerateServer');
      expect(registry.commandHandlers).toContain('ImplementSlice');
      expect(registry.commandHandlers).toContain('CheckTests');
      expect(registry.commandHandlers).toContain('CheckTypes');
      expect(registry.commandHandlers).toContain('CheckLint');
      expect(registry.commandHandlers).toContain('GenerateIA');
      expect(registry.commandHandlers).toContain('GenerateClient');
      expect(registry.commandHandlers).toContain('ImplementComponent');
      expect(registry.commandHandlers).toContain('StartServer');
      expect(registry.commandHandlers).toContain('StartClient');

      expect(registry.eventHandlers).toContain('SchemaExported');
      expect(registry.eventHandlers).toContain('SliceGenerated');
      expect(registry.eventHandlers).toContain('SliceImplemented');
      expect(registry.eventHandlers).toContain('ServerGenerated');
      expect(registry.eventHandlers).toContain('IAGenerated');
      expect(registry.eventHandlers).toContain('ClientGenerated');
      expect(registry.eventHandlers).toContain('ComponentImplemented');
      expect(registry.eventHandlers).toContain('ComponentImplementationFailed');
      expect(registry.eventHandlers).toContain('ClientChecked');
    });

    it('GET /pipeline returns DAG with expected structure', async () => {
      const pipeline = await fetchPipeline(server.baseUrl);

      expect(pipeline.nodes).toBeDefined();
      expect(pipeline.edges).toBeDefined();
      expect(pipeline.commandToEvents).toBeDefined();
      expect(pipeline.eventToCommand).toBeDefined();

      const nodeNames = pipeline.nodes.map((n) => n.name);
      expect(nodeNames).toContain('ExportSchema');
      expect(nodeNames).toContain('GenerateServer');
    });

    it('GET /pipeline nodes have idle or None status before execution', async () => {
      const pipeline = await fetchPipeline(server.baseUrl);

      const activeNodes = pipeline.nodes.filter(
        (n) => n.status === 'running' || n.status === 'pass' || n.status === 'fail',
      );
      expect(activeNodes).toHaveLength(0);
    });

    it('GET /sessions returns current session info', async () => {
      const sessions = await fetchSessions(server.baseUrl);

      expect(sessions.length).toBeGreaterThan(0);
      expect(sessions[0].sessionId).toBeDefined();
    });

    it('GET /messages returns empty or minimal messages initially', async () => {
      const messages = await fetchMessages(server.baseUrl);

      expect(Array.isArray(messages)).toBe(true);
    });
  });

  describe('ExportSchema Command Dispatch', () => {
    it('POST /command accepts ExportSchema and returns ack', async () => {
      const ack = await dispatchCommand(server.baseUrl, 'ExportSchema', {});

      expect(ack.status).toBe('ack');
      expect(ack.commandId).toBeDefined();
      expect(ack.timestamp).toBeDefined();
    });
  });

  describe('Pipeline Status Progression', () => {
    it('should update node statuses as events flow', async () => {
      await dispatchCommand(server.baseUrl, 'ExportSchema', {});

      await delay(2000);

      const statusHistory = await recordStatusProgression(server.baseUrl, 60000, 1000);

      expect(statusHistory.length).toBeGreaterThan(0);

      const hasStatusChange = statusHistory.some((snapshot) =>
        snapshot.nodes.some((n) => n.status === 'running' || n.status === 'pass'),
      );

      expect(hasStatusChange).toBe(true);
    }, 70000);
  });

  describe('Event Stream Recording', () => {
    it('should capture events after ExportSchema dispatch', async () => {
      const initialMessages = await fetchMessages(server.baseUrl);
      const initialCount = initialMessages.length;

      await dispatchCommand(server.baseUrl, 'ExportSchema', {});

      await waitForPipelineCompletion(server.baseUrl, 120000, ['ExportSchema']);

      const finalMessages = await fetchMessages(server.baseUrl);
      const newMessages = finalMessages.slice(initialCount);

      expect(newMessages.length).toBeGreaterThan(0);

      const events = newMessages.filter((m) => m.messageType === 'event');
      expect(events.length).toBeGreaterThan(0);

      const eventTypes = extractEventTypes(events);
      expect(eventTypes).toContain('SchemaExported');
    }, 130000);

    it('should maintain sequential dependencies in event order', async () => {
      const messages = await fetchMessages(server.baseUrl);
      const events = messages.filter((m) => m.messageType === 'event');

      const sequentialDependencies: [string, string][] = [
        ['SchemaExported', 'ServerGenerated'],
        ['ServerGenerated', 'IAGenerated'],
        ['IAGenerated', 'ClientGenerated'],
      ];

      const isValid = validateSequentialDependencies(events, sequentialDependencies);
      expect(isValid).toBe(true);
    });
  });

  describe('Golden Master Snapshot Recording', () => {
    it(
      'should record complete pipeline execution for golden master',
      async () => {
        const registrySnapshot = await fetchRegistry(server.baseUrl);
        const pipelineSnapshot = await fetchPipeline(server.baseUrl);
        const sessionsSnapshot = await fetchSessions(server.baseUrl);

        await dispatchCommand(server.baseUrl, 'ExportSchema', {});

        const statusProgression = await recordStatusProgression(server.baseUrl, PIPELINE_TIMEOUT_MS, 1000);

        const finalMessages = await fetchMessages(server.baseUrl, 1000);
        const finalPipeline = await fetchPipeline(server.baseUrl);
        const finalStats = await fetchStats(server.baseUrl);

        const goldenMaster: GoldenMaster = {
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

        await writeSnapshot(SNAPSHOT_DIR, 'golden-master.snapshot.json', goldenMaster);
        await writeSnapshot(SNAPSHOT_DIR, 'registry.snapshot.json', registrySnapshot);
        await writeSnapshot(SNAPSHOT_DIR, 'pipeline-graph.snapshot.json', pipelineSnapshot);
        await writeSnapshot(SNAPSHOT_DIR, 'event-stream.snapshot.json', extractEventSequence(finalMessages));

        expect(goldenMaster.execution.events.length).toBeGreaterThan(0);
        expect(goldenMaster.execution.commands.length).toBeGreaterThan(0);
      },
      PIPELINE_TIMEOUT_MS + 60000,
    );
  });

  describe('Post-Refactor Comparison (Template)', () => {
    it.skip('should compare new output against golden master with forgiveness', async () => {
      const goldenMaster: GoldenMaster = {
        baseline: {
          registry: { commandHandlers: [], eventHandlers: [], commandsWithMetadata: [], folds: [] },
          pipeline: { nodes: [], edges: [], commandToEvents: {}, eventToCommand: {} },
          sessions: [],
        },
        execution: { statusProgression: [], events: [], commands: [] },
        final: {
          pipeline: { nodes: [], edges: [], commandToEvents: {}, eventToCommand: {} },
          stats: { totalMessages: 0, totalCommands: 0, totalEvents: 0, totalStreams: 0, totalSessions: 0 },
        },
      };

      const newExecution = await createGoldenMaster(server.baseUrl, PIPELINE_TIMEOUT_MS);

      const expectedEventTypes = extractEventTypes(goldenMaster.execution.events);
      const actualEventTypes = extractEventTypes(newExecution.execution.events);

      const { missing, extra } = compareEventSets(expectedEventTypes, actualEventTypes);

      expect(missing).toHaveLength(0);
      expect(extra).toHaveLength(0);

      const expectedCommandHandlers = goldenMaster.baseline.registry.commandHandlers;
      const actualCommandHandlers = newExecution.baseline.registry.commandHandlers;
      expect(actualCommandHandlers.sort()).toEqual(expectedCommandHandlers.sort());

      const expectedEventHandlers = goldenMaster.baseline.registry.eventHandlers;
      const actualEventHandlers = newExecution.baseline.registry.eventHandlers;
      expect(actualEventHandlers.sort()).toEqual(expectedEventHandlers.sort());
    });
  });
});
