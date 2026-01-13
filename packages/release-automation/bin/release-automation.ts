#!/usr/bin/env node
import { runCli } from '../src/cli/index.js';

runCli(process.argv).catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
