import { describe, it, expect, beforeEach } from 'vitest';
import { PipelineServer } from '../server/pipeline-server';
import { loadPipelineConfig } from '../config/pipeline-config';
import kanbanTodoConfig from './fixtures/kanban-todo.config';
import { resetKanbanState } from './fixtures/kanban-full.pipeline';

describe('Real Plugin E2E', () => {
  beforeEach(() => {
    resetKanbanState();
  });

  describe('Load and Run Pipeline Config', () => {
    it('should load handlers from config and register them', async () => {
      const loaded = await loadPipelineConfig(kanbanTodoConfig);

      console.log('=== Loaded Handlers ===');
      console.log(`Total handlers loaded: ${loaded.handlers.length}`);
      console.log('Handler names:', loaded.handlers.map((h) => h.name).join(', '));

      expect(loaded.handlers.length).toBeGreaterThan(0);
      expect(loaded.pipeline.descriptor.name).toBe('kanban-full');
    });

    it('should start server with real config', async () => {
      const loaded = await loadPipelineConfig(kanbanTodoConfig);

      const server = new PipelineServer({ port: 0 });
      server.registerCommandHandlers(loaded.handlers);
      server.registerPipeline(loaded.pipeline);
      await server.start();

      const registeredCommands = server.getRegisteredCommands();
      console.log('=== Registered Commands ===');
      registeredCommands.forEach((cmd) => console.log(`  - ${cmd}`));

      expect(registeredCommands.length).toBe(loaded.handlers.length);

      await server.stop();
    });

    it('should serve pipeline graph via API', async () => {
      const loaded = await loadPipelineConfig(kanbanTodoConfig);

      const server = new PipelineServer({ port: 0 });
      server.registerCommandHandlers(loaded.handlers);
      server.registerPipeline(loaded.pipeline);
      await server.start();

      const response = await fetch(`http://localhost:${server.port}/pipeline`);
      const text = await response.text();

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('application/json');

      const graph = JSON.parse(text) as {
        nodes: Array<{ id: string; name: string }>;
        edges: Array<{ from: string; to: string }>;
      };

      console.log('=== Pipeline Graph ===');
      console.log(`Nodes: ${graph.nodes.length}`);
      console.log(`Edges: ${graph.edges.length}`);

      expect(graph.nodes.length).toBeGreaterThan(0);
      expect(graph.edges.length).toBeGreaterThan(0);

      await server.stop();
    });

    it('should serve registry via API', async () => {
      const loaded = await loadPipelineConfig(kanbanTodoConfig);

      const server = new PipelineServer({ port: 0 });
      server.registerCommandHandlers(loaded.handlers);
      server.registerPipeline(loaded.pipeline);
      await server.start();

      const response = await fetch(`http://localhost:${server.port}/registry`);
      const registry = (await response.json()) as {
        eventHandlers: string[];
        commandHandlers: string[];
        commandsWithMetadata: Array<{ name: string; alias: string; description: string }>;
      };

      console.log('=== Registry ===');
      console.log('Event handlers:', registry.eventHandlers.join(', '));
      console.log('Command handlers:', registry.commandHandlers.join(', '));

      expect(registry.commandHandlers.length).toBeGreaterThan(0);

      await server.stop();
    });
  });
});
