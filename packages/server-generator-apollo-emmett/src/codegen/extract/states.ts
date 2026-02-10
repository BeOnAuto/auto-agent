import type { Slice } from '@auto-engineer/narrative';
import type { EventRef, Message, MessageDefinition } from '../types';
import { extractFieldsFromMessage } from './fields';

interface DataItem {
  origin?: unknown;
  target?: {
    name?: string;
  };
}

function createStateMessage(stateName: string, allMessages: MessageDefinition[]): Message {
  return {
    type: stateName,
    fields: extractFieldsFromMessage(stateName, 'state', allMessages),
  };
}

function hasServerData(slice: Slice): slice is Slice & { server: { data: { items: unknown[] } } } {
  return (
    'server' in slice &&
    Boolean(slice.server) &&
    'data' in slice.server &&
    slice.server.data?.items != null &&
    Array.isArray(slice.server.data.items) &&
    slice.server.data.items.length > 0
  );
}

export function extractStatesFromGiven(givenRefs: EventRef[], allMessages: MessageDefinition[]): Message[] {
  return givenRefs
    .filter((ref) => allMessages.some((m) => m.type === 'state' && m.name === ref.eventRef))
    .map((ref) => createStateMessage(ref.eventRef, allMessages));
}

export function extractStatesFromTarget(slice: Slice, allMessages: MessageDefinition[]): Message[] {
  if (!hasServerData(slice)) {
    return [];
  }

  const targets = slice.server.data.items
    .map((d) => (d as DataItem).target?.name)
    .filter((name): name is string => typeof name === 'string');
  const uniqueTargets = Array.from(new Set(targets));

  return uniqueTargets.map((name) => createStateMessage(name, allMessages));
}

export function extractStatesFromData(slice: Slice, allMessages: MessageDefinition[]): Message[] {
  if (!hasServerData(slice)) {
    return [];
  }

  const states: Message[] = [];
  const seenStates = new Set<string>();

  for (const dataItem of slice.server.data.items) {
    const item = dataItem as DataItem;
    if (!('origin' in item) || typeof item.target?.name !== 'string') {
      continue;
    }

    const stateName = item.target.name;
    if (seenStates.has(stateName)) {
      continue;
    }

    const fields = extractFieldsFromMessage(stateName, 'state', allMessages);
    if (fields.length > 0) {
      states.push(createStateMessage(stateName, allMessages));
      seenStates.add(stateName);
    }
  }

  return states;
}
