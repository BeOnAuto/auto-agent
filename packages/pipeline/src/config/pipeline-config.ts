import type { Pipeline } from '../builder/define';
import type { CommandHandlerWithMetadata } from '../server/pipeline-server';
import { PluginLoader } from '../plugins/plugin-loader';
import { adaptHandlers } from '../plugins/handler-adapter';

export interface PipelineConfig {
  plugins: string[];
  pipeline: Pipeline;
}

export interface LoadedPipelineConfig {
  handlers: CommandHandlerWithMetadata[];
  pipeline: Pipeline;
}

export function pipelineConfig(config: PipelineConfig): PipelineConfig {
  return config;
}

export async function loadPipelineConfig(
  config: PipelineConfig,
  workspaceRoot?: string,
): Promise<LoadedPipelineConfig> {
  const loader = new PluginLoader(workspaceRoot);
  const pluginHandlers = await loader.loadPlugins(config.plugins);
  const handlers = adaptHandlers(pluginHandlers);

  return {
    handlers,
    pipeline: config.pipeline,
  };
}
