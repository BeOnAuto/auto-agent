import debug from 'debug';
import type { Message } from '../../index';
import type { TypeInfo } from '../../loader/ts-utils';
import { collectExampleHintsForData, type ExampleShapeHints } from './example-shapes';
import { createMessage } from './messages';
import { preferNewFields } from './normalize';

const log = debug('auto:flow:spec-processors');

/**
 * Extracts the query name from a GraphQL request string.
 * Supports both SDL strings and JSON-serialized AST.
 */
export function extractQueryNameFromRequest(request: string | undefined): string | null {
  if (!request) return null;
  const queryMatch = request.match(/query\s+(\w+)/i);
  if (queryMatch) {
    return queryMatch[1];
  }
  if (request.startsWith('{') && request.includes('"kind"')) {
    try {
      const ast = JSON.parse(request) as unknown;
      if (
        typeof ast === 'object' &&
        ast !== null &&
        'definitions' in ast &&
        Array.isArray((ast as { definitions: unknown[] }).definitions)
      ) {
        const definitions = (ast as { definitions: Array<{ kind?: string; name?: { value?: string } }> }).definitions;
        const opDef = definitions.find((d) => d.kind === 'OperationDefinition');
        if (opDef?.name?.value) {
          return opDef.name.value;
        }
      }
    } catch {}
  }

  return null;
}

/**
 * Detects if the "When" text in a query slice represents a query action (query name)
 * rather than an event name.
 *
 * Detection is based solely on matching the query name extracted from slice.request.
 * If no query name can be extracted, returns false (treats as event - safe default).
 *
 * @param whenText - The text from the "When" step
 * @param slice - The slice object containing type and optional request field
 * @returns true if the "When" text matches the query name from slice.request
 */
export function detectQueryAction(whenText: string, slice: { type: string; request?: string }): boolean {
  if (slice.type !== 'query') return false;
  if (!whenText) return false;

  const queryName = extractQueryNameFromRequest(slice.request);
  if (!queryName) return false;

  // Exact match or case-insensitive match
  return whenText === queryName || whenText.toLowerCase() === queryName.toLowerCase();
}

type TypeResolver = (
  t: string,
  expected?: 'command' | 'event' | 'state' | 'query',
  exampleData?: unknown,
) => { resolvedName: string; typeInfo: TypeInfo | undefined };

function updateEventRefAndCollectHints(
  g: {
    eventRef?: string;
    commandRef?: string;
    stateRef?: string;
    exampleData?: unknown;
  },
  resolvedName: string,
  typeInfo: TypeInfo | undefined,
  exampleShapeHints: ExampleShapeHints,
) {
  if (typeInfo?.classification === 'command') {
    delete g.eventRef;
    g.commandRef = resolvedName;
  } else {
    g.eventRef = resolvedName;
  }

  if (g.exampleData !== undefined) {
    collectExampleHintsForData(resolvedName, g.exampleData, exampleShapeHints);
  }
}

function handleEventRef(
  g: {
    eventRef?: string;
    commandRef?: string;
    stateRef?: string;
    exampleData?: unknown;
  },
  resolveTypeAndInfo: TypeResolver,
  messages: Map<string, Message>,
  exampleShapeHints: ExampleShapeHints,
) {
  if (typeof g.eventRef !== 'string' || g.eventRef.length === 0) return;
  const { resolvedName, typeInfo } = resolveTypeAndInfo(g.eventRef, 'event', g.exampleData);

  updateEventRefAndCollectHints(g, resolvedName, typeInfo, exampleShapeHints);

  const messageType = typeInfo?.classification ?? 'event';
  const msg = createMessage(resolvedName, typeInfo, messageType);
  const existing = messages.get(resolvedName);
  if (!existing || preferNewFields(msg.fields, existing.fields)) {
    messages.set(resolvedName, msg);
  }
}

