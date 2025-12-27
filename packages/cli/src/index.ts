#!/usr/bin/env node
import * as fs from 'node:fs';
import { createServer } from 'node:http';
import * as path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { CommandHandlerWithMetadata, Pipeline } from '@auto-engineer/pipeline';
import { PipelineServer } from '@auto-engineer/pipeline';
import chalk from 'chalk';
import { Command } from 'commander';
import * as dotenv from 'dotenv';
import getPort, { portNumbers } from 'get-port';
import createJiti from 'jiti';
import ora from 'ora';
import { Server as SocketIOServer } from 'socket.io';
import { FileSyncer } from './file-syncer/index.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface PipelineConfig {
  plugins: string[];
  pipeline: Pipeline;
}

interface PluginModule {
  COMMANDS?: CommandHandlerWithMetadata[];
}

function isValidHandler(item: unknown): boolean {
  return item !== null && item !== undefined && typeof item === 'object' && 'handle' in item && 'name' in item;
}

function extractCommandHandler(
  module: Record<string, unknown>,
  filename: string,
  packageName: string,
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

  for (const [key, value] of Object.entries(module)) {
    if (isValidHandler(value)) {
      console.log(chalk.gray(`  Found handler via named export "${key}" in ${filename}`));
      return value as CommandHandlerWithMetadata;
    }
  }

  console.log(chalk.gray(`  No valid handler found in ${filename} from ${packageName}`));
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
    } catch (error) {
      console.warn(chalk.yellow(`  Failed to load command file ${filename}:`), error);
    }
  }

  return handlers;
}

function getVersion(): string {
  try {
    const possiblePaths = [
      path.join(__dirname, '..', 'package.json'),
      path.join(__dirname, '..', '..', 'package.json'),
    ];

    for (const packageJsonPath of possiblePaths) {
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8')) as { version: string };
        return packageJson.version;
      }
    }
  } catch {
    // Fall through
  }
  return process.env.npm_package_version ?? 'unknown';
}

const VERSION = getVersion();

async function loadPipelineConfig(configPath: string): Promise<PipelineConfig | null> {
  try {
    if (configPath.endsWith('.ts')) {
      const jiti = createJiti(import.meta.url, { interopDefault: true });
      return await jiti.import<PipelineConfig>(configPath);
    }

    const configUrl = pathToFileURL(path.resolve(configPath)).href;
    const configModule = (await import(configUrl)) as { default?: PipelineConfig } & PipelineConfig;
    return configModule.default ?? configModule;
  } catch (error) {
    console.error(chalk.red('Failed to load config:'), error);
    return null;
  }
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
      // /node subpath not available for this package
    }

    return null;
  } catch (error) {
    console.warn(chalk.yellow(`Warning: Failed to load plugin ${packageName}:`), error);
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

async function dispatchCommand(baseUrl: string, commandType: string, data: Record<string, unknown>): Promise<unknown> {
  const response = await fetch(`${baseUrl}/command`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: commandType, data }),
  });
  return response.json();
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

async function startFileSyncServer(
  syncPort: number,
  watchDir: string,
): Promise<{ fileSyncer: FileSyncer; httpServer: ReturnType<typeof createServer> }> {
  const httpServer = createServer();
  const io = new SocketIOServer(httpServer, {
    cors: { origin: '*' },
  });

  const fileSyncer = new FileSyncer(io, watchDir);
  fileSyncer.start();

  return new Promise((resolve) => {
    httpServer.listen(syncPort, () => {
      resolve({ fileSyncer, httpServer });
    });
  });
}

