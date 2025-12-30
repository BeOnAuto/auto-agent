import { Narrative } from '@auto-engineer/narrative';
import { MessageDefinition, Field, Message } from './types.js';
import { extractMessagesFromSpecs } from './extract/index.js';
import { pascalCase, camelCase } from 'change-case';
import createDebug from 'debug';

const debug = createDebug('auto:server-generator-nestjs:entity');

export interface EntityField {
  name: string;
  tsType: string;
  nullable: boolean;
  isPrimary: boolean;
  isEnum: boolean;
  enumName?: string;
  indexed: boolean;
}

export interface ConsolidatedEntity {
  entityName: string;
  tableName: string;
  fields: EntityField[];
  enumImports: string[];
}

function isEnumType(tsType: string): boolean {
  const cleanType = tsType.replace(/\s*\|\s*null\b/g, '').trim();
  return /^"[^"]+"(\s*\|\s*"[^"]+")+$/.test(cleanType) || /^'[^']+'(\s*\|\s*'[^']+)+$/.test(cleanType);
}

function detectPrimaryKeyField(fields: EntityField[], flowName: string): string | null {
  const idCandidates = [`${camelCase(flowName)}Id`, 'id', `${camelCase(flowName)}ID`, 'ID'];

  for (const candidate of idCandidates) {
    const field = fields.find((f) => f.name === candidate);
    if (field) {
      return field.name;
    }
  }

  const stringFields = fields.filter((f) => f.tsType === 'string' && f.name.toLowerCase().includes('id'));
  if (stringFields.length > 0) {
    return stringFields[0].name;
  }

  return null;
}

function shouldIndexField(fieldName: string, tsType: string): boolean {
  const indexableNames = ['status', 'type', 'category', 'state'];
  const nameLower = fieldName.toLowerCase();

  if (indexableNames.some((name) => nameLower.includes(name))) {
    return true;
  }

  if (isEnumType(tsType)) {
    return true;
  }

  return false;
}

function processFieldsFromMessages(
  fields: Field[],
  fieldMap: Map<string, EntityField>,
  unionToEnumName: Map<string, string>,
  enumsUsed: Set<string>,
): void {
  for (const field of fields) {
    if (field.name === 'now') continue;

    if (!fieldMap.has(field.name)) {
      const isEnum = isEnumType(field.tsType);
      const cleanType = field.tsType.replace(/\s*\|\s*null\b/g, '').trim();

      let enumName: string | undefined;
      if (isEnum) {
        const matches = cleanType.match(/'([^']+)'/g);
        const values = matches !== null ? matches.map((v) => v.slice(1, -1)) : [];
        const normalized = values
          .sort()
          .map((v) => `'${v}'`)
          .join(' | ');
        enumName = unionToEnumName.get(normalized);
        if (typeof enumName === 'string' && enumName.length > 0) {
          enumsUsed.add(enumName);
        }
      }

      fieldMap.set(field.name, {
        name: field.name,
        tsType: field.tsType,
        nullable: /\|\s*null\b/.test(field.tsType),
        isPrimary: false,
        isEnum,
        enumName,
        indexed: false,
      });
    }
  }
}

function processMessagesWithFields(
  messageArray: Message[],
  messageLabel: string,
  fieldMap: Map<string, EntityField>,
  unionToEnumName: Map<string, string>,
  enumsUsed: Set<string>,
): void {
  for (const msg of messageArray) {
    debug('    %s: %s with %d fields', messageLabel, msg.type, msg.fields.length);
    if (msg.fields.length > 0) {
      processFieldsFromMessages(msg.fields, fieldMap, unionToEnumName, enumsUsed);
    }
  }
}

function processCommandSlice(
  slice: Narrative['slices'][0],
  messages: MessageDefinition[],
  fieldMap: Map<string, EntityField>,
  unionToEnumName: Map<string, string>,
  enumsUsed: Set<string>,
): void {
  debug('  Processing slice: %s (type: %s)', slice.name, slice.type);
  const extracted = extractMessagesFromSpecs(slice, messages);

  processMessagesWithFields(extracted.commands, 'Command', fieldMap, unionToEnumName, enumsUsed);
  processMessagesWithFields(extracted.events, 'Event', fieldMap, unionToEnumName, enumsUsed);
}

function processQuerySlice(
  slice: Narrative['slices'][0],
  messages: MessageDefinition[],
  fieldMap: Map<string, EntityField>,
  unionToEnumName: Map<string, string>,
  enumsUsed: Set<string>,
): void {
  debug('  Processing slice: %s (type: %s)', slice.name, slice.type);
  const extracted = extractMessagesFromSpecs(slice, messages);

  processMessagesWithFields(extracted.states, 'State', fieldMap, unionToEnumName, enumsUsed);
}

function collectFieldsFromSlices(
  flow: Narrative,
  messages: MessageDefinition[],
  fieldMap: Map<string, EntityField>,
  unionToEnumName: Map<string, string>,
  enumsUsed: Set<string>,
): void {
  for (const slice of flow.slices) {
    if (slice.type === 'experience') continue;

    if (slice.type === 'command') {
      processCommandSlice(slice, messages, fieldMap, unionToEnumName, enumsUsed);
    }

    if (slice.type === 'query') {
      processQuerySlice(slice, messages, fieldMap, unionToEnumName, enumsUsed);
    }
  }
}

function markPrimaryKeyAndIndexes(fields: EntityField[], fieldMap: Map<string, EntityField>, flowName: string): void {
  const primaryKeyField = detectPrimaryKeyField(fields, flowName);
  if (typeof primaryKeyField === 'string' && primaryKeyField.length > 0) {
    const field = fieldMap.get(primaryKeyField);
    if (field !== undefined) {
      field.isPrimary = true;
      debug('  Detected primary key: %s', primaryKeyField);
    }
  } else {
    debug('  WARNING: No primary key detected for flow: %s', flowName);
  }

  for (const field of fields) {
    if (!field.isPrimary && shouldIndexField(field.name, field.tsType)) {
      field.indexed = true;
      debug('  Marking field for indexing: %s', field.name);
    }
  }
}

export function consolidateEntityFields(
  flow: Narrative,
  messages: MessageDefinition[],
  unionToEnumName: Map<string, string>,
): ConsolidatedEntity {
  debug('Consolidating entity fields for flow: %s', flow.name);

  const fieldMap = new Map<string, EntityField>();
  const enumsUsed = new Set<string>();

  collectFieldsFromSlices(flow, messages, fieldMap, unionToEnumName, enumsUsed);

  const fields = Array.from(fieldMap.values());
  markPrimaryKeyAndIndexes(fields, fieldMap, flow.name);

  const entityName = pascalCase(flow.name) + 'Entity';
  const tableName = camelCase(flow.name) + 's';

  debug('Consolidated entity: %s with %d fields', entityName, fields.length);
  debug('  Enum imports: %o', Array.from(enumsUsed));

  return {
    entityName,
    tableName,
    fields,
    enumImports: Array.from(enumsUsed),
  };
}
