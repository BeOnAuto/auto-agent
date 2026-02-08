import type { Command, Event } from '@auto-engineer/message-bus';
import type { PipelineContext } from '../runtime/context';
import type { CommandHandlerWithMetadata } from '../server/pipeline-server';
import type { CommandHandlerMetadata } from './plugin-loader';

export function adaptHandler(source: CommandHandlerMetadata): CommandHandlerWithMetadata {
  return {
    name: source.name,
    alias: source.alias,
    description: source.description,
    events: source.events,
    fields: source.fields,
    handle: async (command: Command, context?: PipelineContext): Promise<Event | Event[]> => {
      const result = await source.handle(command, context);
      return result as Event | Event[];
    },
  };
}

export function adaptHandlers(sources: CommandHandlerMetadata[]): CommandHandlerWithMetadata[] {
  return sources.map(adaptHandler);
}
