import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

function toKebabCase(name: string): string {
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();
}

export async function writeComponent(name: string, code: string, outputDir: string): Promise<string> {
  await mkdir(outputDir, { recursive: true });
  const fileName = `${toKebabCase(name)}.tsx`;
  const fullPath = join(outputDir, fileName);
  await writeFile(fullPath, code);
  return fullPath;
}

export async function writeStory(name: string, code: string, outputDir: string): Promise<string> {
  await mkdir(outputDir, { recursive: true });
  const fileName = `${toKebabCase(name)}.stories.tsx`;
  const fullPath = join(outputDir, fileName);
  await writeFile(fullPath, code);
  return fullPath;
}
