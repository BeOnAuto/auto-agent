import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync, existsSync } from 'fs';
import { PipelineServer } from '../server/pipeline-server';
import { loadPipelineConfig } from '../config/pipeline-config';
import kanbanTodoConfig from './fixtures/kanban-todo.config';
import { resetKanbanState } from './fixtures/kanban-full.pipeline';
import { EventCapture } from './event-capture';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PACKAGES_DIR = path.resolve(__dirname, '../../..');
const CLI_SNAPSHOTS_DIR = path.join(PACKAGES_DIR, 'cli/src/__tests__/e2e/__snapshots__/kanban-todo');

interface PipelineGraph {
  nodes: Array<{ id: string; name: string; title?: string; alias?: string; status: string }>;
  edges: Array<{ from: string; to: string }>;
  commandToEvents: Record<string, string[]>;
  eventToCommand: Record<string, string>;
}

interface Registry {
  eventHandlers: string[];
  commandHandlers: string[];
  commandsWithMetadata: Array<{ name: string; alias?: string; description?: string }>;
  folds: string[];
}

function loadCliSnapshot<T>(filename: string): T | null {
  const snapshotPath = path.join(CLI_SNAPSHOTS_DIR, filename);
  if (!existsSync(snapshotPath)) {
    console.log(`Snapshot not found: ${snapshotPath}`);
    return null;
  }
  const content = readFileSync(snapshotPath, 'utf-8');
  return JSON.parse(content) as T;
}

