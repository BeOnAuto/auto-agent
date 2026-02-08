export interface TimeoutManager {
  start(jobId: string, timeoutMs: number): void;
  clear(jobId: string): void;
  clearAll(): void;
}

export function createTimeoutManager(onTimeout: (jobId: string) => void): TimeoutManager {
  const timers = new Map<string, ReturnType<typeof setTimeout>>();

  return {
    start(jobId: string, timeoutMs: number) {
      timers.set(
        jobId,
        setTimeout(() => {
          timers.delete(jobId);
          onTimeout(jobId);
        }, timeoutMs),
      );
    },
    clear(jobId: string) {
      const timer = timers.get(jobId);
      if (timer !== undefined) {
        clearTimeout(timer);
        timers.delete(jobId);
      }
    },
    clearAll() {
      for (const timer of timers.values()) {
        clearTimeout(timer);
      }
      timers.clear();
    },
  };
}
