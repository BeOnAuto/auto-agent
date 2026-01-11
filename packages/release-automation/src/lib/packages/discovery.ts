import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ChangesetConfig } from '../../types/index.js';

/**
 * Discover packages from changeset config
 */
export async function discoverPackages(changesetConfigPath = '.changeset/config.json'): Promise<string[]> {
  const config = await readChangesetConfig(changesetConfigPath);
  return getFixedGroupPackages(config);
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
 * Get all packages from fixed groups
 */
export function getFixedGroupPackages(config: ChangesetConfig): string[] {
  if (!config.fixed || config.fixed.length === 0) {
    return [];
  }

  // Flatten all fixed groups and expand globs
  const allPackages = config.fixed.flat();

  // For now, we'll just return the patterns as-is
  // In a real implementation, you'd expand globs like "@auto-engineer/*"
  // to actual package names by reading package.json files
  return allPackages;
}

/**
 * Expand glob patterns in package names
 * For simplicity, we're not implementing full glob expansion
 * The patterns in changeset config should match package names
 */
export async function expandPackageGlobs(patterns: string[]): Promise<string[]> {
  // Simple implementation: just return patterns as-is
  // A more sophisticated version would:
  // 1. Find all package.json files in packages/
  // 2. Read package names
  // 3. Match against glob patterns
  // 4. Return matching package names

  return patterns;
}
