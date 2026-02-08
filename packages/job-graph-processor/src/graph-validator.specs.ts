import { describe, expect, it } from 'vitest';
import type { Job } from './graph-validator';
import { validateGraph } from './graph-validator';

describe('validateGraph', () => {
  it('returns valid for a correct graph with no dependencies', () => {
    const jobs: Job[] = [
      { id: 'a', dependsOn: [], target: 'build', payload: {} },
      { id: 'b', dependsOn: [], target: 'test', payload: {} },
    ];

    expect(validateGraph(jobs)).toEqual({ valid: true });
  });

  it('returns valid for a correct graph with dependencies', () => {
    const jobs: Job[] = [
      { id: 'a', dependsOn: [], target: 'build', payload: {} },
      { id: 'b', dependsOn: ['a'], target: 'test', payload: {} },
    ];

    expect(validateGraph(jobs)).toEqual({ valid: true });
  });

  it('returns error for duplicate job IDs', () => {
    const jobs: Job[] = [
      { id: 'a', dependsOn: [], target: 'build', payload: {} },
      { id: 'a', dependsOn: [], target: 'test', payload: {} },
    ];

    expect(validateGraph(jobs)).toEqual({
      valid: false,
      error: "Duplicate job ID: 'a'",
    });
  });

  it('returns error for missing dependency', () => {
    const jobs: Job[] = [{ id: 'a', dependsOn: ['missing'], target: 'build', payload: {} }];

    expect(validateGraph(jobs)).toEqual({
      valid: false,
      error: "Job 'a' depends on unknown job 'missing'",
    });
  });

  it('returns error for self-reference', () => {
    const jobs: Job[] = [{ id: 'a', dependsOn: ['a'], target: 'build', payload: {} }];

    expect(validateGraph(jobs)).toEqual({
      valid: false,
      error: "Job 'a' depends on itself",
    });
  });

  it('returns error for cycle', () => {
    const jobs: Job[] = [
      { id: 'a', dependsOn: ['b'], target: 'build', payload: {} },
      { id: 'b', dependsOn: ['a'], target: 'test', payload: {} },
    ];

    expect(validateGraph(jobs)).toEqual({
      valid: false,
      error: "Cycle detected involving job 'a'",
    });
  });

  it('returns error for transitive cycle', () => {
    const jobs: Job[] = [
      { id: 'a', dependsOn: ['c'], target: 'build', payload: {} },
      { id: 'b', dependsOn: ['a'], target: 'test', payload: {} },
      { id: 'c', dependsOn: ['b'], target: 'lint', payload: {} },
    ];

    expect(validateGraph(jobs)).toEqual({
      valid: false,
      error: "Cycle detected involving job 'a'",
    });
  });

  it('returns error for empty target', () => {
    const jobs: Job[] = [{ id: 'a', dependsOn: [], target: '', payload: {} }];

    expect(validateGraph(jobs)).toEqual({
      valid: false,
      error: "Job 'a' has empty target",
    });
  });

  it('returns valid for diamond dependency graph', () => {
    const jobs: Job[] = [
      { id: 'a', dependsOn: [], target: 'build', payload: {} },
      { id: 'b', dependsOn: ['a'], target: 'test', payload: {} },
      { id: 'c', dependsOn: ['a'], target: 'lint', payload: {} },
      { id: 'd', dependsOn: ['b', 'c'], target: 'deploy', payload: {} },
    ];

    expect(validateGraph(jobs)).toEqual({ valid: true });
  });

  it('returns error for empty jobs array', () => {
    expect(validateGraph([])).toEqual({
      valid: false,
      error: 'Graph must contain at least one job',
    });
  });
});
