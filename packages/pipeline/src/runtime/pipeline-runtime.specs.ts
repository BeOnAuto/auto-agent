import { define } from '../builder/define';
import { PipelineRuntime } from './pipeline-runtime';

describe('PipelineRuntime', () => {
  it('should create PipelineRuntime', () => {
    const pipeline = define('test').on('Start').emit('Cmd', {}).build();
    const runtime = new PipelineRuntime(pipeline.descriptor);
    expect(runtime.descriptor.name).toBe('test');
  });

  it('should index handlers by event type', () => {
    const pipeline = define('test').on('EventA').emit('CmdA', {}).on('EventB').emit('CmdB', {}).build();
    const runtime = new PipelineRuntime(pipeline.descriptor);
    expect(runtime.getHandlersForEvent('EventA')).toHaveLength(1);
    expect(runtime.getHandlersForEvent('EventB')).toHaveLength(1);
    expect(runtime.getHandlersForEvent('NonExistent')).toHaveLength(0);
  });

  it('should return multiple handlers for same event', () => {
    const pipeline = define('test').on('Start').emit('CmdA', {}).on('Start').emit('CmdB', {}).build();
    const runtime = new PipelineRuntime(pipeline.descriptor);
    expect(runtime.getHandlersForEvent('Start')).toHaveLength(2);
  });

  it('should filter by predicate', () => {
    type MyEvent = { type: string; data: { ok: boolean } };
    const pipeline = define('test')
      .on('Event')
      .when((e: MyEvent) => e.data.ok)
      .emit('A', {})
      .on('Event')
      .emit('B', {})
      .build();
    const runtime = new PipelineRuntime(pipeline.descriptor);
    const matchingFalse = runtime.getMatchingHandlers({ type: 'Event', data: { ok: false } });
    const matchingTrue = runtime.getMatchingHandlers({ type: 'Event', data: { ok: true } });
    expect(matchingFalse).toHaveLength(1);
    expect(matchingTrue).toHaveLength(2);
  });

  it('should execute emit handler', async () => {
    const sent: string[] = [];
    const ctx = {
      sendCommand: async (type: string) => {
        sent.push(type);
      },
      emit: async () => {},
      correlationId: 'test',
    };
    const pipeline = define('test').on('Start').emit('Process', {}).build();
    const runtime = new PipelineRuntime(pipeline.descriptor);
    await runtime.handleEvent({ type: 'Start', data: {} }, ctx);
    expect(sent).toContain('Process');
  });

  it('should resolve data factory', async () => {
    const sent: Array<{ type: string; data: unknown }> = [];
    const ctx = {
      sendCommand: async (type: string, data: unknown) => {
        sent.push({ type, data });
      },
      emit: async () => {},
      correlationId: 'test',
    };
    type InEvent = { type: string; data: { id: string } };
    const pipeline = define('test')
      .on('In')
      .emit('Out', (e: InEvent) => ({ x: e.data.id }))
      .build();
    const runtime = new PipelineRuntime(pipeline.descriptor);
    await runtime.handleEvent({ type: 'In', data: { id: '1' } }, ctx);
    expect(sent[0].data).toEqual({ x: '1' });
  });

  it('should execute custom handler', async () => {
    let called = false;
    const pipeline = define('test')
      .on('E')
      .handle(async () => {
        called = true;
      })
      .build();
    const runtime = new PipelineRuntime(pipeline.descriptor);
    await runtime.handleEvent(
      { type: 'E', data: {} },
      { emit: async () => {}, sendCommand: async () => {}, correlationId: '' },
    );
    expect(called).toBe(true);
  });
});
