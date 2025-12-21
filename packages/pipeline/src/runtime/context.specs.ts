import type { PipelineContext } from './context';

describe('PipelineContext', () => {
  it('should define PipelineContext interface', () => {
    const ctx: PipelineContext = {
      emit: async () => {},
      sendCommand: async () => {},
      correlationId: 'test-id',
    };
    expect(typeof ctx.emit).toBe('function');
    expect(typeof ctx.sendCommand).toBe('function');
    expect(ctx.correlationId).toBe('test-id');
  });
});
