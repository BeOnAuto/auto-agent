import { execSync } from 'node:child_process';
import path from 'node:path';

export interface TypeCheckResult {
  passed: boolean;
  errors: string[];
}

function getExecOutput(error: unknown): { stdout: string; stderr: string } {
  if (typeof error !== 'object' || error === null) {
    return { stdout: '', stderr: '' };
  }
  const stdout = 'stdout' in error && typeof error.stdout === 'string' ? error.stdout : '';
  const stderr = 'stderr' in error && typeof error.stderr === 'string' ? error.stderr : '';
  return { stdout, stderr };
}

export function checkTypes(filePaths: string[], cwd: string): TypeCheckResult {
  let stdout = '';
  let stderr = '';

  try {
    stdout = execSync('pnpm type-check', { encoding: 'utf-8', cwd });
  } catch (error: unknown) {
    const output = getExecOutput(error);
    stdout = output.stdout;
    stderr = output.stderr;
  }

  const combined = [stdout, stderr].join('\n');
  const lines = combined.split('\n');

  // tsc outputs relative paths (e.g. "src/components/ui/logo-text.tsx(3,1): error TS...")
  // Convert absolute filePaths to relative (from cwd) for matching
  const relativePaths = filePaths.map((fp) => path.relative(cwd, fp));

  const errors = lines.filter((line) => relativePaths.some((rp) => line.includes(rp)));

  console.log('Relative paths checked for type errors:', relativePaths);
  console.log('Type check output lines:', lines);
  console.log('Filtered type errors:', errors);

  if (errors.length === 0) {
    return { passed: true, errors: [] };
  }

  return { passed: false, errors };
}
