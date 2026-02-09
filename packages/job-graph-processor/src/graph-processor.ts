import type { Event, MessageBus } from '@auto-engineer/message-bus';
import { applyPolicy } from './apply-policy';
import type { FailurePolicy, GraphState } from './evolve';
import { evolve, getReadyJobs, initialState, isGraphComplete } from './evolve';
import type { Job } from './graph-validator';
import { validateGraph } from './graph-validator';
import { classifyJobEvent } from './handle-job-event';

export interface ProcessGraphCommand {
  type: string;
  data: {
    graphId: string;
    jobs: readonly Job[];
    failurePolicy: FailurePolicy;
  };
}

interface DispatchedJob {
  jobId: string;
  target: string;
  payload: unknown;
  correlationId: string;
}

export type DispatchFn = (command: { type: string; data: unknown; correlationId: string }) => Promise<void>;

export function createGraphProcessor(messageBus: MessageBus, options?: { dispatch?: DispatchFn }) {
  const dispatch: DispatchFn =
    options?.dispatch ??
    ((cmd) =>
      messageBus.sendCommand({
        type: cmd.type,
        data: cmd.data as Record<string, unknown>,
        correlationId: cmd.correlationId,
      }));
  const graphs = new Map<string, { state: GraphState; jobById: Record<string, Job> }>();

  function submit(command: ProcessGraphCommand): Event {
    const { graphId, jobs, failurePolicy } = command.data;

    if (graphs.has(graphId)) {
      return { type: 'graph.failed', data: { graphId, reason: `Graph ${graphId} already submitted` } };
    }

    const validation = validateGraph(jobs);
    if (!validation.valid) {
      return { type: 'graph.failed', data: { graphId, reason: validation.error } };
    }

    let state = evolve(initialState(), {
      type: 'GraphSubmitted',
      data: { graphId, jobs, failurePolicy },
    });

    const ready = getReadyJobs(state);
    const jobById: Record<string, Job> = {};
    for (const job of jobs) {
      jobById[job.id] = job;
    }

    const dispatched: DispatchedJob[] = ready.map((jobId) => {
      const correlationId = `graph:${graphId}:${jobId}`;
      state = evolve(state, {
        type: 'JobDispatched',
        data: { jobId, target: jobById[jobId].target, correlationId },
      });
      return { jobId, target: jobById[jobId].target, payload: jobById[jobId].payload, correlationId };
    });

    graphs.set(graphId, { state, jobById });

    messageBus.onCorrelationPrefix(`graph:${graphId}:`, (event) => {
      onJobEvent(graphId, event);
    });

    for (const d of dispatched) {
      dispatch({ type: d.target, data: d.payload, correlationId: d.correlationId }).catch(() => {});
    }

    return { type: 'graph.dispatching', data: { graphId, dispatchedJobs: dispatched } };
  }

  function onJobEvent(graphId: string, event: Event): void {
    const entry = graphs.get(graphId);
    if (entry === undefined) return;

    const classified = classifyJobEvent(event);
    if (classified === null) return;
    let state = evolve(entry.state, classified);

    if (classified.type === 'JobFailed') {
      const policyEvents = applyPolicy(state, classified.data.jobId);
      for (const pe of policyEvents) {
        state = evolve(state, pe);
      }
    }

    for (const jobId of getReadyJobs(state)) {
      const correlationId = `graph:${graphId}:${jobId}`;
      const { target, payload } = entry.jobById[jobId];
      state = evolve(state, {
        type: 'JobDispatched',
        data: { jobId, target, correlationId },
      });
      dispatch({ type: target, data: payload, correlationId }).catch(() => {});
    }

    graphs.set(graphId, { ...entry, state });

    if (isGraphComplete(state)) {
      graphs.delete(graphId);
      messageBus.publishEvent({ type: 'graph.completed', data: { graphId } });
    }
  }

  return { submit };
}
