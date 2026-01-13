import { describe, expect, it } from 'vitest';
import { fromWirePath, toWirePath } from './path.js';

describe('toWirePath', () => {
  it('converts absolute path to wire path relative to root', () => {
    const abs = '/app/narratives/file.ts';
    const root = '/app';

    const wire = toWirePath(abs, root);

    expect(wire).toBe('/narratives/file.ts');
  });
});

describe('fromWirePath', () => {
  it('converts wire path back to absolute path using root', () => {
    const wire = '/narratives/file.ts';
    const root = '/app';

    const abs = fromWirePath(wire, root);

    expect(abs).toBe('/app/narratives/file.ts');
  });
});

describe('wire path roundtrip', () => {
  it('roundtrips correctly when root equals watchDir', () => {
    const original = '/app/narratives/file.ts';
    const root = '/app';

    const wire = toWirePath(original, root);
    const resolved = fromWirePath(wire, root);

    expect(resolved).toBe(original);
  });
});
