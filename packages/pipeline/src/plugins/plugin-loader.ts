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
    const distPaths = ['dist', 'dist/src'];
    const entryPoints = ['index.js', 'node.js'];

    for (const distPath of distPaths) {
      for (const entry of entryPoints) {
        const workspacePath = resolve(this.workspaceRoot, 'packages', shortName, distPath, entry);
        if (this.deps.existsSync(workspacePath)) {
          const mod = await this.deps.importModule(workspacePath);
          if (this.hasCommands(mod)) {
            return mod;
          }
        }
      }
    }

    for (const distPath of distPaths) {
      for (const entry of entryPoints) {
        const nodeModulesPath = resolve(this.workspaceRoot, 'node_modules', packageName, distPath, entry);
        if (this.deps.existsSync(nodeModulesPath)) {
          const mod = await this.deps.importModule(nodeModulesPath);
          if (this.hasCommands(mod)) {
            return mod;
          }
        }
      }
    }

    try {
      return await this.deps.importModule(packageName);
    } catch {
      return null;
    }
  }

  private hasCommands(mod: unknown): boolean {
    if (typeof mod !== 'object' || mod === null) {
      return false;
    }
    const obj = mod as Record<string, unknown>;
    if ('COMMANDS' in obj && Array.isArray(obj.COMMANDS)) {
      return true;
    }
    if ('default' in obj && typeof obj.default === 'object' && obj.default !== null) {
      const defaultMod = obj.default as Record<string, unknown>;
      if ('COMMANDS' in defaultMod && Array.isArray(defaultMod.COMMANDS)) {
        return true;
      }
    }
    for (const key of Object.keys(obj)) {
      if (key.endsWith('CommandHandler') || key.endsWith('commandHandler')) {
        const value = obj[key];
        if (typeof value === 'object' && value !== null && 'name' in value && 'handle' in value) {
          return true;
        }
      }
    }
    return false;
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

    const handlers: unknown[] = [];
    for (const [key, value] of Object.entries(mod)) {
      if (
        (key.endsWith('CommandHandler') || key.endsWith('commandHandler')) &&
        typeof value === 'object' &&
        value !== null &&
        'name' in value &&
        'handle' in value
      ) {
        handlers.push(value);
      }
    }

    return handlers;
  }
}
