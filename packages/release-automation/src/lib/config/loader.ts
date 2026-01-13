import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ReleaseConfig } from '../../types/index.js';
import type { ConfigFile } from './types.js';

/**
 * Load release configuration from multiple sources
 * Priority: overrides > env > config file > defaults
 */
export async function loadConfig(overrides?: Partial<ReleaseConfig>): Promise<ReleaseConfig> {
  const defaults = getDefaultConfig();
  const fromEnv = loadConfigFromEnv();
  const fromFile = await loadConfigFile();

  return mergeConfig(defaults, fromFile, fromEnv, overrides || {});
}

/**
 * Load from .release-automation.json or package.json
 */
export async function loadConfigFile(): Promise<Partial<ReleaseConfig>> {
  // Try .release-automation.json first
  const configPath = join(process.cwd(), '.release-automation.json');
  if (existsSync(configPath)) {
    try {
      const content = readFileSync(configPath, 'utf8');
      const config = JSON.parse(content) as Partial<ReleaseConfig>;
      return config;
    } catch (error) {
      console.warn('Warning: Failed to parse .release-automation.json:', (error as Error).message);
    }
  }

  // Try package.json
  const packagePath = join(process.cwd(), 'package.json');
  if (existsSync(packagePath)) {
    try {
      const content = readFileSync(packagePath, 'utf8');
      const pkg = JSON.parse(content) as ConfigFile;
      return pkg.releaseAutomation || {};
    } catch (error) {
      console.warn('Warning: Failed to parse package.json:', (error as Error).message);
    }
  }

  return {};
}

/**
 * Load from environment variables
 */
export function loadConfigFromEnv(): Partial<ReleaseConfig> {
  const config: Partial<ReleaseConfig> = {};

  if (process.env.AUTO_CHANGESET_CONFIG_PATH) {
    config.changesetConfigPath = process.env.AUTO_CHANGESET_CONFIG_PATH;
  }

  if (process.env.AUTO_CHANGESET_PROVIDER) {
    config.changelogProvider = process.env.AUTO_CHANGESET_PROVIDER as ReleaseConfig['changelogProvider'];
  }

  if (process.env.ANTHROPIC_API_KEY) {
    config.anthropicApiKey = process.env.ANTHROPIC_API_KEY;
  }

  if (process.env.AUTO_CHANGESET_DIR) {
    config.changesetDir = process.env.AUTO_CHANGESET_DIR;
  }

  if (process.env.AUTO_CHANGESET_AMEND !== undefined) {
    config.autoAmend = process.env.AUTO_CHANGESET_AMEND === 'true';
  }

  if (process.env.AUTO_CHANGESET_PACKAGES) {
    config.packages = process.env.AUTO_CHANGESET_PACKAGES.split(',').map((p) => p.trim());
  }

  return config;
}

/**
 * Merge configuration from multiple sources
 */
export function mergeConfig(...configs: Partial<ReleaseConfig>[]): ReleaseConfig {
  const merged = {} as ReleaseConfig;

  for (const config of configs) {
    Object.assign(merged, config);
  }

  return merged;
}

/**
 * Get default configuration
 */
export function getDefaultConfig(): ReleaseConfig {
  return {
    changesetConfigPath: '.changeset/config.json',
    changelogProvider: 'auto',
    autoAmend: true,
    changesetDir: '.changeset',
  };
}
