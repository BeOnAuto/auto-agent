import type tsNS from 'typescript';
import { type FieldTypeInfo, jsonToExpr } from '../ast/emit-helpers';

/**
 * Build a single specs() block for a GWT entry, adapting to slice type:
 * - command: when(Command).then([Events|Error])
 * - react:   when([Events]).then([Commands])
 * - query:   given([Events]).then([State])
 */

function isWhenCommand(x: unknown): x is { commandRef: string; exampleData: Record<string, unknown> } {
  return x !== null && x !== undefined && typeof x === 'object' && 'commandRef' in (x as Record<string, unknown>);
}
function isWhenEvents(x: unknown): x is Array<{ eventRef: string; exampleData: Record<string, unknown> }> {
  return Array.isArray(x);
}
function hasGivenEvents(x: unknown): x is { given: Array<{ eventRef: string; exampleData: Record<string, unknown> }> } {
  return x !== null && x !== undefined && typeof x === 'object' && Array.isArray((x as Record<string, unknown>).given);
}

export type GWTBlock = {
  given?: Array<{ eventRef: string; exampleData: Record<string, unknown> }>;
  when?:
    | { commandRef: string; exampleData: Record<string, unknown> }
    | { eventRef: string; exampleData: Record<string, unknown> }
    | Array<
        | { commandRef: string; exampleData: Record<string, unknown> }
        | { eventRef: string; exampleData: Record<string, unknown> }
      >;
  then: Array<
    | { eventRef: string; exampleData: Record<string, unknown> }
    | { commandRef: string; exampleData: Record<string, unknown> }
    | { stateRef: string; exampleData: Record<string, unknown> }
    | { errorType: 'IllegalStateError' | 'ValidationError' | 'NotFoundError'; message?: string }
  >;
};

function buildStandaloneGivenStatements(
  ts: typeof import('typescript'),
  f: tsNS.NodeFactory,
  g: GWTBlock,
  messages?: Array<{ type: string; name: string; fields: Array<{ name: string; type: string; required: boolean }> }>,
): tsNS.Statement[] {
  const statements: tsNS.Statement[] = [];

  if (hasGivenEvents(g) && g.given !== null && g.given !== undefined && g.given.length > 0) {
    const firstGiven = g.given[0];
    const firstTypeInfo = messages ? getFieldTypeInfo(messages, firstGiven.eventRef) : undefined;
    statements.push(
      f.createExpressionStatement(
        f.createCallExpression(
          f.createIdentifier('given'),
          [f.createTypeReferenceNode(firstGiven.eventRef, undefined)],
          [jsonToExpr(ts, f, firstGiven.exampleData, firstTypeInfo)],
        ),
      ),
    );

    for (let i = 1; i < g.given.length; i++) {
      const givenEvent = g.given[i];
      const typeInfo = messages ? getFieldTypeInfo(messages, givenEvent.eventRef) : undefined;
      statements.push(
        f.createExpressionStatement(
          f.createCallExpression(
            f.createIdentifier('and'),
            [f.createTypeReferenceNode(givenEvent.eventRef, undefined)],
            [jsonToExpr(ts, f, givenEvent.exampleData, typeInfo)],
          ),
        ),
      );
    }
  }

  return statements;
}

function createWhenCallExpression(
  ts: typeof import('typescript'),
  f: tsNS.NodeFactory,
  typeRef: string,
  exampleData: Record<string, unknown>,
  messages?: Array<{ type: string; name: string; fields: Array<{ name: string; type: string; required: boolean }> }>,
): tsNS.Statement {
  const typeInfo = messages !== undefined ? getFieldTypeInfo(messages, typeRef) : undefined;
  return f.createExpressionStatement(
    f.createCallExpression(
      f.createIdentifier('when'),
      typeRef !== '' ? [f.createTypeReferenceNode(typeRef, undefined)] : undefined,
      [jsonToExpr(ts, f, exampleData, typeInfo)],
    ),
  );
}

function buildCommandWhenStatement(
  ts: typeof import('typescript'),
  f: tsNS.NodeFactory,
  when: { commandRef: string; exampleData: Record<string, unknown> },
  messages?: Array<{ type: string; name: string; fields: Array<{ name: string; type: string; required: boolean }> }>,
): tsNS.Statement {
  return createWhenCallExpression(ts, f, when.commandRef, when.exampleData, messages);
}

function buildEventWhenStatement(
  ts: typeof import('typescript'),
  f: tsNS.NodeFactory,
  event: { eventRef: string; exampleData: Record<string, unknown> },
  messages?: Array<{ type: string; name: string; fields: Array<{ name: string; type: string; required: boolean }> }>,
): tsNS.Statement {
  return createWhenCallExpression(ts, f, event.eventRef, event.exampleData, messages);
}

function isQueryWithSingleEvent(
  sliceKind: string,
  when: GWTBlock['when'],
): when is { eventRef: string; exampleData: Record<string, unknown> } {
  return sliceKind === 'query' && when !== undefined && !Array.isArray(when) && 'eventRef' in when;
}

