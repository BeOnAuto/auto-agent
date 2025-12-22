import type { Command, Event } from '@auto-engineer/message-bus';
import type { CommandHandlerWithMetadata } from '../server/pipeline-server';

type MockHandlerFn = (cmd: Command, attempt: number) => Event | Event[];

interface MockHandlerConfig {
  name: string;
  events: string[];
  fn: MockHandlerFn;
}

const callCounts = new Map<string, number>();

export function createMockHandlers(configs: MockHandlerConfig[]): CommandHandlerWithMetadata[] {
  callCounts.clear();

  return configs.map((config) => ({
    name: config.name,
    events: config.events,
    handle: async (cmd: Command): Promise<Event | Event[]> => {
      const currentCount = (callCounts.get(config.name) ?? 0) + 1;
      callCounts.set(config.name, currentCount);
      return config.fn(cmd, currentCount);
    },
  }));
}

export function getHandlerCallCount(handlerName: string): number {
  return callCounts.get(handlerName) ?? 0;
}

export function resetCallCounts(): void {
  callCounts.clear();
}

interface StatefulHandlerConfig {
  name: string;
  events: string[];
  initialFails: number;
  failEvent: (cmd: Command) => Event;
  successEvent: (cmd: Command) => Event;
}

export function createStatefulHandler(config: StatefulHandlerConfig): CommandHandlerWithMetadata {
  let callCount = 0;

  return {
    name: config.name,
    events: config.events,
    handle: async (cmd: Command): Promise<Event> => {
      callCount++;
      if (callCount <= config.initialFails) {
        return config.failEvent(cmd);
      }
      return config.successEvent(cmd);
    },
  };
}
