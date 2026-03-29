import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setConfigDir } from '../config.js';
import { createProgram } from '../index.js';

// ---------- mocks ----------

let mockConnectFn: ReturnType<typeof vi.fn>;
let mockDisconnectFn: ReturnType<typeof vi.fn>;
let mockGetModelFn: ReturnType<typeof vi.fn>;
let capturedOptions: Record<string, unknown>;
let capturedEventHandlers: Record<string, (...args: unknown[]) => void>;

vi.mock('../connection.js', () => {
  return {
    ConnectionManager: class FakeConnectionManager {
      constructor(options: Record<string, unknown>) {
        capturedOptions = options;
      }
      connect = mockConnectFn;
      disconnect = mockDisconnectFn;
      getModel = mockGetModelFn;
      on(event: string, handler: (...args: unknown[]) => void) {
        capturedEventHandlers[event] = handler;
        return this;
      }
    },
  };
});

let mockPersistenceUpdateFn: ReturnType<typeof vi.fn>;
let mockPersistenceDestroyFn: ReturnType<typeof vi.fn>;
let capturedModelPath: string;

vi.mock('../persistence.js', () => {
  return {
    ModelPersistence: class FakeModelPersistence {
      constructor(modelPath: string) {
        capturedModelPath = modelPath;
      }
      update = mockPersistenceUpdateFn;
      destroy = mockPersistenceDestroyFn;
    },
  };
});

// ---------- helpers ----------

