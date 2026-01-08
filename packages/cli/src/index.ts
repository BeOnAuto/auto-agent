#!/usr/bin/env node
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import chalk from 'chalk';
import { Command } from 'commander';
import * as dotenv from 'dotenv';
import ora from 'ora';
import { startServer as startServerCore } from './server.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

async function dispatchCommand(baseUrl: string, commandType: string, data: Record<string, unknown>): Promise<unknown> {
  const response = await fetch(`${baseUrl}/command`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: commandType, data }),
  });
  return response.json();
}

async function startServer(opts: { port: string; debug?: boolean; config?: string }): Promise<void> {
  const port = parseInt(opts.port, 10);
  const spinner = ora('Starting server...').start();

  try {
    const handle = await startServerCore({
      port,
      debug: opts.debug,
      configPath: opts.config,
    });

    process.on('SIGINT', () => {
      console.log(chalk.yellow('\nShutting down servers...'));
      void handle.stop();
      process.exit(0);
    });

    spinner.succeed(`Pipeline server running at http://localhost:${handle.actualPort}`);

    console.log(chalk.cyan('\nEndpoints:'));
    console.log(`  ${chalk.gray('Health:')}    http://localhost:${handle.actualPort}/health`);
    console.log(`  ${chalk.gray('Registry:')} http://localhost:${handle.actualPort}/registry`);
    console.log(`  ${chalk.gray('Pipeline:')} http://localhost:${handle.actualPort}/pipeline`);
    console.log(`  ${chalk.gray('Diagram:')}  http://localhost:${handle.actualPort}/pipeline/diagram`);
    console.log(`  ${chalk.gray('Events:')}   http://localhost:${handle.actualPort}/events (SSE)`);
    console.log(`  ${chalk.gray('FileSync:')} ws://localhost:${handle.actualPort}/file-sync (Socket.IO)`);
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
