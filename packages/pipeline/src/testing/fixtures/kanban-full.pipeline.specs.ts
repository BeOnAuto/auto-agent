import { describe, it, expect, beforeEach } from 'vitest';
import { createKanbanFullPipeline, resetKanbanState } from './kanban-full.pipeline';
import type { EmitHandlerDescriptor, ForEachPhasedDescriptor } from '../../core/descriptors';

describe('kanban-full.pipeline', () => {
  beforeEach(() => {
    resetKanbanState();
  });

  describe('pipeline structure', () => {
    it('should have name kanban-full', () => {
      const pipeline = createKanbanFullPipeline();
      expect(pipeline.descriptor.name).toBe('kanban-full');
    });

    it('should have emit handlers for schema export', () => {
      const pipeline = createKanbanFullPipeline();
      const emitHandlers = pipeline.descriptor.handlers.filter((h): h is EmitHandlerDescriptor => h.type === 'emit');
      const eventTypes = emitHandlers.map((h) => h.eventType);
      expect(eventTypes).toContain('SchemaExported');
    });

    it('should have settled handler for slice checks', () => {
      const pipeline = createKanbanFullPipeline();
      const settledHandlers = pipeline.descriptor.handlers.filter((h) => h.type === 'settled');
      expect(settledHandlers.length).toBeGreaterThan(0);
      const commandTypes = settledHandlers[0].commandTypes;
      expect(commandTypes).toContain('CheckTests');
      expect(commandTypes).toContain('CheckTypes');
      expect(commandTypes).toContain('CheckLint');
    });

    it('should have foreach-phased handler for client components', () => {
      const pipeline = createKanbanFullPipeline();
      const foreachHandlers = pipeline.descriptor.handlers.filter((h) => h.type === 'foreach-phased');
      expect(foreachHandlers.length).toBeGreaterThan(0);
    });
  });

  describe('command data shapes', () => {
    function findEmitCommand(
      pipeline: ReturnType<typeof createKanbanFullPipeline>,
      eventType: string,
      commandType: string,
    ) {
      const emitHandlers = pipeline.descriptor.handlers.filter(
        (h): h is EmitHandlerDescriptor => h.type === 'emit' && h.eventType === eventType,
      );
      for (const handler of emitHandlers) {
        const cmd = handler.commands.find((c) => c.commandType === commandType);
        if (cmd) return cmd;
      }
      return undefined;
    }

    it('should emit GenerateServer with modelPath and destination', () => {
      const pipeline = createKanbanFullPipeline();
      const cmd = findEmitCommand(pipeline, 'SchemaExported', 'GenerateServer');
      expect(cmd).toBeDefined();
      const data =
        typeof cmd?.data === 'function'
          ? cmd.data({
              type: 'SchemaExported',
              data: { outputPath: './.context/schema.json', directory: '.' },
            })
          : cmd?.data;
      expect(data).toEqual({
        modelPath: './.context/schema.json',
        destination: '.',
      });
    });

    it('should emit ImplementSlice with slicePath, context, and aiOptions', () => {
      const pipeline = createKanbanFullPipeline();
      const cmd = findEmitCommand(pipeline, 'SliceGenerated', 'ImplementSlice');
      expect(cmd).toBeDefined();
      const data =
        typeof cmd?.data === 'function'
          ? cmd.data({ type: 'SliceGenerated', data: { slicePath: './adds-todo' } })
          : cmd?.data;
      expect(data).toEqual({
        slicePath: './adds-todo',
        context: { previousOutputs: 'errors', attemptNumber: 0 },
        aiOptions: { maxTokens: 2000 },
      });
    });

    it('should emit CheckTests with targetDirectory and scope', () => {
      const pipeline = createKanbanFullPipeline();
      const cmd = findEmitCommand(pipeline, 'SliceImplemented', 'CheckTests');
      expect(cmd).toBeDefined();
      const data =
        typeof cmd?.data === 'function'
          ? cmd.data({ type: 'SliceImplemented', data: { slicePath: './adds-todo' } })
          : cmd?.data;
      expect(data).toEqual({
        targetDirectory: './adds-todo',
        scope: 'slice',
      });
    });

    it('should emit CheckTypes with targetDirectory and scope', () => {
      const pipeline = createKanbanFullPipeline();
      const cmd = findEmitCommand(pipeline, 'SliceImplemented', 'CheckTypes');
      expect(cmd).toBeDefined();
      const data =
        typeof cmd?.data === 'function'
          ? cmd.data({ type: 'SliceImplemented', data: { slicePath: './adds-todo' } })
          : cmd?.data;
      expect(data).toEqual({
        targetDirectory: './adds-todo',
        scope: 'slice',
      });
    });

    it('should emit CheckLint with targetDirectory, scope, and fix', () => {
      const pipeline = createKanbanFullPipeline();
      const cmd = findEmitCommand(pipeline, 'SliceImplemented', 'CheckLint');
      expect(cmd).toBeDefined();
      const data =
        typeof cmd?.data === 'function'
          ? cmd.data({ type: 'SliceImplemented', data: { slicePath: './adds-todo' } })
          : cmd?.data;
      expect(data).toEqual({
        targetDirectory: './adds-todo',
        scope: 'slice',
        fix: true,
      });
    });

    it('should emit GenerateIA with modelPath and outputDir', () => {
      const pipeline = createKanbanFullPipeline();
      const cmd = findEmitCommand(pipeline, 'ServerGenerated', 'GenerateIA');
      expect(cmd).toBeDefined();
      const data = typeof cmd?.data === 'function' ? cmd.data({ type: 'ServerGenerated', data: {} }) : cmd?.data;
      expect(data).toEqual({
        modelPath: './.context/schema.json',
        outputDir: './.context',
      });
    });

    it('should emit StartServer with serverDirectory', () => {
      const pipeline = createKanbanFullPipeline();
      const cmd = findEmitCommand(pipeline, 'ServerGenerated', 'StartServer');
      expect(cmd).toBeDefined();
      const data = typeof cmd?.data === 'function' ? cmd.data({ type: 'ServerGenerated', data: {} }) : cmd?.data;
      expect(data).toEqual({
        serverDirectory: './server',
      });
    });

    it('should emit GenerateClient with all paths', () => {
      const pipeline = createKanbanFullPipeline();
      const cmd = findEmitCommand(pipeline, 'IAGenerated', 'GenerateClient');
      expect(cmd).toBeDefined();
      const data = typeof cmd?.data === 'function' ? cmd.data({ type: 'IAGenerated', data: {} }) : cmd?.data;
      expect(data).toEqual({
        targetDir: './client',
        iaSchemaPath: './.context/auto-ia-scheme.json',
        gqlSchemaPath: './.context/schema.graphql',
        figmaVariablesPath: './.context/figma-file.json',
      });
    });
  });

  describe('ClientGenerated with StartClient', () => {
    it('should emit StartClient when ClientGenerated has valid components', () => {
      const pipeline = createKanbanFullPipeline();
      const emitHandlers = pipeline.descriptor.handlers.filter(
        (h): h is EmitHandlerDescriptor =>
          h.type === 'emit' && h.eventType === 'ClientGenerated' && h.predicate !== undefined,
      );
      const startClientHandler = emitHandlers.find((h) => h.commands.some((c) => c.commandType === 'StartClient'));
      expect(startClientHandler).toBeDefined();
      const startClientCmd = startClientHandler?.commands.find((c) => c.commandType === 'StartClient');
      expect(startClientCmd).toBeDefined();
      const data =
        typeof startClientCmd?.data === 'function'
          ? startClientCmd.data({ type: 'ClientGenerated', data: { components: [], targetDir: './client' } })
          : startClientCmd?.data;
      expect(data).toEqual({ clientDirectory: './client' });
    });

    it('should have predicate for StartClient that checks valid components', () => {
      const pipeline = createKanbanFullPipeline();
      const emitHandlers = pipeline.descriptor.handlers.filter(
        (h): h is EmitHandlerDescriptor =>
          h.type === 'emit' && h.eventType === 'ClientGenerated' && h.predicate !== undefined,
      );
      const startClientHandler = emitHandlers.find((h) => h.commands.some((c) => c.commandType === 'StartClient'));
      const predicate = startClientHandler?.predicate;
      expect(
        predicate?.({ type: 'ClientGenerated', data: { components: [{ type: 'molecule', filePath: 'x' }] } }),
      ).toBe(true);
      expect(predicate?.({ type: 'ClientGenerated', data: { components: [] } })).toBe(false);
    });
  });

  describe('ClientGenerated edge cases', () => {
    it('should have predicate on foreach-phased handler to check for valid components', () => {
      const pipeline = createKanbanFullPipeline();
      const foreachHandler = pipeline.descriptor.handlers.find(
        (h): h is ForEachPhasedDescriptor => h.type === 'foreach-phased' && h.eventType === 'ClientGenerated',
      );
      expect(foreachHandler).toBeDefined();
      expect(foreachHandler?.predicate).toBeDefined();
    });

    it('should predicate return true when components array has items', () => {
      const pipeline = createKanbanFullPipeline();
      const foreachHandler = pipeline.descriptor.handlers.find(
        (h): h is ForEachPhasedDescriptor => h.type === 'foreach-phased' && h.eventType === 'ClientGenerated',
      );
      const predicate = foreachHandler?.predicate;
      const eventWithComponents = {
        type: 'ClientGenerated',
        data: {
          components: [{ type: 'molecule', filePath: 'src/Foo.tsx' }],
          targetDir: './client',
        },
      };
      expect(predicate?.(eventWithComponents)).toBe(true);
    });

    it('should predicate return false when data is null', () => {
      const pipeline = createKanbanFullPipeline();
      const foreachHandler = pipeline.descriptor.handlers.find(
        (h): h is ForEachPhasedDescriptor => h.type === 'foreach-phased' && h.eventType === 'ClientGenerated',
      );
      const predicate = foreachHandler?.predicate;
      const eventWithNullData = { type: 'ClientGenerated', data: null as unknown as Record<string, unknown> };
      expect(predicate?.(eventWithNullData)).toBe(false);
    });

    it('should predicate return false when components is not an array', () => {
      const pipeline = createKanbanFullPipeline();
      const foreachHandler = pipeline.descriptor.handlers.find(
        (h): h is ForEachPhasedDescriptor => h.type === 'foreach-phased' && h.eventType === 'ClientGenerated',
      );
      const predicate = foreachHandler?.predicate;
      const eventWithInvalidComponents = { type: 'ClientGenerated', data: { components: 'not-array' } };
      expect(predicate?.(eventWithInvalidComponents)).toBe(false);
    });

    it('should predicate return false when components array is empty', () => {
      const pipeline = createKanbanFullPipeline();
      const foreachHandler = pipeline.descriptor.handlers.find(
        (h): h is ForEachPhasedDescriptor => h.type === 'foreach-phased' && h.eventType === 'ClientGenerated',
      );
      const predicate = foreachHandler?.predicate;
      const eventWithEmptyComponents = { type: 'ClientGenerated', data: { components: [] } };
      expect(predicate?.(eventWithEmptyComponents)).toBe(false);
    });

    it('should have fallback emit handler for invalid ClientGenerated data', () => {
      const pipeline = createKanbanFullPipeline();
      const fallbackHandler = pipeline.descriptor.handlers.find(
        (h): h is EmitHandlerDescriptor =>
          h.type === 'emit' &&
          h.eventType === 'ClientGenerated' &&
          h.predicate !== undefined &&
          h.commands.some((c) => c.commandType === 'ImplementComponent'),
      );
      expect(fallbackHandler).toBeDefined();
      const fallbackPredicate = fallbackHandler?.predicate;
      expect(fallbackPredicate?.({ type: 'ClientGenerated', data: null as unknown as Record<string, unknown> })).toBe(
        true,
      );
      expect(fallbackPredicate?.({ type: 'ClientGenerated', data: { components: [] } })).toBe(true);
    });

    it('should fallback handler emit ImplementComponent with example data', () => {
      const pipeline = createKanbanFullPipeline();
      const fallbackHandler = pipeline.descriptor.handlers.find(
        (h): h is EmitHandlerDescriptor =>
          h.type === 'emit' &&
          h.eventType === 'ClientGenerated' &&
          h.predicate !== undefined &&
          h.commands.some((c) => c.commandType === 'ImplementComponent'),
      );
      const implementCmd = fallbackHandler?.commands.find((c) => c.commandType === 'ImplementComponent');
      expect(implementCmd).toBeDefined();
      const data =
        typeof implementCmd?.data === 'function'
          ? implementCmd.data({ type: 'ClientGenerated', data: null as unknown as Record<string, unknown> })
          : implementCmd?.data;
      expect(data).toEqual({
        projectDir: './client',
        iaSchemeDir: './.context',
        designSystemPath: './.context/design-system.md',
        componentType: 'molecule',
        filePath: 'client/src/components/molecules/Example.tsx',
        componentName: 'Example.tsx',
        aiOptions: { maxTokens: 3000 },
      });
    });
  });
});