function handleStateRef(
  g: {
    eventRef?: string;
    commandRef?: string;
    stateRef?: string;
    exampleData?: unknown;
  },
  resolveTypeAndInfo: TypeResolver,
  messages: Map<string, Message>,
  exampleShapeHints: ExampleShapeHints,
) {
  if (typeof g.stateRef !== 'string' || g.stateRef.length === 0) return;
  const { resolvedName, typeInfo } = resolveTypeAndInfo(g.stateRef, 'state', g.exampleData);
  g.stateRef = resolvedName;

  if (g.exampleData !== undefined) {
    collectExampleHintsForData(resolvedName, g.exampleData, exampleShapeHints);
  }
  const messageType = typeInfo?.classification || 'state';
  const msg = createMessage(resolvedName, typeInfo, messageType);
  const existing = messages.get(resolvedName);
  if (!existing || preferNewFields(msg.fields, existing.fields)) {
    messages.set(resolvedName, msg);
  }
}

function handleCommandRef(
  g: {
    eventRef?: string;
    commandRef?: string;
    stateRef?: string;
    exampleData?: unknown;
  },
  resolveTypeAndInfo: TypeResolver,
  messages: Map<string, Message>,
  exampleShapeHints: ExampleShapeHints,
) {
  const cmdRef = g.commandRef;
  if (typeof cmdRef === 'string') {
    const { resolvedName, typeInfo } = resolveTypeAndInfo(cmdRef, 'command', g.exampleData);
    g.commandRef = resolvedName;

    if (g.exampleData !== undefined) {
      collectExampleHintsForData(resolvedName, g.exampleData, exampleShapeHints);
    }

    const msg = createMessage(resolvedName, typeInfo, 'command');
    const existing = messages.get(resolvedName);
    if (!existing || preferNewFields(msg.fields, existing.fields)) {
      messages.set(resolvedName, msg);
    }
  }
}

function tryAlternativeResolutionsForState(
  originalRef: string,
  g: { eventRef?: string; commandRef?: string; stateRef?: string; exampleData?: unknown },
  resolveTypeAndInfo: TypeResolver,
  messages: Map<string, Message>,
  exampleShapeHints: ExampleShapeHints,
): boolean {
  const eventResult = resolveTypeAndInfo(originalRef, 'event', g.exampleData);
  const commandResult = resolveTypeAndInfo(originalRef, 'command', g.exampleData);

  log('DEBUG trying alternatives:', {
    eventResult: { name: eventResult.resolvedName, classification: eventResult.typeInfo?.classification },
    commandResult: { name: commandResult.resolvedName, classification: commandResult.typeInfo?.classification },
  });

  if (eventResult.resolvedName !== 'InferredType' && eventResult.typeInfo?.classification === 'event') {
    log('DEBUG converting to eventRef:', eventResult.resolvedName);
    delete g.stateRef;
    g.eventRef = eventResult.resolvedName;
    handleEventRef(g, resolveTypeAndInfo, messages, exampleShapeHints);
    return true;
  } else if (commandResult.resolvedName !== 'InferredType' && commandResult.typeInfo?.classification === 'command') {
    log('DEBUG converting to commandRef:', commandResult.resolvedName);
    delete g.stateRef;
    g.commandRef = commandResult.resolvedName;
    handleCommandRef(g, resolveTypeAndInfo, messages, exampleShapeHints);
    return true;
  }

  return false;
}

function processStateRefInGiven(
  g: {
    eventRef?: string;
    commandRef?: string;
    stateRef?: string;
    exampleData?: unknown;
  },
  resolveTypeAndInfo: TypeResolver,
  messages: Map<string, Message>,
  exampleShapeHints: ExampleShapeHints,
): boolean {
  if (!('stateRef' in g && typeof g.stateRef === 'string' && g.stateRef.length > 0)) {
    return false;
  }

  const originalRef = g.stateRef;
  const { resolvedName, typeInfo } = resolveTypeAndInfo(originalRef, 'state', g.exampleData);

  log('DEBUG processGiven state resolution:', {
    originalRef,
    resolvedName,
    classification: typeInfo?.classification,
  });

  if (originalRef === 'InferredType' && resolvedName === 'InferredType') {
    return tryAlternativeResolutionsForState(originalRef, g, resolveTypeAndInfo, messages, exampleShapeHints);
  }

  if (originalRef === 'InferredType' && typeInfo?.classification === 'event') {
    log('DEBUG original logic conversion to event:', resolvedName);
    delete g.stateRef;
    g.eventRef = resolvedName;
    handleEventRef(g, resolveTypeAndInfo, messages, exampleShapeHints);
    return true;
  }

  return false;
}

