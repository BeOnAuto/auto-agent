import { type Command, defineCommandHandler, type Event } from '@auto-engineer/message-bus';
import createDebug from 'debug';

const debug = createDebug('auto:narrative:export-schema');
if ('color' in debug && typeof debug === 'object') {
  (debug as { color: string }).color = '4';
}

export type ExportSchemaCommand = Command<
  'ExportSchema',
  {
    directory: string;
  }
>;

export type SchemaExportedEvent = Event<
  'SchemaExported',
  {
    directory: string;
    outputPath: string;
  }
>;

export type SchemaExportFailedEvent = Event<
  'SchemaExportFailed',
  {
    directory: string;
    error: string;
  }
>;

export type ExportSchemaEvents = SchemaExportedEvent | SchemaExportFailedEvent;

export const commandHandler = defineCommandHandler({
  name: 'ExportSchema',
  alias: 'export:schema',
  description: 'Export flow schemas to context directory',
  category: 'export',
  icon: 'download',
  events: ['SchemaExported', 'SchemaExportFailed'],
  fields: {
    directory: {
      description: 'Context directory path (defaults to current working directory)',
      required: true,
    },
  },
  examples: ['$ auto export:schema --directory=./.context'],
  handle: async (command: Command): Promise<SchemaExportedEvent | SchemaExportFailedEvent> => {
    const typedCommand = command as ExportSchemaCommand;
    const result = await handleExportSchemaCommand(typedCommand);
    if (result.type === 'SchemaExported') {
      debug('✅ Flow schema written to: %s', result.data.outputPath);
    } else {
      debug('❌ Failed to export schema: %s', result.data.error);
    }
    return result;
  },
});

export async function handleExportSchemaCommand(
  command: ExportSchemaCommand,
): Promise<SchemaExportedEvent | SchemaExportFailedEvent> {
  const directory = command.data.directory ?? process.cwd();

  try {
    // Run the helper script with tsx
    const { getFs } = await import('./filestore.node.js');
    const fs = await getFs();
    const __dirname = fs.dirname(new URL(import.meta.url).href);
    const helperScript = fs.join(__dirname, 'export-schema-helper.js');

    const resultPath = fs.join(directory, '.context', '.export-result.json');

    const { spawnSync } = await import('node:child_process');
    spawnSync('node', [helperScript, directory], {
      cwd: directory,
      encoding: 'utf-8',
      stdio: 'ignore',
      env: {
        ...process.env,
        NODE_ENV: process.env.NODE_ENV ?? 'development',
        DEBUG: process.env.DEBUG,
        DEBUG_COLORS: process.env.DEBUG_COLORS,
        DEBUG_HIDE_DATE: 'true',
      },
    });

    const resultJson = await fs.readText(resultPath);
    if (resultJson == null) {
      return {
        type: 'SchemaExportFailed',
        data: { directory, error: 'No result file found' },
        timestamp: new Date(),
        requestId: command.requestId,
        correlationId: command.correlationId,
      };
    }

    const parsed = JSON.parse(resultJson) as { success?: boolean; outputPath?: string; error?: string };
    if (parsed.success === true) {
      return {
        type: 'SchemaExported',
        data: { directory, outputPath: parsed.outputPath ?? '' },
        timestamp: new Date(),
        requestId: command.requestId,
        correlationId: command.correlationId,
      };
    } else {
      return {
        type: 'SchemaExportFailed',
        data: { directory, error: parsed.error ?? 'Unknown error' },
        timestamp: new Date(),
        requestId: command.requestId,
        correlationId: command.correlationId,
      };
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      type: 'SchemaExportFailed',
      data: {
        directory,
        error: message,
      },
      timestamp: new Date(),
      requestId: command.requestId,
      correlationId: command.correlationId,
    };
  }
}

// Default export is the command handler
export default commandHandler;
