import * as path from 'node:path';
import type { Event } from '@auto-engineer/message-bus';
import { define } from '@auto-engineer/pipeline';

interface Component {
  type: 'molecule' | 'organism' | 'page';
  filePath: string;
}

interface SchemaExportedData {
  directory: string;
  outputPath: string;
}

interface ChangesDetectedData {
  modelPath: string;
  destination: string;
  changeSet: Record<string, unknown>;
  isFirstRun: boolean;
  newState: Record<string, unknown>;
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

interface ValidationError {
  component: string;
  type: 'molecule' | 'organism';
  field: string;
  invalidReferences: string[];
  message: string;
}

interface IAValidationFailedData {
  errors: ValidationError[];
  outputDir: string;
  modelPath: string;
}

const MAX_RETRIES = 4;
const MAX_IA_RETRIES = 3;
const sliceRetryState = new Map<string, number>();
let iaRetryCount = 0;
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

export const fileId = 'kanbanNew1';

export const plugins = [
  '@auto-engineer/model-diff',
  '@auto-engineer/server-checks',
  '@auto-engineer/design-system-importer',
  '@auto-engineer/server-generator-apollo-emmett',
  '@auto-engineer/narrative',
  '@auto-engineer/frontend-checks',
  '@auto-engineer/frontend-implementer',
  '@auto-engineer/component-implementer',
  '@auto-engineer/information-architect',
  '@auto-engineer/frontend-generator-react-graphql',
  '@auto-engineer/server-implementer',
  '@auto-engineer/dev-server',
];

export const pipeline = define('kanban-todo')
  .on('SchemaExported')
  .emit('DetectChanges', (e: { data: SchemaExportedData }) => {
    projectRoot = e.data.directory;
    return {
      modelPath: e.data.outputPath,
      destination: e.data.directory,
    };
  })

  .on('ChangesDetected')
  .emit('GenerateServer', (e: { data: ChangesDetectedData }) => ({
    modelPath: e.data.modelPath,
    destination: e.data.destination,
    changeSet: e.data.changeSet,
    isFirstRun: e.data.isFirstRun,
    newState: e.data.newState,
  }))

  .on('SliceGenerated')
  .emit('ImplementSlice', (e: { data: SliceGeneratedData }) => ({
    slicePath: resolvePath(e.data.slicePath),
    context: { previousOutputs: '', attemptNumber: 0 },
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
      const errors = collectErrors(allEvents);
      console.error(`❌ Slice implementation failed after ${MAX_RETRIES} retries: ${slicePath}`);
      if (errors) {
        console.error(`   Last errors:\n${errors}`);
      }
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
  .emit('GenerateIA', () => {
    iaRetryCount = 0;
    return {
      modelPath: resolvePath('./.context/schema.json'),
      outputDir: resolvePath('./.context'),
    };
  })
  .emit('StartServer', () => ({
    serverDirectory: resolvePath('./server'),
  }))

  .on('IAValidationFailed')
  .emit('GenerateIA', (e: { data: IAValidationFailedData }) => {
    iaRetryCount += 1;
    if (iaRetryCount > MAX_IA_RETRIES) {
      console.error('IA validation failed after max retries. Errors:', e.data.errors);
      return null;
    }
    const errorSummary = e.data.errors.map((err) => err.message).join('\n');
    console.log(`IA validation failed (attempt ${iaRetryCount}/${MAX_IA_RETRIES}). Retrying...`);
    console.log('Errors:\n', errorSummary);
    return {
      modelPath: e.data.modelPath,
      outputDir: e.data.outputDir,
      previousErrors: errorSummary,
    };
  })

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


  // build dependency chain
  // page >> org1 && org 2
  // org2 >> mol1 && mol2 
  // process dependency tree

  .forEach((e: { data: ClientGeneratedData }) => e.data.components)
  .groupInto(['molecule', 'organism', 'page'], (c) => c.type) // group into phased chain
  .process('ImplementComponent', (c: Component) => ({ // processPhase
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

export function resetState(): void {
  sliceRetryState.clear();
  iaRetryCount = 0;
  projectRoot = '';
}

export function setProjectRoot(root: string): void {
  projectRoot = root;
}