async function startServer(opts: { port: string; debug?: boolean; config?: string }): Promise<void> {
  const port = parseInt(opts.port, 10);
  const actualPort = await getPort({ port: portNumbers(port, port + 100) });
  const syncPort = await getPort({ port: portNumbers(actualPort + 1, actualPort + 100) });

  const configPath = opts.config ?? findConfigFile();
  if (!configPath) {
    console.error(chalk.red('No pipeline config found. Create an auto.config.ts file.'));
    process.exit(1);
  }

  const spinner = ora('Loading pipeline config...').start();

  const config = await loadPipelineConfig(configPath);
  if (!config) {
    spinner.fail('Failed to load pipeline config');
    process.exit(1);
  }

  spinner.text = 'Loading plugins...';
  const commandHandlers = await loadCommandHandlers(config.plugins);
  spinner.succeed(`Loaded ${commandHandlers.length} command handlers from ${config.plugins.length} plugins`);

  spinner.start('Starting pipeline server...');

  try {
    const server = new PipelineServer({ port: actualPort });

    server.registerCommandHandlers(commandHandlers);
    server.registerPipeline(config.pipeline);

    const watchDir = path.dirname(configPath);
    const { fileSyncer, httpServer: syncHttpServer } = await startFileSyncServer(syncPort, watchDir);

    process.on('SIGINT', () => {
      console.log(chalk.yellow('\nShutting down servers...'));
      fileSyncer.stop();
      syncHttpServer.close();
      void server.stop();
      process.exit(0);
    });

    await server.start();
    spinner.succeed(`Pipeline server running at http://localhost:${actualPort}`);

    console.log(chalk.cyan('\nEndpoints:'));
    console.log(`  ${chalk.gray('Health:')}    http://localhost:${actualPort}/health`);
    console.log(`  ${chalk.gray('Registry:')} http://localhost:${actualPort}/registry`);
    console.log(`  ${chalk.gray('Pipeline:')} http://localhost:${actualPort}/pipeline`);
    console.log(`  ${chalk.gray('Diagram:')}  http://localhost:${actualPort}/pipeline/diagram`);
    console.log(`  ${chalk.gray('Events:')}   http://localhost:${actualPort}/events (SSE)`);
    console.log(`  ${chalk.gray('FileSync:')} ws://localhost:${syncPort} (Socket.IO)`);
    console.log(chalk.gray('\nPress Ctrl+C to stop'));
  } catch (error) {
    spinner.fail('Failed to start server');
    console.error(error);
    process.exit(1);
  }
}

async function main(): Promise<void> {
  const program = new Command();

  program
    .name('auto')
    .description('Auto Engineer - Build apps with Narrative Driven Development')
    .version(VERSION, '-v, --version')
    .option('-p, --port <number>', 'Server port', '5555')
    .option('-d, --debug', 'Enable debug mode')
    .option('-c, --config <path>', 'Path to pipeline config file')
    .option('--host <url>', 'Connect to existing server instead of starting one');

  program
    .command('start', { isDefault: true })
    .description('Start the pipeline server with loaded config (default)')
    .action(async () => {
      const opts = program.opts() as { port: string; debug?: boolean; config?: string };
      await startServer(opts);
    });

  program
    .command('dispatch <command>')
    .description('Dispatch a command to the pipeline server')
    .option('--data <json>', 'Command data as JSON', '{}')
    .action(async (commandType: string, options: { data: string }) => {
      const opts = program.opts() as { port: string; host?: string };
      const baseUrl = opts.host ?? `http://localhost:${opts.port}`;

      const spinner = ora(`Dispatching ${commandType}...`).start();

      try {
        const data = JSON.parse(options.data) as Record<string, unknown>;
        const result = await dispatchCommand(baseUrl, commandType, data);
        spinner.succeed(`Command dispatched: ${commandType}`);
        console.log(chalk.gray(JSON.stringify(result, null, 2)));
      } catch (error) {
        spinner.fail(`Failed to dispatch ${commandType}`);
        console.error(error);
        process.exit(1);
      }
    });

  program
    .command('status')
    .description('Check pipeline server status')
    .action(async () => {
      const opts = program.opts() as { port: string; host?: string };
      const baseUrl = opts.host ?? `http://localhost:${opts.port}`;

      try {
        const healthResponse = await fetch(`${baseUrl}/health`);
        if (!healthResponse.ok) {
          console.log(chalk.red('Server is not healthy'));
          process.exit(1);
        }

        const health = (await healthResponse.json()) as { status: string; uptime: number };
        console.log(chalk.green('Server is healthy'));
        console.log(chalk.gray(`  Status: ${health.status}`));
        console.log(chalk.gray(`  Uptime: ${Math.round(health.uptime)}s`));

        const registryResponse = await fetch(`${baseUrl}/registry`);
        const registry = (await registryResponse.json()) as {
          commandHandlers: string[];
          eventHandlers: string[];
        };

        console.log(chalk.cyan('\nRegistry:'));
        console.log(chalk.gray(`  Commands: ${registry.commandHandlers.length}`));
        console.log(chalk.gray(`  Events: ${registry.eventHandlers.length}`));
      } catch {
        console.log(chalk.red('Server is not running'));
        process.exit(1);
      }
    });

  program
    .command('diagram')
    .description('Open the pipeline diagram in a browser')
    .action(async () => {
      const opts = program.opts() as { port: string; host?: string };
      const baseUrl = opts.host ?? `http://localhost:${opts.port}`;
      const diagramUrl = `${baseUrl}/pipeline/diagram`;

      console.log(chalk.cyan(`Opening diagram at ${diagramUrl}`));

      const { exec } = await import('node:child_process');
      const platform = process.platform;
      const command = platform === 'darwin' ? 'open' : platform === 'win32' ? 'start' : 'xdg-open';
      exec(`${command} ${diagramUrl}`);
    });

  await program.parseAsync(process.argv);
}

main().catch((error) => {
  console.error(chalk.red('Error:'), error);
  process.exit(1);
});
