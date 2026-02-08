import type { GraphState, JobGraphEvent } from './evolve';
import { getTransitiveDependents } from './evolve';

export function applyPolicy(state: GraphState, failedJobId: string): JobGraphEvent[] {
  if (state.status !== 'processing') return [];

  switch (state.failurePolicy) {
    case 'continue':
      return [];
    case 'skip-dependents':
      return getTransitiveDependents(state, failedJobId).map(
        (id): JobGraphEvent => ({
          type: 'JobSkipped',
          data: { jobId: id, reason: 'dependency failed' },
        }),
      );
    case 'halt': {
      const events: JobGraphEvent[] = [];
      for (const [id, job] of state.jobs) {
        if (job.status === 'pending') {
          events.push({ type: 'JobSkipped', data: { jobId: id, reason: 'halt policy' } });
        }
      }
      return events;
    }
  }
}
