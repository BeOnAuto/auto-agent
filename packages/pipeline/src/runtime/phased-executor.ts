import type { Event } from '@auto-engineer/message-bus';
import type { ForEachPhasedDescriptor } from '../core/descriptors';
import type { PhasedExecutionDocument, PhasedExecutionEvent } from '../projections/phased-execution-projection';

interface ItemTracker {
  key: string;
  phase: string;
  dispatched: boolean;
  completed: boolean;
}

interface PhasedSession {
  executionId: string;
  correlationId: string;
  handler: ForEachPhasedDescriptor;
  triggerEvent: Event;
  items: Map<string, ItemTracker>;
  phases: readonly string[];
  currentPhaseIndex: number;
  pendingInPhase: Set<string>;
  failedItems: Map<string, unknown>;
}

interface PhasedExecutorOptions {
  onDispatch: (commandType: string, data: unknown, correlationId: string) => void;
  onComplete: (event: Event, correlationId: string) => void;
  onEventEmit?: (event: PhasedExecutionEvent) => void;
}

export class PhasedExecutor {
  private sessions = new Map<string, PhasedSession>();
  private keyToSession = new Map<string, string>();
  private handlerRegistry = new Map<string, ForEachPhasedDescriptor>();
  private readonly onDispatch: (commandType: string, data: unknown, correlationId: string) => void;
  private readonly onComplete: (event: Event, correlationId: string) => void;
  private readonly onEventEmit?: (event: PhasedExecutionEvent) => void;

  constructor(options: PhasedExecutorOptions) {
    this.onDispatch = options.onDispatch;
    this.onComplete = options.onComplete;
    this.onEventEmit = options.onEventEmit;
  }

  registerHandler(handler: ForEachPhasedDescriptor): void {
    const handlerId = this.generateHandlerId(handler);
    this.handlerRegistry.set(handlerId, handler);
  }

  startPhased(handler: ForEachPhasedDescriptor, event: Event, correlationId: string): void {
    const items = handler.itemsSelector(event);
    const itemTrackers = new Map<string, ItemTracker>();

    for (const item of items) {
      const key = handler.completion.itemKey({ type: event.type, data: item as Record<string, unknown> });
      const phase = handler.classifier(item);
      itemTrackers.set(key, {
        key,
        phase,
        dispatched: false,
        completed: false,
      });
    }

    const executionId = this.generateSessionId(correlationId, handler);
    const handlerId = this.generateHandlerId(handler);

    const session: PhasedSession = {
      executionId,
      correlationId,
      handler,
      triggerEvent: event,
      items: itemTrackers,
      phases: handler.phases,
      currentPhaseIndex: 0,
      pendingInPhase: new Set(),
      failedItems: new Map(),
    };

    this.sessions.set(executionId, session);

    for (const key of itemTrackers.keys()) {
      this.keyToSession.set(this.keyWithCorrelation(key, correlationId), executionId);
    }

    this.emitEvent({
      type: 'PhasedExecutionStarted',
      data: {
        executionId,
        correlationId,
        handlerId,
        triggerEvent: event,
        items: Array.from(itemTrackers.values()).map((t) => ({ ...t })),
        phases: handler.phases,
      },
    });

    this.dispatchCurrentPhase(executionId);
  }

  onEventReceived(event: Event, itemKey: string): void {
    const correlationId = event.correlationId;
    if (correlationId === undefined || correlationId === '') return;

    const lookupKey = this.keyWithCorrelation(itemKey, correlationId);
    const sessionId = this.keyToSession.get(lookupKey);
    if (sessionId === undefined) return;

    const session = this.sessions.get(sessionId)!;
    const tracker = session.items.get(itemKey);
    if (tracker === undefined || tracker.completed) return;

    tracker.completed = true;
    session.pendingInPhase.delete(itemKey);

    if (session.handler.stopOnFailure && this.isFailureEvent(event, session.handler)) {
      session.failedItems.set(itemKey, event);
      this.emitEvent({
        type: 'PhasedItemFailed',
        data: { executionId: session.executionId, itemKey, error: event },
      });
      this.handleFailure(sessionId, session);
      return;
    }

    this.emitEvent({
      type: 'PhasedItemCompleted',
      data: { executionId: session.executionId, itemKey, resultEvent: event },
    });

    if (session.pendingInPhase.size === 0) {
      this.advanceToNextPhase(sessionId, session);
    }
  }

  getActiveSessionCount(): number {
    return this.sessions.size;
  }

  isPhaseComplete(correlationId: string, phase: string): boolean {
    for (const session of this.sessions.values()) {
      if (session.correlationId !== correlationId) continue;

      const phaseIndex = session.phases.indexOf(phase);
      if (phaseIndex === -1) continue;

      if (session.currentPhaseIndex > phaseIndex) {
        return true;
      }

      if (session.currentPhaseIndex === phaseIndex) {
        return session.pendingInPhase.size === 0;
      }

      return false;
    }
    return false;
  }

