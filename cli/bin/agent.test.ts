import { describe, it, expect } from 'vitest';
import { createProgram } from '../src/index.js';

describe('agent entrypoint', () => {
  it('createProgram returns a program with expected subcommands', () => {
    const program = createProgram();
    const commandNames = program.commands.map((cmd) => cmd.name()).sort();
    expect(commandNames).toEqual(['configure', 'connect', 'get-model', 'mcp', 'send-model']);
  });
});
