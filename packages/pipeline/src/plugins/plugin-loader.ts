import { existsSync as fsExistsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

export interface CommandHandlerMetadata {
  name: string;
  alias?: string;
  description?: string;
  events?: string[];
  fields?: Record<string, unknown>;
  handle: (command: unknown) => Promise<unknown>;
}

interface UnifiedCommandHandler {
  name: string;
  alias?: string;
  description?: string;
  events?: string[];
  fields?: Record<string, unknown>;
  handle: (command: unknown) => Promise<unknown>;
}

function isValidHandler(obj: unknown): obj is UnifiedCommandHandler {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'name' in obj &&
    typeof (obj as UnifiedCommandHandler).name === 'string' &&
    'handle' in obj &&
    typeof (obj as UnifiedCommandHandler).handle === 'function'
  );
}

export interface PluginLoaderDeps {
  existsSync: (path: string) => boolean;
  importModule: (path: string) => Promise<unknown>;
}

const defaultDeps: PluginLoaderDeps = {
  existsSync: fsExistsSync,
  importModule: (path: string) => import(path),
};

export class PluginLoader {
  private readonly workspaceRoot: string;
  private readonly deps: PluginLoaderDeps;

  constructor(workspaceRoot?: string, deps?: PluginLoaderDeps) {
    const currentDir = dirname(fileURLToPath(import.meta.url));
    this.workspaceRoot = workspaceRoot ?? resolve(currentDir, '../../../../');
    this.deps = deps ?? defaultDeps;
  }

  async loadPlugin(packageName: string): Promise<CommandHandlerMetadata[]> {
    const handlers: CommandHandlerMetadata[] = [];

    try {
      const module = await this.tryLoadModule(packageName);
      if (module === null) {
        return [];
      }

      const commands = this.extractCommands(module);
      for (const cmd of commands) {
        if (isValidHandler(cmd)) {
          handlers.push({
            name: cmd.name,
            alias: cmd.alias,
            description: cmd.description,
            events: cmd.events,
            fields: cmd.fields,
            handle: cmd.handle,
          });
        }
      }
    } catch {
      return [];
    }

    return handlers;
  }

  async loadPlugins(packageNames: string[]): Promise<CommandHandlerMetadata[]> {
    const allHandlers: CommandHandlerMetadata[] = [];
    for (const packageName of packageNames) {
      const handlers = await this.loadPlugin(packageName);
      allHandlers.push(...handlers);
    }
    return allHandlers;
  }

  private async tryLoadModule(packageName: string): Promise<unknown> {
    const shortName = packageName.replace('@auto-engineer/', '');

    const workspaceDistPath = resolve(this.workspaceRoot, 'packages', shortName, 'dist', 'index.js');
    if (this.deps.existsSync(workspaceDistPath)) {
      return this.deps.importModule(workspaceDistPath);
    }

    const nodeModulesPath = resolve(this.workspaceRoot, 'node_modules', packageName, 'dist', 'index.js');
    if (this.deps.existsSync(nodeModulesPath)) {
      return this.deps.importModule(nodeModulesPath);
    }

    try {
      return await this.deps.importModule(packageName);
    } catch {
      return null;
    }
  }

  private extractCommands(module: unknown): unknown[] {
    if (typeof module !== 'object' || module === null) {
      return [];
    }

    const mod = module as Record<string, unknown>;

    if ('COMMANDS' in mod && Array.isArray(mod.COMMANDS)) {
      return mod.COMMANDS;
    }

    if ('default' in mod && typeof mod.default === 'object' && mod.default !== null) {
      const defaultMod = mod.default as Record<string, unknown>;
      if ('COMMANDS' in defaultMod && Array.isArray(defaultMod.COMMANDS)) {
        return defaultMod.COMMANDS;
      }
    }

    return [];
  }
}
