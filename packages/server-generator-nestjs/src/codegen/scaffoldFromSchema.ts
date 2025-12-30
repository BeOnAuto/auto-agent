import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import ejs from 'ejs';
import { ensureDirExists, ensureDirPath, toKebabCase } from './utils/path.js';
import { camelCase, pascalCase } from 'change-case';
import prettier from 'prettier';
import { Narrative, Slice, Model } from '@auto-engineer/narrative';
import createDebug from 'debug';

const debug = createDebug('auto:server-generator-nestjs:scaffold');

import {
  buildCommandGwtMapping,
  buildQueryGwtMapping,
  extractMessagesFromSpecs,
  extractProjectionName,
  groupEventImports,
  getAllEventTypes,
  getLocalEvents,
  createEventUnionType,
  isInlineObject as isInlineObjectHelper,
  isInlineObjectArray as isInlineObjectArrayHelper,
  baseTs,
  createIsEnumType,
  createFieldUsesDate,
  createFieldUsesJSON,
  createFieldUsesFloat,
  createCollectEnumNames,
} from './extract/index.js';

import { Message, MessageDefinition } from './types.js';
import { parseGraphQlRequest } from './extract/graphql.js';
import { getStreamFromSink } from './extract/data-sink.js';
import { consolidateEntityFields, type ConsolidatedEntity } from './entity-consolidation.js';

const defaultFilesByType: Record<string, string[]> = {
  command: ['command.ts.ejs', 'input.ts.ejs', 'handler.ts.ejs', 'resolver.ts.ejs', 'handler.specs.ts.ejs'],
  query: ['query.ts.ejs', 'type.ts.ejs', 'handler.ts.ejs', 'resolver.ts.ejs'],
  react: [],
};

interface EnumDefinition {
  name: string;
  values: string[];
  unionString: string;
}

interface EnumContext {
  enums: EnumDefinition[];
  unionToEnumName: Map<string, string>;
}

function isStringLiteralUnion(s: string): boolean {
  return /^"[^"]+"(\s*\|\s*"[^"]+")+$/.test(s.trim()) || /^'[^']+'(\s*\|\s*'[^']+)+$/.test(s.trim());
}

function extractStringLiteralValues(unionString: string): string[] {
  const doubleQuoted = unionString.match(/"([^"]+)"/g);
  const singleQuoted = unionString.match(/'([^']+)'/g);
  const matches = doubleQuoted ?? singleQuoted;
  if (matches === null) return [];
  return matches.map((m) => m.slice(1, -1));
}

function normalizeUnionString(values: string[]): string {
  return values
    .slice()
    .sort()
    .map((v) => `'${v}'`)
    .join(' | ');
}

function generateEnumName(fieldName: string, existingNames: Set<string>): string {
  const baseName = pascalCase(fieldName);
  if (!existingNames.has(baseName)) {
    return baseName;
  }
  let counter = 2;
  while (existingNames.has(`${baseName}${counter}`)) {
    counter++;
  }
  return `${baseName}${counter}`;
}

function processFieldForEnum(
  field: { name: string; type: string },
  messageName: string,
  unionToEnumName: Map<string, string>,
  existingEnumNames: Set<string>,
): EnumDefinition | null {
  const tsType = field.type;
  if (tsType === null || tsType === undefined) return null;

  const cleanType = tsType.replace(/\s*\|\s*null\b/g, '').trim();
  const isUnion = isStringLiteralUnion(cleanType);
  if (!isUnion) return null;

  const values = extractStringLiteralValues(cleanType);
  if (values.length === 0) return null;

  const normalized = normalizeUnionString(values);

  if (unionToEnumName.has(normalized)) {
    return null;
  }

  const enumName = generateEnumName(`${messageName}${pascalCase(field.name)}`, existingEnumNames);
  existingEnumNames.add(enumName);

  const enumDef: EnumDefinition = {
    name: enumName,
    values,
    unionString: normalized,
  };

  unionToEnumName.set(normalized, enumName);
  return enumDef;
}

function extractEnumsFromMessages(messages: MessageDefinition[]): EnumContext {
  const unionToEnumName = new Map<string, string>();
  const enums: EnumDefinition[] = [];
  const existingEnumNames = new Set<string>();

  for (const message of messages) {
    if (message.fields === undefined || message.fields === null) continue;

    for (const field of message.fields) {
      const enumDef = processFieldForEnum(field, message.name, unionToEnumName, existingEnumNames);
      if (enumDef !== null) {
        enums.push(enumDef);
      }
    }
  }

  return { enums, unionToEnumName };
}

