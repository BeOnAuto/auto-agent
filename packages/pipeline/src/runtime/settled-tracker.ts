import type { Command, Event } from '@auto-engineer/message-bus';

type SendFunction = (commandType: string, data: unknown) => void;

type SettledHandler = (events: Record<string, Event[]>, send: SendFunction) => void | { persist: boolean };

interface SettledHandlerRegistration {
  commandTypes: readonly string[];
  handler: SettledHandler;
}

interface CommandTracker {
  commandType: string;
  hasStarted: boolean;
  hasCompleted: boolean;
  events: Event[];
}

interface HandlerTemplate {
  id: string;
  registration: SettledHandlerRegistration;
}

interface HandlerInstance {
  templateId: string;
  correlationId: string;
  registration: SettledHandlerRegistration;
  commandTrackers: Map<string, CommandTracker>;
}

interface SettledErrorContext {
  commandTypes: readonly string[];
  correlationId: string;
}

interface SettledTrackerOptions {
  onDispatch?: (commandType: string, data: unknown, correlationId: string) => void;
  onError?: (error: unknown, context: SettledErrorContext) => void;
}

export class SettledTracker {
  private handlerTemplates = new Map<string, HandlerTemplate>();
  private handlerInstances = new Map<string, HandlerInstance>();
  private commandToTemplateIds = new Map<string, Set<string>>();
  private readonly onDispatch?: (commandType: string, data: unknown, correlationId: string) => void;
  private readonly onError?: (error: unknown, context: SettledErrorContext) => void;

  constructor(options?: SettledTrackerOptions) {
    this.onDispatch = options?.onDispatch;
    this.onError = options?.onError;
  }

  registerHandler(registration: SettledHandlerRegistration): void {
    const templateId = this.generateTemplateId(registration);

    this.handlerTemplates.set(templateId, {
      id: templateId,
      registration,
    });

    for (const commandType of registration.commandTypes) {
      const existing = this.commandToTemplateIds.get(commandType) ?? new Set<string>();
      existing.add(templateId);
      this.commandToTemplateIds.set(commandType, existing);
    }
  }

  getRegisteredHandlerCount(): number {
    return this.handlerTemplates.size;
  }

  getActiveInstanceCount(): number {
    return this.handlerInstances.size;
  }

  onCommandStarted(command: Command): void {
    const { type: commandType, correlationId, requestId } = command;

    if (!this.isValidId(correlationId) || !this.isValidId(requestId)) {
      return;
    }

    const templateIds = this.commandToTemplateIds.get(commandType);
    if (!templateIds) {
      return;
    }

    for (const templateId of templateIds) {
      const template = this.handlerTemplates.get(templateId);
      if (template) {
        this.ensureInstanceExists(template, correlationId);
        this.markCommandStarted(template.id, correlationId, commandType);
      }
    }
  }

  isWaitingFor(correlationId: string, commandType: string): boolean {
    for (const instance of this.handlerInstances.values()) {
      if (instance.correlationId === correlationId) {
        const tracker = instance.commandTrackers.get(commandType);
        if (tracker?.hasStarted === true && tracker.hasCompleted === false) {
          return true;
        }
      }
    }
    return false;
  }

  onEventReceived(event: Event, sourceCommandType: string): void {
    const correlationId = event.correlationId;

    if (!this.isValidId(correlationId)) {
      return;
    }

    for (const [instanceId, instance] of this.handlerInstances) {
      if (instance.correlationId !== correlationId) {
        continue;
      }

      const tracker = instance.commandTrackers.get(sourceCommandType);
      if (tracker && !tracker.hasCompleted) {
        tracker.events.push(event);
        tracker.hasCompleted = true;
        this.checkAndFireHandler(instanceId, instance);
      }
    }
  }

  private isValidId(id: string | undefined): id is string {
    return id !== undefined && id !== null && id !== '';
  }

  private generateTemplateId(registration: SettledHandlerRegistration): string {
    return `template-${registration.commandTypes.join(',')}`;
  }

  private generateInstanceId(templateId: string, correlationId: string): string {
    return `${templateId}-${correlationId}`;
  }

  private ensureInstanceExists(template: HandlerTemplate, correlationId: string): void {
    const instanceId = this.generateInstanceId(template.id, correlationId);

    if (this.handlerInstances.has(instanceId)) {
      return;
    }

    const commandTrackers = new Map<string, CommandTracker>();
    for (const commandType of template.registration.commandTypes) {
      commandTrackers.set(commandType, {
        commandType,
        hasStarted: false,
        hasCompleted: false,
        events: [],
      });
    }

    this.handlerInstances.set(instanceId, {
      templateId: template.id,
      correlationId,
      registration: template.registration,
      commandTrackers,
    });
  }

  private markCommandStarted(templateId: string, correlationId: string, commandType: string): void {
    const instanceId = this.generateInstanceId(templateId, correlationId);
    const instance = this.handlerInstances.get(instanceId);

    const tracker = instance?.commandTrackers.get(commandType);
    if (tracker) {
      tracker.hasStarted = true;
      tracker.hasCompleted = false;
    }
  }

  private checkAndFireHandler(instanceId: string, instance: HandlerInstance): void {
    const allComplete = Array.from(instance.commandTrackers.values()).every(
      (tracker) => tracker.hasStarted && tracker.hasCompleted,
    );

    if (!allComplete) {
      return;
    }

    const eventsByCommandType = this.collectEvents(instance);

    try {
      const send: SendFunction = (commandType, data) => {
        if (this.onDispatch) {
          this.onDispatch(commandType, data, instance.correlationId);
        }
      };

      const result = instance.registration.handler(eventsByCommandType, send);

      if (this.shouldPersist(result)) {
        this.resetTrackers(instance);
      } else {
        this.handlerInstances.delete(instanceId);
      }
    } catch (error) {
      this.onError?.(error, {
        commandTypes: instance.registration.commandTypes,
        correlationId: instance.correlationId,
      });
      this.handlerInstances.delete(instanceId);
    }
  }

  private collectEvents(instance: HandlerInstance): Record<string, Event[]> {
    const events: Record<string, Event[]> = {};
    for (const [commandType, tracker] of instance.commandTrackers) {
      events[commandType] = [...tracker.events];
    }
    return events;
  }

  private shouldPersist(result: void | { persist: boolean }): boolean {
    return (
      result !== null &&
      result !== undefined &&
      typeof result === 'object' &&
      'persist' in result &&
      result.persist === true
    );
  }

  private resetTrackers(instance: HandlerInstance): void {
    for (const tracker of instance.commandTrackers.values()) {
      tracker.hasStarted = false;
      tracker.hasCompleted = false;
      tracker.events = [];
    }
  }
}
