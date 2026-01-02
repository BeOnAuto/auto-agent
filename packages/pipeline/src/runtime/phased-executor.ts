import type { Event } from '@auto-engineer/message-bus';
import type { ForEachPhasedDescriptor } from '../core/descriptors';
import type { PhasedExecutionDocument, PhasedExecutionEvent } from '../projections/phased-execution-projection';
import type { PipelineReadModel } from '../store/pipeline-read-model';

interface PhasedExecutorOptions {
  readModel: PipelineReadModel;
  onDispatch: (commandType: string, data: unknown, correlationId: string) => void;
  onComplete: (event: Event, correlationId: string) => void;
  onEventEmit?: (event: PhasedExecutionEvent) => void | Promise<void>;
}

export class PhasedExecutor {
  private handlerRegistry = new Map<string, ForEachPhasedDescriptor>();
  private readonly readModel: PipelineReadModel;
  private readonly onDispatch: (commandType: string, data: unknown, correlationId: string) => void;
  private readonly onComplete: (event: Event, correlationId: string) => void;
  private readonly onEventEmit?: (event: PhasedExecutionEvent) => void | Promise<void>;

  constructor(options: PhasedExecutorOptions) {
    this.readModel = options.readModel;
    this.onDispatch = options.onDispatch;
    this.onComplete = options.onComplete;
    this.onEventEmit = options.onEventEmit;
  }

  registerHandler(handler: ForEachPhasedDescriptor): void {
    const handlerId = this.generateHandlerId(handler);
    this.handlerRegistry.set(handlerId, handler);
  }

  async startPhased(handler: ForEachPhasedDescriptor, event: Event, correlationId: string): Promise<void> {
    const items = handler.itemsSelector(event);
    const itemData: Array<{ key: string; phase: string; dispatched: boolean; completed: boolean }> = [];

    for (const item of items) {
      const key = handler.completion.itemKey({ type: event.type, data: item as Record<string, unknown> });
      const phase = handler.classifier(item);
      itemData.push({ key, phase, dispatched: false, completed: false });
    }

    const executionId = this.generateSessionId(correlationId, handler);
    const handlerId = this.generateHandlerId(handler);

    await this.emitEvent({
      type: 'PhasedExecutionStarted',
      data: {
        executionId,
        correlationId,
        handlerId,
        triggerEvent: event,
        items: itemData,
        phases: handler.phases,
      },
    });

    await this.dispatchCurrentPhase(executionId, handler);
  }

  async onEventReceived(event: Event, itemKey: string): Promise<void> {
    const correlationId = event.correlationId;
    if (correlationId === undefined || correlationId === '') return;

    const executions = await this.readModel.getActivePhasedExecutions(correlationId);
    const execution = executions.find((ex) => ex.items.some((item) => item.key === itemKey));

    if (execution === undefined) return;

    const itemDoc = execution.items.find((i) => i.key === itemKey);
    if (itemDoc === undefined || itemDoc.completed) return;

    const handler = this.handlerRegistry.get(execution.handlerId)!;

    if (handler.stopOnFailure && this.isFailureEvent(event, handler)) {
      await this.emitEvent({
        type: 'PhasedItemFailed',
        data: { executionId: execution.executionId, itemKey, error: event },
      });
      await this.handleFailure(execution.executionId, handler);
      return;
    }

    await this.emitEvent({
      type: 'PhasedItemCompleted',
      data: { executionId: execution.executionId, itemKey, resultEvent: event },
    });

    const updatedExecution = (await this.readModel.getPhasedExecution(execution.executionId))!;

    const pendingCount = this.countPendingInPhase(updatedExecution);
    if (pendingCount === 0) {
      await this.advanceToNextPhase(execution.executionId, handler);
    }
  }

  async isPhaseComplete(correlationId: string, phase: string): Promise<boolean> {
    const executions = await this.readModel.getActivePhasedExecutions(correlationId);
    for (const execution of executions) {
      const phaseIndex = execution.phases.indexOf(phase);
      if (phaseIndex === -1) continue;

      if (execution.currentPhaseIndex > phaseIndex) {
        return true;
      }

      if (execution.currentPhaseIndex === phaseIndex) {
        const pendingCount = this.countPendingInPhase(execution);
        return pendingCount === 0;
      }

      return false;
    }
    return false;
  }