function generateEnumTypeScript(enumDef: EnumDefinition): string {
  const entries = enumDef.values.map((val) => {
    const key = val.toUpperCase().replace(/[^A-Z0-9]/g, '_');
    return `  ${key} = '${val}',`;
  });

  return `import { registerEnumType } from '@nestjs/graphql';

export enum ${enumDef.name} {
${entries.join('\n')}
}

registerEnumType(${enumDef.name}, {
  name: '${enumDef.name}',
});`;
}

async function writeEnumsToEntitiesFolder(baseDir: string, flowName: string, enums: EnumDefinition[]): Promise<void> {
  if (enums.length === 0) return;

  const entitiesDir = path.join(baseDir, toKebabCase(flowName), 'entities');
  await ensureDirExists(entitiesDir);

  for (const enumDef of enums) {
    const enumFilePath = path.join(entitiesDir, `${toKebabCase(enumDef.name)}.enum.ts`);

    try {
      await fs.access(enumFilePath);
      debug('Enum file already exists: %s, skipping', enumFilePath);
      continue;
    } catch {
      const content = generateEnumTypeScript(enumDef);
      const prettierConfig = await prettier.resolveConfig(enumFilePath);
      const formatted = await prettier.format(content, {
        ...prettierConfig,
        parser: 'typescript',
        filepath: enumFilePath,
      });

      await fs.writeFile(enumFilePath, formatted, 'utf8');
      debug('Written enum file: %s', enumFilePath);
    }
  }
}

export interface FilePlan {
  outputPath: string;
  contents: string;
}

async function renderTemplate(
  templatePath: string,
  data: Record<string, unknown>,
  unionToEnumName: Map<string, string> = new Map(),
): Promise<string> {
  const content = await fs.readFile(templatePath, 'utf8');
  const template = ejs.compile(content, {
    async: true,
    escape: (text: string): string => text,
  });

  const isInlineObject = isInlineObjectHelper;
  const isInlineObjectArray = isInlineObjectArrayHelper;

  const convertPrimitiveType = (base: string): string => {
    if (base === 'ID') return 'ID';
    if (base === 'Int') return 'Int';
    if (base === 'Float') return 'Float';
    if (base === 'string') return 'String';
    if (base === 'number') return 'Float';
    if (base === 'boolean') return 'Boolean';
    if (base === 'Date') return 'Date';
    return 'String';
  };

  const resolveEnumOrString = (base: string): string => {
    if (!isStringLiteralUnion(base)) return 'String';
    const values = extractStringLiteralValues(base);
    const normalized = normalizeUnionString(values);
    const enumName = unionToEnumName.get(normalized);
    return enumName ?? 'String';
  };

  const graphqlType = (rawTs: string): string => {
    const t = (rawTs ?? '').trim();
    if (!t) return 'String';
    const base = t.replace(/\s*\|\s*null\b/g, '').trim();

    const arr1 = base.match(/^Array<(.*)>$/);
    const arr2 = base.match(/^(.*)\[\]$/);
    if (arr1 !== null) return `[${graphqlType(arr1[1].trim())}]`;
    if (arr2 !== null) return `[${graphqlType(arr2[1].trim())}]`;

    if (base === 'unknown' || base === 'any') return 'GraphQLJSON';
    if (base === 'object') return 'JSON';
    if (isInlineObject(base)) return 'JSON';
    if (isStringLiteralUnion(base)) return resolveEnumOrString(base);

    return convertPrimitiveType(base);
  };

  const toTsFieldType = (ts: string): string => {
    if (!ts) return 'string';
    const t = ts.trim();
    const cleanType = t.replace(/\s*\|\s*null\b/g, '').trim();

    const arr = cleanType.match(/^Array<(.*)>$/);
    if (arr !== null) return `${toTsFieldType(arr[1].trim())}[]`;

    if (isStringLiteralUnion(cleanType)) {
      const values = extractStringLiteralValues(cleanType);
      const normalized = normalizeUnionString(values);
      const enumName = unionToEnumName.get(normalized);
      if (enumName !== undefined) return enumName;
    }

    return t;
  };

  const isNullable = (rawTs: string): boolean => /\|\s*null\b/.test(rawTs);

  const isEnumType = createIsEnumType(toTsFieldType);
  const fieldUsesDate = createFieldUsesDate(graphqlType);
  const fieldUsesJSON = createFieldUsesJSON(graphqlType);
  const fieldUsesFloat = createFieldUsesFloat(graphqlType);
  const collectEnumNames = createCollectEnumNames(isEnumType, toTsFieldType);

  const result = await template({
    ...data,
    pascalCase,
    toKebabCase,
    camelCase,
    graphqlType,
    isNullable,
    toTsFieldType,
    messages: data.messages,
    message: data.message,
    isInlineObject,
    isInlineObjectArray,
    baseTs,
    isEnumType,
    fieldUsesDate,
    fieldUsesJSON,
    fieldUsesFloat,
    collectEnumNames,
  });

  return result;
}

