import type { Event } from '@auto-engineer/message-bus';
import { define } from '../../builder/define';

interface Component {
  type: 'molecule' | 'organism' | 'page';
  filePath: string;
}

interface SliceGeneratedData {
  slicePath: string;
}

interface SliceImplementedData {
  slicePath: string;
}

interface ClientGeneratedData {
  components: Component[];
  targetDir: string;
}

interface CheckEventData {
  targetDirectory?: string;
  errors?: string;
}

const MAX_RETRIES = 4;
const sliceRetryState = new Map<string, number>();

function hasAnyFailures(events: Event[]): boolean {
  return events.some((e) => e.type.includes('Failed'));
}

function collectErrors(events: Event[]): string {
  return events
    .filter((e) => e.type.includes('Failed'))
    .map((e) => (e.data as CheckEventData).errors ?? '')
    .filter((s) => s.length > 0)
    .join('\n');
}

function extractSlicePath(events: Record<string, Event[]>): string {
  const firstEvent = events.CheckTests?.[0] ?? events.CheckTypes?.[0] ?? events.CheckLint?.[0];
  const data = firstEvent?.data as CheckEventData | undefined;
  return data?.targetDirectory ?? '';
}

function gatherAllCheckEvents(events: Record<string, Event[]>): Event[] {
  return [...(events.CheckTests ?? []), ...(events.CheckTypes ?? []), ...(events.CheckLint ?? [])];
}

function shouldRetry(slicePath: string): boolean {
  const attempts = sliceRetryState.get(slicePath) ?? 0;
  return attempts < MAX_RETRIES;
}

function incrementRetryCount(slicePath: string): number {
  const attempts = sliceRetryState.get(slicePath) ?? 0;
  sliceRetryState.set(slicePath, attempts + 1);
  return attempts + 1;
}

function hasValidComponents(e: { data: ClientGeneratedData | null }): boolean {
  return e.data !== null && Array.isArray(e.data.components) && e.data.components.length > 0;
}

function hasInvalidComponents(e: { data: ClientGeneratedData | null }): boolean {
  return !hasValidComponents(e);
}

export function createKanbanFullPipeline() {
  return define('kanban-full')
    .on('SchemaExported')
    .emit('GenerateServer', () => ({
      modelPath: './.context/schema.json',
      destination: '.',
    }))

    .on('SliceGenerated')
    .emit('ImplementSlice', (e: { data: SliceGeneratedData }) => ({
      slicePath: e.data.slicePath,
      context: { previousOutputs: 'errors', attemptNumber: 0 },
      aiOptions: { maxTokens: 2000 },
    }))

    .on('SliceImplemented')
    .emit('CheckTests', (e: { data: SliceImplementedData }) => ({
      targetDirectory: e.data.slicePath,
      scope: 'slice',
    }))
    .emit('CheckTypes', (e: { data: SliceImplementedData }) => ({
      targetDirectory: e.data.slicePath,
      scope: 'slice',
    }))
    .emit('CheckLint', (e: { data: SliceImplementedData }) => ({
      targetDirectory: e.data.slicePath,
      scope: 'slice',
      fix: true,
    }))

    .settled(['CheckTests', 'CheckTypes', 'CheckLint'])
    .dispatch((events, send) => {
      const allEvents = gatherAllCheckEvents(events);

      if (!hasAnyFailures(allEvents)) {
        const slicePath = extractSlicePath(events);
        sliceRetryState.delete(slicePath);
        return;
      }

      const slicePath = extractSlicePath(events);

      if (!shouldRetry(slicePath)) {
        sliceRetryState.delete(slicePath);
        return;
      }

      const retryAttempt = incrementRetryCount(slicePath);
      send('ImplementSlice', {
        slicePath,
        context: { previousOutputs: collectErrors(allEvents), attemptNumber: retryAttempt },
        aiOptions: { maxTokens: 2000 },
      });
      return { persist: true };
    })

    .on('ServerGenerated')
    .emit('GenerateIA', () => ({
      modelPath: './.context/schema.json',
      outputDir: './.context',
    }))
    .emit('StartServer', () => ({
      serverDirectory: './server',
    }))

    .on('IAGenerated')
    .emit('GenerateClient', () => ({
      targetDir: './client',
      iaSchemaPath: './.context/auto-ia-scheme.json',
      gqlSchemaPath: './.context/schema.graphql',
      figmaVariablesPath: './.context/figma-file.json',
    }))

    .on('ClientGenerated')
    .when(hasInvalidComponents)
    .emit('ImplementComponent', () => ({
      projectDir: './client',
      iaSchemeDir: './.context',
      designSystemPath: './.context/design-system.md',
      componentType: 'molecule',
      filePath: 'client/src/components/molecules/Example.tsx',
      componentName: 'Example.tsx',
      aiOptions: { maxTokens: 3000 },
    }))

    .on('ClientGenerated')
    .when(hasValidComponents)
    .forEach((e: { data: ClientGeneratedData }) => e.data.components)
    .groupInto(['molecule', 'organism', 'page'], (c) => c.type)
    .process('ImplementComponent', (c: Component) => ({
      projectDir: './client',
      iaSchemeDir: './.context',
      designSystemPath: './.context/design-system.md',
      componentType: c.type,
      filePath: c.filePath,
      componentName: c.filePath.split('/').pop()?.replace('.tsx', '') ?? '',
      aiOptions: { maxTokens: 3000 },
    }))
    .onComplete({
      success: 'AllComponentsImplemented',
      failure: 'ComponentsFailed',
      itemKey: (e) => (e.data as { filePath?: string }).filePath ?? '',
    })

    .build();
}

export function resetKanbanState(): void {
  sliceRetryState.clear();
}
