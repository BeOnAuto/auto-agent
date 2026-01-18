import * as fs from 'node:fs';
import type { Server as HttpServer } from 'node:http';
import * as path from 'node:path';
import { pathToFileURL } from 'node:url';
import type { CommandHandlerWithMetadata, Event, Pipeline } from '@auto-engineer/pipeline';
import { PipelineServer } from '@auto-engineer/pipeline';
import type { RequestHandler } from 'express';
import getPort, { portNumbers } from 'get-port';
import createJiti from 'jiti';
import { Server as SocketIOServer } from 'socket.io';
import { FileSyncer, type SocketMiddleware } from './file-syncer/index.js';

export type { SocketMiddleware };

interface PipelineConfig {
  plugins: string[];
  pipeline: Pipeline;
  COMMANDS?: CommandHandlerWithMetadata[];
}

interface PluginModule {
  COMMANDS?: CommandHandlerWithMetadata[];
}

export interface StartServerOptions {
  port: number;
  debug?: boolean;
  configPath?: string;
  httpMiddleware?: RequestHandler[];
  socketMiddleware?: SocketMiddleware;
  onEvent?: (event: { type: string; correlationId?: string }) => void;
}

export interface ServerHandle {
  fileSyncer: FileSyncer;
  httpServer: HttpServer;
  actualPort: number;
  stop: () => Promise<void>;
}

function findConfigFile(): string | null {
  const candidates = ['auto.config.ts', 'auto.config.js'];
  for (const candidate of candidates) {
    const fullPath = path.join(process.cwd(), candidate);
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
  }
  return null;
}

async function loadPipelineConfig(configPath: string): Promise<PipelineConfig | null> {
  try {
    if (configPath.endsWith('.ts')) {
      const jiti = createJiti(import.meta.url, { interopDefault: true });
      return await jiti.import<PipelineConfig>(configPath);
    }
    const configUrl = pathToFileURL(path.resolve(configPath)).href;
    const configModule = (await import(configUrl)) as { default?: PipelineConfig } & PipelineConfig;
    return configModule.default ?? configModule;
  } catch {
    return null;
  }
}

function isValidHandler(item: unknown): boolean {
  return item !== null && item !== undefined && typeof item === 'object' && 'handle' in item && 'name' in item;
}

function extractCommandHandler(
  module: Record<string, unknown>,
  _filename: string,
  _packageName: string,
): CommandHandlerWithMetadata | null {
  if (isValidHandler(module.default)) {
    return module.default as CommandHandlerWithMetadata;
  }
  if (isValidHandler(module.commandHandler)) {
    return module.commandHandler as CommandHandlerWithMetadata;
  }
  if (isValidHandler(module.handler)) {
    return module.handler as CommandHandlerWithMetadata;
  }
  for (const [_key, value] of Object.entries(module)) {
    if (isValidHandler(value)) {
      return value as CommandHandlerWithMetadata;
    }
  }
  return null;
}

async function detectCommandsByConvention(packageName: string): Promise<CommandHandlerWithMetadata[]> {
  const handlers: CommandHandlerWithMetadata[] = [];
  const packageShortName = packageName.replace('@auto-engineer/', '');

  const workspaceCommandsPath = path.join(process.cwd(), 'packages', packageShortName, 'dist', 'commands');
  const workspaceSrcCommandsPath = path.join(process.cwd(), 'packages', packageShortName, 'dist', 'src', 'commands');
  const nodeModulesCommandsPath = path.join(process.cwd(), 'node_modules', packageName, 'dist', 'commands');
  const nodeModulesSrcCommandsPath = path.join(process.cwd(), 'node_modules', packageName, 'dist', 'src', 'commands');

  let commandsDir: string | null = null;
  if (fs.existsSync(workspaceCommandsPath)) {
    commandsDir = workspaceCommandsPath;
  } else if (fs.existsSync(workspaceSrcCommandsPath)) {
    commandsDir = workspaceSrcCommandsPath;
  } else if (fs.existsSync(nodeModulesCommandsPath)) {
    commandsDir = nodeModulesCommandsPath;
  } else if (fs.existsSync(nodeModulesSrcCommandsPath)) {
    commandsDir = nodeModulesSrcCommandsPath;
  }

  if (!commandsDir) {
    return handlers;
  }

  const commandFiles = fs.readdirSync(commandsDir).filter((file) => file.endsWith('.js'));
  for (const filename of commandFiles) {
    const filePath = path.join(commandsDir, filename);
    const fileUrl = pathToFileURL(filePath).href;
    try {
      const module = (await import(fileUrl)) as Record<string, unknown>;
      const handler = extractCommandHandler(module, filename, packageName);
      if (handler) {
        handlers.push(handler);
      }
    } catch {
      // Skip failed imports
    }
  }
  return handlers;
}

