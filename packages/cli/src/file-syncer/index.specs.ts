import * as path from 'node:path';
import { describe, expect, it } from 'vitest';
import { fromWirePath, toWirePath } from './utils/path.js';

describe('wire path roundtrip with watchDir as root', () => {
  it('roundtrips file paths correctly when using watchDir as base', () => {
    const watchDir = '/app';
    const fileInWatchDir = '/app/narratives/file.ts';

    // Use watchDir directly as the root for wire paths
    const wire = toWirePath(fileInWatchDir, watchDir);
    const resolved = fromWirePath(wire, watchDir);

    // Wire path should be relative to watchDir
    expect(wire).toBe('/narratives/file.ts');
    // Roundtrip should return original path
    expect(resolved).toBe(fileInWatchDir);

    // Security check should pass
    const allowedRoot = path.resolve(watchDir) + path.sep;
    const normalizedAbs = path.resolve(resolved);
    expect(normalizedAbs.startsWith(allowedRoot)).toBe(true);
  });

  it('passes security check for client file changes', () => {
    const watchDir = '/app';

    // Browser sends path relative to watchDir
    const clientPath = '/narratives/file.ts';
    const resolved = fromWirePath(clientPath, watchDir);

    // Should resolve to path within watchDir
    expect(resolved).toBe('/app/narratives/file.ts');

    // Security check should pass
    const allowedRoot = path.resolve(watchDir) + path.sep;
    const normalizedAbs = path.resolve(resolved);
    expect(normalizedAbs.startsWith(allowedRoot)).toBe(true);
  });
});
