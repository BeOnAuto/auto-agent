import { appendFileSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import type { ModelChange } from './connection.js';

export class ModelPersistence {
  private debounceTimer: ReturnType<typeof setTimeout> | undefined = undefined;
  private pendingModel: unknown = null;
  private changesPath: string;

  constructor(private modelPath: string, private debounceMs = 1000) {
    this.changesPath = modelPath.replace(/model\.json$/, 'changes.json');
  }

  update(model: unknown): void {
    this.pendingModel = model;
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => this.flush(), this.debounceMs);
  }

  appendChange(change: ModelChange): void {
    const dir = dirname(this.changesPath);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    appendFileSync(this.changesPath, JSON.stringify(change) + '\n', 'utf-8');
  }

  readAndClearChanges(): ModelChange[] {
    if (!existsSync(this.changesPath)) return [];
    const raw = readFileSync(this.changesPath, 'utf-8').trim();
    if (!raw) return [];
    writeFileSync(this.changesPath, '', 'utf-8');
    return raw.split('\n').map((line) => JSON.parse(line) as ModelChange);
  }

  readModel(): unknown | null {
    if (!existsSync(this.modelPath)) return null;
    const raw = readFileSync(this.modelPath, 'utf-8');
    return JSON.parse(raw);
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
