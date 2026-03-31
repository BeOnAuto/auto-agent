import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { rmSync } from 'node:fs';
import { createLogger } from './logger.js';

const FIXED_DATE = new Date('2026-01-15T10:30:00.000Z');
const FIXED_NOW = () => FIXED_DATE;
const TS = '2026-01-15T10:30:00.000Z';

describe('createLogger', () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'logger-test-'));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('writes info log line with timestamp, level, and tag', () => {
    const logger = createLogger(join(dir, 'test.log'), FIXED_NOW);

    logger.info('server', 'started');

    const content = readFileSync(join(dir, 'test.log'), 'utf-8');
    expect(content).toEqual(`${TS} [INFO] [server] started\n`);
  });

  it('writes error level log line', () => {
    const logger = createLogger(join(dir, 'test.log'), FIXED_NOW);

    logger.error('connection', 'failed to connect');

    const content = readFileSync(join(dir, 'test.log'), 'utf-8');
    expect(content).toEqual(`${TS} [ERROR] [connection] failed to connect\n`);
  });

  it('writes warn level log line', () => {
    const logger = createLogger(join(dir, 'test.log'), FIXED_NOW);

    logger.warn('daemon', 'reconnecting');

    const content = readFileSync(join(dir, 'test.log'), 'utf-8');
    expect(content).toEqual(`${TS} [WARN] [daemon] reconnecting\n`);
  });

  it('appends to file that already has content', () => {
    const logPath = join(dir, 'test.log');
    writeFileSync(logPath, 'existing line\n', 'utf-8');
    const logger = createLogger(logPath, FIXED_NOW);

    logger.info('b', 'second');

    const content = readFileSync(logPath, 'utf-8');
    expect(content).toEqual(`existing line\n${TS} [INFO] [b] second\n`);
  });

  it('creates parent directories when they do not exist', () => {
    const nested = join(dir, 'sub', 'deep', 'test.log');
    const logger = createLogger(nested, FIXED_NOW);

    logger.info('test', 'hello');

    const content = readFileSync(nested, 'utf-8');
    expect(content).toEqual(`${TS} [INFO] [test] hello\n`);
  });

  it('formats Error extra with message and stack in single entry', () => {
    const logger = createLogger(join(dir, 'test.log'), FIXED_NOW);
    const err = new Error('boom');
    err.stack = 'Error: boom\n    at Test.fn (test.ts:1:1)';

    logger.error('mcp', 'tool failed', err);

    const content = readFileSync(join(dir, 'test.log'), 'utf-8');
    expect(content).toEqual(`${TS} [ERROR] [mcp] tool failed: boom\nError: boom\n    at Test.fn (test.ts:1:1)\n`);
  });

  it('formats non-Error extra as inline JSON', () => {
    const logger = createLogger(join(dir, 'test.log'), FIXED_NOW);

    logger.info('tools', 'called', { key: 'ak_123_abc' });

    const content = readFileSync(join(dir, 'test.log'), 'utf-8');
    expect(content).toEqual(`${TS} [INFO] [tools] called {"key":"ak_123_abc"}\n`);
  });
});
