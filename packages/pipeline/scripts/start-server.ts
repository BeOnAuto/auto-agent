import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';
import { loadPipelineConfig } from '../src/config/pipeline-config';
import { PipelineServer } from '../src/server/pipeline-server';
import { resetKanbanState } from '../src/testing/fixtures/kanban-full.pipeline';
import kanbanTodoConfig from '../src/testing/fixtures/kanban-todo.config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PIPELINE_ROOT = path.resolve(__dirname, '..');

config({ path: path.join(PIPELINE_ROOT, '.env') });

const PORT = parseInt(process.env.PIPELINE_PORT ?? '3456', 10);

async function main(): Promise<void> {
  console.log('\n\x1b[1m=== Pipeline Server ===\x1b[0m\n');

  if (process.env.ANTHROPIC_API_KEY === undefined) {
    console.error('\x1b[31mError: ANTHROPIC_API_KEY not set\x1b[0m');
    process.exit(1);
  }

  console.log('Loading pipeline configuration...');
  const loaded = await loadPipelineConfig(kanbanTodoConfig);
  console.log(`Loaded ${loaded.handlers.length} handlers:`);
  loaded.handlers.forEach((h) => console.log(`  - ${h.name}`));

  resetKanbanState();

  const server = new PipelineServer({ port: PORT });
  server.registerCommandHandlers(loaded.handlers);
  server.registerPipeline(loaded.pipeline);
  await server.start();

  console.log(`\n\x1b[32mServer running on http://localhost:${server.port}\x1b[0m\n`);
  console.log('Endpoints:');
  console.log(`  GET  http://localhost:${server.port}/health`);
  console.log(`  GET  http://localhost:${server.port}/registry`);
  console.log(`  GET  http://localhost:${server.port}/pipeline`);
  console.log(`  GET  http://localhost:${server.port}/messages`);
  console.log(`  POST http://localhost:${server.port}/command`);
  console.log('\nExample:');
  console.log(`  curl -X POST http://localhost:${server.port}/command \\`);
  console.log(`    -H "Content-Type: application/json" \\`);
  console.log(`    -d '{"type":"ExportSchema","data":{"directory":"/path/to/project"}}'`);
  console.log('\nPress Ctrl+C to stop\n');

  process.on('SIGINT', async () => {
    console.log('\nShutting down...');
    await server.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await server.stop();
    process.exit(0);
  });
}

main().catch((err) => {
  console.error('\x1b[31mFatal error:\x1b[0m', err);
  process.exit(1);
});
