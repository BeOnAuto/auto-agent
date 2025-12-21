import { Command, CommandDispatch, Event } from './types';

describe('Core Types', () => {
  it('should re-export Command and Event from message-bus', () => {
    const cmd: Command = { type: 'Test', data: {} };
    const evt: Event = { type: 'TestDone', data: {} };

    expect(cmd.type).toBe('Test');
    expect(evt.type).toBe('TestDone');
  });
});

describe('CommandDispatch', () => {
  it('should create CommandDispatch with static data', () => {
    const cmd: CommandDispatch = {
      commandType: 'CheckTests',
      data: { targetDirectory: './src', scope: 'slice' },
    };
    expect(cmd).toEqual({
      commandType: 'CheckTests',
      data: { targetDirectory: './src', scope: 'slice' },
    });
  });

  it('should create CommandDispatch with data factory', () => {
    const cmd: CommandDispatch = {
      commandType: 'ImplementSlice',
      data: (e: Event) => ({ slicePath: e.data.path }),
    };
    const event: Event = { type: 'SliceGenerated', data: { path: './slice' } };
    const resolved = typeof cmd.data === 'function' ? cmd.data(event) : cmd.data;
    expect(resolved).toEqual({ slicePath: './slice' });
  });
});