  private dispatchCurrentPhase(sessionId: string): void {
    const session = this.sessions.get(sessionId)!;

    if (session.currentPhaseIndex >= session.phases.length) {
      this.completeSession(sessionId, session, true);
      return;
    }

    const currentPhase = session.phases[session.currentPhaseIndex];
    const itemsToDispatch: ItemTracker[] = [];

    for (const tracker of session.items.values()) {
      if (tracker.phase === currentPhase && !tracker.dispatched) {
        itemsToDispatch.push(tracker);
      }
    }

    if (itemsToDispatch.length === 0) {
      this.advanceToNextPhase(sessionId, session);
      return;
    }

    for (const tracker of itemsToDispatch) {
      tracker.dispatched = true;
      session.pendingInPhase.add(tracker.key);

      this.emitEvent({
        type: 'PhasedItemDispatched',
        data: { executionId: session.executionId, itemKey: tracker.key, phase: tracker.phase },
      });

      const item = this.findItemByKey(session, tracker.key);
      if (item !== undefined) {
        const command = session.handler.emitFactory(item, tracker.phase, session.triggerEvent);
        this.onDispatch(command.commandType, command.data, session.correlationId);
      }
    }
  }

  private advanceToNextPhase(sessionId: string, session: PhasedSession): void {
    const fromPhase = session.currentPhaseIndex;
    session.currentPhaseIndex++;

    this.emitEvent({
      type: 'PhasedPhaseAdvanced',
      data: { executionId: session.executionId, fromPhase, toPhase: session.currentPhaseIndex },
    });

    this.dispatchCurrentPhase(sessionId);
  }

  private handleFailure(sessionId: string, session: PhasedSession): void {
    this.completeSession(sessionId, session, false);
  }

  private completeSession(sessionId: string, session: PhasedSession, success: boolean): void {
    const eventDescriptor = success ? session.handler.completion.successEvent : session.handler.completion.failureEvent;
    const eventType = eventDescriptor.name;

    const results = this.collectResults(session);
    const eventData = success
      ? { results, itemCount: session.items.size }
      : { failures: Array.from(session.failedItems.entries()).map(([k, v]) => ({ key: k, error: v })) };

    const completionEvent: Event = {
      type: eventType,
      correlationId: session.correlationId,
      data: eventData,
    };

    this.emitEvent({
      type: 'PhasedExecutionCompleted',
      data: { executionId: session.executionId, success, results },
    });

    this.onComplete(completionEvent, session.correlationId);
    this.cleanupSession(sessionId, session);
  }

  private collectResults(session: PhasedSession): string[] {
    const completed: string[] = [];
    for (const tracker of session.items.values()) {
      if (tracker.completed) {
        completed.push(tracker.key);
      }
    }
    return completed;
  }

  private cleanupSession(sessionId: string, session: PhasedSession): void {
    for (const key of session.items.keys()) {
      this.keyToSession.delete(this.keyWithCorrelation(key, session.correlationId));
    }
    this.sessions.delete(sessionId);
  }

  private findItemByKey(session: PhasedSession, key: string): unknown {
    const items = session.handler.itemsSelector(session.triggerEvent);
    return items.find((item) => {
      const itemKey = session.handler.completion.itemKey({
        type: session.triggerEvent.type,
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

  private keyWithCorrelation(key: string, correlationId: string): string {
    return `${correlationId}::${key}`;
  }

  private generateHandlerId(handler: ForEachPhasedDescriptor): string {
    return `phased-handler-${handler.eventType}`;
  }

  private emitEvent(event: PhasedExecutionEvent): void {
    this.onEventEmit?.(event);
  }

  rebuildFromProjection(documents: PhasedExecutionDocument[]): void {
    for (const doc of documents) {
      if (doc.status !== 'active') {
        continue;
      }

      const handler = this.handlerRegistry.get(doc.handlerId);
      if (handler === undefined) {
        continue;
      }

      this.rebuildSession(doc, handler);
    }
  }

  private rebuildSession(doc: PhasedExecutionDocument, handler: ForEachPhasedDescriptor): void {
    const itemTrackers = this.rebuildItemTrackers(doc.items);
    const pendingInPhase = this.rebuildPendingInPhase(doc.items);
    const failedItems = this.rebuildFailedItems(doc.failedItems);

    const session: PhasedSession = {
      executionId: doc.executionId,
      correlationId: doc.correlationId,
      handler,
      triggerEvent: doc.triggerEvent,
      items: itemTrackers,
      phases: doc.phases,
      currentPhaseIndex: doc.currentPhaseIndex,
      pendingInPhase,
      failedItems,
    };

    this.sessions.set(doc.executionId, session);

    for (const key of itemTrackers.keys()) {
      this.keyToSession.set(this.keyWithCorrelation(key, doc.correlationId), doc.executionId);
    }
  }

  private rebuildItemTrackers(items: PhasedExecutionDocument['items']): Map<string, ItemTracker> {
    const trackers = new Map<string, ItemTracker>();
    for (const item of items) {
      trackers.set(item.key, {
        key: item.key,
        phase: item.phase,
        dispatched: item.dispatched,
        completed: item.completed,
      });
    }
    return trackers;
  }

  private rebuildPendingInPhase(items: PhasedExecutionDocument['items']): Set<string> {
    const pending = new Set<string>();
    for (const item of items) {
      if (item.dispatched && !item.completed) {
        pending.add(item.key);
      }
    }
    return pending;
  }

  private rebuildFailedItems(failedItems: PhasedExecutionDocument['failedItems']): Map<string, unknown> {
    const failed = new Map<string, unknown>();
    for (const item of failedItems) {
      failed.set(item.key, item.error);
    }
    return failed;
  }
}
