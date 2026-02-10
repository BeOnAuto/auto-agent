import type tsNS from 'typescript';

/**
 * Type information for converting JSON values with proper Date handling
 */
export interface FieldTypeInfo {
  [fieldName: string]: string; // field name -> type (e.g., 'Date', 'string', etc.)
}

export type TypeResolver = (typeName: string) => FieldTypeInfo | undefined;

const ARRAY_TYPE_REGEX = /^Array<(.+)>$/;

const VALID_IDENTIFIER_REGEX = /^[A-Za-z_]\w*$/;

function createDateNewExpr(f: tsNS.NodeFactory, dateStr: string): tsNS.NewExpression {
  return f.createNewExpression(f.createIdentifier('Date'), undefined, [f.createStringLiteral(dateStr)]);
}

function parseObjectTypeFields(typeStr: string): Array<{ name: string; type: string }> | undefined {
  const trimmed = typeStr.trim();
  if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) {
    return undefined;
  }

  const inner = trimmed.slice(1, -1).trim();
  if (inner.length === 0) {
    return [];
  }

  const result: Array<{ name: string; type: string }> = [];
  const parts = splitTopLevel(inner, ',');

  for (const p of parts) {
    const colonIdx = p.indexOf(':');
    if (colonIdx === -1) continue;

    const name = p.slice(0, colonIdx).trim();
    const type = p.slice(colonIdx + 1).trim();
    if (name.length === 0 || type.length === 0) continue;

    result.push({ name, type });
  }

  return result;
}

function parseObjectTypeInfo(typeStr: string): FieldTypeInfo | undefined {
  const fields = parseObjectTypeFields(typeStr);
  if (!fields) return undefined;

  const result: FieldTypeInfo = {};
  for (const { name, type } of fields) {
    result[name] = type;
  }
  return result;
}

function parseArrayElementType(typeStr: string): string | undefined {
  const match = ARRAY_TYPE_REGEX.exec(typeStr.trim());
  return match ? match[1] : undefined;
}

function convertDateValue(f: tsNS.NodeFactory, x: unknown): tsNS.Expression | undefined {
  if (typeof x === 'string') return createDateNewExpr(f, x);
  if (x instanceof Date) return createDateNewExpr(f, x.toISOString());
  return undefined;
}

function convertArrayField(
  ts: typeof import('typescript'),
  f: tsNS.NodeFactory,
  arr: unknown[],
  fieldType: string,
  typeResolver?: TypeResolver,
): tsNS.Expression {
  const elementType = parseArrayElementType(fieldType);
  if (elementType === 'Date') {
    return f.createArrayLiteralExpression(arr.map((elem) => convertDateValue(f, elem) ?? jsonToExpr(ts, f, elem)));
  }
  const elementTypeInfo = elementType ? (parseObjectTypeInfo(elementType) ?? typeResolver?.(elementType)) : undefined;
  return f.createArrayLiteralExpression(arr.map((elem) => jsonToExpr(ts, f, elem, elementTypeInfo, typeResolver)));
}

function convertObjectField(
  ts: typeof import('typescript'),
  f: tsNS.NodeFactory,
  obj: Record<string, unknown>,
  fieldType: string,
  typeResolver?: TypeResolver,
): tsNS.Expression {
  const nestedTypeInfo = parseObjectTypeInfo(fieldType) ?? typeResolver?.(fieldType);
  return jsonToExpr(ts, f, obj, nestedTypeInfo, typeResolver);
}

function computeFieldExpr(
  ts: typeof import('typescript'),
  f: tsNS.NodeFactory,
  x: unknown,
  fieldType: string | undefined,
  typeInfo: FieldTypeInfo | undefined,
  typeResolver?: TypeResolver,
): tsNS.Expression {
  if (fieldType === 'Date') {
    const dateExpr = convertDateValue(f, x);
    if (dateExpr) return dateExpr;
  }
  if (fieldType && typeof x === 'object' && x !== null) {
    if (Array.isArray(x)) return convertArrayField(ts, f, x, fieldType, typeResolver);
    return convertObjectField(ts, f, x as Record<string, unknown>, fieldType, typeResolver);
  }
  return jsonToExpr(ts, f, x, typeInfo, typeResolver);
}

/**
 * Emit a TS expression from a plain JSON-like value with optional type information for Date handling.
 */
