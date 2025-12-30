import { existsSync } from 'fs';
import { mkdir } from 'fs/promises';
import path from 'path';

export function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/\s+/g, '-')
    .toLowerCase();
}

export function ensureDirPath(...segments: string[]): string {
  return path.join(...segments);
}

export async function ensureDirExists(dirPath: string): Promise<void> {
  if (!existsSync(dirPath)) {
    await mkdir(dirPath, { recursive: true });
  }
}
