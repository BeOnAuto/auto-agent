#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const srcPath = resolve(__dirname, '..', 'src', 'index.js');
const node = spawn('node', [srcPath, ...process.argv.slice(2)], { stdio: 'inherit' });

node.on('exit', (code) => {
  process.exit(code || 0);
});
