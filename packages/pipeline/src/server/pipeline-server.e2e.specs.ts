import { define } from '../builder/define';
import { PipelineServer, type CommandHandlerWithMetadata } from './pipeline-server';

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
});
