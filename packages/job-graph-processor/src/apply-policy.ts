import type { GraphState, JobGraphEvent } from './evolve';

export function applyPolicy(state: GraphState, _failedJobId: string): JobGraphEvent[] {
  if (state.status !== 'processing') return [];

  const events: JobGraphEvent[] = [];
  for (const [id, job] of state.jobs) {
    if (job.status === 'pending') {
      events.push({ type: 'JobSkipped', data: { jobId: id, reason: 'halt policy' } });
    }
  }
  return events;
}