async function generateFileForTemplate(
  templateFile: string,
  slice: Slice,
  sliceDir: string,
  templateData: Record<string, unknown>,
  unionToEnumName: Map<string, string> = new Map(),
): Promise<FilePlan> {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const templatePath = path.join(__dirname, './templates', slice.type, templateFile);
  const fileName = templateFile
    .replace(/\.ts\.ejs$/, '.ts')
    .replace(/^(command|query|handler|resolver|input|type)\./, `${toKebabCase(slice.name)}.$1.`);
  const outputPath = path.join(sliceDir, fileName);

  const contents = await renderTemplate(templatePath, templateData, unionToEnumName);

  const prettierConfig = await prettier.resolveConfig(outputPath);
  const formattedContents = await prettier.format(contents, {
    ...prettierConfig,
    parser: 'typescript',
    filepath: outputPath,
  });

  return { outputPath, contents: formattedContents };
}

async function prepareTemplateData(
  slice: Slice,
  flow: Narrative,
  commands: Message[],
  events: Message[],
  states: Message[],
  commandSchemasByName: Record<string, Message>,
  projectionIdField: string | undefined,
  projectionSingleton: boolean | undefined,
  allMessages?: MessageDefinition[],
  integrations?: Model['integrations'],
): Promise<Record<string, unknown>> {
  const { streamPattern, streamId } = getStreamFromSink(slice);
  const gwtMapping = buildCommandGwtMapping(slice);
  const queryGwtMapping = buildQueryGwtMapping(slice);
  const projectionName = extractProjectionName(slice);

  const uniqueCommands = Array.from(new Map(commands.map((c) => [c.type, c])).values());
  const allowedForSlice = new Set(Object.keys(gwtMapping));
  const filteredCommands =
    allowedForSlice.size > 0 ? uniqueCommands.filter((c) => allowedForSlice.has(c.type)) : uniqueCommands;

  const eventImportGroups = groupEventImports({ currentSliceName: slice.name, events });
  const allEventTypesArray = getAllEventTypes(events);
  const allEventTypes = createEventUnionType(events);
  const localEvents = getLocalEvents(events);

  return {
    flowName: flow.name,
    sliceName: slice.name,
    slice,
    stream: { pattern: streamPattern, id: streamId },
    commands: filteredCommands,
    events,
    states,
    gwtMapping,
    queryGwtMapping,
    commandSchemasByName,
    projectionIdField,
    projectionSingleton,
    projectionName,
    projectionType: projectionName != null ? pascalCase(projectionName) : undefined,
    parsedRequest: slice.type === 'query' && slice.request != null ? parseGraphQlRequest(slice.request) : undefined,
    messages: allMessages,
    message:
      slice.type === 'query' && allMessages
        ? allMessages.find((m) => m.name === slice.server?.data?.[0]?.target?.name)
        : undefined,
    integrations,
    eventImportGroups,
    allEventTypes,
    allEventTypesArray,
    localEvents,
  };
}

async function generateFilesForSlice(
  slice: Slice,
  flow: Narrative,
  sliceDir: string,
  messages: MessageDefinition[],
  flows: Narrative[],
  unionToEnumName: Map<string, string>,
  integrations?: Model['integrations'],
): Promise<FilePlan[]> {
  const templates = defaultFilesByType[slice.type];
  if (!templates?.length) {
    return [];
  }

  const extracted = extractMessagesFromSpecs(slice, messages);

  const templateData = await prepareTemplateData(
    slice,
    flow,
    extracted.commands,
    extracted.events,
    extracted.states,
    extracted.commandSchemasByName,
    extracted.projectionIdField,
    extracted.projectionSingleton,
    messages,
    integrations,
  );

  const plans = await Promise.all(
    templates.map((template) => generateFileForTemplate(template, slice, sliceDir, templateData, unionToEnumName)),
  );
  return plans;
}