function tryAlternativeResolutionsForEvent(
  originalRef: string,
  g: { eventRef?: string; commandRef?: string; stateRef?: string; exampleData?: unknown },
  resolveTypeAndInfo: TypeResolver,
  messages: Map<string, Message>,
  exampleShapeHints: ExampleShapeHints,
  resolvedName: string,
  typeInfo: TypeInfo | undefined,
): boolean {
  const stateResult = resolveTypeAndInfo(originalRef, 'state', g.exampleData);
  const commandResult = resolveTypeAndInfo(originalRef, 'command', g.exampleData);

  log('DEBUG trying alternatives for event:', {
    eventResult: { name: resolvedName, classification: typeInfo?.classification },
    stateResult: { name: stateResult.resolvedName, classification: stateResult.typeInfo?.classification },
    commandResult: { name: commandResult.resolvedName, classification: commandResult.typeInfo?.classification },
  });

  if (stateResult.resolvedName !== 'InferredType' && stateResult.typeInfo?.classification === 'state') {
    log('DEBUG converting eventRef to stateRef (better match):', stateResult.resolvedName);
    delete g.eventRef;
    g.stateRef = stateResult.resolvedName;
    handleStateRef(g, resolveTypeAndInfo, messages, exampleShapeHints);
    return true;
  } else if (commandResult.resolvedName !== 'InferredType' && commandResult.typeInfo?.classification === 'command') {
    log('DEBUG converting eventRef to commandRef (better match):', commandResult.resolvedName);
    delete g.eventRef;
    g.commandRef = commandResult.resolvedName;
    handleCommandRef(g, resolveTypeAndInfo, messages, exampleShapeHints);
    return true;
  }

  return false;
}

// eslint-disable-next-line complexity
function processEventRefInGiven(
  g: {
    eventRef?: string;
    commandRef?: string;
    stateRef?: string;
    exampleData?: unknown;
  },
  resolveTypeAndInfo: TypeResolver,
  messages: Map<string, Message>,
  exampleShapeHints: ExampleShapeHints,
): boolean {
  if (!('eventRef' in g && typeof g.eventRef === 'string' && g.eventRef.length > 0)) {
    return false;
  }

  const originalRef = g.eventRef;
  const { resolvedName, typeInfo } = resolveTypeAndInfo(originalRef, 'event', g.exampleData);

  log('DEBUG processGiven event resolution:', {
    originalRef,
    resolvedName,
    classification: typeInfo?.classification,
  });

  if (originalRef === 'InferredType') {
    if (
      tryAlternativeResolutionsForEvent(
        originalRef,
        g,
        resolveTypeAndInfo,
        messages,
        exampleShapeHints,
        resolvedName,
        typeInfo,
      )
    ) {
      return true;
    }
  }

  if (originalRef === 'InferredType' && typeInfo?.classification === 'state') {
    log('DEBUG original logic conversion event to state:', resolvedName);
    delete g.eventRef;
    g.stateRef = resolvedName;
    handleStateRef(g, resolveTypeAndInfo, messages, exampleShapeHints);
    return true;
  } else if (originalRef === 'InferredType' && typeInfo?.classification === 'command') {
    log('DEBUG original logic conversion event to command:', resolvedName);
    delete g.eventRef;
    g.commandRef = resolvedName;
    handleCommandRef(g, resolveTypeAndInfo, messages, exampleShapeHints);
    return true;
  }

  handleEventRef(g, resolveTypeAndInfo, messages, exampleShapeHints);
  return true;
}

export function processGiven(
  given: Array<{
    eventRef?: string;
    commandRef?: string;
    stateRef?: string;
    exampleData?: unknown;
  }>,
  resolveTypeAndInfo: TypeResolver,
  messages: Map<string, Message>,
  exampleShapeHints: ExampleShapeHints,
) {
  given.forEach((g) => {
    if (processStateRefInGiven(g, resolveTypeAndInfo, messages, exampleShapeHints)) {
      return;
    }

    if (processEventRefInGiven(g, resolveTypeAndInfo, messages, exampleShapeHints)) {
      return;
    }

    if ('stateRef' in g) {
      handleStateRef(g, resolveTypeAndInfo, messages, exampleShapeHints);
    }
    if ('commandRef' in g) {
      handleCommandRef(g, resolveTypeAndInfo, messages, exampleShapeHints);
    }
  });
}