function isReactOrQueryWithEvents(sliceKind: string): boolean {
  return sliceKind === 'react' || sliceKind === 'query';
}

function buildStandaloneWhenStatement(
  ts: typeof import('typescript'),
  f: tsNS.NodeFactory,
  g: GWTBlock,
  sliceKind: 'command' | 'react' | 'query' | 'experience',
  messages?: Array<{ type: string; name: string; fields: Array<{ name: string; type: string; required: boolean }> }>,
): tsNS.Statement | null {
  if (isEmptyWhen(g.when)) {
    return null;
  }

  const when = g.when;
  if (sliceKind === 'command' && isWhenCommand(when)) {
    return buildCommandWhenStatement(ts, f, when, messages);
  }
  if (isReactOrQueryWithEvents(sliceKind) && isWhenEvents(when) && when.length > 0) {
    return buildEventWhenStatement(ts, f, when[0], messages);
  }
  if (isQueryWithSingleEvent(sliceKind, when)) {
    return buildEventWhenStatement(ts, f, when, messages);
  }
  return null;
}

function buildStandaloneThenStatement(
  ts: typeof import('typescript'),
  f: tsNS.NodeFactory,
  g: GWTBlock,
  messages?: Array<{ type: string; name: string; fields: Array<{ name: string; type: string; required: boolean }> }>,
): tsNS.Statement {
  const firstThenItem = g.then[0];
  const thenTypeRef = getThenTypeRef(firstThenItem);
  const typeInfo = messages && thenTypeRef ? getFieldTypeInfo(messages, thenTypeRef) : undefined;
  const thenArg = buildThenItem(ts, f, firstThenItem, typeInfo);
  const thenTypeParams = thenTypeRef ? [f.createTypeReferenceNode(thenTypeRef, undefined)] : undefined;

  return f.createExpressionStatement(f.createCallExpression(f.createIdentifier('then'), thenTypeParams, [thenArg]));
}

function buildThenItem(
  ts: typeof import('typescript'),
  f: tsNS.NodeFactory,
  t: GWTBlock['then'][0],
  typeInfo?: FieldTypeInfo,
): tsNS.Expression {
  const item = t as Record<string, unknown>;

  if ('eventRef' in item) {
    const e = t as { eventRef: string; exampleData: Record<string, unknown> };
    return jsonToExpr(ts, f, e.exampleData, typeInfo);
  }

  if ('commandRef' in item) {
    const c = t as { commandRef: string; exampleData: Record<string, unknown> };
    return jsonToExpr(ts, f, c.exampleData, typeInfo);
  }

  if ('stateRef' in item) {
    const s = t as { stateRef: string; exampleData: Record<string, unknown> };
    return jsonToExpr(ts, f, s.exampleData, typeInfo);
  }

  if ('errorType' in item) {
    const err = t as { errorType: 'IllegalStateError' | 'ValidationError' | 'NotFoundError'; message?: string };
    return f.createObjectLiteralExpression(
      [
        f.createPropertyAssignment('errorType', f.createStringLiteral(err.errorType)),
        ...(err.message !== null && err.message !== undefined
          ? [f.createPropertyAssignment('message', f.createStringLiteral(err.message))]
          : []),
      ],
      false,
    );
  }

  return f.createNull();
}

function getDescriptions(
  g: GWTBlock & { description?: string; ruleDescription?: string; exampleDescription?: string },
) {
  const ruleDesc =
    g.ruleDescription !== null && g.ruleDescription !== undefined && g.ruleDescription !== ''
      ? g.ruleDescription
      : 'Generated rule description';

  const exampleDesc =
    g.exampleDescription !== null && g.exampleDescription !== undefined && g.exampleDescription !== ''
      ? g.exampleDescription
      : g.description !== null && g.description !== undefined && g.description !== ''
        ? g.description
        : 'Generated example description';

  return { ruleDesc, exampleDesc };
}

function isEmptyEventWhen(when: { eventRef: string; exampleData: Record<string, unknown> }): boolean {
  return Object.keys(when.exampleData).length === 0;
}

function isEmptyCommandWhen(when: { commandRef: string; exampleData: Record<string, unknown> }): boolean {
  return (!when.commandRef || when.commandRef === '') && Object.keys(when.exampleData).length === 0;
}

function isEmptyWhen(whenData: GWTBlock['when']): boolean {
  if (!whenData) return true;
  if (Array.isArray(whenData)) {
    if (whenData.length === 0) return true;
    const firstItem = whenData[0];
    if ('eventRef' in firstItem) {
      return isEmptyEventWhen(firstItem as { eventRef: string; exampleData: Record<string, unknown> });
    }
    if ('commandRef' in firstItem) {
      return isEmptyCommandWhen(firstItem as { commandRef: string; exampleData: Record<string, unknown> });
    }
    return false;
  }
  if (typeof whenData === 'object' && 'eventRef' in whenData) {
    return isEmptyEventWhen(whenData as { eventRef: string; exampleData: Record<string, unknown> });
  }
  if (typeof whenData === 'object' && 'commandRef' in whenData) {
    return isEmptyCommandWhen(whenData as { commandRef: string; exampleData: Record<string, unknown> });
  }
  return false;
}

