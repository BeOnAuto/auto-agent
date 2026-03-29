import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getConfigDir, getConfigPath, getModelPath, readConfig, setConfigDir, writeConfig } from './config.js';

describe('config', () => {
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

  it('readConfig returns null when no config file exists', () => {
    expect(readConfig()).toBeNull();
  });

  it('writeConfig creates .auto-agent/config.json and readConfig reads it back', () => {
    const config = {
      apiKey: 'test-key-123',
      serverUrl: 'https://example.com',
      workspaceId: 'ws-456',
    };
    writeConfig(config);
    expect(existsSync(join(tempDir, '.auto-agent', 'config.json'))).toBe(true);
    const result = readConfig();
    expect(result).toEqual(config);
  });

  it('getConfigDir returns the config directory', () => {
    expect(getConfigDir()).toBe(join(tempDir, '.auto-agent'));
  });

  it('getConfigPath returns path to config.json inside config dir', () => {
    expect(getConfigPath()).toBe(join(tempDir, '.auto-agent', 'config.json'));
  });

  it('getModelPath returns path to model.json inside config dir', () => {
    expect(getModelPath()).toBe(join(tempDir, '.auto-agent', 'model.json'));
  });

  it('setConfigDir changes the config directory', () => {
    const customDir = join(tempDir, 'custom-config');
    setConfigDir(customDir);
    expect(getConfigDir()).toBe(customDir);
    expect(getConfigPath()).toBe(join(customDir, 'config.json'));
  });

  it('readConfig falls back to legacy .auto-agent.json', () => {
    const config = {
      apiKey: 'legacy-key',
      serverUrl: 'https://legacy.com',
      workspaceId: 'ws-legacy',
    };
    writeFileSync(join(tempDir, '.auto-agent.json'), JSON.stringify(config, null, 2), 'utf-8');
    const result = readConfig();
    expect(result).toEqual(config);
  });

  it('readConfig prefers .auto-agent/config.json over legacy .auto-agent.json', () => {
    const legacyConfig = {
      apiKey: 'legacy-key',
      serverUrl: 'https://legacy.com',
      workspaceId: 'ws-legacy',
    };
    const newConfig = {
      apiKey: 'new-key',
      serverUrl: 'https://new.com',
      workspaceId: 'ws-new',
    };
    writeFileSync(join(tempDir, '.auto-agent.json'), JSON.stringify(legacyConfig, null, 2), 'utf-8');
    writeConfig(newConfig);
    const result = readConfig();
    expect(result).toEqual(newConfig);
  });

  it('writeConfig overwrites existing config when directory already exists', () => {
    const first = { apiKey: 'key-1', serverUrl: 'https://one.com', workspaceId: 'ws-1' };
    const second = { apiKey: 'key-2', serverUrl: 'https://two.com', workspaceId: 'ws-2' };
    writeConfig(first);
    writeConfig(second);
    expect(readConfig()).toEqual(second);
  });

  it('readConfig returns null when legacy config contains invalid JSON', () => {
    writeFileSync(join(tempDir, '.auto-agent.json'), 'not valid json', 'utf-8');
    expect(readConfig()).toBeNull();
  });

  it('writeConfig creates the directory if it does not exist', () => {
    const customDir = join(tempDir, 'deep', 'nested', 'config');
    setConfigDir(customDir);
    const config = {
      apiKey: 'test-key',
      serverUrl: 'https://example.com',
      workspaceId: 'ws-1',
    };
    writeConfig(config);
    expect(existsSync(join(customDir, 'config.json'))).toBe(true);
    const result = readConfig();
    expect(result).toEqual(config);
  });
});
