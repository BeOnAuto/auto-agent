export function parseCorrelationId(correlationId: string): { graphId: string; jobId: string } | null {
  const match = correlationId.match(/^graph:(.+):(.+)$/);
  if (match === null) return null;
  return { graphId: match[1], jobId: match[2] };
}
