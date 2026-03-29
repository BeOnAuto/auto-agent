import { describe, it, expect } from 'vitest';
import { createProgram } from '../index.js';

describe('connect command', () => {
  it('is registered on the program with the correct description', () => {
    const program = createProgram();
    const connectCmd = program.commands.find((cmd) => cmd.name() === 'connect');
    expect(connectCmd!.description()).toBe('Connect to the collaboration server and sync model in real-time');
  });

  it('has --dir option defaulting to .auto-agent', () => {
    const program = createProgram();
    const connectCmd = program.commands.find((cmd) => cmd.name() === 'connect')!;
    const dirOption = connectCmd.options.find((opt) => opt.long === '--dir');
    expect(dirOption!.defaultValue).toBe('.auto-agent');
  });
});
