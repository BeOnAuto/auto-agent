import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Command } from 'commander';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setConfigDir } from '../config.js';
import { registerGetModelCommand } from './get-model.js';

describe('get-model command', () => {
  let originalCwd: string;
  let tempDir: string;
  let stdoutSpy: ReturnType<typeof vi.spyOn>;
  let stderrSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    originalCwd = process.cwd();
    tempDir = mkdtempSync(join(tmpdir(), 'auto-agent-test-'));
    process.chdir(tempDir);
    setConfigDir(join(tempDir, '.auto-agent'));
    stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(tempDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it('get-model outputs model JSON to stdout when config exists', async () => {
    const fakeModel = { entities: [{ name: 'User' }], relations: [] };

    const configDir = join(tempDir, '.auto-agent');
    mkdirSync(configDir, { recursive: true });
    writeFileSync(
      join(configDir, 'config.json'),
      JSON.stringify({
        apiKey: 'ak_ws1_secret',
        serverUrl: 'https://fake.server',
        workspaceId: 'ws1',
      }),
    );

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ model: fakeModel }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const program = new Command();
    program.exitOverride();
    registerGetModelCommand(program);

    await program.parseAsync(['node', 'test', 'get-model']);

    expect(fetchSpy).toHaveBeenCalledOnce();
    expect(fetchSpy.mock.calls[0][0]).toBe('https://fake.server/api/agent/model/ws1');

    const output = stdoutSpy.mock.calls.map((c) => c[0]).join('');
    const parsed = JSON.parse(output);
    expect(parsed).toEqual(fakeModel);
  });

  it('get-model exits with error when no config', async () => {
    const program = new Command();
    program.exitOverride();
    registerGetModelCommand(program);

    await program.parseAsync(['node', 'test', 'get-model']);

    const errOutput = stderrSpy.mock.calls.map((c) => c[0]).join('');
    expect(errOutput).toContain('No configuration found');
    expect(process.exitCode).toBe(1);

    // Reset exitCode so it doesn't affect test runner
    process.exitCode = undefined;
  });
});