  private countPendingInPhase(execution: PhasedExecutionDocument): number {
    let pending = 0;
    const currentPhase = execution.phases[execution.currentPhaseIndex];
    for (const item of execution.items) {
      if (item.phase === currentPhase && item.dispatched && !item.completed) {
        pending++;
      }
    }
    return pending;
  }

  private async dispatchCurrentPhase(executionId: string, handler: ForEachPhasedDescriptor): Promise<void> {
    const execution = (await this.readModel.getPhasedExecution(executionId))!;

    if (execution.currentPhaseIndex >= execution.phases.length) {
      await this.completeSession(executionId, handler, true);
      return;
    }

    const currentPhase = execution.phases[execution.currentPhaseIndex];
    const itemsToDispatch = execution.items.filter((i) => i.phase === currentPhase && !i.dispatched);

    if (itemsToDispatch.length === 0) {
      await this.advanceToNextPhase(executionId, handler);
      return;
    }

    for (const item of itemsToDispatch) {
      await this.emitEvent({
        type: 'PhasedItemDispatched',
        data: { executionId, itemKey: item.key, phase: item.phase },
      });

      const originalItem = this.findItemByKey(execution.triggerEvent, handler, item.key);
      if (originalItem !== undefined) {
        const command = handler.emitFactory(originalItem, item.phase, execution.triggerEvent);
        this.onDispatch(command.commandType, command.data, execution.correlationId);
      }
    }
  }

  private async advanceToNextPhase(executionId: string, handler: ForEachPhasedDescriptor): Promise<void> {
    const execution = (await this.readModel.getPhasedExecution(executionId))!;

    const fromPhase = execution.currentPhaseIndex;
    const toPhase = fromPhase + 1;

    await this.emitEvent({
      type: 'PhasedPhaseAdvanced',
      data: { executionId, fromPhase, toPhase },
    });

    await this.dispatchCurrentPhase(executionId, handler);
  }

  private async handleFailure(executionId: string, handler: ForEachPhasedDescriptor): Promise<void> {
    await this.completeSession(executionId, handler, false);
  }

  private async completeSession(
    executionId: string,
    handler: ForEachPhasedDescriptor,
    success: boolean,
  ): Promise<void> {
    const execution = (await this.readModel.getPhasedExecution(executionId))!;

    const eventDescriptor = success ? handler.completion.successEvent : handler.completion.failureEvent;
    const eventType = eventDescriptor.name;

    const results = execution.items.filter((i) => i.completed).map((i) => i.key);
    const eventData = success
      ? { results, itemCount: execution.items.length }
      : { failures: execution.failedItems.map((f) => ({ key: f.key, error: f.error })) };

    const completionEvent: Event = {
      type: eventType,
      correlationId: execution.correlationId,
      data: eventData,
    };

    await this.emitEvent({
      type: 'PhasedExecutionCompleted',
      data: { executionId, success, results },
    });

    this.onComplete(completionEvent, execution.correlationId);
  }

  private findItemByKey(triggerEvent: Event, handler: ForEachPhasedDescriptor, key: string): unknown {
    const items = handler.itemsSelector(triggerEvent);
    return items.find((item) => {
      const itemKey = handler.completion.itemKey({
        type: triggerEvent.type,
        data: item as Record<string, unknown>,
      });
      return itemKey === key;
    });
  }

  private isFailureEvent(event: Event, handler: ForEachPhasedDescriptor): boolean {
    return event.type === handler.completion.failureEvent.name;
  }

  private generateSessionId(correlationId: string, handler: ForEachPhasedDescriptor): string {
    return `phased-${correlationId}-${handler.eventType}`;
  }

  private generateHandlerId(handler: ForEachPhasedDescriptor): string {
    return `phased-handler-${handler.eventType}`;
  }

  private async emitEvent(event: PhasedExecutionEvent): Promise<void> {
    await this.onEventEmit?.(event);
  }
}
