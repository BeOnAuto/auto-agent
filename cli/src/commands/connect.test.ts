import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setConfigDir } from '../config.js';
import { createProgram } from '../index.js';

let mockConnectFn: ReturnType<typeof vi.fn>;
let mockDisconnectFn: ReturnType<typeof vi.fn>;

vi.mock('../connection.js', () => ({
  ConnectionManager: class {
    connect = mockConnectFn;
    disconnect = mockDisconnectFn;
    isConnected = () => true;
  },
}));

vi.mock('../persistence.js', () => ({
  ModelPersistence: class {
    update = vi.fn();
    flush = vi.fn();
    destroy = vi.fn();
    appendChange = vi.fn();
    readAndClearChanges = vi.fn().mockReturnValue([]);
    readModel = vi.fn().mockReturnValue(null);
  },
}));

describe('connect command', () => {
  let originalCwd: string;
  let tempDir: string;
  let stderrOutput: string;
  const originalStderrWrite = process.stderr.write;

  beforeEach(() => {
    originalCwd = process.cwd();
    tempDir = mkdtempSync(join(tmpdir(), 'connect-test-'));
    process.chdir(tempDir);
    setConfigDir(join(tempDir, '.auto-agent'));
    stderrOutput = '';
    process.stderr.write = ((chunk: string) => { stderrOutput += chunk; return true; }) as typeof process.stderr.write;
    mockConnectFn = vi.fn().mockResolvedValue(undefined);
    mockDisconnectFn = vi.fn();
  });

  afterEach(() => {
    process.removeAllListeners('SIGINT');
    process.removeAllListeners('SIGTERM');
    process.chdir(originalCwd);
    rmSync(tempDir, { recursive: true, force: true });
    process.stderr.write = originalStderrWrite;
    process.exitCode = undefined;
  });

  function writeConfigFile() {
    const configDir = join(tempDir, '.auto-agent');
    mkdirSync(configDir, { recursive: true });
    writeFileSync(join(configDir, 'config.json'), JSON.stringify({
      apiKey: 'ak_ws1_secret',
      serverUrl: 'https://example.com',
      workspaceId: 'ws1',
    }));
  }

  it('is registered on the program', () => {
    const program = createProgram();
    const connectCmd = program.commands.find((cmd) => cmd.name() === 'connect');
    expect(connectCmd!.description()).toBe('Connect to the collaboration server and sync model in real-time');
  });

  it('errors when no config exists', async () => {
    const program = createProgram();
    await program.parseAsync(['node', 'auto-agent', 'connect']);
    expect(stderrOutput).toContain('No configuration found');
    expect(process.exitCode).toBe(1);
  });

  it('connects and writes status to stderr', async () => {
    writeConfigFile();
    const program = createProgram();
    await program.parseAsync(['node', 'auto-agent', 'connect']);
    expect(mockConnectFn).toHaveBeenCalled();
    expect(stderrOutput).toContain('Connecting to https://example.com');
    expect(stderrOutput).toContain('Connected.');
  });

  it('catches connection error and sets exit code', async () => {
    writeConfigFile();
    mockConnectFn.mockRejectedValue(new Error('WebSocket timeout'));
    const program = createProgram();
    await program.parseAsync(['node', 'auto-agent', 'connect']);
    expect(stderrOutput).toContain('Error: WebSocket timeout');
    expect(process.exitCode).toBe(1);
  });

  it('catches non-Error throw with fallback message', async () => {
    writeConfigFile();
    mockConnectFn.mockRejectedValue('string-error');
    const program = createProgram();
    await program.parseAsync(['node', 'auto-agent', 'connect']);
    expect(stderrOutput).toContain('Error: Connection failed');
    expect(process.exitCode).toBe(1);
  });

  it('SIGINT handler disconnects', async () => {
    writeConfigFile();
    const program = createProgram();
    await program.parseAsync(['node', 'auto-agent', 'connect']);
    const exitMock = vi.spyOn(process, 'exit').mockImplementation((() => {}) as never);
    process.emit('SIGINT');
    expect(mockDisconnectFn).toHaveBeenCalled();
    expect(exitMock).toHaveBeenCalledWith(0);
    exitMock.mockRestore();
  });

  it('SIGTERM handler disconnects', async () => {
    writeConfigFile();
    const program = createProgram();
    await program.parseAsync(['node', 'auto-agent', 'connect']);
    const exitMock = vi.spyOn(process, 'exit').mockImplementation((() => {}) as never);
    process.emit('SIGTERM');
    expect(mockDisconnectFn).toHaveBeenCalled();
    expect(exitMock).toHaveBeenCalledWith(0);
    exitMock.mockRestore();
  });
});
