import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

export interface GeneratedFile {
  path: string;
  content: string;
}

export interface WriteResult {
  filesWritten: string[];
}

export async function writeGeneratedFile(file: GeneratedFile, outputDir: string): Promise<string> {
  const fullPath = join(outputDir, 'src', file.path);
  await mkdir(dirname(fullPath), { recursive: true });
  await writeFile(fullPath, file.content);
  return fullPath;
}

export async function writeApp(app: { files: GeneratedFile[] }, outputDir: string): Promise<WriteResult> {
  const filesWritten: string[] = [];
  for (const file of app.files) {
    const written = await writeGeneratedFile(file, outputDir);
    filesWritten.push(written);
  }
  return { filesWritten };
}
