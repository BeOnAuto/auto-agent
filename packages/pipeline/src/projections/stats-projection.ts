import type { MessageLogEvent } from './message-log-projection';

export interface StatsDocument {
  [key: string]: unknown;
  totalMessages: number;
  totalCommands: number;
  totalEvents: number;
}

export function evolve(document: StatsDocument | null, event: MessageLogEvent): StatsDocument {
  const current = document ?? { totalMessages: 0, totalCommands: 0, totalEvents: 0 };

  if (event.type === 'CommandDispatched') {
    return {
      totalMessages: current.totalMessages + 1,
      totalCommands: current.totalCommands + 1,
      totalEvents: current.totalEvents,
    };
  }

  return {
    totalMessages: current.totalMessages + 1,
    totalCommands: current.totalCommands,
    totalEvents: current.totalEvents + 1,
  };
}
