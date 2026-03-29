import { describe, expect, it } from 'vitest';
import { createProgram } from './index.js';

describe('createProgram', () => {
  it('returns a Commander program named auto-agent', () => {
    const program = createProgram();
    expect(program.name()).toBe('auto-agent');
  });

  it('has a version set', () => {
    const program = createProgram();
    expect(program.version()).toBe('0.1.0');
  });
});