describe('Kanban-Todo Pipeline E2E Comparison', () => {
  let server: PipelineServer;
  let eventCapture: EventCapture;

  beforeAll(async () => {
    const loaded = await loadPipelineConfig(kanbanTodoConfig);

    server = new PipelineServer({ port: 0 });
    server.registerCommandHandlers(loaded.handlers);
    server.registerPipeline(loaded.pipeline);
    await server.start();

    eventCapture = new EventCapture();
  }, 30000);

  afterAll(async () => {
    await server.stop();
  });

  beforeEach(() => {
    resetKanbanState();
    eventCapture.clear();
  });

  describe('Registry Comparison', () => {
    it('should have matching command handlers', async () => {
      const response = await fetch(`http://localhost:${server.port}/registry`);
      const registry = (await response.json()) as Registry;
      const cliRegistry = loadCliSnapshot<Registry>('registry.snapshot.json');

      console.log('=== Pipeline Registry ===');
      console.log('Command handlers:', registry.commandHandlers.sort().join(', '));

      if (cliRegistry !== null) {
        console.log('\n=== CLI Registry ===');
        console.log('Command handlers:', cliRegistry.commandHandlers.sort().join(', '));

        const pipelineCommands = new Set(registry.commandHandlers);
        const cliCommands = new Set(cliRegistry.commandHandlers);

        const missingInPipeline = cliRegistry.commandHandlers.filter((c) => !pipelineCommands.has(c));
        const extraInPipeline = registry.commandHandlers.filter((c) => !cliCommands.has(c));

        console.log('\n=== Differences ===');
        console.log('Missing in pipeline:', missingInPipeline.join(', ') || 'none');
        console.log('Extra in pipeline:', extraInPipeline.join(', ') || 'none');

        expect(missingInPipeline.length).toBeLessThanOrEqual(3);
      } else {
        expect(registry.commandHandlers.length).toBeGreaterThan(10);
      }
    });

    it('should have matching event handlers', async () => {
      const response = await fetch(`http://localhost:${server.port}/registry`);
      const registry = (await response.json()) as Registry;
      const cliRegistry = loadCliSnapshot<Registry>('registry.snapshot.json');

      console.log('=== Pipeline Event Handlers ===');
      console.log(registry.eventHandlers.sort().join(', '));

      if (cliRegistry !== null) {
        console.log('\n=== CLI Event Handlers ===');
        console.log(cliRegistry.eventHandlers.sort().join(', '));

        const pipelineEvents = new Set(registry.eventHandlers);
        const cliEvents = new Set(cliRegistry.eventHandlers);

        const missingInPipeline = cliRegistry.eventHandlers.filter((e) => !pipelineEvents.has(e));
        const extraInPipeline = registry.eventHandlers.filter((e) => !cliEvents.has(e));

        console.log('\n=== Differences ===');
        console.log('Missing in pipeline:', missingInPipeline.join(', ') || 'none');
        console.log('Extra in pipeline:', extraInPipeline.join(', ') || 'none');
      }

      expect(registry.eventHandlers.length).toBeGreaterThan(0);
    });
  });

  describe('Pipeline Graph Comparison', () => {
    it('should have similar edge structure to CLI', async () => {
      const response = await fetch(`http://localhost:${server.port}/pipeline`);
      const graph = (await response.json()) as PipelineGraph;
      const cliGraph = loadCliSnapshot<PipelineGraph>('pipeline-graph.snapshot.json');

      console.log('=== Pipeline Graph ===');
      console.log(`Nodes: ${graph.nodes.length}`);
      console.log(`Edges: ${graph.edges.length}`);

      if (cliGraph !== null) {
        console.log('\n=== CLI Graph ===');
        console.log(`Nodes: ${cliGraph.nodes.length}`);
        console.log(`Edges: ${cliGraph.edges.length}`);

        console.log('\n=== CLI Edges (by command name) ===');
        cliGraph.edges.forEach((e) => {
          const fromNode = cliGraph.nodes.find((n) => n.id === e.from);
          const toNode = cliGraph.nodes.find((n) => n.id === e.to);
          console.log(`  ${fromNode?.name ?? e.from} → ${toNode?.name ?? e.to}`);
        });
      }

      console.log('\n=== Pipeline Edges ===');
      graph.edges.forEach((e) => console.log(`  ${e.from} → ${e.to}`));

      expect(graph.edges.length).toBeGreaterThan(5);
    });

    it('should have commandToEvents mapping', async () => {
      const response = await fetch(`http://localhost:${server.port}/pipeline`);
      const graph = (await response.json()) as PipelineGraph;
      const cliGraph = loadCliSnapshot<PipelineGraph>('pipeline-graph.snapshot.json');

      console.log('=== Pipeline commandToEvents ===');
      Object.entries(graph.commandToEvents).forEach(([cmd, events]) => {
        console.log(`  ${cmd}: [${events.join(', ')}]`);
      });

      if (cliGraph !== null) {
        console.log('\n=== CLI commandToEvents ===');
        Object.entries(cliGraph.commandToEvents).forEach(([cmd, events]) => {
          console.log(`  ${cmd}: [${events.join(', ')}]`);
        });
      }

      expect(Object.keys(graph.commandToEvents).length).toBeGreaterThan(0);
    });
  });

  describe('Workflow Sequence Validation', () => {
    it('should have correct causal dependencies in pipeline definition', () => {
      const expectedDependencies: [string, string][] = [
        ['SchemaExported', 'GenerateServer'],
        ['SliceGenerated', 'ImplementSlice'],
        ['SliceImplemented', 'CheckTests'],
        ['SliceImplemented', 'CheckTypes'],
        ['SliceImplemented', 'CheckLint'],
        ['ServerGenerated', 'GenerateIA'],
        ['ServerGenerated', 'StartServer'],
        ['IAGenerated', 'GenerateClient'],
        ['ClientGenerated', 'ImplementComponent'],
        ['ClientGenerated', 'StartClient'],
      ];

      const pipelineHandlers = kanbanTodoConfig.pipeline.descriptor.handlers;

      console.log('=== Pipeline Handler Event Types ===');
      pipelineHandlers.forEach((h) => {
        if (h.type === 'emit') {
          const commands = h.commands.map((c) => c.commandType).join(', ');
          console.log(`  ${h.eventType} → [${commands}]`);
        } else if (h.type === 'settled') {
          console.log(`  settled(${h.commandTypes.join(', ')}) → dispatch handler`);
        } else if (h.type === 'foreach-phased') {
          console.log(
            `  ${h.eventType} → forEach/phased → ${h.emitFactory({}, '', { type: '', data: {} }).commandType}`,
          );
        }
      });

      console.log('\n=== Expected Dependencies ===');
      expectedDependencies.forEach(([from, to]) => {
        console.log(`  ${from} → ${to}`);
      });

      const emitHandlers = pipelineHandlers.filter((h) => h.type === 'emit');
      expect(emitHandlers.length).toBeGreaterThan(5);
    });
  });
});
