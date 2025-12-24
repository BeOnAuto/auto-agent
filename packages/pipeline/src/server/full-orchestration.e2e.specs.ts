import type { Command, Event } from '@auto-engineer/message-bus';
import { define } from '../builder/define';
import { createKanbanPipeline, resetRetryState } from '../testing/fixtures/kanban.pipeline';
import {
  createMockHandlers,
  createStatefulHandler,
  getHandlerCallCount,
  resetCallCounts,
} from '../testing/mock-handlers';
import { containsSubsequence, findMissingEvents } from '../testing/snapshot-compare';
import { type CommandHandlerWithMetadata, PipelineServer } from './pipeline-server';

interface StoredMessage {
  message: { type: string; data?: Record<string, unknown> };
  messageType: string;
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  return res.json() as Promise<T>;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('Full Orchestration E2E', () => {
  beforeEach(() => {
    resetRetryState();
    resetCallCounts();
  });

  describe('Kanban pipeline definition', () => {
    it('should build kanban pipeline with all handler types', () => {
      const pipeline = createKanbanPipeline();

      expect(pipeline.descriptor.name).toBe('kanban');
      expect(pipeline.descriptor.handlers.length).toBeGreaterThan(0);

      const handlerTypes = pipeline.descriptor.handlers.map((h) => h.type);
      expect(handlerTypes).toContain('emit');
      expect(handlerTypes).toContain('settled');
      expect(handlerTypes).toContain('foreach-phased');
    });

    it('should generate graph with nodes and edges', () => {
      const pipeline = createKanbanPipeline();
      const graph = pipeline.toGraph();

      expect(graph.nodes.length).toBeGreaterThan(0);
      expect(graph.edges.length).toBeGreaterThan(0);

      const nodeIds = graph.nodes.map((n) => n.id);
      expect(nodeIds).toContain('evt:SchemaExported');
      expect(nodeIds).toContain('cmd:GenerateServer');
      expect(nodeIds).toContain('evt:SliceImplemented');
      expect(nodeIds).toContain('evt:AllComponentsImplemented');
    });
  });

  describe('scatter-gather workflow', () => {
    it('should execute scatter-gather with settled handler', async () => {
      let settledCalled = false;
      let checkEvents: Record<string, Event[]> = {};

      const handlers = createMockHandlers([
        {
          name: 'Start',
          events: ['Started'],
          fn: () => ({ type: 'Started', data: {} }),
        },
        {
          name: 'CheckA',
          events: ['AChecked'],
          fn: () => ({ type: 'AChecked', data: { result: 'pass' } }),
        },
        {
          name: 'CheckB',
          events: ['BChecked'],
          fn: () => ({ type: 'BChecked', data: { result: 'pass' } }),
        },
        {
          name: 'CheckC',
          events: ['CChecked'],
          fn: () => ({ type: 'CChecked', data: { result: 'pass' } }),
        },
      ]);

      const pipeline = define('scatter-gather')
        .on('Started')
        .emit('CheckA', {})
        .emit('CheckB', {})
        .emit('CheckC', {})
        .settled(['CheckA', 'CheckB', 'CheckC'])
        .dispatch({ dispatches: [] }, (events) => {
          settledCalled = true;
          checkEvents = events;
        })
        .build();

      const server = new PipelineServer({ port: 0 });
      server.registerCommandHandlers(handlers);
      server.registerPipeline(pipeline);
      await server.start();

      await fetchJson(`http://localhost:${server.port}/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'Start', data: {} }),
      });

      await delay(300);

      expect(settledCalled).toBe(true);
      expect(checkEvents.CheckA).toHaveLength(1);
      expect(checkEvents.CheckB).toHaveLength(1);
      expect(checkEvents.CheckC).toHaveLength(1);

      await server.stop();
    });
  });

  describe('retry with persist pattern', () => {
    it('should retry failed checks with persist: true', async () => {
      const checkHandler = createStatefulHandler({
        name: 'RunCheck',
        events: ['CheckPassed', 'CheckFailed'],
        initialFails: 2,
        failEvent: (cmd: Command) => ({
          type: 'CheckFailed',
          data: { target: (cmd.data as { target?: string }).target ?? 'unknown', error: 'something went wrong' },
        }),
        successEvent: (cmd: Command) => ({
          type: 'CheckPassed',
          data: { target: (cmd.data as { target?: string }).target ?? 'unknown' },
        }),
      });

      const startHandler: CommandHandlerWithMetadata = {
        name: 'Start',
        events: ['Started'],
        handle: async () => ({ type: 'Started', data: { target: './src' } }),
      };

      let settledCallCount = 0;

      const pipeline = define('retry-persist')
        .on('Started')
        .emit('RunCheck', (e: { data: { target: string } }) => ({ target: e.data.target }))
        .settled(['RunCheck'])
        .dispatch({ dispatches: ['RunCheck'] }, (events, send) => {
          settledCallCount++;
          const hasFailure = (events.RunCheck ?? []).some((e) => e.type === 'CheckFailed');

          if (hasFailure && settledCallCount < 3) {
            const target = (events.RunCheck[0]?.data as { target?: string })?.target ?? './src';
            send('RunCheck', { target, retryAttempt: settledCallCount });
            return { persist: true };
          }
        })
        .build();

      const server = new PipelineServer({ port: 0 });
      server.registerCommandHandlers([startHandler, checkHandler]);
      server.registerPipeline(pipeline);
      await server.start();

      await fetchJson(`http://localhost:${server.port}/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'Start', data: {} }),
      });

      await delay(500);

      const messages = await fetchJson<StoredMessage[]>(`http://localhost:${server.port}/messages`);
      const eventTypes = messages.filter((m) => m.messageType === 'event').map((m) => m.message.type);

      expect(eventTypes.filter((t) => t === 'CheckFailed')).toHaveLength(2);
      expect(eventTypes).toContain('CheckPassed');
      expect(settledCallCount).toBe(3);

      await server.stop();
    });
  });

  describe('phased execution workflow', () => {
    it('should execute components in phase order', async () => {
      const executionOrder: string[] = [];

      interface Component {
        id: string;
        type: 'molecule' | 'organism' | 'page';
      }

      const handlers: CommandHandlerWithMetadata[] = [
        {
          name: 'GenerateClient',
          events: ['ClientGenerated'],
          handle: async () => ({
            type: 'ClientGenerated',
            data: {
              components: [
                { id: 'page1', type: 'page' },
                { id: 'mol1', type: 'molecule' },
                { id: 'org1', type: 'organism' },
                { id: 'mol2', type: 'molecule' },
                { id: 'org2', type: 'organism' },
              ],
            },
          }),
        },
        {
          name: 'ImplementComponent',
          events: ['ComponentImplemented'],
          handle: async (cmd) => {
            const filePath = (cmd.data as { filePath: string }).filePath;
            executionOrder.push(filePath);
            return { type: 'ComponentImplemented', data: { filePath } };
          },
        },
      ];

      const pipeline = define('phased')
        .on('ClientGenerated')
        .forEach((e: { data: { components: Component[] } }) => e.data.components)
        .groupInto(['molecule', 'organism', 'page'], (c: Component) => c.type)
        .process('ImplementComponent', (c: Component) => ({ filePath: c.id }))
        .onComplete({
          success: 'AllComponentsImplemented',
          failure: 'ComponentsFailed',
          itemKey: (e) => (e.data as { filePath?: string; id?: string }).filePath ?? (e.data as { id: string }).id,
        })
        .build();

      const server = new PipelineServer({ port: 0 });
      server.registerCommandHandlers(handlers);
      server.registerPipeline(pipeline);
      await server.start();

      await fetchJson(`http://localhost:${server.port}/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'GenerateClient', data: {} }),
      });

      await delay(600);

      expect(executionOrder).toEqual(['mol1', 'mol2', 'org1', 'org2', 'page1']);

      const messages = await fetchJson<StoredMessage[]>(`http://localhost:${server.port}/messages`);
      const eventTypes = messages.filter((m) => m.messageType === 'event').map((m) => m.message.type);

      expect(eventTypes).toContain('AllComponentsImplemented');

      await server.stop();
    });
  });

  describe('complete kanban workflow', () => {
    it('should execute full kanban workflow with mock handlers', async () => {
      const handlers = createMockHandlers([
        {
          name: 'ExportSchema',
          events: ['SchemaExported'],
          fn: () => ({ type: 'SchemaExported', data: { outputPath: './schema.json' } }),
        },
        {
          name: 'GenerateServer',
          events: ['ServerGenerated', 'SliceGenerated'],
          fn: () => [
            { type: 'SliceGenerated', data: { slicePath: './adds-todo' } },
            { type: 'ServerGenerated', data: { modelPath: './schema.json' } },
          ],
        },
        {
          name: 'ImplementSlice',
          events: ['SliceImplemented'],
          fn: (cmd) => ({
            type: 'SliceImplemented',
            data: { slicePath: (cmd.data as { slicePath: string }).slicePath },
          }),
        },
        {
          name: 'CheckTests',
          events: ['TestsCheckPassed', 'TestsCheckFailed'],
          fn: () => ({ type: 'TestsCheckPassed', data: {} }),
        },
        {
          name: 'CheckTypes',
          events: ['TypeCheckPassed', 'TypeCheckFailed'],
          fn: () => ({ type: 'TypeCheckPassed', data: {} }),
        },
        {
          name: 'CheckLint',
          events: ['LintCheckPassed', 'LintCheckFailed'],
          fn: () => ({ type: 'LintCheckPassed', data: {} }),
        },
        {
          name: 'GenerateIA',
          events: ['IAGenerated'],
          fn: () => ({ type: 'IAGenerated', data: {} }),
        },
        {
          name: 'StartServer',
          events: ['ServerStarted'],
          fn: () => ({ type: 'ServerStarted', data: {} }),
        },
        {
          name: 'GenerateClient',
          events: ['ClientGenerated'],
          fn: () => ({
            type: 'ClientGenerated',
            data: {
              components: [
                { id: 'm1', type: 'molecule', filePath: 'm1.tsx' },
                { id: 'o1', type: 'organism', filePath: 'o1.tsx' },
                { id: 'p1', type: 'page', filePath: 'p1.tsx' },
              ],
            },
          }),
        },
        {
          name: 'ImplementComponent',
          events: ['ComponentImplemented'],
          fn: (cmd) => ({
            type: 'ComponentImplemented',
            data: { filePath: (cmd.data as { filePath: string }).filePath },
          }),
        },
      ]);

      const pipeline = createKanbanPipeline();

      const server = new PipelineServer({ port: 0 });
      server.registerCommandHandlers(handlers);
      server.registerPipeline(pipeline);
      await server.start();

      await fetchJson(`http://localhost:${server.port}/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'ExportSchema', data: {} }),
      });

      await delay(800);

      const messages = await fetchJson<StoredMessage[]>(`http://localhost:${server.port}/messages`);
      const eventTypes = messages.filter((m) => m.messageType === 'event').map((m) => m.message.type);

      const expectedSubsequence = [
        'SchemaExported',
        'SliceGenerated',
        'SliceImplemented',
        'TestsCheckPassed',
        'TypeCheckPassed',
        'LintCheckPassed',
      ];

      expect(containsSubsequence(eventTypes, expectedSubsequence)).toBe(true);
      expect(eventTypes).toContain('IAGenerated');
      expect(eventTypes).toContain('ClientGenerated');
      expect(eventTypes).toContain('AllComponentsImplemented');

      const missingEvents = findMissingEvents(eventTypes, [
        'SchemaExported',
        'SliceGenerated',
        'SliceImplemented',
        'ServerGenerated',
        'IAGenerated',
        'ClientGenerated',
        'AllComponentsImplemented',
      ]);

      expect(missingEvents).toHaveLength(0);

      await server.stop();
    });

    it('should handle retry scenario in kanban workflow', async () => {
      let typeCheckCallCount = 0;

      const handlers = createMockHandlers([
        {
          name: 'ExportSchema',
          events: ['SchemaExported'],
          fn: () => ({ type: 'SchemaExported', data: { outputPath: './schema.json' } }),
        },
        {
          name: 'GenerateServer',
          events: ['ServerGenerated', 'SliceGenerated'],
          fn: () => [
            { type: 'SliceGenerated', data: { slicePath: './adds-todo' } },
            { type: 'ServerGenerated', data: { modelPath: './schema.json' } },
          ],
        },
        {
          name: 'ImplementSlice',
          events: ['SliceImplemented'],
          fn: (cmd) => ({
            type: 'SliceImplemented',
            data: { slicePath: (cmd.data as { slicePath: string }).slicePath },
          }),
        },
        {
          name: 'CheckTests',
          events: ['TestsCheckPassed', 'TestsCheckFailed'],
          fn: () => ({ type: 'TestsCheckPassed', data: { target: './adds-todo' } }),
        },
        {
          name: 'CheckTypes',
          events: ['TypeCheckPassed', 'TypeCheckFailed'],
          fn: () => {
            typeCheckCallCount++;
            if (typeCheckCallCount < 3) {
              return { type: 'TypeCheckFailed', data: { target: './adds-todo', error: 'TS2322' } };
            }
            return { type: 'TypeCheckPassed', data: { target: './adds-todo' } };
          },
        },
        {
          name: 'CheckLint',
          events: ['LintCheckPassed', 'LintCheckFailed'],
          fn: () => ({ type: 'LintCheckPassed', data: { target: './adds-todo' } }),
        },
        {
          name: 'GenerateIA',
          events: ['IAGenerated'],
          fn: () => ({ type: 'IAGenerated', data: {} }),
        },
        {
          name: 'StartServer',
          events: ['ServerStarted'],
          fn: () => ({ type: 'ServerStarted', data: {} }),
        },
        {
          name: 'GenerateClient',
          events: ['ClientGenerated'],
          fn: () => ({
            type: 'ClientGenerated',
            data: { components: [{ id: 'm1', type: 'molecule', filePath: 'm1.tsx' }] },
          }),
        },
        {
          name: 'ImplementComponent',
          events: ['ComponentImplemented'],
          fn: (cmd) => ({
            type: 'ComponentImplemented',
            data: { filePath: (cmd.data as { filePath: string }).filePath },
          }),
        },
      ]);

      const pipeline = createKanbanPipeline();

      const server = new PipelineServer({ port: 0 });
      server.registerCommandHandlers(handlers);
      server.registerPipeline(pipeline);
      await server.start();

      await fetchJson(`http://localhost:${server.port}/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'ExportSchema', data: {} }),
      });

      await delay(1000);

      const messages = await fetchJson<StoredMessage[]>(`http://localhost:${server.port}/messages`);
      const eventTypes = messages.filter((m) => m.messageType === 'event').map((m) => m.message.type);

      const typeCheckFailCount = eventTypes.filter((t) => t === 'TypeCheckFailed').length;
      expect(typeCheckFailCount).toBe(2);
      expect(eventTypes).toContain('TypeCheckPassed');

      expect(getHandlerCallCount('ImplementSlice')).toBe(3);

      await server.stop();
    });
  });

  describe('SSE streaming verification', () => {
    it('should receive events via SSE endpoint', async () => {
      const handlers = createMockHandlers([
        {
          name: 'Start',
          events: ['Started'],
          fn: () => ({ type: 'Started', data: { message: 'workflow started' } }),
        },
        {
          name: 'Process',
          events: ['Processed'],
          fn: () => ({ type: 'Processed', data: { message: 'work done' } }),
        },
      ]);

      const pipeline = define('sse-test').on('Started').emit('Process', {}).build();

      const server = new PipelineServer({ port: 0 });
      server.registerCommandHandlers(handlers);
      server.registerPipeline(pipeline);
      await server.start();

      const sseEvents: Event[] = [];

      const controller = new AbortController();
      const ssePromise = fetch(`http://localhost:${server.port}/events`, {
        signal: controller.signal,
      }).then(async (response) => {
        const reader = response.body?.getReader();
        if (reader === undefined) return;

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split('\n\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const jsonStr = line.slice(6);
              const event = JSON.parse(jsonStr) as Event;
              sseEvents.push(event);
            }
          }
        }
      });

      await delay(100);

      await fetchJson(`http://localhost:${server.port}/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'Start', data: {} }),
      });

      await delay(300);

      controller.abort();
      await ssePromise.catch(() => {});

      const sseEventTypes = sseEvents.map((e) => e.type);
      expect(sseEventTypes).toContain('Started');
      expect(sseEventTypes).toContain('Processed');

      await server.stop();
    });

    it('should filter SSE events by correlationId', async () => {
      const handlers = createMockHandlers([
        {
          name: 'Start',
          events: ['Started'],
          fn: () => ({ type: 'Started', data: {} }),
        },
      ]);

      const server = new PipelineServer({ port: 0 });
      server.registerCommandHandlers(handlers);
      await server.start();

      const filteredEvents: Event[] = [];
      const targetCorrelationId = 'workflow-123';

      const controller = new AbortController();
      const ssePromise = fetch(`http://localhost:${server.port}/events?correlationId=${targetCorrelationId}`, {
        signal: controller.signal,
      }).then(async (response) => {
        const reader = response.body?.getReader();
        if (reader === undefined) return;

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split('\n\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const jsonStr = line.slice(6);
              const event = JSON.parse(jsonStr) as Event;
              filteredEvents.push(event);
            }
          }
        }
      });

      await delay(100);

      await fetchJson(`http://localhost:${server.port}/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'Start', correlationId: targetCorrelationId, data: {} }),
      });

      await fetchJson(`http://localhost:${server.port}/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'Start', correlationId: 'other-workflow', data: {} }),
      });

      await delay(300);

      controller.abort();
      await ssePromise.catch(() => {});

      expect(filteredEvents.every((e) => e.correlationId === targetCorrelationId)).toBe(true);

      await server.stop();
    });
  });

  describe('event sequence snapshot verification', () => {
    it('should produce expected event sequence for simple workflow', async () => {
      const handlers = createMockHandlers([
        {
          name: 'A',
          events: ['ADone'],
          fn: () => ({ type: 'ADone', data: {} }),
        },
        {
          name: 'B',
          events: ['BDone'],
          fn: () => ({ type: 'BDone', data: {} }),
        },
        {
          name: 'C',
          events: ['CDone'],
          fn: () => ({ type: 'CDone', data: {} }),
        },
      ]);

      const pipeline = define('sequence').on('ADone').emit('B', {}).on('BDone').emit('C', {}).build();

      const server = new PipelineServer({ port: 0 });
      server.registerCommandHandlers(handlers);
      server.registerPipeline(pipeline);
      await server.start();

      await fetchJson(`http://localhost:${server.port}/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'A', data: {} }),
      });

      await delay(300);

      const messages = await fetchJson<StoredMessage[]>(`http://localhost:${server.port}/messages`);
      const eventTypes = messages.filter((m) => m.messageType === 'event').map((m) => m.message.type);

      const expectedSequence = ['ADone', 'BDone', 'CDone'];
      expect(containsSubsequence(eventTypes, expectedSequence)).toBe(true);

      const missing = findMissingEvents(eventTypes, expectedSequence);
      expect(missing).toHaveLength(0);

      await server.stop();
    });
  });
});
