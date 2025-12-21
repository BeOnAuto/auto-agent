import { define } from '../builder/define';
import { PipelineServer } from './pipeline-server';

interface HealthResponse {
  status: string;
}

interface CommandMetadata {
  id: string;
  name: string;
  alias: string;
  description: string;
  fields: Record<string, unknown>;
  examples: unknown[];
}

interface RegistryResponse {
  eventHandlers: string[];
  commandHandlers: string[];
  commandsWithMetadata: CommandMetadata[];
  folds: string[];
}

interface GraphNode {
  id: string;
  type: string;
  label: string;
}

interface PipelineNode {
  id: string;
  name: string;
  title: string;
  status: string;
}

interface PipelineResponse {
  nodes: PipelineNode[];
  edges: Array<{ from: string; to: string }>;
  commandToEvents: Record<string, string[]>;
  eventToCommand: Record<string, string>;
}

interface GraphResponse {
  nodes: GraphNode[];
  edges: Array<{ from: string; to: string }>;
}

interface CommandResponse {
  status: string;
}

interface StoredMessage {
  message: { type: string };
}

interface StatsResponse {
  totalMessages: number;
}

async function fetchAs<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  return res.json() as Promise<T>;
}

async function fetchWithStatus(
  url: string,
  options?: RequestInit,
): Promise<{ status: number; json: <T>() => Promise<T> }> {
  const res = await fetch(url, options);
  return {
    status: res.status,
    json: <T>() => res.json() as Promise<T>,
  };
}

