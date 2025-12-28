import type { CommandHandler, EventDefinition } from '@auto-engineer/message-bus';

export type { EventDefinition };

interface CommandHandlerWithEvents extends CommandHandler {
  events?: readonly EventDefinition[];
}

function getEventName(event: EventDefinition): string {
  return typeof event === 'string' ? event : event.name;
}

export class EventCommandMapper {
  private eventToCommand = new Map<string, string>();
  private commandToEvents = new Map<string, string[]>();

  constructor(handlers: CommandHandlerWithEvents[]) {
    for (const handler of handlers) {
      this.addHandler(handler);
    }
  }

  addHandler(handler: CommandHandlerWithEvents): void {
    const events = handler.events ?? [];

    for (const event of events) {
      const eventType = getEventName(event);
      this.eventToCommand.set(eventType, handler.name);
    }

    this.commandToEvents.set(handler.name, events.map(getEventName));
  }

  getSourceCommand(eventType: string): string | undefined {
    return this.eventToCommand.get(eventType);
  }

  getEventsForCommand(commandType: string): string[] {
    return this.commandToEvents.get(commandType) ?? [];
  }

  isEventFromCommand(eventType: string, commandType: string): boolean {
    return this.getSourceCommand(eventType) === commandType;
  }
}
