#!/usr/bin/env node
import path from 'node:path';
import { NodeFileStore } from '@auto-engineer/file-store/node';
import { getNarratives } from '../src';

const main = async () => {
  try {
    const result = await getNarratives({ vfs: new NodeFileStore(), root: path.resolve(__dirname) });
    const schema = result.toModel();
    console.log(JSON.stringify(schema, null, 2));
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

main().catch(console.error);
