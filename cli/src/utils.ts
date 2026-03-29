export function parseApiKey(key: string): { workspaceId: string } | null {
  const parts = key.split('_');
  if (parts.length < 3 || parts[0] !== 'ak') return null;
  return { workspaceId: parts[1] };
}
