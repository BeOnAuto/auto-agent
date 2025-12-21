import { Command, Event } from './types';

describe('Core Types', () => {
  it('should re-export Command and Event from message-bus', () => {
    const cmd: Command = { type: 'Test', data: {} };
    const evt: Event = { type: 'TestDone', data: {} };

    expect(cmd.type).toBe('Test');
    expect(evt.type).toBe('TestDone');
  });
});
