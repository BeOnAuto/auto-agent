import { mkdtempSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ModelPersistence } from './persistence.js';

describe('ModelPersistence', () => {
  let tempDir: string;
  let modelPath: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'auto-agent-persistence-test-'));
    modelPath = join(tempDir, '.auto-agent', 'model.json');
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('flush writes model.json to disk', () => {
    const persistence = new ModelPersistence(modelPath);
    const model = { scenes: [{ id: 's1', name: 'Login' }] };

    persistence.update(model);
    persistence.flush();

    expect(existsSync(modelPath)).toBe(true);
    const written = JSON.parse(readFileSync(modelPath, 'utf-8'));
    expect(written).toEqual(model);
  });

  it('update debounces writes', () => {
    vi.useFakeTimers();
    try {
      const persistence = new ModelPersistence(modelPath, 1000);

      persistence.update({ version: 1 });
      persistence.update({ version: 2 });

      // File should not exist yet — debounce hasn't fired
      expect(existsSync(modelPath)).toBe(false);

      vi.advanceTimersByTime(1000);

      // Now the debounce fired — file should have the latest value
      expect(existsSync(modelPath)).toBe(true);
      const written = JSON.parse(readFileSync(modelPath, 'utf-8'));
      expect(written).toEqual({ version: 2 });
    } finally {
      vi.useRealTimers();
    }
  });

  it('flush is a no-op when no model is pending', () => {
    const persistence = new ModelPersistence(modelPath);
    persistence.flush();
    expect(existsSync(modelPath)).toBe(false);
  });

  it('flush skips mkdir when directory already exists', () => {
    const persistence = new ModelPersistence(modelPath);
    persistence.update({ first: true });
    persistence.flush();
    expect(existsSync(modelPath)).toBe(true);

    persistence.update({ second: true });
    persistence.flush();
    const written = JSON.parse(readFileSync(modelPath, 'utf-8'));
    expect(written).toEqual({ second: true });
  });

  it('destroy is safe when no timer is active', () => {
    const persistence = new ModelPersistence(modelPath);
    persistence.destroy();
    expect(existsSync(modelPath)).toBe(false);
  });

  it('destroy flushes pending model', () => {
    const persistence = new ModelPersistence(modelPath);
    const model = { narratives: ['happy-path'] };

    persistence.update(model);
    persistence.destroy();

    expect(existsSync(modelPath)).toBe(true);
    const written = JSON.parse(readFileSync(modelPath, 'utf-8'));
    expect(written).toEqual(model);
  });

  it('appendChange writes change as JSONL and readAndClearChanges returns and truncates', () => {
    const persistence = new ModelPersistence(modelPath);

    persistence.appendChange({ action: 'added', entityType: 'scene', id: 's1', name: 'Login' });
    persistence.appendChange({ action: 'updated', entityType: 'message', id: 'm1', name: 'CreateUser' });

    const changes = persistence.readAndClearChanges();
    expect(changes).toEqual([
      { action: 'added', entityType: 'scene', id: 's1', name: 'Login' },
      { action: 'updated', entityType: 'message', id: 'm1', name: 'CreateUser' },
    ]);

    expect(persistence.readAndClearChanges()).toEqual([]);
  });

  it('readAndClearChanges returns empty array when no changes file exists', () => {
    const persistence = new ModelPersistence(modelPath);
    expect(persistence.readAndClearChanges()).toEqual([]);
  });

  it('readModel returns parsed model from disk', () => {
    const persistence = new ModelPersistence(modelPath);
    const model = { scenes: [{ id: 's1' }] };
    persistence.update(model);
    persistence.flush();

    expect(persistence.readModel()).toEqual(model);
  });

  it('readModel returns null when no file exists', () => {
    const persistence = new ModelPersistence(modelPath);
    expect(persistence.readModel()).toEqual(null);
  });
});
