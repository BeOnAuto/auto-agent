import { define } from '@auto-engineer/pipeline';

export const fileId = 'minimal1';

export const plugins = ['@auto-engineer/server-checks'];

export const pipeline = define('minimal')
  .on('CheckTypes')
  .emit('TypesVerified', (e: { data: { targetDirectory: string } }) => ({
    directory: e.data.targetDirectory,
  }))
  .build();
