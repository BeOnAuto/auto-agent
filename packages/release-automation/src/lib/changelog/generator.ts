import type { ChangelogProvider, ConventionalCommit, ReleaseConfig } from '../../types/index.js';
import { AnthropicApiProvider, ClaudeCliProvider, SimpleProvider } from './providers/index.js';

/**
 * Generate changelog using configured provider with fallback cascade
 */
export async function generateChangelog(
  commits: ConventionalCommit[],
  config?: Partial<ReleaseConfig>,
): Promise<string> {
  const providers = getAvailableProviders(config);

  for (const provider of providers) {
    try {
      if (await provider.isAvailable()) {
        console.log(`✨ Generating changelog with ${provider.name}...`);
        const result = await provider.generate(commits);
        return result;
      }
    } catch (error) {
      console.warn(`⚠️  ${provider.name} failed:`, (error as Error).message);
      // Continue to next provider
    }
  }

  // Final fallback (should never reach here since SimpleProvider is always available)
  console.log('📝 Using simple changelog generation');
  const simple = new SimpleProvider();
  return simple.generate(commits);
}

/**
 * Get available changelog providers in priority order
 */
export function getAvailableProviders(config?: Partial<ReleaseConfig>): ChangelogProvider[] {
  const provider = config?.changelogProvider || 'auto';

  // If specific provider requested, try only that one
  if (provider !== 'auto') {
    return [createProvider(provider, config), new SimpleProvider()];
  }

  // Auto mode: try all providers in priority order
  return [new ClaudeCliProvider(), new AnthropicApiProvider(config?.anthropicApiKey), new SimpleProvider()];
}

function createProvider(
  type: 'claude-cli' | 'anthropic-api' | 'simple',
  config?: Partial<ReleaseConfig>,
): ChangelogProvider {
  switch (type) {
    case 'claude-cli':
      return new ClaudeCliProvider();
    case 'anthropic-api':
      return new AnthropicApiProvider(config?.anthropicApiKey);
    case 'simple':
      return new SimpleProvider();
  }
}
