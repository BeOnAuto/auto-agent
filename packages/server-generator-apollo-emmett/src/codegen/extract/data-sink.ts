import type { Slice } from '@auto-engineer/narrative';
import type { CommandRef, ErrorRef } from '../types';
import { extractGwtSpecsFromSlice, type GwtResult } from './step-converter';

function resolveStreamId(stream: string, exampleData: Record<string, unknown>): string {
  return stream.replace(/\$\{([^}]+)\}/g, (_, key: string) => String(exampleData?.[key] ?? 'unknown'));
}

function extractExampleDataFromEventWhen(firstSpec: GwtResult): Record<string, unknown> {
  if (Array.isArray(firstSpec.when)) {
    const firstWhen = firstSpec.when[0];
    return firstWhen?.exampleData ?? {};
  }
  return {};
}

function extractExampleDataFromCommand(firstSpec: GwtResult): Record<string, unknown> {
  const then = firstSpec.then as (CommandRef | ErrorRef)[];
  const firstExample = then.find((t): t is CommandRef => 'exampleData' in t);
  return firstExample?.exampleData ?? {};
}

function extractExampleDataFromSpecs(slice: Slice, gwtSpecs: GwtResult[]): Record<string, unknown> {
  if (gwtSpecs.length === 0) {
    return {};
  }

  const firstSpec = gwtSpecs[0];
  switch (slice.type) {
    case 'react':
    case 'query':
      return extractExampleDataFromEventWhen(firstSpec);
    case 'command':
      return extractExampleDataFromCommand(firstSpec);
    default:
      return {};
  }
}

function isValidStreamSink(item: unknown): item is { destination: { pattern: string } } {
  return (
    typeof item === 'object' &&
    item !== null &&
    'destination' in item &&
    typeof item.destination === 'object' &&
    item.destination !== null &&
    'type' in item.destination &&
    item.destination.type === 'stream' &&
    'pattern' in item.destination &&
    typeof item.destination.pattern === 'string'
  );
}

function processStreamSink(item: unknown, exampleData: Record<string, unknown>) {
  if (!isValidStreamSink(item)) {
    return null;
  }

  const streamPattern = item.destination.pattern;
  const streamId = streamPattern.length > 0 ? resolveStreamId(streamPattern, exampleData) : undefined;

  return { streamPattern, streamId };
}

export function getStreamFromSink(slice: Slice): { streamPattern?: string; streamId?: string } {
  if (!('server' in slice)) return {};
  if (slice.server == null || !('data' in slice.server) || !Array.isArray(slice.server.data)) {
    return {};
  }
  const gwtSpecs = extractGwtSpecsFromSlice(slice);
  const exampleData = extractExampleDataFromSpecs(slice, gwtSpecs);
  const serverData = slice.server.data;

  for (const item of serverData) {
    const result = processStreamSink(item, exampleData);
    if (result) {
      return result;
    }
  }

  return {};
}
