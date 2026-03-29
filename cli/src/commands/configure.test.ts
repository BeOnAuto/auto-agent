import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Command } from 'commander';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { setConfigDir } from '../config.js';
import { registerConfigureCommand } from './configure.js';

describe('configure command', () => {
  let originalCwd: string;
  let tempDir: string;

  beforeEach(() => {
    originalCwd = process.cwd();
    tempDir = mkdtempSync(join(tmpdir(), 'auto-agent-test-'));
    process.chdir(tempDir);
    setConfigDir(join(tempDir, '.auto-agent'));
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('configure writes config with valid key', async () => {
    const program = new Command();
    program.exitOverride();
    registerConfigureCommand(program);

    await program.parseAsync([
      'node',
      'test',
      'configure',
      '--key',
      'ak_workspace123_abcdef1234567890abcdef1234567890',
    ]);

    const configPath = join(tempDir, '.auto-agent', 'config.json');
    const written = JSON.parse(readFileSync(configPath, 'utf-8'));
    expect(written).toEqual({
      apiKey: 'ak_workspace123_abcdef1234567890abcdef1234567890',
      serverUrl: 'https://collaboration-server.on-auto.workers.dev',
      workspaceId: 'workspace123',
    });
  });

  it('configure rejects invalid key format', async () => {
    const program = new Command();
    program.exitOverride();
    registerConfigureCommand(program);

    await expect(program.parseAsync(['node', 'test', 'configure', '--key', 'bad-key-no-prefix'])).rejects.toThrow();
  });
});
