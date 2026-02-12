import { execSync } from 'node:child_process';

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

export function checkTypes(filePaths: string[]): TypeCheckResult {
  let stdout = '';
  let stderr = '';

  try {
    stdout = execSync('npx tsc --noEmit --pretty false', { encoding: 'utf-8' });
  } catch (error: unknown) {
    const output = getExecOutput(error);
    stdout = output.stdout;
    stderr = output.stderr;
  }

  const combined = [stdout, stderr].join('\n');
  const lines = combined.split('\n');

  const errors = lines.filter((line) => filePaths.some((filePath) => line.includes(filePath)));

  if (errors.length === 0) {
    return { passed: true, errors: [] };
  }

  return { passed: false, errors };
}
