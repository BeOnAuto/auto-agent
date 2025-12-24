import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadPipelineConfig } from '../config/pipeline-config';
import { PipelineServer } from '../server/pipeline-server';
import { resetKanbanState } from './fixtures/kanban-full.pipeline';
import kanbanTodoConfig from './fixtures/kanban-todo.config';

interface StoredMessage {
  message: {
    type: string;
    data: Record<string, unknown>;
    requestId?: string;
    correlationId?: string;
  };
  messageType: 'command' | 'event';
  position: string;
}

describe('Server Startup E2E', () => {
  let server: PipelineServer;

  beforeAll(async () => {
    const loaded = await loadPipelineConfig(kanbanTodoConfig);
    server = new PipelineServer({ port: 0 });
    server.registerCommandHandlers(loaded.handlers);
    server.registerPipeline(loaded.pipeline);
    await server.start();
  }, 30000);

  afterAll(async () => {
    await server.stop();
  });

  beforeEach(() => {
    resetKanbanState();
  });

  describe('StartServer and StartClient handlers', () => {
    it('should have StartServer handler registered', () => {
      const commands = server.getRegisteredCommands();
      expect(commands).toContain('StartServer');
    });

    it('should have StartClient handler registered', () => {
      const commands = server.getRegisteredCommands();
      expect(commands).toContain('StartClient');
    });

    it('should expose StartServer in registry API', async () => {
      const response = await fetch(`http://localhost:${server.port}/registry`);
      const registry = (await response.json()) as {
        commandHandlers: string[];
        commandsWithMetadata: Array<{ name: string; alias?: string; description?: string }>;
      };

      expect(registry.commandHandlers).toContain('StartServer');

      const startServerMeta = registry.commandsWithMetadata.find((c) => c.name === 'StartServer');
      expect(startServerMeta).toBeDefined();
      expect(startServerMeta?.alias).toBe('start:server');
      expect(startServerMeta?.description).toBe('Start the development server');
    });

    it('should expose StartClient in registry API', async () => {
      const response = await fetch(`http://localhost:${server.port}/registry`);
      const registry = (await response.json()) as {
        commandHandlers: string[];
        commandsWithMetadata: Array<{ name: string; alias?: string; description?: string }>;
      };

      expect(registry.commandHandlers).toContain('StartClient');

      const startClientMeta = registry.commandsWithMetadata.find((c) => c.name === 'StartClient');
      expect(startClientMeta).toBeDefined();
      expect(startClientMeta?.alias).toBe('start:client');
      expect(startClientMeta?.description).toBe('Start the development client');
    });
  });

  describe('Pipeline routing for StartServer and StartClient', () => {
    it('should have ServerGenerated -> StartServer edge in pipeline graph', async () => {
      const response = await fetch(`http://localhost:${server.port}/pipeline`);
      const graph = (await response.json()) as {
        edges: Array<{ from: string; to: string }>;
        eventToCommand: Record<string, string>;
      };

      const serverGeneratedEdge = graph.edges.find(
        (e) => e.from === 'evt:ServerGenerated' && e.to === 'cmd:StartServer',
      );
      expect(serverGeneratedEdge).toBeDefined();
    });

    it('should have ClientGenerated -> StartClient edge in pipeline graph', async () => {
      const response = await fetch(`http://localhost:${server.port}/pipeline`);
      const graph = (await response.json()) as {
        edges: Array<{ from: string; to: string }>;
        eventToCommand: Record<string, string>;
      };

      const clientGeneratedEdge = graph.edges.find(
        (e) => e.from === 'evt:ClientGenerated' && e.to === 'cmd:StartClient',
      );
      expect(clientGeneratedEdge).toBeDefined();
    });
  });

  describe('StartServer command dispatch', () => {
    it('should accept StartServer command and return ServerStartFailed for missing directory', async () => {
      const response = await fetch(`http://localhost:${server.port}/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'StartServer',
          data: { serverDirectory: '/nonexistent/path' },
        }),
      });

      const result = (await response.json()) as { status: string; commandId: string };
      expect(result.status).toBe('ack');

      await new Promise((r) => setTimeout(r, 200));

      const messagesResponse = await fetch(`http://localhost:${server.port}/messages`);
      const messages = (await messagesResponse.json()) as StoredMessage[];

      const serverEvent = messages.find(
        (m) => m.message.type === 'ServerStarted' || m.message.type === 'ServerStartFailed',
      );

      expect(serverEvent).toBeDefined();
      expect(serverEvent?.message.type).toBe('ServerStartFailed');
    });
  });

  describe('StartClient command dispatch', () => {
    it('should accept StartClient command and return ClientStartFailed for missing directory', async () => {
      const response = await fetch(`http://localhost:${server.port}/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'StartClient',
          data: { clientDirectory: '/nonexistent/path' },
        }),
      });

      const result = (await response.json()) as { status: string; commandId: string };
      expect(result.status).toBe('ack');

      await new Promise((r) => setTimeout(r, 200));

      const messagesResponse = await fetch(`http://localhost:${server.port}/messages`);
      const messages = (await messagesResponse.json()) as StoredMessage[];

      const clientEvent = messages.find(
        (m) => m.message.type === 'ClientStarted' || m.message.type === 'ClientStartFailed',
      );

      expect(clientEvent).toBeDefined();
      expect(clientEvent?.message.type).toBe('ClientStartFailed');
    });
  });
});
