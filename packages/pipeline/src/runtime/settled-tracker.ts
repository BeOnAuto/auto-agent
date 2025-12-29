import type { Command, Event } from '@auto-engineer/message-bus';
import type { SettledEvent, SettledInstanceDocument } from '../projections/settled-instance-projection';
import type { PipelineReadModel } from '../store/pipeline-read-model';

type SendFunction = (commandType: string, data: unknown) => void;

type SettledHandler = (events: Record<string, Event[]>, send: SendFunction) => void | { persist: boolean };

interface SettledHandlerRegistration {
  commandTypes: readonly string[];
  handler: SettledHandler;
}

interface HandlerTemplate {
  id: string;
  registration: SettledHandlerRegistration;
}

interface SettledErrorContext {
  commandTypes: readonly string[];
  correlationId: string;
}

interface SettledTrackerOptions {
  readModel: PipelineReadModel;
  onDispatch?: (commandType: string, data: unknown, correlationId: string) => void;
  onError?: (error: unknown, context: SettledErrorContext) => void;
  onEventEmit?: (event: SettledEvent) => void | Promise<void>;
}

export class SettledTracker {
  private handlerTemplates = new Map<string, HandlerTemplate>();
  private commandToTemplateIds = new Map<string, Set<string>>();
  private readonly readModel: PipelineReadModel;
  private readonly onDispatch?: (commandType: string, data: unknown, correlationId: string) => void;
  private readonly onError?: (error: unknown, context: SettledErrorContext) => void;
  private readonly onEventEmit?: (event: SettledEvent) => void | Promise<void>;

  constructor(options: SettledTrackerOptions) {
    this.readModel = options.readModel;
    this.onDispatch = options.onDispatch;
    this.onError = options.onError;
    this.onEventEmit = options.onEventEmit;
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

  async isWaitingForAsync(correlationId: string, commandType: string): Promise<boolean> {
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

    const instances = await this.readModel.getActiveSettledInstances(correlationId);

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

        const updatedInstance = await this.readModel.getSettledInstance(instanceDoc.templateId, correlationId);
        if (updatedInstance) {
          await this.checkAndFireHandler(updatedInstance);
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

  private async ensureInstanceExists(template: HandlerTemplate, correlationId: string): Promise<boolean> {
    const existsInProjection = (await this.readModel.getSettledInstance(template.id, correlationId)) !== null;

    if (existsInProjection) {
      return false;
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

  private async checkAndFireHandler(instanceDoc: SettledInstanceDocument): Promise<void> {
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
}
