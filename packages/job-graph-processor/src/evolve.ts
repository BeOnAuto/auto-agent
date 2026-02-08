import type { Job } from './graph-validator';

export type JobStatus = 'pending' | 'dispatched' | 'succeeded';
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

export type JobGraphEvent = GraphSubmitted | JobDispatched | JobSucceeded;

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
          event.data.jobs.map((job) => [
            job.id,
            { jobId: job.id, status: 'pending' as JobStatus, dependsOn: job.dependsOn },
          ]),
        ),
      };
    case 'JobDispatched':
      return updateJobStatus(state, event.data.jobId, 'dispatched');
    case 'JobSucceeded':
      return updateJobStatus(state, event.data.jobId, 'succeeded');
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

export function isGraphComplete(state: GraphState): boolean {
  if (state.status !== 'processing') return false;
  for (const job of state.jobs.values()) {
    if (job.status !== 'succeeded') return false;
  }
  return true;
}

export function getReadyJobs(state: GraphState): string[] {
  if (state.status !== 'processing') return [];
  const ready: string[] = [];
  for (const [id, job] of state.jobs) {
    if (job.status !== 'pending') continue;
    const allDepsResolved = job.dependsOn.every((dep) => {
      const depJob = state.jobs.get(dep);
      return depJob !== undefined && depJob.status === 'succeeded';
    });
    if (allDepsResolved) {
      ready.push(id);
    }
  }
  return ready;
}
