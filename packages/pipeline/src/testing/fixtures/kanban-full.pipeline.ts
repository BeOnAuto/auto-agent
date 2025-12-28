import type { Event } from '@auto-engineer/message-bus';
import { define } from '../../builder/define';

interface Component {
  type: 'molecule' | 'organism' | 'page';
  filePath: string;
}

interface SchemaExportedData {
  directory: string;
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
  targetDir: string;
}

interface CheckEventData {
  targetDirectory?: string;
  errors?: string;
}

const MAX_RETRIES = 4;
const sliceRetryState = new Map<string, number>();
let projectRoot = '';

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

function resolvePath(relativePath: string): string {
  if (projectRoot === '') {
    return relativePath;
  }
  if (relativePath.startsWith('/')) {
    return relativePath;
  }
  if (relativePath.startsWith('./')) {
    return `${projectRoot}/${relativePath.slice(2)}`;
  }
  return `${projectRoot}/${relativePath}`;
}

export function createKanbanFullPipeline() {
  return define('kanban-full')
    .on('SchemaExported')
    .emit('GenerateServer', (e: { data: SchemaExportedData }) => {
      projectRoot = e.data.directory;
      return {
        modelPath: e.data.outputPath,
        destination: e.data.directory,
      };
    })

    .on('SliceGenerated')
    .emit('ImplementSlice', (e: { data: SliceGeneratedData }) => ({
      slicePath: resolvePath(e.data.slicePath),
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
    .dispatch({ dispatches: ['ImplementSlice'] }, (events, send) => {
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
      modelPath: resolvePath('./.context/schema.json'),
      outputDir: resolvePath('./.context'),
    }))
    .emit('StartServer', () => ({
      serverDirectory: resolvePath('./server'),
    }))

    .on('IAGenerated')
    .emit('GenerateClient', () => ({
      targetDir: resolvePath('./client'),
      iaSchemaPath: resolvePath('./.context/auto-ia-scheme.json'),
      gqlSchemaPath: resolvePath('./.context/schema.graphql'),
      figmaVariablesPath: resolvePath('./.context/figma-file.json'),
    }))

    .on('ClientGenerated')
    .when(hasValidComponents)
    .emit('StartClient', () => ({
      clientDirectory: resolvePath('./client'),
    }))

    .on('ClientGenerated')
    .when(hasInvalidComponents)
    .emit('ImplementComponent', () => ({
      projectDir: resolvePath('./client'),
      iaSchemeDir: resolvePath('./.context'),
      designSystemPath: resolvePath('./.context/design-system.md'),
      componentType: 'molecule',
      filePath: resolvePath('client/src/components/molecules/Example.tsx'),
      componentName: 'Example.tsx',
      aiOptions: { maxTokens: 3000 },
    }))

    .on('ClientGenerated')
    .when(hasValidComponents)
    .forEach((e: { data: ClientGeneratedData }) => e.data.components)
    .groupInto(['molecule', 'organism', 'page'], (c) => c.type)
    .process('ImplementComponent', (c: Component) => ({
      projectDir: resolvePath('./client'),
      iaSchemeDir: resolvePath('./.context'),
      designSystemPath: resolvePath('./.context/design-system.md'),
      componentType: c.type ?? 'molecule',
      filePath: resolvePath(c.filePath ?? ''),
      componentName: (c.filePath ?? '').split('/').pop()?.replace('.tsx', '') ?? '',
      aiOptions: { maxTokens: 3000 },
    }))
    .onComplete({
      success: { name: 'AllComponentsImplemented', displayName: 'All Components Implemented' },
      failure: { name: 'ComponentsFailed', displayName: 'Components Failed' },
      itemKey: (e) => (e.data as { filePath?: string }).filePath ?? '',
    })

    .build();
}

export function resetKanbanState(): void {
  sliceRetryState.clear();
  projectRoot = '';
}

export function setProjectRoot(root: string): void {
  projectRoot = root;
}

export function testResolvePath(relativePath: string): string {
  return resolvePath(relativePath);
}

export function setSliceRetryCount(slicePath: string, count: number): void {
  sliceRetryState.set(slicePath, count);
}

export function testShouldRetry(slicePath: string): boolean {
  return shouldRetry(slicePath);
}
