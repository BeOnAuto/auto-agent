import { pipelineConfig } from '../../config/pipeline-config';
import { createKanbanFullPipeline } from './kanban-full.pipeline';

export default pipelineConfig({
  plugins: [
    '@auto-engineer/server-checks',
    '@auto-engineer/design-system-importer',
    '@auto-engineer/server-generator-apollo-emmett',
    '@auto-engineer/narrative',
    '@auto-engineer/frontend-checks',
    '@auto-engineer/frontend-implementer',
    '@auto-engineer/component-implementer',
    '@auto-engineer/information-architect',
    '@auto-engineer/frontend-generator-react-graphql',
    '@auto-engineer/server-implementer',
    '@auto-engineer/dev-server',
  ],
  pipeline: createKanbanFullPipeline(),
});
