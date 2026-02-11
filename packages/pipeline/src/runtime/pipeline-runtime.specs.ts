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

  it('should dispatch run-await commands with static array', async () => {
    const sent: string[] = [];
    const ctx = {
      sendCommand: async (type: string) => {
        sent.push(type);
      },
      emit: async () => {},
      correlationId: 'test',
    };
    const pipeline = define('test')
      .on('Start')
      .run([
        { commandType: 'A', data: {} },
        { commandType: 'B', data: {} },
      ])
      .awaitAll('key', () => '')
      .build();
    const runtime = new PipelineRuntime(pipeline.descriptor);
    await runtime.handleEvent({ type: 'Start', data: {} }, ctx);
    expect(sent).toEqual(['A', 'B']);
  });

  it('should dispatch run-await commands with factory', async () => {
    const sent: Array<{ type: string; data: unknown }> = [];
    const ctx = {
      sendCommand: async (type: string, data: unknown) => {
        sent.push({ type, data });
      },
      emit: async () => {},
      correlationId: 'test',
    };
    type ItemsEvent = { type: string; data: { items: Array<{ id: string }> } };
    const pipeline = define('test')
      .on('Items')
      .run((e: ItemsEvent) => e.data.items.map((item) => ({ commandType: 'Process', data: { itemId: item.id } })))
      .awaitAll('byItem', () => '')
      .build();
    const runtime = new PipelineRuntime(pipeline.descriptor);
    await runtime.handleEvent({ type: 'Items', data: { items: [{ id: '1' }, { id: '2' }] } }, ctx);
    expect(sent).toHaveLength(2);
    expect(sent[0].data).toEqual({ itemId: '1' });
    expect(sent[1].data).toEqual({ itemId: '2' });
  });

  it('should dispatch run-await commands with data factory per command', async () => {
    const sent: Array<{ type: string; data: unknown }> = [];
    const ctx = {
      sendCommand: async (type: string, data: unknown) => {
        sent.push({ type, data });
      },
      emit: async () => {},
      correlationId: 'test',
    };
    type MyEvent = { type: string; data: { x: number } };
    const pipeline = define('test')
      .on('Start')
      .run((e: MyEvent) => [{ commandType: 'Cmd', data: { val: e.data.x * 2 } }])
      .awaitAll('key', () => '')
      .build();
    const runtime = new PipelineRuntime(pipeline.descriptor);
    await runtime.handleEvent({ type: 'Start', data: { x: 5 } }, ctx);
    expect(sent[0].data).toEqual({ val: 10 });
  });

  it('should resolve data factory in static run-await commands', async () => {
    const sent: Array<{ type: string; data: unknown }> = [];
    const ctx = {
      sendCommand: async (type: string, data: unknown) => {
        sent.push({ type, data });
      },
      emit: async () => {},
      correlationId: 'test',
    };
    const dataFactory = (e: { data: { v?: number } }) => ({ result: (e.data.v ?? 0) * 3 });
    const runtime = new PipelineRuntime({
      name: 'test',
      keys: new Map(),
      handlers: [
        {
          type: 'run-await',
          eventType: 'Start',
          commands: [{ commandType: 'Cmd', data: dataFactory }],
          awaitConfig: { keyName: 'k', key: () => '' },
        },
      ],
    });
    await runtime.handleEvent({ type: 'Start', data: { v: 7 } }, ctx);
    expect(sent[0].data).toEqual({ result: 21 });
  });

  it('should process items in phase order for foreach-phased', async () => {
    const sent: string[] = [];
    const ctx = {
      sendCommand: async (_: string, data: unknown) => {
        sent.push((data as { id: string }).id);
      },
      emit: async () => {},
      correlationId: 'test',
    };
    type Item = { id: string; p: 'high' | 'low' };
    const pipeline = define('test')
      .on('Items')
      .forEach((e: { data: { items: Item[] } }) => e.data.items)
      .groupInto(['high', 'low'], (i: Item) => i.p)
      .process('Cmd', (i: Item) => ({ id: i.id }))
      .onComplete({ success: 'Done', failure: 'Fail', itemKey: () => '' })
      .build();
    const runtime = new PipelineRuntime(pipeline.descriptor);
    await runtime.handleEvent(
      {
        type: 'Items',
        data: {
          items: [
            { id: '1', p: 'low' },
            { id: '2', p: 'high' },
            { id: '3', p: 'high' },
          ],
        },
      },
      ctx,
    );
    expect(sent).toEqual(['2', '3', '1']);
  });

  it('should use startPhased when provided for foreach-phased', async () => {
    let phasedCalled = false;
    const ctx = {
      sendCommand: async () => {},
      emit: async () => {},
      correlationId: 'test',
      startPhased: () => {
        phasedCalled = true;
      },
    };
    type Item = { id: string; p: 'high' | 'low' };
    const pipeline = define('test')
      .on('Items')
      .forEach((e: { data: { items: Item[] } }) => e.data.items)
      .groupInto(['high', 'low'], (i: Item) => i.p)
      .process('Cmd', (i: Item) => ({ id: i.id }))
      .onComplete({ success: 'Done', failure: 'Fail', itemKey: () => '' })
      .build();
    const runtime = new PipelineRuntime(pipeline.descriptor);
    await runtime.handleEvent({ type: 'Items', data: { items: [{ id: '1', p: 'low' }] } }, ctx);
    expect(phasedCalled).toBe(true);
  });

  it('should propagate startPhased rejection', async () => {
    const ctx = {
      sendCommand: async () => {},
      emit: async () => {},
      correlationId: 'test',
      startPhased: async () => {
        throw new Error('phased-setup-failed');
      },
    };
    type Item = { id: string; p: 'high' | 'low' };
    const pipeline = define('test')
      .on('Items')
      .forEach((e: { data: { items: Item[] } }) => e.data.items)
      .groupInto(['high', 'low'], (i: Item) => i.p)
      .process('Cmd', (i: Item) => ({ id: i.id }))
      .onComplete({ success: 'Done', failure: 'Fail', itemKey: () => '' })
      .build();
    const runtime = new PipelineRuntime(pipeline.descriptor);
    await expect(runtime.handleEvent({ type: 'Items', data: { items: [{ id: '1', p: 'low' }] } }, ctx)).rejects.toThrow(
      'phased-setup-failed',
    );
  });

  it('should dispatch multiple emit commands in parallel, not sequentially', async () => {
    const callOrder: string[] = [];
    let resolveA: () => void;
    let resolveB: () => void;
    const promiseA = new Promise<void>((r) => {
      resolveA = r;
    });
    const promiseB = new Promise<void>((r) => {
      resolveB = r;
    });

    const ctx = {
      sendCommand: async (type: string) => {
        callOrder.push(`${type}:start`);
        if (type === 'CmdA') {
          await promiseA;
        } else if (type === 'CmdB') {
          await promiseB;
        }
        callOrder.push(`${type}:end`);
      },
      emit: async () => {},
      correlationId: 'test',
    };

    const pipeline = define('test').on('Start').emit('CmdA', {}).emit('CmdB', {}).build();
    const runtime = new PipelineRuntime(pipeline.descriptor);

    const handlePromise = runtime.handleEvent({ type: 'Start', data: {} }, ctx);

    await new Promise((r) => setTimeout(r, 10));

    expect(callOrder).toContain('CmdA:start');
    expect(callOrder).toContain('CmdB:start');

    resolveB!();
    resolveA!();
    await handlePromise;

    expect(callOrder).toEqual(['CmdA:start', 'CmdB:start', 'CmdB:end', 'CmdA:end']);
  });
});