describe('PipelineServer', () => {
  describe('health endpoint', () => {
    it('should respond to /health', async () => {
      const server = new PipelineServer({ port: 0 });
      await server.start();
      const data = await fetchAs<HealthResponse>(`http://localhost:${server.port}/health`);
      expect(data.status).toBe('healthy');
      await server.stop();
    });
  });

  describe('command handlers', () => {
    it('should register command handlers', () => {
      const handler = {
        name: 'Cmd',
        handle: async () => ({ type: 'Done', data: {} }),
      };
      const server = new PipelineServer({ port: 0 });
      server.registerCommandHandlers([handler]);
      expect(server.getRegisteredCommands()).toContain('Cmd');
    });
  });

  describe('pipeline registration', () => {
    it('should register pipeline', () => {
      const pipeline = define('test').on('A').emit('B', {}).build();
      const server = new PipelineServer({ port: 0 });
      server.registerPipeline(pipeline);
      expect(server.getPipelineNames()).toContain('test');
    });
  });

  describe('GET /registry', () => {
    it('should return registry with event handlers', async () => {
      const pipeline = define('test').on('Start').emit('Cmd', {}).build();
      const server = new PipelineServer({ port: 0 });
      server.registerPipeline(pipeline);
      await server.start();
      const data = await fetchAs<RegistryResponse>(`http://localhost:${server.port}/registry`);
      expect(data.eventHandlers).toContain('Start');
      await server.stop();
    });

    it('should return registry with command metadata defaults', async () => {
      const handler = {
        name: 'MinimalCmd',
        handle: async () => ({ type: 'Done', data: {} }),
      };
      const server = new PipelineServer({ port: 0 });
      server.registerCommandHandlers([handler]);
      await server.start();
      const data = await fetchAs<RegistryResponse>(`http://localhost:${server.port}/registry`);
      const metadata = data.commandsWithMetadata[0];
      expect(metadata.alias).toBe('MinimalCmd');
      expect(metadata.description).toBe('');
      expect(metadata.fields).toEqual({});
      expect(metadata.examples).toEqual([]);
      await server.stop();
    });

    it('should return registry with command metadata', async () => {
      const handler = {
        name: 'Cmd',
        alias: 'cmd',
        description: 'Test',
        fields: { x: 1 },
        examples: ['ex'],
        handle: async () => ({ type: 'Done', data: {} }),
      };
      const server = new PipelineServer({ port: 0 });
      server.registerCommandHandlers([handler]);
      await server.start();
      const data = await fetchAs<RegistryResponse>(`http://localhost:${server.port}/registry`);
      const metadata = data.commandsWithMetadata[0];
      expect(metadata.alias).toBe('cmd');
      expect(metadata.description).toBe('Test');
      expect(metadata.fields).toEqual({ x: 1 });
      expect(metadata.examples).toEqual(['ex']);
      await server.stop();
    });

    it('should return registry with folds array', async () => {
      const server = new PipelineServer({ port: 0 });
      await server.start();
      const data = await fetchAs<RegistryResponse>(`http://localhost:${server.port}/registry`);
      expect(data.folds).toEqual([]);
      await server.stop();
    });
  });

  describe('GET /pipeline', () => {
    it('should return pipeline graph', async () => {
      const pipeline = define('test').on('Start').emit('Cmd', {}).build();
      const server = new PipelineServer({ port: 0 });
      server.registerPipeline(pipeline);
      await server.start();
      const data = await fetchAs<GraphResponse>(`http://localhost:${server.port}/pipeline`);
      expect(data.nodes.some((n) => n.id === 'evt:Start')).toBe(true);
      await server.stop();
    });

    it('should return pipeline response with commandToEvents', async () => {
      const handler = {
        name: 'Gen',
        events: ['GenDone', 'GenProgress'],
        handle: async () => ({ type: 'GenDone', data: {} }),
      };
      const server = new PipelineServer({ port: 0 });
      server.registerCommandHandlers([handler]);
      await server.start();
      const data = await fetchAs<PipelineResponse>(`http://localhost:${server.port}/pipeline`);
      expect(data.commandToEvents).toEqual({ Gen: ['GenDone', 'GenProgress'] });
      await server.stop();
    });

    it('should return pipeline response with eventToCommand', async () => {
      const pipeline = define('test').on('Start').emit('Process', {}).build();
      const server = new PipelineServer({ port: 0 });
      server.registerPipeline(pipeline);
      await server.start();
      const data = await fetchAs<PipelineResponse>(`http://localhost:${server.port}/pipeline`);
      expect(data.eventToCommand).toEqual({ Start: 'Process' });
      await server.stop();
    });

    it('should return pipeline nodes with name, title, and status', async () => {
      const handler = {
        name: 'Cmd',
        alias: 'cmd',
        description: 'Test command',
        handle: async () => ({ type: 'Done', data: {} }),
      };
      const server = new PipelineServer({ port: 0 });
      server.registerCommandHandlers([handler]);
      await server.start();
      const data = await fetchAs<PipelineResponse>(`http://localhost:${server.port}/pipeline`);
      const cmdNode = data.nodes.find((n) => n.id === 'Cmd');
      expect(cmdNode).toBeDefined();
      expect(cmdNode?.name).toBe('Cmd');
      expect(cmdNode?.title).toBe('Test command');
      expect(cmdNode?.status).toBe('None');
      await server.stop();
    });
  });

  describe('POST /command', () => {
    it('should accept command', async () => {
      const handler = {
        name: 'Cmd',
        handle: async () => ({ type: 'Done', data: {} }),
      };
      const server = new PipelineServer({ port: 0 });
      server.registerCommandHandlers([handler]);
      await server.start();
      const data = await fetchAs<CommandResponse>(`http://localhost:${server.port}/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'Cmd', data: {} }),
      });
      expect(data.status).toBe('ack');
      await server.stop();
    });

    it('should return 404 for unknown command', async () => {
      const server = new PipelineServer({ port: 0 });
      await server.start();
      const res = await fetchWithStatus(`http://localhost:${server.port}/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'UnknownCmd', data: {} }),
      });
      expect(res.status).toBe(404);
      const data = await res.json<CommandResponse>();
      expect(data.status).toBe('nack');
      await server.stop();
    });

    it('should handle command that returns multiple events', async () => {
      const handler = {
        name: 'Multi',
        handle: async () => [
          { type: 'EventA', data: { a: 1 } },
          { type: 'EventB', data: { b: 2 } },
        ],
      };
      const server = new PipelineServer({ port: 0 });
      server.registerCommandHandlers([handler]);
      await server.start();
      await fetch(`http://localhost:${server.port}/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'Multi', data: {} }),
      });
      await new Promise((r) => setTimeout(r, 100));
      const msgs = await fetchAs<StoredMessage[]>(`http://localhost:${server.port}/messages`);
      expect(msgs.some((m) => m.message.type === 'EventA')).toBe(true);
      expect(msgs.some((m) => m.message.type === 'EventB')).toBe(true);
      await server.stop();
    });
  });

  describe('GET /messages', () => {
    it('should return messages', async () => {
      const server = new PipelineServer({ port: 0 });
      await server.start();
      const data = await fetchAs<StoredMessage[]>(`http://localhost:${server.port}/messages`);
      expect(Array.isArray(data)).toBe(true);
      await server.stop();
    });
  });

  describe('GET /stats', () => {
    it('should return stats', async () => {
      const server = new PipelineServer({ port: 0 });
      await server.start();
      const data = await fetchAs<StatsResponse>(`http://localhost:${server.port}/stats`);
      expect(data.totalMessages).toBeDefined();
      await server.stop();
    });
  });

  describe('GET /sessions', () => {
    it('should return sessions', async () => {
      const server = new PipelineServer({ port: 0 });
      await server.start();
      const data = await fetchAs<unknown[]>(`http://localhost:${server.port}/sessions`);
      expect(Array.isArray(data)).toBe(true);
      await server.stop();
    });
  });

  describe('event routing', () => {
    it('should route events through pipeline', async () => {
      const handler = {
        name: 'Init',
        handle: async () => ({ type: 'Ready', data: {} }),
      };
      const pipeline = define('test').on('Ready').emit('Next', {}).build();
      const server = new PipelineServer({ port: 0 });
      server.registerCommandHandlers([handler]);
      server.registerPipeline(pipeline);
      await server.start();
      await fetch(`http://localhost:${server.port}/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'Init', data: {} }),
      });
      await new Promise((r) => setTimeout(r, 100));
      const msgs = await fetchAs<StoredMessage[]>(`http://localhost:${server.port}/messages`);
      expect(msgs.some((m) => m.message.type === 'Next')).toBe(true);
      await server.stop();
    });

    it('should handle custom handler that emits events', async () => {
      const handler = {
        name: 'Start',
        handle: async () => ({ type: 'Started', data: {} }),
      };
      const pipeline = define('test')
        .on('Started')
        .handle(async (_e, ctx) => {
          await ctx.emit('CustomEvent', { emitted: true });
        })
        .build();
      const server = new PipelineServer({ port: 0 });
      server.registerCommandHandlers([handler]);
      server.registerPipeline(pipeline);
      await server.start();
      await fetch(`http://localhost:${server.port}/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'Start', data: {} }),
      });
      await new Promise((r) => setTimeout(r, 100));
      const msgs = await fetchAs<StoredMessage[]>(`http://localhost:${server.port}/messages`);
      expect(msgs.some((m) => m.message.type === 'CustomEvent')).toBe(true);
      await server.stop();
    });
  });

  describe('integration', () => {
    it('should execute complete workflow', async () => {
      const handler = {
        name: 'Gen',
        alias: 'gen',
        description: '',
        fields: {},
        examples: [],
        events: ['Done'],
        handle: async () => ({ type: 'Done', data: { id: '1' } }),
      };
      const pipeline = define('wf')
        .on('Done')
        .emit('Process', (e: { data: { id: string } }) => ({ x: e.data.id }))
        .build();
      const server = new PipelineServer({ port: 0 });
      server.registerCommandHandlers([handler]);
      server.registerPipeline(pipeline);
      await server.start();
      await fetch(`http://localhost:${server.port}/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'Gen', data: {} }),
      });
      await new Promise((r) => setTimeout(r, 200));
      const msgs = await fetchAs<StoredMessage[]>(`http://localhost:${server.port}/messages`);
      expect(msgs.some((m) => m.message.type === 'Process')).toBe(true);
      await server.stop();
    });
  });
});
