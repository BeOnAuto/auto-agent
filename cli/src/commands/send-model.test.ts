import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { setConfigDir } from '../config.js';
import { createProgram } from '../index.js';

describe('send-model command', () => {
  let originalCwd: string;
  let tempDir: string;
  const originalFetch = globalThis.fetch;
  let stderrOutput: string;
  let stdoutOutput: string;
  const originalStderrWrite = process.stderr.write;
  const originalStdoutWrite = process.stdout.write;

  beforeEach(() => {
    originalCwd = process.cwd();
    tempDir = mkdtempSync(join(tmpdir(), 'auto-agent-test-'));
    process.chdir(tempDir);
    setConfigDir(join(tempDir, '.auto-agent'));

    stderrOutput = '';
    stdoutOutput = '';
    process.stderr.write = ((chunk: string) => {
      stderrOutput += chunk;
      return true;
    }) as typeof process.stderr.write;
    process.stdout.write = ((chunk: string) => {
      stdoutOutput += chunk;
      return true;
    }) as typeof process.stdout.write;
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(tempDir, { recursive: true, force: true });
    globalThis.fetch = originalFetch;
    process.stderr.write = originalStderrWrite;
    process.stdout.write = originalStdoutWrite;
    process.exitCode = undefined;
  });

  function writeConfigFile() {
    const configDir = join(tempDir, '.auto-agent');
    mkdirSync(configDir, { recursive: true });
    writeFileSync(
      join(configDir, 'config.json'),
      JSON.stringify({
        apiKey: 'ak_ws1_secret',
        serverUrl: 'https://example.com',
        workspaceId: 'ws1',
      }),
    );
  }

  function stubFetch(responseBody: unknown) {
    globalThis.fetch = async () =>
      new Response(JSON.stringify(responseBody), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
  }

  it('send-model reads file and outputs corrected model', async () => {
    writeConfigFile();
    const modelFile = join(tempDir, 'model.json');
    writeFileSync(modelFile, JSON.stringify({ entities: [{ name: 'user' }] }));

    const correctedModel = { entities: [{ name: 'User' }] };
    stubFetch({ model: correctedModel, corrections: [], correctionCount: 0 });

    const program = createProgram();
    await program.parseAsync(['node', 'auto-agent', 'send-model', modelFile]);

    expect(stdoutOutput).toBe(JSON.stringify(correctedModel, null, 2) + '\n');
  });

  it('send-model errors when no config exists', async () => {
    const program = createProgram();
    await program.parseAsync(['node', 'auto-agent', 'send-model', 'model.json']);
    expect(stderrOutput).toContain('No configuration found');
    expect(process.exitCode).toBe(1);
  });

  it('send-model errors when file does not exist', async () => {
    writeConfigFile();
    const program = createProgram();
    await program.parseAsync(['node', 'auto-agent', 'send-model', '/tmp/nonexistent-file.json']);
    expect(stderrOutput).toContain('Could not read file');
    expect(process.exitCode).toBe(1);
  });

  it('send-model errors when file contains invalid JSON', async () => {
    writeConfigFile();
    const modelFile = join(tempDir, 'bad.json');
    writeFileSync(modelFile, 'not valid json');
    const program = createProgram();
    await program.parseAsync(['node', 'auto-agent', 'send-model', modelFile]);
    expect(stderrOutput).toContain('invalid JSON');
    expect(process.exitCode).toBe(1);
  });

  it('send-model shows corrections on stderr', async () => {
    writeConfigFile();
    const modelFile = join(tempDir, 'model.json');
    writeFileSync(modelFile, JSON.stringify({ entities: [{ name: 'user' }] }));

    stubFetch({
      model: { entities: [{ name: 'User' }] },
      corrections: ['Renamed entity from "user" to "User"'],
      correctionCount: 1,
    });

    const program = createProgram();
    await program.parseAsync(['node', 'auto-agent', 'send-model', modelFile]);

    expect(stderrOutput).toContain('Corrections applied (1):');
    expect(stderrOutput).toContain('Renamed entity from "user" to "User"');
  });
});