async function generateEntityFiles(
  entity: ConsolidatedEntity,
  entitiesDir: string,
  unionToEnumName: Map<string, string>,
): Promise<FilePlan[]> {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const plans: FilePlan[] = [];

  const entityTemplatePath = path.join(__dirname, './templates/entity/entity.ts.ejs');
  const indexTemplatePath = path.join(__dirname, './templates/entity/index.ts.ejs');

  const entityTemplateData = { entity, toTsFieldType: (ts: string) => ts, toKebabCase };
  const entityContents = await renderTemplate(entityTemplatePath, entityTemplateData, unionToEnumName);

  const entityFileName = `${toKebabCase(entity.entityName)}.entity.ts`;
  const entityPath = path.join(entitiesDir, entityFileName);
  const prettierConfig = await prettier.resolveConfig(entityPath);
  const formattedEntity = await prettier.format(entityContents, {
    ...prettierConfig,
    parser: 'typescript',
    filepath: entityPath,
  });

  plans.push({ outputPath: entityPath, contents: formattedEntity });

  const indexTemplateData = { entity, toKebabCase };
  const indexContents = await renderTemplate(indexTemplatePath, indexTemplateData, unionToEnumName);
  const indexPath = path.join(entitiesDir, 'index.ts');
  const formattedIndex = await prettier.format(indexContents, {
    ...prettierConfig,
    parser: 'typescript',
    filepath: indexPath,
  });

  plans.push({ outputPath: indexPath, contents: formattedIndex });

  return plans;
}

async function generateDomainModule(
  flow: Narrative,
  flowDir: string,
  unionToEnumName: Map<string, string>,
): Promise<FilePlan> {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const moduleTemplatePath = path.join(__dirname, './templates/module/domain-module.ts.ejs');

  const slices = flow.slices.filter((s) => s.type !== 'experience');
  const templateData = {
    flowName: flow.name,
    slices,
    pascalCase,
    toKebabCase,
  };

  const contents = await renderTemplate(moduleTemplatePath, templateData, unionToEnumName);
  const modulePath = path.join(flowDir, `${toKebabCase(flow.name)}.module.ts`);

  const prettierConfig = await prettier.resolveConfig(modulePath);
  const formattedContents = await prettier.format(contents, {
    ...prettierConfig,
    parser: 'typescript',
    filepath: modulePath,
  });

  return { outputPath: modulePath, contents: formattedContents };
}

async function generateAppModule(
  flows: Narrative[],
  baseDir: string,
  unionToEnumName: Map<string, string>,
): Promise<FilePlan> {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const moduleTemplatePath = path.join(__dirname, './templates/module/app-module.ts.ejs');

  const templateData = {
    flows,
    pascalCase,
    toKebabCase,
  };

  const contents = await renderTemplate(moduleTemplatePath, templateData, unionToEnumName);
  const appModulePath = path.join(baseDir, '../app.module.ts');

  const prettierConfig = await prettier.resolveConfig(appModulePath);
  const formattedContents = await prettier.format(contents, {
    ...prettierConfig,
    parser: 'typescript',
    filepath: appModulePath,
  });

  return { outputPath: appModulePath, contents: formattedContents };
}

export async function generateScaffoldFilePlans(
  flows: Narrative[],
  messages: Model['messages'],
  integrations?: Model['integrations'],
  baseDir = 'src/domain',
): Promise<FilePlan[]> {
  const { enums, unionToEnumName } = extractEnumsFromMessages(messages ?? []);

  const allPlans: FilePlan[] = [];

  for (const flow of flows) {
    const flowDir = ensureDirPath(baseDir, toKebabCase(flow.name));
    const entitiesDir = ensureDirPath(flowDir, 'entities');

    await writeEnumsToEntitiesFolder(baseDir, flow.name, enums);

    const entity = consolidateEntityFields(flow, messages ?? [], unionToEnumName);
    const entityPlans = await generateEntityFiles(entity, entitiesDir, unionToEnumName);
    allPlans.push(...entityPlans);

    for (const slice of flow.slices) {
      const sliceDir = ensureDirPath(flowDir, toKebabCase(slice.name));
      const plans = await generateFilesForSlice(
        slice,
        flow,
        sliceDir,
        messages ?? [],
        flows,
        unionToEnumName,
        integrations,
      );
      allPlans.push(...plans);
    }

    const modulePlan = await generateDomainModule(flow, flowDir, unionToEnumName);
    allPlans.push(modulePlan);
  }

  const appModulePlan = await generateAppModule(flows, baseDir, unionToEnumName);
  allPlans.push(appModulePlan);

  return allPlans;
}

export async function writeScaffoldFilePlans(plans: FilePlan[]): Promise<void> {
  for (const { outputPath, contents } of plans) {
    const dir = path.dirname(outputPath);
    await ensureDirExists(dir);
    await fs.writeFile(outputPath, contents, 'utf8');
  }
}

export async function scaffoldFromSchema(
  flows: Narrative[],
  messages: Model['messages'],
  baseDir = 'src/domain',
): Promise<void> {
  const plans = await generateScaffoldFilePlans(flows, messages, undefined, baseDir);
  await writeScaffoldFilePlans(plans);
}
