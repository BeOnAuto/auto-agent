import type { PipelineContext, RuntimeConfig } from './context';

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

describe('RuntimeConfig', () => {
  it('should define RuntimeConfig interface', () => {
    const config: RuntimeConfig = {
      defaultTimeout: 30000,
    };
    expect(config.defaultTimeout).toBe(30000);
  });

  it('should allow optional defaultTimeout', () => {
    const config: RuntimeConfig = {};
    expect(config.defaultTimeout).toBeUndefined();
  });
});
