export interface RetryConfig {
  maxRetries: number;
  backoffMs: number;
  maxBackoffMs: number;
}

export interface RetryManager {
  recordFailure(jobId: string, config: RetryConfig): boolean;
}

export function createRetryManager(onRetry: (jobId: string, attempt: number) => void): RetryManager {
  const attempts = new Map<string, number>();

  return {
    recordFailure(jobId: string, config: RetryConfig): boolean {
      const current = attempts.get(jobId) ?? 0;
      const next = current + 1;

      if (next > config.maxRetries) {
        return true;
      }

      attempts.set(jobId, next);
      const delay = Math.min(config.backoffMs * 2 ** (next - 1), config.maxBackoffMs);
      setTimeout(() => onRetry(jobId, next), delay);
      return false;
    },
  };
}
