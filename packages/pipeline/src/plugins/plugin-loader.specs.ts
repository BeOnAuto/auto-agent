import { describe, it, expect, vi } from 'vitest';
import { PluginLoader, type PluginLoaderDeps } from './plugin-loader';

function createMockDeps(overrides?: Partial<PluginLoaderDeps>): PluginLoaderDeps {
  return {
    existsSync: vi.fn().mockReturnValue(false),
    importModule: vi.fn().mockResolvedValue(null),
    ...overrides,
  };
}

function createMockHandler(name: string, events?: string[]) {
  return {
    name,
    alias: `${name.toLowerCase()}:cmd`,
    description: `${name} handler`,
    events: events ?? [`${name}Done`],
    fields: { field1: { type: 'string' } },
    handle: vi.fn().mockResolvedValue({ type: `${name}Done`, data: {} }),
  };
}

describe('PluginLoader', () => {
  describe('loadPlugin', () => {
    it('should load COMMANDS from workspace package', async () => {
      const mockHandler = createMockHandler('CheckTests', ['TestsCheckPassed', 'TestsCheckFailed']);
      const deps = createMockDeps({
        existsSync: vi.fn().mockImplementation((path: string) => path.includes('packages/server-checks')),
        importModule: vi.fn().mockResolvedValue({ COMMANDS: [mockHandler] }),
      });

      const loader = new PluginLoader('/workspace', deps);
      const handlers = await loader.loadPlugin('@auto-engineer/server-checks');

      expect(handlers).toHaveLength(1);
      expect(handlers[0].name).toBe('CheckTests');
      expect(handlers[0].events).toEqual(['TestsCheckPassed', 'TestsCheckFailed']);
    });

    it('should load COMMANDS from node_modules when workspace not found', async () => {
      const mockHandler = createMockHandler('GenerateServer');
      const deps = createMockDeps({
        existsSync: vi.fn().mockImplementation((path: string) => path.includes('node_modules')),
        importModule: vi.fn().mockResolvedValue({ COMMANDS: [mockHandler] }),
      });

      const loader = new PluginLoader('/workspace', deps);
      const handlers = await loader.loadPlugin('@auto-engineer/server-generator');

      expect(handlers).toHaveLength(1);
      expect(handlers[0].name).toBe('GenerateServer');
      expect(deps.existsSync).toHaveBeenCalled();
    });

    it('should fallback to direct import when neither workspace nor node_modules found', async () => {
      const mockHandler = createMockHandler('DirectImport');
      const deps = createMockDeps({
        existsSync: vi.fn().mockReturnValue(false),
        importModule: vi.fn().mockResolvedValue({ COMMANDS: [mockHandler] }),
      });

      const loader = new PluginLoader('/workspace', deps);
      const handlers = await loader.loadPlugin('some-package');

      expect(handlers).toHaveLength(1);
      expect(handlers[0].name).toBe('DirectImport');
      expect(deps.importModule).toHaveBeenCalledWith('some-package');
    });

    it('should return empty array when import fails', async () => {
      const deps = createMockDeps({
        existsSync: vi.fn().mockReturnValue(false),
        importModule: vi.fn().mockRejectedValue(new Error('Module not found')),
      });

      const loader = new PluginLoader('/workspace', deps);
      const handlers = await loader.loadPlugin('@auto-engineer/nonexistent');

      expect(handlers).toEqual([]);
    });

    it('should extract handler metadata', async () => {
      const mockHandler = {
        name: 'CheckTypes',
        alias: 'check:types',
        description: 'Type checking',
        events: ['TypeCheckPassed', 'TypeCheckFailed'],
        fields: { targetDir: { type: 'string', required: true } },
        handle: vi.fn(),
      };
      const deps = createMockDeps({
        existsSync: vi.fn().mockReturnValue(true),
        importModule: vi.fn().mockResolvedValue({ COMMANDS: [mockHandler] }),
      });

      const loader = new PluginLoader('/workspace', deps);
      const handlers = await loader.loadPlugin('@auto-engineer/server-checks');

      expect(handlers[0]).toEqual({
        name: 'CheckTypes',
        alias: 'check:types',
        description: 'Type checking',
        events: ['TypeCheckPassed', 'TypeCheckFailed'],
        fields: { targetDir: { type: 'string', required: true } },
        handle: mockHandler.handle,
      });
    });

    it('should skip invalid handlers in COMMANDS array', async () => {
      const validHandler = createMockHandler('Valid');
      const deps = createMockDeps({
        existsSync: vi.fn().mockReturnValue(true),
        importModule: vi.fn().mockResolvedValue({
          COMMANDS: [validHandler, { notAHandler: true }, null, 'string', { name: 'NoHandle' }],
        }),
      });

      const loader = new PluginLoader('/workspace', deps);
      const handlers = await loader.loadPlugin('@auto-engineer/test');

      expect(handlers).toHaveLength(1);
      expect(handlers[0].name).toBe('Valid');
    });

    it('should handle module that is not an object', async () => {
      const deps = createMockDeps({
        existsSync: vi.fn().mockReturnValue(true),
        importModule: vi.fn().mockResolvedValue('not an object'),
      });

      const loader = new PluginLoader('/workspace', deps);
      const handlers = await loader.loadPlugin('@auto-engineer/test');

      expect(handlers).toEqual([]);
    });

    it('should handle null module', async () => {
      const deps = createMockDeps({
        existsSync: vi.fn().mockReturnValue(true),
        importModule: vi.fn().mockResolvedValue(null),
      });

      const loader = new PluginLoader('/workspace', deps);
      const handlers = await loader.loadPlugin('@auto-engineer/test');

      expect(handlers).toEqual([]);
    });

    it('should extract COMMANDS from default export', async () => {
      const mockHandler = createMockHandler('FromDefault');
      const deps = createMockDeps({
        existsSync: vi.fn().mockReturnValue(true),
        importModule: vi.fn().mockResolvedValue({
          default: { COMMANDS: [mockHandler] },
        }),
      });

      const loader = new PluginLoader('/workspace', deps);
      const handlers = await loader.loadPlugin('@auto-engineer/test');

      expect(handlers).toHaveLength(1);
      expect(handlers[0].name).toBe('FromDefault');
    });

    it('should return empty when default export has no COMMANDS', async () => {
      const deps = createMockDeps({
        existsSync: vi.fn().mockReturnValue(true),
        importModule: vi.fn().mockResolvedValue({
          default: { somethingElse: true },
        }),
      });

      const loader = new PluginLoader('/workspace', deps);
      const handlers = await loader.loadPlugin('@auto-engineer/test');

      expect(handlers).toEqual([]);
    });

    it('should return empty when default export is not an object', async () => {
      const deps = createMockDeps({
        existsSync: vi.fn().mockReturnValue(true),
        importModule: vi.fn().mockResolvedValue({
          default: 'not an object',
        }),
      });

      const loader = new PluginLoader('/workspace', deps);
      const handlers = await loader.loadPlugin('@auto-engineer/test');

      expect(handlers).toEqual([]);
    });

    it('should return empty when extractCommands throws', async () => {
      const deps = createMockDeps({
        existsSync: vi.fn().mockReturnValue(true),
        importModule: vi.fn().mockImplementation(() => {
          throw new Error('Unexpected error');
        }),
      });

      const loader = new PluginLoader('/workspace', deps);
      const handlers = await loader.loadPlugin('@auto-engineer/test');

      expect(handlers).toEqual([]);
    });
  });

  describe('loadPlugins', () => {
    it('should load handlers from multiple packages', async () => {
      const handler1 = createMockHandler('Handler1');
      const handler2 = createMockHandler('Handler2');
      const deps = createMockDeps({
        existsSync: vi.fn().mockReturnValue(true),
        importModule: vi
          .fn()
          .mockResolvedValueOnce({ COMMANDS: [handler1] })
          .mockResolvedValueOnce({ COMMANDS: [handler2] }),
      });

      const loader = new PluginLoader('/workspace', deps);
      const handlers = await loader.loadPlugins(['@auto-engineer/pkg1', '@auto-engineer/pkg2']);

      expect(handlers).toHaveLength(2);
      expect(handlers.map((h) => h.name)).toEqual(['Handler1', 'Handler2']);
    });

    it('should continue loading even if one package fails', async () => {
      const handler = createMockHandler('Handler');
      const deps = createMockDeps({
        existsSync: vi.fn().mockReturnValue(true),
        importModule: vi
          .fn()
          .mockRejectedValueOnce(new Error('Failed'))
          .mockResolvedValueOnce({ COMMANDS: [handler] }),
      });

      const loader = new PluginLoader('/workspace', deps);
      const handlers = await loader.loadPlugins(['@auto-engineer/failing', '@auto-engineer/working']);

      expect(handlers).toHaveLength(1);
      expect(handlers[0].name).toBe('Handler');
    });
  });

  describe('constructor', () => {
    it('should use default workspace root when not provided', () => {
      const loader = new PluginLoader();
      expect(loader).toBeDefined();
    });

    it('should use custom workspace root when provided', () => {
      const loader = new PluginLoader('/custom/workspace');
      expect(loader).toBeDefined();
    });
  });

  describe('integration', () => {
    it('should load real package using default deps', async () => {
      const loader = new PluginLoader();
      const handlers = await loader.loadPlugin('@auto-engineer/server-checks');
      const handlerNames = handlers.map((h) => h.name);
      expect(handlerNames).toContain('CheckTests');
      expect(handlerNames).toContain('CheckTypes');
      expect(handlerNames).toContain('CheckLint');
    });

    it('should load handlers from multiple real packages', async () => {
      const loader = new PluginLoader();
      const handlers = await loader.loadPlugins([
        '@auto-engineer/server-checks',
        '@auto-engineer/server-generator-apollo-emmett',
      ]);
      const handlerNames = handlers.map((h) => h.name);
      expect(handlerNames).toContain('CheckTests');
      expect(handlerNames).toContain('CheckTypes');
      expect(handlerNames).toContain('CheckLint');
      expect(handlerNames).toContain('GenerateServer');
      expect(handlers.length).toBeGreaterThan(3);
    });

    it('should load ExportSchema from narrative package node entry', async () => {
      const loader = new PluginLoader();
      const handlers = await loader.loadPlugin('@auto-engineer/narrative');
      const handlerNames = handlers.map((h) => h.name);
      expect(handlerNames).toContain('ExportSchema');
    });

    it('should load GenerateClient from frontend-generator package', async () => {
      const loader = new PluginLoader();
      const handlers = await loader.loadPlugin('@auto-engineer/frontend-generator-react-graphql');
      const handlerNames = handlers.map((h) => h.name);
      expect(handlerNames).toContain('GenerateClient');
    });
  });
});
