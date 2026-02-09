export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return '[' + value.map((item) => stableStringify(item)).join(',') + ']';
  }

  const obj = value as Record<string, unknown>;
  const sortedKeys = Object.keys(obj).sort();
  const parts: string[] = [];
  for (const key of sortedKeys) {
    const val = obj[key];
    if (val === undefined) continue;
    parts.push(JSON.stringify(key) + ':' + stableStringify(val));
  }
  return '{' + parts.join(',') + '}';
}