// eslint-disable-next-line complexity
function processSingleWhen(
  when: {
    commandRef?: string;
    eventRef?: string;
    stateRef?: string;
    exampleData?: unknown;
  },
  slice: { type: string; request?: string },
  resolveTypeAndInfo: TypeResolver,
  messages: Map<string, Message>,
  exampleShapeHints: ExampleShapeHints,
) {
  if (typeof when.commandRef !== 'string' || when.commandRef.length === 0) {
    return;
  }

  const originalCommandRef = when.commandRef;

  // Check if this is a query action
  // Query actions represent the act of executing the query - create a query message for them
  if (detectQueryAction(originalCommandRef, slice)) {
    log('DEBUG processSingleWhen: detected query action, creating query message:', originalCommandRef);
    const { typeInfo } = resolveTypeAndInfo(originalCommandRef, 'query', when.exampleData);
    const msg = createMessage(originalCommandRef, typeInfo, 'query');
    const existing = messages.get(originalCommandRef);
    if (!existing || preferNewFields(msg.fields, existing.fields)) {
      messages.set(originalCommandRef, msg);
    }
    if (when.exampleData !== undefined) {
      collectExampleHintsForData(originalCommandRef, when.exampleData, exampleShapeHints);
    }
    return;
  }

  const expected = slice.type === 'command' ? 'command' : 'event';

  log('DEBUG processSingleWhen:', {
    originalCommandRef,
    sliceType: slice.type,
    expected,
    exampleData: when.exampleData,
  });

  let resolvedName: string;
  let typeInfo: TypeInfo | undefined;

  if (originalCommandRef !== 'InferredType') {
    log('DEBUG preserving AST type:', originalCommandRef);
    resolvedName = originalCommandRef;
    when.commandRef = originalCommandRef;
    const result = resolveTypeAndInfo(originalCommandRef, expected, when.exampleData);
    typeInfo = result.typeInfo;
  } else {
    log('DEBUG using type inference for:', originalCommandRef);
    const result = resolveTypeAndInfo(originalCommandRef, expected, when.exampleData);
    resolvedName = result.resolvedName;
    typeInfo = result.typeInfo;
    log('DEBUG inference result:', { resolvedName, classification: typeInfo?.classification });
    if (typeInfo?.classification && typeInfo.classification !== 'command') {
      if (typeInfo.classification === 'event') {
        delete when.commandRef;
        when.eventRef = resolvedName;
        log('DEBUG converted commandRef to eventRef:', resolvedName);
      } else if (typeInfo.classification === 'state') {
        delete when.commandRef;
        when.stateRef = resolvedName;
        log('DEBUG converted commandRef to stateRef:', resolvedName);
      }
    } else {
      when.commandRef = resolvedName;
    }
  }

  if (when.exampleData !== undefined) {
    const refName = when.commandRef ?? when.eventRef ?? when.stateRef;
    if (refName !== undefined && refName.length > 0) {
      collectExampleHintsForData(refName, when.exampleData, exampleShapeHints);
    }
  }

  if (resolvedName !== 'InferredType') {
    const messageType = typeInfo?.classification ?? (slice.type === 'command' ? 'command' : 'event');
    const msg = createMessage(resolvedName, typeInfo, messageType);
    const existing = messages.get(resolvedName);
    if (!existing || preferNewFields(msg.fields, existing.fields)) {
      messages.set(resolvedName, msg);
    }
  }
}

function updateCommandRefTypeInArray(
  item: {
    commandRef?: string;
    eventRef?: string;
    stateRef?: string;
    exampleData?: unknown;
  },
  resolvedName: string,
  typeInfo: TypeInfo | undefined,
) {
  if (item.commandRef !== 'InferredType') {
    item.commandRef = resolvedName;
  } else {
    if (typeInfo?.classification === 'event') {
      delete item.commandRef;
      item.eventRef = resolvedName;
    } else if (typeInfo?.classification === 'state') {
      delete item.commandRef;
      item.stateRef = resolvedName;
    } else {
      item.commandRef = resolvedName;
    }
  }
}

function determineCommandRefForArray(originalCommandRef: string, resolvedName: string): string {
  return originalCommandRef !== 'InferredType' ? originalCommandRef : resolvedName;
}

