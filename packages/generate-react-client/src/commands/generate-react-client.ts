import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { type Command, defineCommandHandler, type Event } from '@auto-engineer/message-bus';
import createDebug from 'debug';
import { StarterBuilder } from '../builder.js';

const debug = createDebug('auto:generate-react-client:command');

const resolveStarterPath = (): string => {
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(currentDir, '../../starter');
};

export type GenerateReactClientCommand = Command<
  'GenerateReactClient',
  {
    targetDir: string;
  }
>;

export type ReactClientGeneratedEvent = Event<
  'ReactClientGenerated',
  {
    targetDir: string;
  }
>;

export type ReactClientGenerationFailedEvent = Event<
  'ReactClientGenerationFailed',
  {
    error: string;
    targetDir: string;
  }
>;

export type GenerateReactClientEvents = ReactClientGeneratedEvent | ReactClientGenerationFailedEvent;

export const commandHandler = defineCommandHandler({
  name: 'GenerateReactClient',
  displayName: 'Generate React Client',
  alias: 'generate:react-client',
  description: 'Scaffold a React + Vite + Tailwind CSS v4 + shadcn client app',
  category: 'generate',
  icon: 'monitor',
  fields: {
    targetDir: {
      description: 'Output directory for the generated client',
      required: true,
    },
  },
  examples: ['$ auto generate:react-client --target-dir=./client'],
  events: [
    { name: 'ReactClientGenerated', displayName: 'React Client Generated' },
    {
      name: 'ReactClientGenerationFailed',
      displayName: 'React Client Generation Failed',
    },
  ],
  handle: async (command: Command): Promise<GenerateReactClientEvents> => {
    const { targetDir } = (command as GenerateReactClientCommand).data;

    debug('Generating React client to: %s', targetDir);

    try {
      const builder = new StarterBuilder();
      const starterPath = resolveStarterPath();

      debug('Starter path: %s', starterPath);
      await builder.cloneStarter(starterPath);
      await builder.build(targetDir);

      debug('Running pnpm install in: %s', targetDir);
      execSync('pnpm install', {
        cwd: targetDir,
        stdio: 'inherit',
      });

      debug('React client generated at: %s', targetDir);

      return {
        type: 'ReactClientGenerated',
        data: { targetDir },
        timestamp: new Date(),
        requestId: command.requestId,
        correlationId: command.correlationId,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      debug('Generation failed: %s', errorMessage);

      return {
        type: 'ReactClientGenerationFailed',
        data: { error: errorMessage, targetDir },
        timestamp: new Date(),
        requestId: command.requestId,
        correlationId: command.correlationId,
      };
    }
  },
});

export default commandHandler;
