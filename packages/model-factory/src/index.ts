import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { createXai } from '@ai-sdk/xai';
import type { LanguageModel } from 'ai';

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

export function createModelFromEnv(options?: CreateModelOptions): LanguageModel {
  const provider = options?.provider ?? (process.env.DEFAULT_AI_PROVIDER as Provider | undefined) ?? 'custom';
  const modelName = options?.model ?? process.env.DEFAULT_AI_MODEL ?? DEFAULT_MODELS[provider];

  if (provider === 'custom') {
    const name = process.env.CUSTOM_PROVIDER_NAME ?? 'custom';
    const baseURL = process.env.CUSTOM_PROVIDER_BASE_URL;
    const apiKey = process.env.CUSTOM_PROVIDER_API_KEY ?? '';

    if (!baseURL) {
      throw new Error('CUSTOM_PROVIDER_BASE_URL is required when using the custom provider');
    }

    return createOpenAICompatible({ name, baseURL, apiKey }).chatModel(modelName) as unknown as LanguageModel;
  }

  switch (provider) {
    case 'openai':
      return createOpenAI()(modelName) as unknown as LanguageModel;
    case 'anthropic':
      return createAnthropic()(modelName) as unknown as LanguageModel;
    case 'google':
      return createGoogleGenerativeAI()(modelName) as unknown as LanguageModel;
    case 'xai':
      return createXai()(modelName) as unknown as LanguageModel;
  }
}
