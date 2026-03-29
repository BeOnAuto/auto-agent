#!/usr/bin/env node
import { createProgram } from '../src/index.js';

const program = createProgram();
program.parse(process.argv);
