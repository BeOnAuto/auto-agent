import type { AwaitEvent } from '../projections/await-tracker-projection';
import type { PipelineReadModel } from '../store/pipeline-read-model';

interface AwaitTrackerOptions {
  readModel: PipelineReadModel;
  onEventEmit: (event: AwaitEvent) => void | Promise<void>;
}

export class AwaitTracker {
  private readonly readModel: PipelineReadModel;
  private readonly onEventEmit: (event: AwaitEvent) => void | Promise<void>;

  constructor(options: AwaitTrackerOptions) {
    this.readModel = options.readModel;
    this.onEventEmit = options.onEventEmit;
  }

  async startAwaiting(correlationId: string, keys: string[]): Promise<void> {
    await this.emitEvent({
      type: 'AwaitStarted',
      data: { correlationId, keys },
    });
  }

  async isPending(correlationId: string): Promise<boolean> {
    const state = await this.readModel.getAwaitState(correlationId);
    return state !== null;
  }

  async getPendingKeys(correlationId: string): Promise<string[]> {
    const state = await this.readModel.getAwaitState(correlationId);
    return state ? state.pendingKeys : [];
  }

  async markComplete(correlationId: string, key: string, result: unknown): Promise<void> {
    await this.emitEvent({
      type: 'AwaitItemCompleted',
      data: { correlationId, key, result },
    });
  }

  async isComplete(correlationId: string): Promise<boolean> {
    const state = await this.readModel.getAwaitState(correlationId);
    return state !== null && state.pendingKeys.length === 0;
  }

  async getResults(correlationId: string): Promise<Record<string, unknown>> {
    const state = await this.readModel.getAwaitState(correlationId);
    if (state === null) {
      return {};
    }
    await this.emitEvent({
      type: 'AwaitCompleted',
      data: { correlationId },
    });
    return state.results;
  }

  private async emitEvent(event: AwaitEvent): Promise<void> {
    await this.onEventEmit(event);
  }
}
