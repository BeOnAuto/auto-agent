import { writeFileSync, mkdirSync, existsSync, renameSync } from 'node:fs';
import { dirname } from 'node:path';

export class ModelPersistence {
  private debounceTimer: ReturnType<typeof setTimeout> | undefined = undefined;
  private pendingModel: unknown = null;

  constructor(private modelPath: string, private debounceMs = 1000) {}

  update(model: unknown): void {
    this.pendingModel = model;
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => this.flush(), this.debounceMs);
  }

  flush(): void {
    if (this.pendingModel === null) return;
    const dir = dirname(this.modelPath);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    const tmpPath = this.modelPath + '.tmp';
    writeFileSync(tmpPath, JSON.stringify(this.pendingModel, null, 2) + '\n', 'utf-8');
    renameSync(tmpPath, this.modelPath);
    this.pendingModel = null;
    clearTimeout(this.debounceTimer);
    this.debounceTimer = undefined;
  }

  destroy(): void {
    clearTimeout(this.debounceTimer);
    this.flush();
  }
}