function processCommandRefInArray(
  item: {
    commandRef?: string;
    eventRef?: string;
    stateRef?: string;
    exampleData?: unknown;
  },
  slice: { type: string; request?: string },
  resolveTypeAndInfo: TypeResolver,
  messages: Map<string, Message>,
  exampleShapeHints: ExampleShapeHints,
) {
  if (typeof item.commandRef !== 'string' || item.commandRef.length === 0) {
    return;
  }

  const originalCommandRef = item.commandRef;

  // Check if this is a query action (query name like ViewWorkoutPlan)
  // Query actions represent the act of executing the query - create a query message for them
  if (detectQueryAction(originalCommandRef, slice)) {
    log('DEBUG processCommandRefInArray: detected query action, creating query message:', originalCommandRef);
    const { typeInfo } = resolveTypeAndInfo(originalCommandRef, 'query', item.exampleData);
    const msg = createMessage(originalCommandRef, typeInfo, 'query');
    const existing = messages.get(originalCommandRef);
    if (!existing || preferNewFields(msg.fields, existing.fields)) {
      messages.set(originalCommandRef, msg);
    }
    if (item.exampleData !== undefined) {
      collectExampleHintsForData(originalCommandRef, item.exampleData, exampleShapeHints);
    }
    return;
  }

  const expected = slice.type === 'command' ? 'command' : 'event';
  const { resolvedName, typeInfo } = resolveTypeAndInfo(originalCommandRef, expected, item.exampleData);

  if (originalCommandRef !== 'InferredType') {
    item.commandRef = originalCommandRef;
  } else {
    updateCommandRefTypeInArray(item, resolvedName, typeInfo);
  }

  const finalRef = determineCommandRefForArray(originalCommandRef, resolvedName);

  if (item.exampleData !== undefined) {
    collectExampleHintsForData(finalRef, item.exampleData, exampleShapeHints);
  }

  const messageType = typeInfo?.classification ?? 'command';
  const msg = createMessage(finalRef, typeInfo, messageType);
  const existing = messages.get(finalRef);
  if (!existing || preferNewFields(msg.fields, existing.fields)) {
    messages.set(finalRef, msg);
  }
}

function processEventRefInArray(
  item: {
    commandRef?: string;
    eventRef?: string;
    stateRef?: string;
    exampleData?: unknown;
  },
  resolveTypeAndInfo: TypeResolver,
  messages: Map<string, Message>,
  exampleShapeHints: ExampleShapeHints,
) {
  if (typeof item.eventRef !== 'string' || item.eventRef.length === 0) {
    return;
  }

  const { resolvedName, typeInfo } = resolveTypeAndInfo(item.eventRef, 'event', item.exampleData);
  item.eventRef = resolvedName;

  if (item.exampleData !== undefined) {
    collectExampleHintsForData(resolvedName, item.exampleData, exampleShapeHints);
  }

  if (resolvedName.length > 0 && resolvedName !== 'InferredType') {
    const messageType = typeInfo?.classification ?? 'event';
    const msg = createMessage(resolvedName, typeInfo, messageType);
    const existing = messages.get(resolvedName);
    if (!existing || preferNewFields(msg.fields, existing.fields)) {
      messages.set(resolvedName, msg);
    }
  }
}

export function processWhen(
  when:
    | {
        commandRef?: string;
        eventRef?: string;
        stateRef?: string;
        exampleData?: unknown;
      }
    | Array<{
        commandRef?: string;
        eventRef?: string;
        stateRef?: string;
        exampleData?: unknown;
      }>,
  slice: { type: string; request?: string },
  resolveTypeAndInfo: TypeResolver,
  messages: Map<string, Message>,
  exampleShapeHints: ExampleShapeHints,
) {
  if ('commandRef' in when) {
    processSingleWhen(when, slice, resolveTypeAndInfo, messages, exampleShapeHints);
  } else if (Array.isArray(when)) {
    when.forEach((item) => {
      if ('commandRef' in item) {
        processCommandRefInArray(item, slice, resolveTypeAndInfo, messages, exampleShapeHints);
      } else if ('eventRef' in item) {
        processEventRefInArray(item, resolveTypeAndInfo, messages, exampleShapeHints);
      }
    });
  }
}

