export interface Job {
  id: string;
  dependsOn: readonly string[];
  target: string;
  payload: unknown;
  timeoutMs?: number;
  retries?: number;
  backoffMs?: number;
  maxBackoffMs?: number;
}

type ValidationResult = { valid: true } | { valid: false; error: string };

export function validateGraph(jobs: readonly Job[]): ValidationResult {
  if (jobs.length === 0) {
    return { valid: false, error: 'Graph must contain at least one job' };
  }

  const ids = new Set<string>();
  for (const job of jobs) {
    if (ids.has(job.id)) {
      return { valid: false, error: `Duplicate job ID: '${job.id}'` };
    }
    ids.add(job.id);
  }

  for (const job of jobs) {
    if (job.target === '') {
      return { valid: false, error: `Job '${job.id}' has empty target` };
    }

    for (const dep of job.dependsOn) {
      if (dep === job.id) {
        return { valid: false, error: `Job '${job.id}' depends on itself` };
      }
      if (!ids.has(dep)) {
        return { valid: false, error: `Job '${job.id}' depends on unknown job '${dep}'` };
      }
    }
  }

  const cycleError = detectCycles(jobs);
  if (cycleError !== null) {
    return { valid: false, error: cycleError };
  }

  return { valid: true };
}

function detectCycles(jobs: readonly Job[]): string | null {
  const adjacency: Record<string, readonly string[]> = {};
  for (const job of jobs) {
    adjacency[job.id] = job.dependsOn;
  }

  const visited = new Set<string>();
  const inStack = new Set<string>();

  for (const job of jobs) {
    if (!visited.has(job.id)) {
      const cycleNode = dfs(job.id, adjacency, visited, inStack);
      if (cycleNode !== null) {
        return `Cycle detected involving job '${cycleNode}'`;
      }
    }
  }

  return null;
}

function dfs(
  nodeId: string,
  adjacency: Record<string, readonly string[]>,
  visited: Set<string>,
  inStack: Set<string>,
): string | null {
  visited.add(nodeId);
  inStack.add(nodeId);

  for (const dep of adjacency[nodeId]) {
    if (inStack.has(dep)) {
      return dep;
    }
    if (!visited.has(dep)) {
      const result = dfs(dep, adjacency, visited, inStack);
      if (result !== null) {
        return result;
      }
    }
  }

  inStack.delete(nodeId);
  return null;
}
