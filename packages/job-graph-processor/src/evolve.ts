import type { Job } from './graph-validator';

export type JobStatus = 'pending' | 'dispatched' | 'succeeded' | 'failed' | 'skipped' | 'timed-out';
export type FailurePolicy = 'halt' | 'skip-dependents' | 'continue';

interface JobState {
  jobId: string;
  status: JobStatus;
  dependsOn: readonly string[];
}

type GraphSubmitted = {
  type: 'GraphSubmitted';
  data: { graphId: string; jobs: readonly Job[]; failurePolicy: FailurePolicy };
};

type JobDispatched = {
  type: 'JobDispatched';
  data: { jobId: string; target: string; correlationId: string };
};
type JobSucceeded = { type: 'JobSucceeded'; data: { jobId: string; result?: unknown } };
type JobFailed = { type: 'JobFailed'; data: { jobId: string; error: string } };
type JobSkipped = { type: 'JobSkipped'; data: { jobId: string; reason: string } };
type JobTimedOut = { type: 'JobTimedOut'; data: { jobId: string; timeoutMs: number } };

export type JobGraphEvent = GraphSubmitted | JobDispatched | JobSucceeded | JobFailed | JobSkipped | JobTimedOut;

type PendingGraphState = { status: 'pending' };
type ProcessingGraphState = {
  status: 'processing';
  graphId: string;
  failurePolicy: FailurePolicy;
  jobs: Map<string, JobState>;
};

export type GraphState = PendingGraphState | ProcessingGraphState;

export function initialState(): GraphState {
  return { status: 'pending' };
}

export function evolve(state: GraphState, event: JobGraphEvent): GraphState {
  switch (event.type) {
    case 'GraphSubmitted':
      return {
        status: 'processing',
        graphId: event.data.graphId,
        failurePolicy: event.data.failurePolicy,
        jobs: new Map(
          event.data.jobs.map((job): [string, JobState] => [
            job.id,
            { jobId: job.id, status: 'pending', dependsOn: job.dependsOn },
          ]),
        ),
      };
    case 'JobDispatched':
      return updateJobStatus(state, event.data.jobId, 'dispatched');
    case 'JobSucceeded':
      return updateJobStatus(state, event.data.jobId, 'succeeded');
    case 'JobFailed':
      return updateJobStatus(state, event.data.jobId, 'failed');
    case 'JobSkipped':
      return updateJobStatus(state, event.data.jobId, 'skipped');
    case 'JobTimedOut':
      return updateJobStatus(state, event.data.jobId, 'timed-out');
  }
}

function updateJobStatus(state: GraphState, jobId: string, status: JobStatus): GraphState {
  if (state.status !== 'processing') return state;
  const jobs = new Map(state.jobs);
  const existing = jobs.get(jobId);
  if (existing === undefined) return state;
  jobs.set(jobId, { ...existing, status });
  return { ...state, jobs };
}

const TERMINAL_STATUSES: ReadonlySet<JobStatus> = new Set(['succeeded', 'failed', 'skipped', 'timed-out']);

export function isGraphComplete(state: GraphState): boolean {
  if (state.status !== 'processing') return false;
  for (const job of state.jobs.values()) {
    if (!TERMINAL_STATUSES.has(job.status)) return false;
  }
  return true;
}

export function getTransitiveDependents(state: GraphState, jobId: string): string[] {
  if (state.status !== 'processing') return [];
  const dependents: Set<string> = new Set();
  const queue = [jobId];
  while (queue.length > 0) {
    const current = queue.pop()!;
    for (const [id, job] of state.jobs) {
      if (!dependents.has(id) && job.dependsOn.includes(current)) {
        dependents.add(id);
        queue.push(id);
      }
    }
  }
  return [...dependents];
}

export function getReadyJobs(state: GraphState): string[] {
  if (state.status !== 'processing') return [];
  const ready: string[] = [];
  for (const [id, job] of state.jobs) {
    if (job.status !== 'pending') continue;
    const allDepsResolved = job.dependsOn.every((dep) => {
      const depJob = state.jobs.get(dep);
      return (
        depJob !== undefined &&
        (depJob.status === 'succeeded' || (state.failurePolicy === 'continue' && TERMINAL_STATUSES.has(depJob.status)))
      );
    });
    if (allDepsResolved) {
      ready.push(id);
    }
  }
  return ready;
}
