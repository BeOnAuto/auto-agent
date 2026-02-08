import type { Event } from '@auto-engineer/message-bus';
import type { FailurePolicy } from './evolve';
import { evolve, getReadyJobs, initialState } from './evolve';
import type { Job } from './graph-validator';
import { validateGraph } from './graph-validator';

interface ProcessGraphCommand {
  type: 'ProcessGraph';
  data: {
    graphId: string;
    jobs: readonly Job[];
    failurePolicy: FailurePolicy;
  };
}

export async function handleProcessGraph(command: ProcessGraphCommand): Promise<Event | Event[]> {
  const { graphId, jobs, failurePolicy } = command.data;

  const validation = validateGraph(jobs);
  if (!validation.valid) {
    return {
      type: 'graph.failed',
      data: { graphId, reason: validation.error },
    };
  }

  const state = evolve(initialState(), {
    type: 'GraphSubmitted',
    data: { graphId, jobs, failurePolicy },
  });

  const jobById: Record<string, Job> = {};
  for (const job of jobs) {
    jobById[job.id] = job;
  }

  const ready = getReadyJobs(state);
  return ready.map((jobId) => ({
    type: 'job.dispatched',
    data: { graphId, jobId, target: jobById[jobId].target, payload: jobById[jobId].payload },
  }));
}