function getThenTypeRef(firstThenItem: GWTBlock['then'][0]): string {
  if ('eventRef' in firstThenItem) {
    return (firstThenItem as { eventRef: string }).eventRef;
  } else if ('commandRef' in firstThenItem) {
    return (firstThenItem as { commandRef: string }).commandRef;
  } else if ('stateRef' in firstThenItem) {
    return (firstThenItem as { stateRef: string }).stateRef;
  }
  return '';
}

export function buildGwtSpecBlock(
  ts: typeof import('typescript'),
  f: tsNS.NodeFactory,
  g: GWTBlock & { description?: string; ruleDescription?: string; exampleDescription?: string; ruleId?: string },
  sliceKind: 'command' | 'react' | 'query' | 'experience',
  messages?: Array<{ type: string; name: string; fields: Array<{ name: string; type: string; required: boolean }> }>,
): tsNS.Statement {
  const { ruleDesc, exampleDesc } = getDescriptions(g);

  const bodyStatements: tsNS.Statement[] = [];
  bodyStatements.push(...buildStandaloneGivenStatements(ts, f, g, messages));
  const whenStmt = buildStandaloneWhenStatement(ts, f, g, sliceKind, messages);
  if (whenStmt) {
    bodyStatements.push(whenStmt);
  }
  bodyStatements.push(buildStandaloneThenStatement(ts, f, g, messages));

  const exampleCall = f.createCallExpression(f.createIdentifier('example'), undefined, [
    f.createStringLiteral(exampleDesc),
    f.createArrowFunction(
      undefined,
      undefined,
      [],
      undefined,
      f.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
      f.createBlock(bodyStatements, true),
    ),
  ]);

  const ruleArgs: tsNS.Expression[] = [f.createStringLiteral(ruleDesc)];

  if (g.ruleId !== null && g.ruleId !== undefined) {
    ruleArgs.push(f.createStringLiteral(g.ruleId));
  }

  ruleArgs.push(
    f.createArrowFunction(
      undefined,
      undefined,
      [],
      undefined,
      f.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
      f.createBlock([f.createExpressionStatement(exampleCall)], true),
    ),
  );

  const ruleCall = f.createCallExpression(f.createIdentifier('rule'), undefined, ruleArgs);
  return f.createExpressionStatement(ruleCall);
}

/**
 * Build a rule() call that contains multiple examples
 */
/**
 * Extract field type information from messages for a specific type
 */
function getFieldTypeInfo(
  messages: Array<{ type: string; name: string; fields: Array<{ name: string; type: string; required: boolean }> }>,
  typeName: string,
): FieldTypeInfo {
  const message = messages.find((msg) => msg.name === typeName);
  if (!message) return {};

  const typeInfo: FieldTypeInfo = {};
  for (const field of message.fields) {
    typeInfo[field.name] = field.type;
  }
  return typeInfo;
}

export function buildConsolidatedGwtSpecBlock(
  ts: typeof import('typescript'),
  f: tsNS.NodeFactory,
  rule: { id?: string; description: string },
  gwtBlocks: Array<
    GWTBlock & { description?: string; ruleDescription?: string; exampleDescription?: string; ruleId?: string }
  >,
  sliceKind: 'command' | 'react' | 'query' | 'experience',
  messages?: Array<{ type: string; name: string; fields: Array<{ name: string; type: string; required: boolean }> }>,
): tsNS.Statement {
  const exampleStatements: tsNS.Statement[] = [];

  for (const g of gwtBlocks) {
    const { exampleDesc } = getDescriptions(g);

    const bodyStatements: tsNS.Statement[] = [];
    bodyStatements.push(...buildStandaloneGivenStatements(ts, f, g, messages));
    const whenStmt = buildStandaloneWhenStatement(ts, f, g, sliceKind, messages);
    if (whenStmt) {
      bodyStatements.push(whenStmt);
    }
    bodyStatements.push(buildStandaloneThenStatement(ts, f, g, messages));

    const exampleCall = f.createCallExpression(f.createIdentifier('example'), undefined, [
      f.createStringLiteral(exampleDesc),
      f.createArrowFunction(
        undefined,
        undefined,
        [],
        undefined,
        f.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
        f.createBlock(bodyStatements, true),
      ),
    ]);

    exampleStatements.push(f.createExpressionStatement(exampleCall));
  }

  const ruleArgs: tsNS.Expression[] = [f.createStringLiteral(rule.description)];

  if (rule.id !== null && rule.id !== undefined) {
    ruleArgs.push(f.createStringLiteral(rule.id));
  }

  ruleArgs.push(
    f.createArrowFunction(
      undefined,
      undefined,
      [],
      undefined,
      f.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
      f.createBlock(exampleStatements, true),
    ),
  );

  const ruleCall = f.createCallExpression(f.createIdentifier('rule'), undefined, ruleArgs);
  return f.createExpressionStatement(ruleCall);
}
