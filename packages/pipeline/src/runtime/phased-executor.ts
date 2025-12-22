import type { Event } from '@auto-engineer/message-bus';
import type { ForEachPhasedDescriptor } from '../core/descriptors';

interface ItemTracker {
  key: string;
  phase: string;
  dispatched: boolean;
  completed: boolean;
}

interface PhasedSession {
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
}

export class PhasedExecutor {
  private sessions = new Map<string, PhasedSession>();
  private keyToSession = new Map<string, string>();
  private readonly onDispatch: (commandType: string, data: unknown, correlationId: string) => void;
  private readonly onComplete: (event: Event, correlationId: string) => void;

  constructor(options: PhasedExecutorOptions) {
    this.onDispatch = options.onDispatch;
    this.onComplete = options.onComplete;
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

    const session: PhasedSession = {
      correlationId,
      handler,
      triggerEvent: event,
      items: itemTrackers,
      phases: handler.phases,
      currentPhaseIndex: 0,
      pendingInPhase: new Set(),
      failedItems: new Map(),
    };

    const sessionId = this.generateSessionId(correlationId, handler);
    this.sessions.set(sessionId, session);

    for (const key of itemTrackers.keys()) {
      this.keyToSession.set(this.keyWithCorrelation(key, correlationId), sessionId);
    }

    this.dispatchCurrentPhase(sessionId);
  }

  onEventReceived(event: Event, itemKey: string): void {
    const correlationId = event.correlationId;
    if (correlationId === undefined || correlationId === '') return;

    const lookupKey = this.keyWithCorrelation(itemKey, correlationId);
    const sessionId = this.keyToSession.get(lookupKey);
    if (sessionId === undefined) return;

    const session = this.sessions.get(sessionId);
    if (!session) return;

    const tracker = session.items.get(itemKey);
    if (!tracker || tracker.completed) return;

    tracker.completed = true;
    session.pendingInPhase.delete(itemKey);

    if (session.handler.stopOnFailure && this.isFailureEvent(event, session.handler)) {
      session.failedItems.set(itemKey, event);
      this.handleFailure(sessionId, session);
      return;
    }

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
    const session = this.sessions.get(sessionId);
    if (!session) return;

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

      const item = this.findItemByKey(session, tracker.key);
      if (item !== undefined) {
        const command = session.handler.emitFactory(item, tracker.phase, session.triggerEvent);
        this.onDispatch(command.commandType, command.data, session.correlationId);
      }
    }
  }

  private advanceToNextPhase(sessionId: string, session: PhasedSession): void {
    session.currentPhaseIndex++;
    this.dispatchCurrentPhase(sessionId);
  }

  private handleFailure(sessionId: string, session: PhasedSession): void {
    this.completeSession(sessionId, session, false);
  }

  private completeSession(sessionId: string, session: PhasedSession, success: boolean): void {
    const eventType = success ? session.handler.completion.successEvent : session.handler.completion.failureEvent;

    const results = this.collectResults(session);
    const eventData = success
      ? { results, itemCount: session.items.size }
      : { failures: Array.from(session.failedItems.entries()).map(([k, v]) => ({ key: k, error: v })) };

    const completionEvent: Event = {
      type: eventType,
      correlationId: session.correlationId,
      data: eventData,
    };

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
    return event.type === handler.completion.failureEvent;
  }

  private generateSessionId(correlationId: string, handler: ForEachPhasedDescriptor): string {
    return `phased-${correlationId}-${handler.eventType}`;
  }

  private keyWithCorrelation(key: string, correlationId: string): string {
    return `${correlationId}::${key}`;
  }
}
