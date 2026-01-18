import { define } from '@auto-engineer/pipeline';

export const pipeline = define('test-pipeline').build();

export const COMMANDS = [
  {
    name: 'ConfigCommand',
    handle: async () => ({ type: 'ConfigCommandDone', data: {} }),
  },
];

export default {
  plugins: [],
  pipeline,
  COMMANDS,
};
