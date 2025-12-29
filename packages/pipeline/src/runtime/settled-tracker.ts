import type { Command, Event } from '@auto-engineer/message-bus';
import type { SettledEvent, SettledInstanceDocument } from '../projections/settled-instance-projection';
import type { PipelineReadModel } from '../store/pipeline-read-model';

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
  readModel?: PipelineReadModel;
  onDispatch?: (commandType: string, data: unknown, correlationId: string) => void;
  onError?: (error: unknown, context: SettledErrorContext) => void;
  onEventEmit?: (event: SettledEvent) => void | Promise<void>;
}

export class SettledTracker {
  private handlerTemplates = new Map<string, HandlerTemplate>();
  private handlerInstances = new Map<string, HandlerInstance>();
  private commandToTemplateIds = new Map<string, Set<string>>();
  private readonly readModel?: PipelineReadModel;
  private readonly onDispatch?: (commandType: string, data: unknown, correlationId: string) => void;
  private readonly onError?: (error: unknown, context: SettledErrorContext) => void;
  private readonly onEventEmit?: (event: SettledEvent) => void | Promise<void>;

  constructor(options?: SettledTrackerOptions) {
    this.readModel = options?.readModel;
    this.onDispatch = options?.onDispatch;
    this.onError = options?.onError;
    this.onEventEmit = options?.onEventEmit;
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

  rebuildFromProjection(documents: SettledInstanceDocument[]): void {
    for (const doc of documents) {
      if (doc.status !== 'active') {
        continue;
      }

      const template = this.handlerTemplates.get(doc.templateId);
      if (!template) {
        continue;
      }

      const instanceId = this.generateInstanceId(doc.templateId, doc.correlationId);
      const commandTrackers = new Map<string, CommandTracker>();

      for (const tracker of doc.commandTrackers) {
        commandTrackers.set(tracker.commandType, {
          commandType: tracker.commandType,
          hasStarted: tracker.hasStarted,
          hasCompleted: tracker.hasCompleted,
          events: [...tracker.events],
        });
      }

      this.handlerInstances.set(instanceId, {
        templateId: doc.templateId,
        correlationId: doc.correlationId,
        registration: template.registration,
        commandTrackers,
      });
    }
  }

  async onCommandStarted(command: Command): Promise<void> {
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
        await this.ensureInstanceExists(template, correlationId);
        await this.markCommandStarted(template.id, correlationId, commandType);
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

  async isWaitingForAsync(correlationId: string, commandType: string): Promise<boolean> {
    if (!this.readModel) {
      return this.isWaitingFor(correlationId, commandType);
    }

    const instances = await this.readModel.getActiveSettledInstances(correlationId);
    for (const instance of instances) {
      const tracker = instance.commandTrackers.find((t) => t.commandType === commandType);
      if (tracker?.hasStarted === true && tracker.hasCompleted === false) {
        return true;
      }
    }
    return false;
  }

  async onEventReceived(event: Event, sourceCommandType: string): Promise<void> {
    const correlationId = event.correlationId;

    if (!this.isValidId(correlationId)) {
      return;
    }

    if (this.readModel) {
      await this.onEventReceivedES(event, sourceCommandType, correlationId);
    } else {
      await this.onEventReceivedLegacy(event, sourceCommandType, correlationId);
    }
  }

  private async onEventReceivedLegacy(event: Event, sourceCommandType: string, correlationId: string): Promise<void> {
    for (const [instanceId, instance] of this.handlerInstances) {
      if (instance.correlationId !== correlationId) {
        continue;
      }

      const tracker = instance.commandTrackers.get(sourceCommandType);
      if (tracker && !tracker.hasCompleted) {
        tracker.events.push(event);
        tracker.hasCompleted = true;

        await this.emitEvent({
          type: 'SettledEventReceived',
          data: {
            templateId: instance.templateId,
            correlationId,
            commandType: sourceCommandType,
            event,
          },
        });

        await this.checkAndFireHandler(instanceId, instance);
      }
    }
  }

  private async onEventReceivedES(event: Event, sourceCommandType: string, correlationId: string): Promise<void> {
    const instances = await this.readModel!.getActiveSettledInstances(correlationId);

    for (const instanceDoc of instances) {
      const tracker = instanceDoc.commandTrackers.find((t) => t.commandType === sourceCommandType);
      if (tracker && !tracker.hasCompleted) {
        await this.emitEvent({
          type: 'SettledEventReceived',
          data: {
            templateId: instanceDoc.templateId,
            correlationId,
            commandType: sourceCommandType,
            event,
          },
        });

        const updatedInstance = await this.readModel!.getSettledInstance(instanceDoc.templateId, correlationId);
        if (updatedInstance) {
          await this.checkAndFireHandlerES(updatedInstance);
        }
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

  private async ensureInstanceExists(template: HandlerTemplate, correlationId: string): Promise<boolean> {
    const instanceId = this.generateInstanceId(template.id, correlationId);

    const existsInProjection = this.readModel
      ? (await this.readModel.getSettledInstance(template.id, correlationId)) !== null
      : this.handlerInstances.has(instanceId);

    if (existsInProjection) {
      return false;
    }

    if (!this.readModel) {
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

    await this.emitEvent({
      type: 'SettledInstanceCreated',
      data: {
        templateId: template.id,
        correlationId,
        commandTypes: template.registration.commandTypes,
      },
    });

    return true;
  }

  private async markCommandStarted(templateId: string, correlationId: string, commandType: string): Promise<void> {
    if (!this.readModel) {
      const instanceId = this.generateInstanceId(templateId, correlationId);
      const instance = this.handlerInstances.get(instanceId);
      const tracker = instance?.commandTrackers.get(commandType);
      if (tracker) {
        tracker.hasStarted = true;
        tracker.hasCompleted = false;
      }
    }

    await this.emitEvent({
      type: 'SettledCommandStarted',
      data: {
        templateId,
        correlationId,
        commandType,
      },
    });
  }

  private async emitEvent(event: SettledEvent): Promise<void> {
    await this.onEventEmit?.(event);
  }

  private async checkAndFireHandler(instanceId: string, instance: HandlerInstance): Promise<void> {
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
      const persist = this.shouldPersist(result);

      await this.emitEvent({
        type: 'SettledHandlerFired',
        data: {
          templateId: instance.templateId,
          correlationId: instance.correlationId,
          persist,
        },
      });

      if (persist) {
        this.resetTrackers(instance);
        await this.emitEvent({
          type: 'SettledInstanceReset',
          data: {
            templateId: instance.templateId,
            correlationId: instance.correlationId,
          },
        });
      } else {
        this.handlerInstances.delete(instanceId);
        await this.emitEvent({
          type: 'SettledInstanceCleaned',
          data: {
            templateId: instance.templateId,
            correlationId: instance.correlationId,
          },
        });
      }
    } catch (error) {
      this.onError?.(error, {
        commandTypes: instance.registration.commandTypes,
        correlationId: instance.correlationId,
      });
      this.handlerInstances.delete(instanceId);
      await this.emitEvent({
        type: 'SettledInstanceCleaned',
        data: {
          templateId: instance.templateId,
          correlationId: instance.correlationId,
        },
      });
    }
  }

  private async checkAndFireHandlerES(instanceDoc: SettledInstanceDocument): Promise<void> {
    const allComplete = instanceDoc.commandTrackers.every((tracker) => tracker.hasStarted && tracker.hasCompleted);

    if (!allComplete) {
      return;
    }

    const template = this.handlerTemplates.get(instanceDoc.templateId);
    if (!template) {
      return;
    }

    const eventsByCommandType = this.collectEventsFromDoc(instanceDoc);

    try {
      const send: SendFunction = (commandType, data) => {
        if (this.onDispatch) {
          this.onDispatch(commandType, data, instanceDoc.correlationId);
        }
      };

      const result = template.registration.handler(eventsByCommandType, send);
      const persist = this.shouldPersist(result);

      await this.emitEvent({
        type: 'SettledHandlerFired',
        data: {
          templateId: instanceDoc.templateId,
          correlationId: instanceDoc.correlationId,
          persist,
        },
      });

      if (persist) {
        await this.emitEvent({
          type: 'SettledInstanceReset',
          data: {
            templateId: instanceDoc.templateId,
            correlationId: instanceDoc.correlationId,
          },
        });
      } else {
        await this.emitEvent({
          type: 'SettledInstanceCleaned',
          data: {
            templateId: instanceDoc.templateId,
            correlationId: instanceDoc.correlationId,
          },
        });
      }
    } catch (error) {
      const commandTypes = instanceDoc.commandTrackers.map((t) => t.commandType);
      this.onError?.(error, {
        commandTypes,
        correlationId: instanceDoc.correlationId,
      });
      await this.emitEvent({
        type: 'SettledInstanceCleaned',
        data: {
          templateId: instanceDoc.templateId,
          correlationId: instanceDoc.correlationId,
        },
      });
    }
  }

  private collectEvents(instance: HandlerInstance): Record<string, Event[]> {
    const events: Record<string, Event[]> = {};
    for (const [commandType, tracker] of instance.commandTrackers) {
      events[commandType] = [...tracker.events];
    }
    return events;
  }

  private collectEventsFromDoc(instanceDoc: SettledInstanceDocument): Record<string, Event[]> {
    const events: Record<string, Event[]> = {};
    for (const tracker of instanceDoc.commandTrackers) {
      events[tracker.commandType] = [...tracker.events];
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
