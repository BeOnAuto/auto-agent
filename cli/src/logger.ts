import { appendFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

export interface Logger {
  info(tag: string, message: string, extra?: unknown): void;
  warn(tag: string, message: string, extra?: unknown): void;
  error(tag: string, message: string, extra?: unknown): void;
}

function formatExtra(extra: unknown): string {
  if (extra instanceof Error) {
    return `: ${extra.message}\n${extra.stack}`;
  }
  return ` ${JSON.stringify(extra)}`;
}

export function createLogger(logPath: string, now: () => Date = () => new Date()): Logger {
  function write(level: string, tag: string, message: string, extra?: unknown): void {
    const dir = dirname(logPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    const timestamp = now().toISOString();
    const suffix = extra !== undefined ? formatExtra(extra) : '';
    const line = `${timestamp} [${level}] [${tag}] ${message}${suffix}\n`;
    appendFileSync(logPath, line, 'utf-8');
  }

  return {
    info: (tag, message, extra?) => write('INFO', tag, message, extra),
    warn: (tag, message, extra?) => write('WARN', tag, message, extra),
    error: (tag, message, extra?) => write('ERROR', tag, message, extra),
  };
}
