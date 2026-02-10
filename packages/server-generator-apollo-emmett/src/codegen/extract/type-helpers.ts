export function isInlineObject(ts: string): boolean {
  return /^\{[\s\S]*\}$/.test((ts ?? '').trim());
}

export function isInlineObjectArray(ts: string): boolean {
  const t = (ts ?? '').trim();
  return /^Array<\{[\s\S]*\}>$/.test(t) || /^\{[\s\S]*\}\[\]$/.test(t);
}

export function baseTs(ts: string): string {
  return (ts ?? 'string').replace(/\s*\|\s*null\b/g, '').trim();
}

function extractObjectBody(tsType: string): string | null {
  const t = tsType.trim();
  let inner: string;
  if (t.startsWith('Array<{') && t.endsWith('}>')) {
    inner = t.slice(6, -1);
  } else if (t.endsWith('[]')) {
    inner = t.slice(0, -2).trim();
  } else {
    inner = t;
  }
  const match = inner.match(/^\{([\s\S]*)\}$/);
  return match ? match[1] : null;
}

function splitFieldsRespectingNesting(body: string): string[] {
  const fields: string[] = [];
  let current = '';
  let depth = 0;
  for (const char of body) {
    if (char === '<' || char === '{') depth++;
    if (char === '>' || char === '}') depth--;
    if ((char === ';' || char === ',') && depth === 0) {
      const trimmed = current.trim();
      if (trimmed) fields.push(trimmed);
      current = '';
      continue;
    }
    current += char;
  }
  const trimmed = current.trim();
  if (trimmed) fields.push(trimmed);
  return fields;
}

export function parseInlineObjectFields(tsType: string): Array<{ name: string; tsType: string }> {
  const body = extractObjectBody(tsType);
  if (body === null) return [];
  const rawFields = splitFieldsRespectingNesting(body);
  return rawFields
    .map((f) => {
      const colonIdx = f.indexOf(':');
      if (colonIdx === -1) return null;
      const name = f.slice(0, colonIdx).trim();
      const type = f.slice(colonIdx + 1).trim();
      if (!name || !type) return null;
      return { name, tsType: type };
    })
    .filter((f): f is { name: string; tsType: string } => f !== null);
}

export function createIsEnumType(toTsFieldType: (ts: string) => string) {
  return (tsType: string): boolean => {
    const converted = toTsFieldType(tsType);
    const base = converted
      .replace(/\s*\|\s*null\b/g, '')
      .replace(/\[\]$/, '')
      .trim();
    return (
      /^[A-Z][a-zA-Z0-9]*$/.test(base) &&
      ![
        'String',
        'Number',
        'Boolean',
        'Date',
        'ID',
        'Int',
        'Float',
        'GraphQLISODateTime',
        'GraphQLJSON',
        'JSON',
      ].includes(base)
    );
  };
}

export function createFieldUsesDate(graphqlType: (ts: string) => string) {
  return (ts: string): boolean => {
    const b = baseTs(ts);
    const gqlType = graphqlType(b);
    if (gqlType.includes('GraphQLISODateTime')) return true;
    if (isInlineObject(b) || isInlineObjectArray(b)) return /:\s*Date\b/.test(b);
    return false;
  };
}

export function createFieldUsesJSON(graphqlType: (ts: string) => string) {
  return (ts: string): boolean => {
    const b = baseTs(ts);
    const gqlType = graphqlType(b);
    if (gqlType.includes('GraphQLJSON') || gqlType.includes('JSON')) return true;
    if (isInlineObject(b) || isInlineObjectArray(b)) return /:\s*(unknown|any|object)\b/.test(b);
    return false;
  };
}

export function createFieldUsesFloat(graphqlType: (ts: string) => string) {
  return (ts: string): boolean => {
    const b = baseTs(ts);
    const gqlType = graphqlType(b);
    if (gqlType.includes('Float')) return true;
    if (isInlineObject(b) || isInlineObjectArray(b)) {
      const fields = parseInlineObjectFields(b);
      return fields.some((f) => graphqlType(f.tsType).includes('Float'));
    }
    return false;
  };
}

export function extractEnumName(tsType: string, toTsFieldType: (ts: string) => string): string {
  return toTsFieldType(tsType)
    .replace(/\s*\|\s*null\b/g, '')
    .replace(/\[\]$/, '')
    .trim();
}

export function createCollectEnumNames(isEnumType: (tsType: string) => boolean, toTsFieldType: (ts: string) => string) {
  return (fields: Array<{ type?: string; tsType?: string }>): string[] => {
    const enumNames = new Set<string>();
    for (const field of fields) {
      const fieldType = field.type ?? field.tsType;
      if (fieldType !== undefined && fieldType !== null && fieldType.length > 0 && isEnumType(fieldType)) {
        enumNames.add(extractEnumName(fieldType, toTsFieldType));
      }
    }
    return Array.from(enumNames).sort();
  };
}
