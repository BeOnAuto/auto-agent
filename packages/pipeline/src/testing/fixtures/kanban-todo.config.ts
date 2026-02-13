import { pipelineConfig } from '../../config/pipeline-config';
import { createKanbanFullPipeline } from './kanban-full.pipeline';

export default pipelineConfig({
  plugins: [
    '@auto-engineer/server-checks',
    '@auto-engineer/server-generator-apollo-emmett',
    '@auto-engineer/narrative',
    '@auto-engineer/information-architect',
    '@auto-engineer/generate-react-client',
    '@auto-engineer/react-component-implementer',
    '@auto-engineer/server-implementer',
    '@auto-engineer/app-implementer',
    '@auto-engineer/dev-server',
  ],
  pipeline: createKanbanFullPipeline(),
});
