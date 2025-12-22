import type { CommandHandler } from '@auto-engineer/message-bus';

interface CommandHandlerWithEvents extends CommandHandler {
  events?: readonly string[];
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

    for (const eventType of events) {
      this.eventToCommand.set(eventType, handler.name);
    }

    this.commandToEvents.set(handler.name, [...events]);
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
