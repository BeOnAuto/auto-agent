import { describe, expect, it, vi } from 'vitest';
import { define } from '../builder/define';
import { loadPipelineConfig, pipelineConfig } from './pipeline-config';

vi.mock('../plugins/plugin-loader', () => ({
  PluginLoader: vi.fn().mockImplementation(() => ({
    loadPlugins: vi.fn().mockResolvedValue([]),
  })),
}));

describe('pipelineConfig', () => {
  it('should return config unchanged', () => {
    const pipeline = define('test').build();
    const config = { plugins: [], pipeline };

    const result = pipelineConfig(config);

    expect(result).toBe(config);
  });
});

describe('loadPipelineConfig', () => {
  it('should load plugins and return handlers with pipeline', async () => {
    const pipeline = define('test').build();
    const config = { plugins: ['./test-plugin'], pipeline };

    const result = await loadPipelineConfig(config, '/workspace');

    expect(result.handlers).toEqual([]);
    expect(result.pipeline).toBe(pipeline);
  });
});
