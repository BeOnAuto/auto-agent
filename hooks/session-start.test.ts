import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const hooksDir = dirname(fileURLToPath(import.meta.url));
const scriptPath = join(hooksDir, 'session-start.js');

describe('session-start hook', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'session-start-'));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('outputs connected message when config exists', () => {
    const configDir = join(tmpDir, '.auto-agent');
    mkdirSync(configDir, { recursive: true });
    writeFileSync(
      join(configDir, 'config.json'),
      JSON.stringify({ apiKey: 'ak_ws1_secret', serverUrl: 'https://example.com', workspaceId: 'ws1' }),
    );

    const result = execFileSync('node', [scriptPath], { cwd: tmpDir, encoding: 'utf-8' });

    expect(JSON.parse(result)).toEqual({
      message: 'Auto Agent: Connected to workspace ws1. Use auto_get_model to fetch the current model.',
    });
  });

  it('outputs empty message when no config exists', () => {
    const result = execFileSync('node', [scriptPath], { cwd: tmpDir, encoding: 'utf-8' });

    expect(JSON.parse(result)).toEqual({ message: '' });
  });
});
