import { define } from '../builder/define';
import { type CommandHandlerWithMetadata, PipelineServer } from './pipeline-server';

interface RegistryResponse {
  eventHandlers: string[];
  commandHandlers: string[];
  commandsWithMetadata: Array<{
    id: string;
    name: string;
    alias: string;
    description: string;
  }>;
  folds: string[];
}

interface PipelineNode {
  id: string;
  name?: string;
  title?: string;
  status?: string;
}

interface PipelineResponse {
  nodes: PipelineNode[];
  edges: Array<{ from: string; to: string }>;
  commandToEvents: Record<string, string[]>;
  eventToCommand: Record<string, string>;
}

interface CommandAck {
  status: string;
  commandId?: string;
}

interface StoredMessage {
  message: { type: string; data?: Record<string, unknown> };
  messageType: string;
}

interface StatsResponse {
  totalMessages: number;
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  return res.json() as Promise<T>;
}

describe('PipelineServer E2E', () => {
  describe('baseline endpoints (CLI E2E parity)', () => {
    it('should return registry with expected shape', async () => {
      const handler: CommandHandlerWithMetadata = {
        name: 'ExportSchema',
        alias: 'export:schema',
        description: 'Export flow schemas to context directory',
        events: ['SchemaExported'],
        handle: async () => ({ type: 'SchemaExported', data: {} }),
      };

      const pipeline = define('kanban')
        .on('SchemaExported')
        .emit('GenerateServer', { modelPath: './.context/schema.json' })
        .build();

      const server = new PipelineServer({ port: 0 });
      server.registerCommandHandlers([handler]);
      server.registerPipeline(pipeline);
      await server.start();

      const registry = await fetchJson<RegistryResponse>(`http://localhost:${server.port}/registry`);

      expect(registry.eventHandlers).toContain('SchemaExported');
      expect(registry.commandHandlers).toContain('ExportSchema');
      expect(registry.folds).toEqual([]);
      expect(registry.commandsWithMetadata).toHaveLength(1);
      expect(registry.commandsWithMetadata[0].alias).toBe('export:schema');
      expect(registry.commandsWithMetadata[0].description).toBe('Export flow schemas to context directory');

      await server.stop();
    });

    it('should return pipeline with expected shape', async () => {
      const handler: CommandHandlerWithMetadata = {
        name: 'ExportSchema',
        alias: 'export:schema',
        description: 'Export schemas',
        events: ['SchemaExported'],
        handle: async () => ({ type: 'SchemaExported', data: {} }),
      };

      const pipeline = define('kanban').on('SchemaExported').emit('GenerateServer', {}).build();

      const server = new PipelineServer({ port: 0 });
      server.registerCommandHandlers([handler]);
      server.registerPipeline(pipeline);
      await server.start();

      const pipelineRes = await fetchJson<PipelineResponse>(`http://localhost:${server.port}/pipeline`);

      expect(pipelineRes.commandToEvents).toEqual({ ExportSchema: ['SchemaExported'] });
      expect(pipelineRes.eventToCommand).toEqual({ SchemaExported: 'GenerateServer' });
      expect(pipelineRes.nodes.some((n) => n.id === 'ExportSchema')).toBe(true);
      expect(pipelineRes.nodes.some((n) => n.id === 'evt:SchemaExported')).toBe(true);

      await server.stop();
    });

    it('should return sessions array', async () => {
      const server = new PipelineServer({ port: 0 });
      await server.start();

      const sessions = await fetchJson<unknown[]>(`http://localhost:${server.port}/sessions`);
      expect(Array.isArray(sessions)).toBe(true);

      await server.stop();
    });

    it('should return messages array', async () => {
      const server = new PipelineServer({ port: 0 });
      await server.start();

      const messages = await fetchJson<StoredMessage[]>(`http://localhost:${server.port}/messages`);
      expect(Array.isArray(messages)).toBe(true);

      await server.stop();
    });

    it('should return stats with totalMessages', async () => {
      const server = new PipelineServer({ port: 0 });
      await server.start();

      const stats = await fetchJson<StatsResponse>(`http://localhost:${server.port}/stats`);
      expect(stats.totalMessages).toBeDefined();

      await server.stop();
    });

    it('should accept command and return ack', async () => {
      const handler: CommandHandlerWithMetadata = {
        name: 'ExportSchema',
        handle: async () => ({ type: 'SchemaExported', data: {} }),
      };

      const server = new PipelineServer({ port: 0 });
      server.registerCommandHandlers([handler]);
      await server.start();

      const ack = await fetchJson<CommandAck>(`http://localhost:${server.port}/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'ExportSchema', data: {} }),
      });

      expect(ack.status).toBe('ack');
      expect(ack.commandId).toBeDefined();

      await server.stop();
    });
  });

  describe('command execution and event routing', () => {
    it('should execute command and route resulting event through pipeline', async () => {
      const exportHandler: CommandHandlerWithMetadata = {
        name: 'ExportSchema',
        events: ['SchemaExported'],
        handle: async () => ({ type: 'SchemaExported', data: { path: './schema.json' } }),
      };

      const generateHandler: CommandHandlerWithMetadata = {
        name: 'GenerateServer',
        events: ['ServerGenerated'],
        handle: async () => ({ type: 'ServerGenerated', data: { slices: 3 } }),
      };

      const pipeline = define('kanban')
        .on('SchemaExported')
        .emit('GenerateServer', (e: { data: { path: string } }) => ({ modelPath: e.data.path }))
        .build();

      const server = new PipelineServer({ port: 0 });
      server.registerCommandHandlers([exportHandler, generateHandler]);
      server.registerPipeline(pipeline);
      await server.start();

      await fetchJson(`http://localhost:${server.port}/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'ExportSchema', data: {} }),
      });

      await new Promise((r) => setTimeout(r, 200));

      const messages = await fetchJson<StoredMessage[]>(`http://localhost:${server.port}/messages`);
      const eventTypes = messages.filter((m) => m.messageType === 'event').map((m) => m.message.type);

      expect(eventTypes).toContain('SchemaExported');
      expect(eventTypes).toContain('ServerGenerated');

      await server.stop();
    });

    it('should handle pipeline chain with multiple handlers', async () => {
      const handlers: CommandHandlerWithMetadata[] = [
        {
          name: 'Start',
          events: ['Started'],
          handle: async () => ({ type: 'Started', data: {} }),
        },
        {
          name: 'Process',
          events: ['Processed'],
          handle: async () => ({ type: 'Processed', data: {} }),
        },
        {
          name: 'Finish',
          events: ['Finished'],
          handle: async () => ({ type: 'Finished', data: {} }),
        },
      ];

      const pipeline = define('chain').on('Started').emit('Process', {}).on('Processed').emit('Finish', {}).build();

      const server = new PipelineServer({ port: 0 });
      server.registerCommandHandlers(handlers);
      server.registerPipeline(pipeline);
      await server.start();

      await fetchJson(`http://localhost:${server.port}/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'Start', data: {} }),
      });

      await new Promise((r) => setTimeout(r, 300));

      const messages = await fetchJson<StoredMessage[]>(`http://localhost:${server.port}/messages`);
      const eventTypes = messages.filter((m) => m.messageType === 'event').map((m) => m.message.type);

      expect(eventTypes).toContain('Started');
      expect(eventTypes).toContain('Processed');
      expect(eventTypes).toContain('Finished');

      await server.stop();
    });
  });

  describe('settled handler execution', () => {
    it('should execute settled handler when all commands complete', async () => {
      let settledHandlerCalled = false;
      let receivedEvents: Record<string, Array<{ type: string }>> = {};

      const handlers: CommandHandlerWithMetadata[] = [
        {
          name: 'CheckTests',
          events: ['TestsCheckPassed', 'TestsCheckFailed'],
          handle: async () => ({ type: 'TestsCheckPassed', data: { result: 'pass' } }),
        },
        {
          name: 'CheckTypes',
          events: ['TypeCheckPassed', 'TypeCheckFailed'],
          handle: async () => ({ type: 'TypeCheckPassed', data: { result: 'pass' } }),
        },
        {
          name: 'CheckLint',
          events: ['LintCheckPassed', 'LintCheckFailed'],
          handle: async () => ({ type: 'LintCheckPassed', data: { result: 'pass' } }),
        },
        {
          name: 'ImplementSlice',
          events: ['SliceImplemented'],
          handle: async () => ({ type: 'SliceImplemented', data: {} }),
        },
      ];

      const pipeline = define('check-settle')
        .on('SliceImplemented')
        .emit('CheckTests', { target: './src' })
        .emit('CheckTypes', { target: './src' })
        .emit('CheckLint', { target: './src' })
        .settled(['CheckTests', 'CheckTypes', 'CheckLint'])
        .dispatch({ dispatches: [] }, (events) => {
          settledHandlerCalled = true;
          receivedEvents = events as Record<string, Array<{ type: string }>>;
        })
        .build();

      const server = new PipelineServer({ port: 0 });
      server.registerCommandHandlers(handlers);
      server.registerPipeline(pipeline);
      await server.start();

      await fetchJson(`http://localhost:${server.port}/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'ImplementSlice', data: { slicePath: './adds-todo' } }),
      });

      await new Promise((r) => setTimeout(r, 300));

      expect(settledHandlerCalled).toBe(true);
      expect(receivedEvents.CheckTests).toBeDefined();
      expect(receivedEvents.CheckTypes).toBeDefined();
      expect(receivedEvents.CheckLint).toBeDefined();
      expect(receivedEvents.CheckTests[0].type).toBe('TestsCheckPassed');
      expect(receivedEvents.CheckTypes[0].type).toBe('TypeCheckPassed');
      expect(receivedEvents.CheckLint[0].type).toBe('LintCheckPassed');

      await server.stop();
    });

    it('should dispatch command from settled handler', async () => {
      const handlers: CommandHandlerWithMetadata[] = [
        {
          name: 'CheckA',
          events: ['ADone'],
          handle: async () => ({ type: 'ADone', data: {} }),
        },
        {
          name: 'CheckB',
          events: ['BDone'],
          handle: async () => ({ type: 'BDone', data: {} }),
        },
        {
          name: 'FollowUp',
          events: ['FollowUpDone'],
          handle: async () => ({ type: 'FollowUpDone', data: { message: 'completed' } }),
        },
        {
          name: 'Trigger',
          events: ['Triggered'],
          handle: async () => ({ type: 'Triggered', data: {} }),
        },
      ];

      const pipeline = define('dispatch-test')
        .on('Triggered')
        .emit('CheckA', {})
        .emit('CheckB', {})
        .settled(['CheckA', 'CheckB'])
        .dispatch({ dispatches: ['FollowUp'] }, (_events, send) => {
          send('FollowUp', { reason: 'all checks passed' });
        })
        .build();

      const server = new PipelineServer({ port: 0 });
      server.registerCommandHandlers(handlers);
      server.registerPipeline(pipeline);
      await server.start();

      await fetchJson(`http://localhost:${server.port}/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'Trigger', data: {} }),
      });

      await new Promise((r) => setTimeout(r, 300));

      const messages = await fetchJson<StoredMessage[]>(`http://localhost:${server.port}/messages`);
      const eventTypes = messages.filter((m) => m.messageType === 'event').map((m) => m.message.type);

      expect(eventTypes).toContain('Triggered');
      expect(eventTypes).toContain('ADone');
      expect(eventTypes).toContain('BDone');
      expect(eventTypes).toContain('FollowUpDone');

      await server.stop();
    });

    it('should retry when settled handler returns persist: true', async () => {
      let checkCallCount = 0;
      let settledCallCount = 0;

      const handlers: CommandHandlerWithMetadata[] = [
        {
          name: 'RunCheck',
          events: ['CheckPassed', 'CheckFailed'],
          handle: async () => {
            checkCallCount++;
            if (checkCallCount < 3) {
              return { type: 'CheckFailed', data: { attempt: checkCallCount } };
            }
            return { type: 'CheckPassed', data: { attempt: checkCallCount } };
          },
        },
        {
          name: 'Start',
          events: ['Started'],
          handle: async () => ({ type: 'Started', data: {} }),
        },
      ];

      const pipeline = define('retry-test')
        .on('Started')
        .emit('RunCheck', {})
        .settled(['RunCheck'])
        .dispatch({ dispatches: ['RunCheck'] }, (events, send) => {
          settledCallCount++;
          const checkEvents = events.RunCheck;
          const hasFailure = checkEvents.some((e) => e.type === 'CheckFailed');

          if (hasFailure && settledCallCount < 3) {
            send('RunCheck', { retryAttempt: settledCallCount });
            return { persist: true };
          }
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

      await new Promise((r) => setTimeout(r, 500));

      const messages = await fetchJson<StoredMessage[]>(`http://localhost:${server.port}/messages`);
      const eventTypes = messages.filter((m) => m.messageType === 'event').map((m) => m.message.type);

      expect(eventTypes.filter((t) => t === 'CheckFailed')).toHaveLength(2);
      expect(eventTypes).toContain('CheckPassed');
      expect(checkCallCount).toBe(3);
      expect(settledCallCount).toBe(3);

      await server.stop();
    });
  });

  describe('phased execution', () => {
    it('should execute items in phase order with waiting', async () => {
      const dispatchedOrder: string[] = [];

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
              ],
            },
          }),
        },
        {
          name: 'ImplementComponent',
          events: ['ComponentImplemented'],
          handle: async (cmd) => {
            const filePath = (cmd.data as { filePath: string }).filePath;
            dispatchedOrder.push(filePath);
            return { type: 'ComponentImplemented', data: { filePath } };
          },
        },
      ];

      const pipeline = define('phased-test')
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

      await new Promise((r) => setTimeout(r, 500));

      const messages = await fetchJson<StoredMessage[]>(`http://localhost:${server.port}/messages`);
      const eventTypes = messages.filter((m) => m.messageType === 'event').map((m) => m.message.type);

      expect(dispatchedOrder).toEqual(['mol1', 'mol2', 'org1', 'page1']);

      expect(eventTypes).toContain('ComponentImplemented');
      expect(eventTypes).toContain('AllComponentsImplemented');

      await server.stop();
    });
  });
});
