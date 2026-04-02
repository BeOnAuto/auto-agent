import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';

const StackConfigSchema = z.object({
  frontend: z.string().default('react-vite'),
  backend: z.string().default('apollo-graphql'),
  clientDir: z.string().default('client'),
  serverDir: z.string().default('server'),
});

export type StackConfig = z.infer<typeof StackConfigSchema>;

const DEFAULT_STACK: StackConfig = {
  frontend: 'react-vite',
  backend: 'apollo-graphql',
  clientDir: 'client',
  serverDir: 'server',
};

const AgentConfigSchema = z.object({
  apiKey: z.string(),
  serverUrl: z.string(),
  workspaceId: z.string(),
  stack: StackConfigSchema.optional(),
});

export type AgentConfig = z.infer<typeof AgentConfigSchema>;

let configDir = join(process.cwd(), '.auto-agent');

export function setConfigDir(dir: string): void {
  configDir = dir;
}

export function getConfigDir(): string {
  return configDir;
}

export function getConfigPath(): string {
  return join(configDir, 'config.json');
}

export function getModelPath(): string {
  return join(configDir, 'model.json');
}

const LEGACY_CONFIG_FILENAME = '.auto-agent.json';

function getLegacyConfigPath(): string {
  return join(configDir, '..', LEGACY_CONFIG_FILENAME);
}

export function readConfig(): AgentConfig | null {
  try {
    const raw = readFileSync(getConfigPath(), 'utf-8');
    return AgentConfigSchema.parse(JSON.parse(raw));
  } catch {
    try {
      const legacyPath = getLegacyConfigPath();
      if (existsSync(legacyPath)) {
        const raw = readFileSync(legacyPath, 'utf-8');
        return AgentConfigSchema.parse(JSON.parse(raw));
      }
    } catch {
      return null;
    }
    return null;
  }
}

export function getStackConfig(): StackConfig {
  const config = readConfig();
  return config?.stack ?? DEFAULT_STACK;
}

export function writeConfig(config: AgentConfig): void {
  if (!existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true });
  }
  writeFileSync(getConfigPath(), JSON.stringify(config, null, 2), 'utf-8');
}
