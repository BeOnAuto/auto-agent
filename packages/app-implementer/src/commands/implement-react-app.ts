import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { createAnthropic } from '@ai-sdk/anthropic';
import { type Command, defineCommandHandler, type Event } from '@auto-engineer/message-bus';
import createDebug from 'debug';
import { generateApp, refineApp } from '../app-generator.js';
import { writeApp } from '../app-writer.js';
import { discoverComponents } from '../component-discovery.js';
import { scanFileTree } from '../file-tree.js';
import { analyzeJourney } from '../journey-analyzer.js';
import { connectMcpClient } from '../mcp-client.js';
import { checkTypes } from '../type-checker.js';

const debug = createDebug('auto:app-implementer:command');

const PORT = 6006;
const MAX_REFINEMENTS = 3;

async function checkStorybookRunning(): Promise<void> {
  try {
    const response = await fetch(`http://localhost:${PORT}`);
    if (!response.ok) {
      throw new Error('Storybook responded with non-OK status');
    }
  } catch {
    throw new Error(
      `Storybook is not running on port ${PORT}. Start it with \`pnpm storybook\` in the client directory before running this command.`,
    );
  }
}

export type ImplementReactAppCommand = Command<
  'ImplementReactApp',
  {
    clientDir: string;
    modelPath: string;
  }
>;

export type ReactAppImplementedEvent = Event<
  'ReactAppImplemented',
  {
    filesWritten: string[];
    journeyPages: number;
    refinements: number;
  }
>;

export type ReactAppImplementationFailedEvent = Event<
  'ReactAppImplementationFailed',
  {
    error: string;
  }
>;

export type ImplementReactAppEvents = ReactAppImplementedEvent | ReactAppImplementationFailedEvent;

export const commandHandler = defineCommandHandler({
  name: 'ImplementReactApp',
  displayName: 'Implement React App',
  alias: 'implement:react-app',
  description:
    'Generate a complete React application from a narrative model and Storybook component catalog, with type-check refinement',
  category: 'implement',
  icon: 'app',
  fields: {
    clientDir: {
      description: 'The existing client directory (already has components in Storybook)',
      required: true,
    },
    modelPath: {
      description: 'Path to narrative model.json (used for journey analysis)',
      required: true,
    },
  },
  examples: ['$ auto implement:react-app --client-dir=./client --model-path=./.context/model.json'],
  events: [
    { name: 'ReactAppImplemented', displayName: 'React App Implemented' },
    { name: 'ReactAppImplementationFailed', displayName: 'React App Implementation Failed' },
  ],
  handle: async (command: Command): Promise<ImplementReactAppEvents> => {
    const { clientDir, modelPath } = (command as ImplementReactAppCommand).data;

    debug('Implementing React app: clientDir=%s, modelPath=%s', clientDir, modelPath);

    let mcpClient: Awaited<ReturnType<typeof connectMcpClient>> | undefined;

    try {
      // 1. Read narrative model
      debug('Reading narrative model from %s', modelPath);
      const rawModel = await readFile(modelPath, 'utf-8');
      const narrative: unknown = JSON.parse(rawModel);

      // 2. Check Storybook running
      debug('Checking Storybook on port %d...', PORT);
      await checkStorybookRunning();

      // 3. Connect MCP and discover components
      debug('Connecting MCP client...');
      mcpClient = await connectMcpClient({ baseUrl: `http://localhost:${PORT}` });

      debug('Discovering components from Storybook...');
      const resolvedClientDir = path.resolve(clientDir);
      const componentsDir = path.resolve(resolvedClientDir, 'src', 'components', 'ui');
      const [catalog, fileTree] = await Promise.all([
        discoverComponents(mcpClient),
        scanFileTree(componentsDir, { readdir }),
      ]);
      debug('Found %d component docs', catalog.componentDocs.length);

      // 4. Journey analysis
      const modelName = process.env.DEFAULT_AI_MODEL ?? 'claude-sonnet-4-20250514';
      debug('Using AI model: %s', modelName);
      const model = createAnthropic()(modelName);

      debug('Analyzing user journey...');
      const { journey } = await analyzeJourney(narrative, catalog, model);
      debug('Journey: %d pages, %d edges', journey.pages.length, journey.navigationEdges.length);

      // 5. Generate app
      debug('Generating app...');
      let { app, history } = await generateApp({ journey, catalog, fileTree }, model);
      debug('Generated %d files', app.files.length);

      // 6. Write files
      debug('Writing files to %s', resolvedClientDir);
      let { filesWritten } = await writeApp(app, resolvedClientDir);

      // 7. Type-check + refinement loop
      let refinements = 0;
      for (let i = 0; i < MAX_REFINEMENTS; i++) {
        debug('Type-checking (attempt %d/%d)...', i + 1, MAX_REFINEMENTS);
        const result = checkTypes(filesWritten, resolvedClientDir);

        if (result.passed) {
          debug('Type check passed');
          break;
        }

        debug('Type errors found: %d, refining...', result.errors.length);
        refinements++;

        const refined = await refineApp(app, result.errors, catalog, fileTree, history, model);
        app = refined.app;
        history = refined.history;

        const writeResult = await writeApp(app, resolvedClientDir);
        filesWritten = writeResult.filesWritten;
      }

      return {
        type: 'ReactAppImplemented',
        data: {
          filesWritten,
          journeyPages: journey.pages.length,
          refinements,
        },
        timestamp: new Date(),
        requestId: command.requestId,
        correlationId: command.correlationId,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      debug('Implementation failed: %s', errorMessage);

      return {
        type: 'ReactAppImplementationFailed',
        data: { error: errorMessage },
        timestamp: new Date(),
        requestId: command.requestId,
        correlationId: command.correlationId,
      };
    } finally {
      if (mcpClient) {
        await mcpClient.close();
      }
    }
  },
});

export default commandHandler;
