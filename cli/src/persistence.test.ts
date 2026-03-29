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

  it('destroy flushes pending model', () => {
    const persistence = new ModelPersistence(modelPath);
    const model = { narratives: ['happy-path'] };

    persistence.update(model);
    // destroy immediately without waiting for debounce
    persistence.destroy();

    expect(existsSync(modelPath)).toBe(true);
    const written = JSON.parse(readFileSync(modelPath, 'utf-8'));
    expect(written).toEqual(model);
  });
});
