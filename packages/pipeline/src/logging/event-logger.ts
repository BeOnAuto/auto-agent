import type { Event } from '@auto-engineer/message-bus';

export interface LogEntry {
  timestamp: string;
  event: Event;
  correlationId?: string;
}

export interface EventLoggerOptions {
  onLog?: (entry: LogEntry) => void;
}

export class EventLogger {
  private entries: LogEntry[] = [];
  private readonly onLog?: (entry: LogEntry) => void;

  constructor(options?: EventLoggerOptions) {
    this.onLog = options?.onLog;
  }

  log(event: Event): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      event,
      correlationId: event.correlationId,
    };
    this.entries.push(entry);
    this.onLog?.(entry);
  }

  getEntries(): LogEntry[] {
    return [...this.entries];
  }

  getEntriesByCorrelationId(correlationId: string): LogEntry[] {
    return this.entries.filter((e) => e.correlationId === correlationId);
  }

  getEventTypes(): string[] {
    return this.entries.map((e) => e.event.type);
  }

  clear(): void {
    this.entries = [];
  }

  toJSON(): LogEntry[] {
    return this.getEntries();
  }
}
