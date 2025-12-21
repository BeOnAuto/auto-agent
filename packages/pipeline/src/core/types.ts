import type { Event } from '@auto-engineer/message-bus';

export type { Command, Event } from '@auto-engineer/message-bus';

export type DataRecord = Record<string, unknown>;

export type DataOrFactory<D extends DataRecord = DataRecord> = D | ((event: Event) => D);

export interface CommandDispatch<D extends DataRecord = DataRecord> {
  commandType: string;
  data: DataOrFactory<D>;
}

export function dispatch<D extends DataRecord>(commandType: string, data: DataOrFactory<D>): CommandDispatch<D> {
  return { commandType, data };
}
