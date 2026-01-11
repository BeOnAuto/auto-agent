import crypto from 'node:crypto';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { BumpType, ChangesetData } from '../../types/index.js';

/**
 * Create a changeset file
 */
export function createChangesetFile(
  data: ChangesetData,
  packages: string[],
  changesetDir = '.changeset',
): { path: string; filename: string } {
  const changesetPath = join(process.cwd(), changesetDir);

  if (!existsSync(changesetPath)) {
    mkdirSync(changesetPath, { recursive: true });
  }

  const filename = generateChangesetFilename();
  const filepath = join(changesetPath, filename);

  const frontmatter = generateChangesetFrontmatter(packages, data.bumpType);
  const content = `${frontmatter}\n${data.description}\n`;

  writeFileSync(filepath, content);

  return { path: filepath, filename };
}

/**
 * Generate changeset frontmatter
 */
export function generateChangesetFrontmatter(packages: string[], bumpType: BumpType): string {
  const packageEntries = packages.map((pkg) => `"${pkg}": ${bumpType}`).join('\n');

  return `---\n${packageEntries}\n---\n`;
}

/**
 * Generate unique changeset filename
 */
export function generateChangesetFilename(): string {
  const hash = crypto.randomBytes(4).toString('hex');
  return `auto-${hash}.md`;
}
