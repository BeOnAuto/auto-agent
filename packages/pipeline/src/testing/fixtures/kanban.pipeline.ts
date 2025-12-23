import type { Event } from '@auto-engineer/message-bus';
import { define } from '../../builder/define';

interface Component {
  id: string;
  type: 'molecule' | 'organism' | 'page';
  filePath: string;
}

interface SchemaExportedData {
  outputPath: string;
}

interface SliceGeneratedData {
  slicePath: string;
}

interface SliceImplementedData {
  slicePath: string;
}

interface ClientGeneratedData {
  components: Component[];
}

interface CheckEventData {
  target: string;
}

const MAX_RETRIES = 3;
const retryState = new Map<string, number>();

function hasAnyFailures(events: Event[]): boolean {
  return events.some((e) => e.type.includes('Failed'));
}

function collectErrors(events: Event[]): string[] {
  return events.filter((e) => e.type.includes('Failed')).map((e) => JSON.stringify(e.data));
}

function extractSlicePath(events: Record<string, Event[]>): string {
  const firstEvent = events.CheckTests?.[0] ?? events.CheckTypes?.[0] ?? events.CheckLint?.[0];
  const data = firstEvent?.data as CheckEventData | undefined;
  return data?.target ?? 'unknown';
}

function gatherAllCheckEvents(events: Record<string, Event[]>): Event[] {
  return [...(events.CheckTests ?? []), ...(events.CheckTypes ?? []), ...(events.CheckLint ?? [])];
}

function shouldRetry(slicePath: string): boolean {
  const attempts = retryState.get(slicePath) ?? 0;
  return attempts < MAX_RETRIES;
}

function incrementRetryCount(slicePath: string): number {
  const attempts = retryState.get(slicePath) ?? 0;
  retryState.set(slicePath, attempts + 1);
  return attempts + 1;
}

export function createKanbanPipeline() {
  return define('kanban')
    .on('SchemaExported')
    .emit('GenerateServer', (e: { data: SchemaExportedData }) => ({ modelPath: e.data.outputPath }))

    .on('SliceGenerated')
    .emit('ImplementSlice', (e: { data: SliceGeneratedData }) => ({ slicePath: e.data.slicePath }))

    .on('SliceImplemented')
    .emit('CheckTests', (e: { data: SliceImplementedData }) => ({ target: e.data.slicePath }))
    .emit('CheckTypes', (e: { data: SliceImplementedData }) => ({ target: e.data.slicePath }))
    .emit('CheckLint', (e: { data: SliceImplementedData }) => ({ target: e.data.slicePath }))

    .settled(['CheckTests', 'CheckTypes', 'CheckLint'])
    .dispatch({ dispatches: ['ImplementSlice'] }, (events, send) => {
      const allEvents = gatherAllCheckEvents(events);

      if (!hasAnyFailures(allEvents)) {
        return;
      }

      const slicePath = extractSlicePath(events);

      if (!shouldRetry(slicePath)) {
        return;
      }

      const retryAttempt = incrementRetryCount(slicePath);
      send('ImplementSlice', { slicePath, context: { errors: collectErrors(allEvents), retryAttempt } });
      return { persist: true };
    })

    .on('ServerGenerated')
    .emit('GenerateIA', (e: { data: { modelPath: string } }) => ({ modelPath: e.data.modelPath }))
    .emit('StartServer', {})

    .on('IAGenerated')
    .emit('GenerateClient', {})

    .on('ClientGenerated')
    .forEach((e: { data: ClientGeneratedData }) => e.data.components)
    .groupInto(['molecule', 'organism', 'page'], (c) => c.type)
    .process('ImplementComponent', (c) => ({ filePath: c.filePath }))
    .onComplete({
      success: 'AllComponentsImplemented',
      failure: 'ComponentsFailed',
      itemKey: (e) => (e.data as { filePath?: string }).filePath ?? '',
    })

    .build();
}

export function resetRetryState(): void {
  retryState.clear();
}
