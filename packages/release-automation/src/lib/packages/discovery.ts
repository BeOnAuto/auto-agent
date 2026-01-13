import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { minimatch } from 'minimatch';
import type { ChangesetConfig } from '../../types/index.js';

/**
 * Discover packages from changeset config
 */
export async function discoverPackages(changesetConfigPath = '.changeset/config.json'): Promise<string[]> {
  const config = await readChangesetConfig(changesetConfigPath);
  const patterns = getFixedGroupPackages(config);
  return expandPackageGlobs(patterns);
}

/**
 * Read changeset configuration
 */
export async function readChangesetConfig(configPath = '.changeset/config.json'): Promise<ChangesetConfig> {
  const fullPath = join(process.cwd(), configPath);

  if (!existsSync(fullPath)) {
    throw new Error(`Changeset config not found at ${configPath}`);
  }

  try {
    const content = readFileSync(fullPath, 'utf8');
    const config = JSON.parse(content) as ChangesetConfig;
    return config;
  } catch (error) {
    throw new Error(`Failed to read changeset config: ${(error as Error).message}`);
  }
}

/**
 * Get all packages from fixed groups (returns raw patterns)
 */
export function getFixedGroupPackages(config: ChangesetConfig): string[] {
  if (!config.fixed || config.fixed.length === 0) {
    return [];
  }
  return config.fixed.flat();
}

/**
 * Expand glob patterns to actual package names
 */
export function expandPackageGlobs(patterns: string[]): string[] {
  const packagesDir = join(process.cwd(), 'packages');
  if (!existsSync(packagesDir)) {
    return patterns.filter((p) => !p.includes('*'));
  }

  const packageNames: string[] = [];
  const dirs = readdirSync(packagesDir, { withFileTypes: true });

  for (const dir of dirs) {
    if (!dir.isDirectory()) continue;
    const pkgJsonPath = join(packagesDir, dir.name, 'package.json');
    if (!existsSync(pkgJsonPath)) continue;

    try {
      const pkgJson = JSON.parse(readFileSync(pkgJsonPath, 'utf8'));
      if (pkgJson.name) {
        packageNames.push(pkgJson.name);
      }
    } catch {
      // Skip invalid package.json
    }
  }

  const result: string[] = [];
  for (const pattern of patterns) {
    if (pattern.includes('*')) {
      const matches = packageNames.filter((name) => minimatch(name, pattern));
      result.push(...matches);
    } else {
      result.push(pattern);
    }
  }

  return [...new Set(result)];
}
