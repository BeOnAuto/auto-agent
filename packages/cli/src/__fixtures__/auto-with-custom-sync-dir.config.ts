import { define } from '@auto-engineer/pipeline';

export const pipeline = define('test-pipeline').build();

export const fileSync = {
  dir: './custom-sync-dir',
};

export default {
  plugins: [],
  pipeline,
  fileSync,
};
