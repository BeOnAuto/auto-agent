import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import type { LanguageModelV3 } from '@ai-sdk/provider';

export type Provider = 'openai' | 'anthropic' | 'google' | 'xai' | 'custom';

export const DEFAULT_MODELS: Record<Provider, string> = {
  openai: 'gpt-4o',
  anthropic: 'claude-sonnet-4-20250514',
  google: 'gemini-2.0-flash',
  xai: 'grok-3',
  custom: 'claude-sonnet-4-20250514',
};

interface CreateModelOptions {
  provider?: Provider;
  model?: string;
}

export function createModelFromEnv(options?: CreateModelOptions): LanguageModelV3 {
  const provider = options?.provider ?? (process.env.DEFAULT_AI_PROVIDER as Provider | undefined) ?? 'custom';
  const modelName = options?.model ?? process.env.DEFAULT_AI_MODEL ?? DEFAULT_MODELS[provider];

  if (provider !== 'custom') {
    throw new Error(`Provider "${provider}" is not yet supported`);
  }

  const name = process.env.CUSTOM_PROVIDER_NAME ?? 'custom';
  const baseURL = process.env.CUSTOM_PROVIDER_BASE_URL;
  const apiKey = process.env.CUSTOM_PROVIDER_API_KEY ?? '';

  if (!baseURL) {
    throw new Error('CUSTOM_PROVIDER_BASE_URL is required when using the custom provider');
  }

  return createOpenAICompatible({ name, baseURL, apiKey }).chatModel(modelName);
}
