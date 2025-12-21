interface AwaitState {
  pendingKeys: Set<string>;
  results: Map<string, unknown>;
}

export class AwaitTracker {
  private readonly state = new Map<string, AwaitState>();

  startAwaiting(correlationId: string, keys: string[]): void {
    this.state.set(correlationId, {
      pendingKeys: new Set(keys),
      results: new Map(),
    });
  }

  isPending(correlationId: string): boolean {
    return this.state.has(correlationId);
  }

  getPendingKeys(correlationId: string): string[] {
    const awaitState = this.state.get(correlationId);
    return awaitState ? Array.from(awaitState.pendingKeys) : [];
  }

  markComplete(correlationId: string, key: string, result: unknown): void {
    const awaitState = this.state.get(correlationId);
    if (awaitState) {
      awaitState.pendingKeys.delete(key);
      awaitState.results.set(key, result);
    }
  }

  isComplete(correlationId: string): boolean {
    const awaitState = this.state.get(correlationId);
    return awaitState ? awaitState.pendingKeys.size === 0 : false;
  }

  getResults(correlationId: string): Record<string, unknown> {
    const awaitState = this.state.get(correlationId);
    if (!awaitState) {
      return {};
    }
    const results: Record<string, unknown> = {};
    for (const [key, value] of awaitState.results) {
      results[key] = value;
    }
    this.state.delete(correlationId);
    return results;
  }
}