describe('connect command', () => {
  let originalCwd: string;
  let tempDir: string;
  let stderrOutput: string;
  const originalStderrWrite = process.stderr.write;

  beforeEach(() => {
    originalCwd = process.cwd();
    tempDir = mkdtempSync(join(tmpdir(), 'auto-agent-connect-test-'));
    process.chdir(tempDir);
    setConfigDir(join(tempDir, '.auto-agent'));

    stderrOutput = '';
    process.stderr.write = ((chunk: string) => {
      stderrOutput += chunk;
      return true;
    }) as typeof process.stderr.write;

    mockConnectFn = vi.fn().mockResolvedValue(undefined);
    mockDisconnectFn = vi.fn();
    mockGetModelFn = vi.fn().mockReturnValue({ entities: [] });
    mockPersistenceUpdateFn = vi.fn();
    mockPersistenceDestroyFn = vi.fn();
    capturedOptions = {};
    capturedEventHandlers = {};
    capturedModelPath = '';
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
    writeFileSync(
      join(configDir, 'config.json'),
      JSON.stringify({
        apiKey: 'ak_ws1_secret',
        serverUrl: 'https://example.com',
        workspaceId: 'ws1',
      }),
    );
  }

  // ---------- registration ----------

  it('is registered on the program with the correct description', () => {
    const program = createProgram();
    const connectCmd = program.commands.find((cmd) => cmd.name() === 'connect');
    expect(connectCmd!.description()).toBe('Connect to the collaboration server and sync model in real-time');
  });

  it('has --dir option defaulting to .auto-agent', () => {
    const program = createProgram();
    const connectCmd = program.commands.find((cmd) => cmd.name() === 'connect')!;
    const dirOption = connectCmd.options.find((opt) => opt.long === '--dir');
    expect(dirOption!.defaultValue).toBe('.auto-agent');
  });

  // ---------- no config ----------

  it('errors when no config exists', async () => {
    const program = createProgram();
    await program.parseAsync(['node', 'auto-agent', 'connect']);
    expect(stderrOutput).toContain('No configuration found');
    expect(process.exitCode).toBe(1);
  });

  // ---------- successful connect ----------

  it('connects with correct options and writes status to stderr', async () => {
    writeConfigFile();
    const program = createProgram();
    await program.parseAsync(['node', 'auto-agent', 'connect']);

    expect(capturedOptions).toEqual(expect.objectContaining({
      serverUrl: 'https://example.com',
      apiKey: 'ak_ws1_secret',
      workspaceId: 'ws1',
    }));
    expect(mockConnectFn).toHaveBeenCalled();
    expect(stderrOutput).toContain('Connecting to https://example.com for workspace ws1...');
    expect(stderrOutput).toContain('Model will be written to');
  });

  it('uses default --dir to build modelPath', async () => {
    writeConfigFile();
    const program = createProgram();
    await program.parseAsync(['node', 'auto-agent', 'connect']);
    expect(capturedModelPath).toBe(join('.auto-agent', 'model.json'));
  });

  it('uses custom --dir when provided', async () => {
    writeConfigFile();
    const program = createProgram();
    await program.parseAsync(['node', 'auto-agent', 'connect', '--dir', 'custom-dir']);
    expect(capturedModelPath).toBe(join('custom-dir', 'model.json'));
  });

  // ---------- onModel callback ----------

  it('onModel callback calls persistence.update', async () => {
    writeConfigFile();
    const program = createProgram();
    await program.parseAsync(['node', 'auto-agent', 'connect']);

    const onModel = capturedOptions.onModel as (model: unknown) => void;
    const fakeModel = { entities: [{ name: 'Foo' }] };
    onModel(fakeModel);
    expect(mockPersistenceUpdateFn).toHaveBeenCalledWith(fakeModel);
  });

  // ---------- onChange callback ----------

  it('onChange callback writes change to stderr', async () => {
    writeConfigFile();
    const program = createProgram();
    await program.parseAsync(['node', 'auto-agent', 'connect']);

    const onChange = capturedOptions.onChange as (change: { action: string; entityType: string; name: string }) => void;
    onChange({ action: 'added', entityType: 'scene', name: 'Login' });
    expect(stderrOutput).toContain('[added] scene: Login');
  });

  // ---------- connected event ----------

  it('connected event handler writes to stderr and persists model', async () => {
    writeConfigFile();
    const fakeModel = { entities: [{ name: 'Bar' }] };
    mockGetModelFn.mockReturnValue(fakeModel);

    const program = createProgram();
    await program.parseAsync(['node', 'auto-agent', 'connect']);

    capturedEventHandlers.connected();
    expect(stderrOutput).toContain('Connected to collaboration server.');
    expect(mockGetModelFn).toHaveBeenCalled();
    expect(mockPersistenceUpdateFn).toHaveBeenCalledWith(fakeModel);
  });

  // ---------- disconnected event ----------

  it('disconnected event handler writes to stderr', async () => {
    writeConfigFile();
    const program = createProgram();
    await program.parseAsync(['node', 'auto-agent', 'connect']);

    capturedEventHandlers.disconnected();
    expect(stderrOutput).toContain('Disconnected from collaboration server. Reconnecting...');
  });

  // ---------- SIGINT handler ----------

  it('SIGINT handler disconnects manager and destroys persistence', async () => {
    writeConfigFile();
    const program = createProgram();
    await program.parseAsync(['node', 'auto-agent', 'connect']);

    const exitMock = vi.spyOn(process, 'exit').mockImplementation((() => {}) as never);
    try {
      process.emit('SIGINT');
      expect(mockDisconnectFn).toHaveBeenCalled();
      expect(mockPersistenceDestroyFn).toHaveBeenCalled();
      expect(exitMock).toHaveBeenCalledWith(0);
    } finally {
      exitMock.mockRestore();
    }
  });

  // ---------- SIGTERM handler ----------

  it('SIGTERM handler disconnects manager and destroys persistence', async () => {
    writeConfigFile();
    const program = createProgram();
    await program.parseAsync(['node', 'auto-agent', 'connect']);

    const exitMock = vi.spyOn(process, 'exit').mockImplementation((() => {}) as never);
    try {
      process.emit('SIGTERM');
      expect(mockDisconnectFn).toHaveBeenCalled();
      expect(mockPersistenceDestroyFn).toHaveBeenCalled();
      expect(exitMock).toHaveBeenCalledWith(0);
    } finally {
      exitMock.mockRestore();
    }
  });

  // ---------- connection error (Error instance) ----------

  it('catches connection Error and writes message to stderr', async () => {
    writeConfigFile();
    mockConnectFn.mockRejectedValue(new Error('WebSocket timeout'));

    const program = createProgram();
    await program.parseAsync(['node', 'auto-agent', 'connect']);

    expect(stderrOutput).toContain('Error: WebSocket timeout');
    expect(mockPersistenceDestroyFn).toHaveBeenCalled();
    expect(process.exitCode).toBe(1);
  });

  // ---------- connection error (non-Error) ----------

  it('catches non-Error throw and writes generic message to stderr', async () => {
    writeConfigFile();
    mockConnectFn.mockRejectedValue('something unexpected');

    const program = createProgram();
    await program.parseAsync(['node', 'auto-agent', 'connect']);

    expect(stderrOutput).toContain('Error: Connection failed');
    expect(mockPersistenceDestroyFn).toHaveBeenCalled();
    expect(process.exitCode).toBe(1);
  });
});