async function tryLoadFromPath(modulePath: string): Promise<PluginModule | null> {
  if (!fs.existsSync(modulePath)) return null;
  const packageUrl = pathToFileURL(modulePath).href;
  return (await import(packageUrl)) as PluginModule;
}

async function loadPlugin(packageName: string): Promise<PluginModule | null> {
  const packageShortName = packageName.replace('@auto-engineer/', '');
  const workspaceBase = path.join(process.cwd(), 'packages', packageShortName, 'dist');
  const nodeModulesBase = path.join(process.cwd(), 'node_modules', packageName, 'dist');

  const pathsToTry = [
    path.join(workspaceBase, 'index.js'),
    path.join(workspaceBase, 'src', 'index.js'),
    path.join(nodeModulesBase, 'index.js'),
    path.join(nodeModulesBase, 'src', 'index.js'),
  ];

  const nodePathsToTry = [path.join(workspaceBase, 'src', 'node.js'), path.join(nodeModulesBase, 'src', 'node.js')];

  try {
    for (const modulePath of pathsToTry) {
      const plugin = await tryLoadFromPath(modulePath);
      if (plugin?.COMMANDS) return plugin;
    }
    for (const modulePath of nodePathsToTry) {
      const plugin = await tryLoadFromPath(modulePath);
      if (plugin?.COMMANDS) return plugin;
    }
    const dynamicPlugin = (await import(packageName)) as PluginModule;
    if (dynamicPlugin?.COMMANDS) return dynamicPlugin;
    try {
      const nodeImport = (await import(`${packageName}/node`)) as PluginModule;
      if (nodeImport?.COMMANDS) return nodeImport;
    } catch {
      // /node subpath not available
    }
    return null;
  } catch {
    return null;
  }
}

async function loadCommandHandlers(plugins: string[]): Promise<CommandHandlerWithMetadata[]> {
  const handlers: CommandHandlerWithMetadata[] = [];
  for (const packageName of plugins) {
    const plugin = await loadPlugin(packageName);
    if (plugin?.COMMANDS) {
      handlers.push(...plugin.COMMANDS);
      continue;
    }
    const detectedHandlers = await detectCommandsByConvention(packageName);
    if (detectedHandlers.length > 0) {
      handlers.push(...detectedHandlers);
    }
  }
  return handlers;
}

export async function startServer(opts: StartServerOptions): Promise<ServerHandle> {
  const port = opts.port;
  const actualPort = await getPort({ port: port === 0 ? undefined : portNumbers(port, port + 100) });

  const configPath = opts.configPath ?? findConfigFile();
  if (!configPath) {
    throw new Error('No pipeline config found. Create an auto.config.ts file.');
  }

  const config = await loadPipelineConfig(configPath);
  if (!config) {
    throw new Error(`Failed to load pipeline config from ${configPath}`);
  }

  const pluginHandlers = await loadCommandHandlers(config.plugins);
  const configHandlers = config.COMMANDS ?? [];
  const commandHandlers = [...pluginHandlers, ...configHandlers];
  const pipelineServer = new PipelineServer({ port: actualPort });

  if (opts.onEvent) {
    const eventCallback = opts.onEvent;
    pipelineServer.getMessageBus().subscribeAll({
      name: 'ExternalEventCallback',
      handle: async (event: Event) => {
        eventCallback({ type: event.type, correlationId: event.correlationId });
      },
    });
  }

  if (opts.httpMiddleware) {
    for (const middleware of opts.httpMiddleware) {
      pipelineServer.use(middleware);
    }
  }

  pipelineServer.registerCommandHandlers(commandHandlers);
  pipelineServer.registerPipeline(config.pipeline);

  const watchDir = path.dirname(configPath);

  const httpServer = pipelineServer.getHttpServer();
  const io = new SocketIOServer(httpServer, {
    cors: { origin: '*' },
    path: '/file-sync',
  });

  const fileSyncer = new FileSyncer(io, watchDir, undefined, { socketMiddleware: opts.socketMiddleware });
  fileSyncer.start();

  await pipelineServer.start();

  const stop = async (): Promise<void> => {
    fileSyncer.stop();
    await pipelineServer.stop();
  };

  return {
    fileSyncer,
    httpServer,
    actualPort,
    stop,
  };
}
