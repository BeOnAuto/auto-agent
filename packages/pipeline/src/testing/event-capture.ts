import type { Event } from '@auto-engineer/message-bus';

export class EventCapture {
  private events: Event[] = [];
  private eventListeners: Array<(event: Event) => void> = [];

  record(event: Event): void {
    this.events.push(event);
    this.eventListeners.forEach((listener) => listener(event));
  }

  getEvents(): Event[] {
    return [...this.events];
  }

  getEventTypes(): string[] {
    return this.events.map((e) => e.type);
  }

  clear(): void {
    this.events = [];
  }

  hasEvent(eventType: string): boolean {
    return this.events.some((e) => e.type === eventType);
  }

  getEventsOfType(eventType: string): Event[] {
    return this.events.filter((e) => e.type === eventType);
  }

  waitForEvent(eventType: string, timeoutMs: number): Promise<Event> {
    const existing = this.events.find((e) => e.type === eventType);
    if (existing) {
      return Promise.resolve(existing);
    }

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        const index = this.eventListeners.indexOf(listener);
        if (index !== -1) {
          this.eventListeners.splice(index, 1);
        }
        reject(new Error(`Timeout waiting for event: ${eventType}`));
      }, timeoutMs);

      const listener = (event: Event) => {
        if (event.type === eventType) {
          clearTimeout(timeoutId);
          const index = this.eventListeners.indexOf(listener);
          if (index !== -1) {
            this.eventListeners.splice(index, 1);
          }
          resolve(event);
        }
      };

      this.eventListeners.push(listener);
    });
  }

  get count(): number {
    return this.events.length;
  }
}
