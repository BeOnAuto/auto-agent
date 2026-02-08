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

export type JobGraphEvent = GraphSubmitted;

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
  }
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