function handleThenEventRef(
  t: {
    eventRef?: string;
    commandRef?: string;
    stateRef?: string;
    exampleData?: unknown;
  },
  resolveTypeAndInfo: TypeResolver,
  messages: Map<string, Message>,
  exampleShapeHints: ExampleShapeHints,
) {
  if (typeof t.eventRef !== 'string' || t.eventRef.length === 0) return;
  const { resolvedName, typeInfo } = resolveTypeAndInfo(t.eventRef, 'event', t.exampleData);
  t.eventRef = resolvedName;

  if (t.exampleData !== undefined) {
    collectExampleHintsForData(resolvedName, t.exampleData, exampleShapeHints);
  }

  const messageType = typeInfo?.classification ?? 'event';
  const msg = createMessage(resolvedName, typeInfo, messageType);
  const existing = messages.get(resolvedName);
  if (!existing || preferNewFields(msg.fields, existing.fields)) {
    messages.set(resolvedName, msg);
  }
}

function updateThenCommandRefType(
  t: {
    eventRef?: string;
    commandRef?: string;
    stateRef?: string;
    exampleData?: unknown;
  },
  resolvedName: string,
  typeInfo: TypeInfo | undefined,
  exampleShapeHints: ExampleShapeHints,
) {
  if (t.commandRef !== 'InferredType') {
    t.commandRef = resolvedName;
  } else {
    if (typeInfo?.classification === 'event') {
      delete t.commandRef;
      t.eventRef = resolvedName;
    } else if (typeInfo?.classification === 'state') {
      delete t.commandRef;
      t.stateRef = resolvedName;
    } else {
      t.commandRef = resolvedName;
    }
  }

  if (t.exampleData !== undefined) {
    collectExampleHintsForData(resolvedName, t.exampleData, exampleShapeHints);
  }
}

function handleThenCommandRef(
  t: {
    eventRef?: string;
    commandRef?: string;
    stateRef?: string;
    exampleData?: unknown;
  },
  resolveTypeAndInfo: TypeResolver,
  messages: Map<string, Message>,
  exampleShapeHints: ExampleShapeHints,
) {
  if (typeof t.commandRef !== 'string' || t.commandRef.length === 0) return;
  const { resolvedName, typeInfo } = resolveTypeAndInfo(t.commandRef, 'command', t.exampleData);

  updateThenCommandRefType(t, resolvedName, typeInfo, exampleShapeHints);

  const messageType = typeInfo?.classification ?? 'command';
  const msg = createMessage(resolvedName, typeInfo, messageType);
  const existing = messages.get(resolvedName);
  if (!existing || preferNewFields(msg.fields, existing.fields)) {
    messages.set(resolvedName, msg);
  }
}

function handleThenStateRef(
  t: {
    eventRef?: string;
    commandRef?: string;
    stateRef?: string;
    exampleData?: unknown;
  },
  resolveTypeAndInfo: TypeResolver,
  messages: Map<string, Message>,
  exampleShapeHints: ExampleShapeHints,
) {
  if (typeof t.stateRef !== 'string' || t.stateRef.length === 0) return;
  const { resolvedName, typeInfo } = resolveTypeAndInfo(t.stateRef, 'state', t.exampleData);
  t.stateRef = resolvedName;

  if (t.exampleData !== undefined) {
    collectExampleHintsForData(resolvedName, t.exampleData, exampleShapeHints);
  }

  const messageType = typeInfo?.classification || 'state';
  const msg = createMessage(resolvedName, typeInfo, messageType);
  const existing = messages.get(resolvedName);
  if (!existing || preferNewFields(msg.fields, existing.fields)) {
    messages.set(resolvedName, msg);
  }
}

export function processThen(
  then: Array<{
    eventRef?: string;
    commandRef?: string;
    stateRef?: string;
    exampleData?: unknown;
  }>,
  resolveTypeAndInfo: TypeResolver,
  messages: Map<string, Message>,
  exampleShapeHints: ExampleShapeHints,
) {
  if (Array.isArray(then) && then.length > 0) {
    then.forEach((t) => {
      if ('eventRef' in t) {
        handleThenEventRef(t, resolveTypeAndInfo, messages, exampleShapeHints);
      } else if ('commandRef' in t) {
        handleThenCommandRef(t, resolveTypeAndInfo, messages, exampleShapeHints);
      } else if ('stateRef' in t) {
        handleThenStateRef(t, resolveTypeAndInfo, messages, exampleShapeHints);
      }
    });
  }
}
