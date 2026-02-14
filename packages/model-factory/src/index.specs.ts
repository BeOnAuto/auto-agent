import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const stubModel = (provider: string) => (model: string) => ({
  specificationVersion: 'v3',
  modelId: model,
  provider,
});

vi.mock('@ai-sdk/openai-compatible', () => ({
  createOpenAICompatible: ({ name, baseURL, apiKey }: { name: string; baseURL: string; apiKey: string }) => ({
    chatModel: (model: string) => ({
      specificationVersion: 'v3',
      modelId: model,
      provider: `${name}:${baseURL}:${apiKey}`,
    }),
  }),
}));

vi.mock('@ai-sdk/openai', () => ({ createOpenAI: () => stubModel('openai') }));
vi.mock('@ai-sdk/anthropic', () => ({ createAnthropic: () => stubModel('anthropic') }));
vi.mock('@ai-sdk/google', () => ({ createGoogleGenerativeAI: () => stubModel('google') }));
vi.mock('@ai-sdk/xai', () => ({ createXai: () => stubModel('xai') }));

const savedEnv = { ...process.env };

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  process.env = { ...savedEnv };
});

describe('createModelFromEnv', () => {
  describe('custom provider', () => {
    it('creates model using CUSTOM_PROVIDER env vars with default model', async () => {
      process.env.CUSTOM_PROVIDER_NAME = 'litellm';
      process.env.CUSTOM_PROVIDER_BASE_URL = 'https://gateway.example.com/v1';
      process.env.CUSTOM_PROVIDER_API_KEY = 'sk-test';
      process.env.DEFAULT_AI_PROVIDER = 'custom';

      const { createModelFromEnv, DEFAULT_MODELS } = await import('./index.js');
      const model = createModelFromEnv();

      expect(model).toEqual({
        specificationVersion: 'v3',
        modelId: DEFAULT_MODELS.custom,
        provider: 'litellm:https://gateway.example.com/v1:sk-test',
      });
    });

    it('uses options.model override', async () => {
      process.env.CUSTOM_PROVIDER_BASE_URL = 'https://gw.example.com/v1';

      const { createModelFromEnv } = await import('./index.js');
      const model = createModelFromEnv({ model: 'my-custom-model' });

      expect(model).toEqual({
        specificationVersion: 'v3',
        modelId: 'my-custom-model',
        provider: 'custom:https://gw.example.com/v1:',
      });
    });

    it('uses DEFAULT_AI_MODEL env var when options.model is unset', async () => {
      process.env.CUSTOM_PROVIDER_BASE_URL = 'https://gw.example.com/v1';
      process.env.DEFAULT_AI_MODEL = 'env-override-model';

      const { createModelFromEnv } = await import('./index.js');
      const model = createModelFromEnv();

      expect(model).toEqual({
        specificationVersion: 'v3',
        modelId: 'env-override-model',
        provider: 'custom:https://gw.example.com/v1:',
      });
    });

    it('defaults to custom provider when DEFAULT_AI_PROVIDER is unset', async () => {
      process.env.CUSTOM_PROVIDER_BASE_URL = 'https://gw.example.com/v1';
      delete process.env.DEFAULT_AI_PROVIDER;

      const { createModelFromEnv } = await import('./index.js');
      const model = createModelFromEnv();

      expect(model).toEqual(expect.objectContaining({
        specificationVersion: 'v3',
        provider: 'custom:https://gw.example.com/v1:',
      }));
    });

    it('throws when CUSTOM_PROVIDER_BASE_URL is missing', async () => {
      process.env.DEFAULT_AI_PROVIDER = 'custom';
      delete process.env.CUSTOM_PROVIDER_BASE_URL;

      const { createModelFromEnv } = await import('./index.js');

      expect(() => createModelFromEnv()).toThrow(
        'CUSTOM_PROVIDER_BASE_URL is required when using the custom provider',
      );
    });
  });

  describe('direct providers', () => {
    it('creates openai model with default model name', async () => {
      const { createModelFromEnv, DEFAULT_MODELS } = await import('./index.js');
      const model = createModelFromEnv({ provider: 'openai' });

      expect(model).toEqual({
        specificationVersion: 'v3',
        modelId: DEFAULT_MODELS.openai,
        provider: 'openai',
      });
    });

    it('creates anthropic model with default model name', async () => {
      const { createModelFromEnv, DEFAULT_MODELS } = await import('./index.js');
      const model = createModelFromEnv({ provider: 'anthropic' });

      expect(model).toEqual({
        specificationVersion: 'v3',
        modelId: DEFAULT_MODELS.anthropic,
        provider: 'anthropic',
      });
    });

    it('creates google model with default model name', async () => {
      const { createModelFromEnv, DEFAULT_MODELS } = await import('./index.js');
      const model = createModelFromEnv({ provider: 'google' });

      expect(model).toEqual({
        specificationVersion: 'v3',
        modelId: DEFAULT_MODELS.google,
        provider: 'google',
      });
    });

    it('creates xai model with default model name', async () => {
      const { createModelFromEnv, DEFAULT_MODELS } = await import('./index.js');
      const model = createModelFromEnv({ provider: 'xai' });

      expect(model).toEqual({
        specificationVersion: 'v3',
        modelId: DEFAULT_MODELS.xai,
        provider: 'xai',
      });
    });

    it('reads provider from DEFAULT_AI_PROVIDER env var', async () => {
      process.env.DEFAULT_AI_PROVIDER = 'anthropic';

      const { createModelFromEnv, DEFAULT_MODELS } = await import('./index.js');
      const model = createModelFromEnv();

      expect(model).toEqual({
        specificationVersion: 'v3',
        modelId: DEFAULT_MODELS.anthropic,
        provider: 'anthropic',
      });
    });

    it('options.provider overrides DEFAULT_AI_PROVIDER env var', async () => {
      process.env.DEFAULT_AI_PROVIDER = 'openai';

      const { createModelFromEnv, DEFAULT_MODELS } = await import('./index.js');
      const model = createModelFromEnv({ provider: 'xai' });

      expect(model).toEqual({
        specificationVersion: 'v3',
        modelId: DEFAULT_MODELS.xai,
        provider: 'xai',
      });
    });

    it('uses options.model for direct provider', async () => {
      const { createModelFromEnv } = await import('./index.js');
      const model = createModelFromEnv({ provider: 'openai', model: 'gpt-4-turbo' });

      expect(model).toEqual({
        specificationVersion: 'v3',
        modelId: 'gpt-4-turbo',
        provider: 'openai',
      });
    });

    it('uses DEFAULT_AI_MODEL env var for direct provider', async () => {
      process.env.DEFAULT_AI_MODEL = 'custom-model-name';

      const { createModelFromEnv } = await import('./index.js');
      const model = createModelFromEnv({ provider: 'openai' });

      expect(model).toEqual({
        specificationVersion: 'v3',
        modelId: 'custom-model-name',
        provider: 'openai',
      });
    });
  });
});