export function jsonToExpr(
  ts: typeof import('typescript'),
  f: tsNS.NodeFactory,
  v: unknown,
  typeInfo?: FieldTypeInfo,
  typeResolver?: TypeResolver,
): tsNS.Expression {
  if (v === null) return f.createNull();
  switch (typeof v) {
    case 'string':
      return f.createStringLiteral(v);
    case 'number':
      if (v < 0) {
        return f.createPrefixUnaryExpression(ts.SyntaxKind.MinusToken, f.createNumericLiteral(String(Math.abs(v))));
      }
      return f.createNumericLiteral(String(v));
    case 'boolean':
      return v ? f.createTrue() : f.createFalse();
    case 'object': {
      if (v instanceof Date) {
        return createDateNewExpr(f, v.toISOString());
      }
      if (Array.isArray(v)) {
        return f.createArrayLiteralExpression(v.map((x) => jsonToExpr(ts, f, x, typeInfo, typeResolver)));
      }
      const entries = Object.entries(v as Record<string, unknown>);
      return f.createObjectLiteralExpression(
        entries.map(([k, x]) =>
          f.createPropertyAssignment(
            VALID_IDENTIFIER_REGEX.test(k) ? f.createIdentifier(k) : f.createStringLiteral(k),
            computeFieldExpr(ts, f, x, typeInfo?.[k], typeInfo, typeResolver),
          ),
        ),
        false,
      );
    }
    default:
      return f.createIdentifier('undefined');
  }
}

/**
 * Creates primitive type nodes
 */
function createPrimitiveTypeNode(
  ts: typeof import('typescript'),
  f: tsNS.NodeFactory,
  trimmed: string,
): tsNS.TypeNode | null {
  switch (trimmed) {
    case 'string':
      return f.createKeywordTypeNode(ts.SyntaxKind.StringKeyword);
    case 'number':
      return f.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword);
    case 'boolean':
      return f.createKeywordTypeNode(ts.SyntaxKind.BooleanKeyword);
    case 'unknown':
      return f.createKeywordTypeNode(ts.SyntaxKind.UnknownKeyword);
    case 'Date':
      return f.createTypeReferenceNode('Date');
    default:
      return null;
  }
}

/**
 * Creates array type node if the type is Array<...>
 */
function createArrayTypeNode(
  ts: typeof import('typescript'),
  f: tsNS.NodeFactory,
  trimmed: string,
): tsNS.TypeNode | null {
  const arrayMatch = ARRAY_TYPE_REGEX.exec(trimmed);
  if (arrayMatch) {
    const inner = typeFromString(ts, f, arrayMatch[1]);
    return f.createArrayTypeNode(inner);
  }
  return null;
}

/**
 * Creates object literal type node for {prop: type, ...} syntax
 */
function createObjectLiteralTypeNode(
  ts: typeof import('typescript'),
  f: tsNS.NodeFactory,
  trimmed: string,
): tsNS.TypeNode | null {
  const fields = parseObjectTypeFields(trimmed);
  if (!fields) return null;

  const members = fields.map(({ name, type }) =>
    f.createPropertySignature(
      undefined,
      VALID_IDENTIFIER_REGEX.test(name) ? f.createIdentifier(name) : f.createStringLiteral(name),
      undefined,
      typeFromString(ts, f, type),
    ),
  );

  return f.createTypeLiteralNode(members);
}

/**
 * Create a TypeNode from a simple textual form (as produced by your schema).
 * Supports: string, number, boolean, unknown, Date, Array<...>, inline object {a: string, ...}
 * Falls back to a named type reference.
 */
export function typeFromString(ts: typeof import('typescript'), f: tsNS.NodeFactory, t: string): tsNS.TypeNode {
  const trimmed = t.trim();

  // Try primitive types
  const primitive = createPrimitiveTypeNode(ts, f, trimmed);
  if (primitive) return primitive;

  // Try array types
  const arrayType = createArrayTypeNode(ts, f, trimmed);
  if (arrayType) return arrayType;

  // Try object literal types
  const objectType = createObjectLiteralTypeNode(ts, f, trimmed);
  if (objectType) return objectType;

  // Fallback: bare identifier type
  return f.createTypeReferenceNode(trimmed);
}

/** Split a string by a delimiter at top-level only (not inside {}, <>). */
function splitTopLevel(input: string, delim: ',' | '|'): string[] {
  const out: string[] = [];
  let depthBrace = 0;
  let depthAngle = 0;
  let cur = '';
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (ch === '{') depthBrace++;
    else if (ch === '}') depthBrace--;
    else if (ch === '<') depthAngle++;
    else if (ch === '>') depthAngle--;
    if (ch === delim && depthBrace === 0 && depthAngle === 0) {
      out.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}
