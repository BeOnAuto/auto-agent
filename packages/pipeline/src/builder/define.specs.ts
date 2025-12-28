import { vi } from 'vitest';
import type {
  CustomHandlerDescriptor,
  EmitHandlerDescriptor,
  ForEachPhasedDescriptor,
  RunAwaitHandlerDescriptor,
  SettledHandlerDescriptor,
} from '../core/descriptors';
import { define } from './define';

describe('define()', () => {
  it('should create PipelineBuilder via define()', () => {
    const builder = define('my-pipeline');
    expect(builder).toBeDefined();
    expect(typeof builder.version).toBe('function');
    expect(typeof builder.on).toBe('function');
    expect(typeof builder.build).toBe('function');
  });

  it('should chain version() and description()', () => {
    const pipeline = define('test').version('1.0.0').description('Test pipeline').build();
    expect(pipeline.descriptor.name).toBe('test');
    expect(pipeline.descriptor.version).toBe('1.0.0');
    expect(pipeline.descriptor.description).toBe('Test pipeline');
  });

  it('should return frozen Pipeline from build()', () => {
    const pipeline = define('test').build();
    expect(pipeline.descriptor).toBeDefined();
    expect(Object.isFrozen(pipeline.descriptor)).toBe(true);
  });

  it('should define named key extractors', () => {
    const extractor = (e: { data: { slicePath?: string } }) => e.data.slicePath ?? '';
    const pipeline = define('test').key('bySlice', extractor).build();
    expect(pipeline.descriptor.keys.get('bySlice')).toBe(extractor);
  });
});

describe('on() and emit()', () => {
  it('should capture emit handler in descriptor', () => {
    const pipeline = define('test').on('SchemaExported').emit('GenerateServer', { modelPath: './schema.json' }).build();
    expect(pipeline.descriptor.handlers).toHaveLength(1);
    const handler = pipeline.descriptor.handlers[0] as EmitHandlerDescriptor;
    expect(handler.type).toBe('emit');
    expect(handler.eventType).toBe('SchemaExported');
    expect(handler.commands).toEqual([{ commandType: 'GenerateServer', data: { modelPath: './schema.json' } }]);
  });

  it('should accept data factory in emit()', () => {
    type SliceEvent = { data: { path: string } };
    const factory = (e: SliceEvent) => ({ slicePath: e.data.path });
    const pipeline = define('test').on('SliceGenerated').emit('ImplementSlice', factory).build();
    const handler = pipeline.descriptor.handlers[0] as EmitHandlerDescriptor;
    expect(typeof handler.commands[0].data).toBe('function');
  });

  it('should chain emit() for parallel commands', () => {
    const pipeline = define('test')
      .on('ServerGenerated')
      .emit('GenerateIA', { modelPath: './schema.json' })
      .emit('StartServer', { serverDirectory: './server' })
      .build();
    const handler = pipeline.descriptor.handlers[0] as EmitHandlerDescriptor;
    expect(handler.commands).toHaveLength(2);
    expect(handler.commands[0].commandType).toBe('GenerateIA');
    expect(handler.commands[1].commandType).toBe('StartServer');
  });

  it('should chain on() from EmitChain', () => {
    const pipeline = define('test').on('EventA').emit('CmdA', { d: 'a' }).on('EventB').emit('CmdB', { d: 'b' }).build();
    expect(pipeline.descriptor.handlers).toHaveLength(2);
    const handlerA = pipeline.descriptor.handlers[0] as EmitHandlerDescriptor;
    const handlerB = pipeline.descriptor.handlers[1] as EmitHandlerDescriptor;
    expect(handlerA.eventType).toBe('EventA');
    expect(handlerB.eventType).toBe('EventB');
  });
});

describe('when() predicate', () => {
  it('should apply predicate with when()', () => {
    type ClientEvent = { data: { components?: string[] } };
    const predicate = (e: ClientEvent) => (e.data.components?.length ?? 0) > 0;
    const pipeline = define('test')
      .on('ClientGenerated')
      .when(predicate)
      .emit('ImplementComponent', { path: './c' })
      .build();
    const handler = pipeline.descriptor.handlers[0];
    expect(handler.type).toBe('emit');
    if (handler.type === 'emit') {
      expect(handler.predicate).toBe(predicate);
    }
  });
});

describe('settled()', () => {
  it('should create a SettledHandlerDescriptor', () => {
    const handler = vi.fn();
    const pipeline = define('test')
      .settled(['CheckTests', 'CheckTypes', 'CheckLint'])
      .dispatch({ dispatches: [] }, handler)
      .build();

    const descriptor = pipeline.descriptor.handlers[0] as SettledHandlerDescriptor;
    expect(descriptor.type).toBe('settled');
    expect(descriptor.commandTypes).toEqual(['CheckTests', 'CheckTypes', 'CheckLint']);
    expect(descriptor.handler).toBe(handler);
  });

  it('should chain multiple settled handlers', () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    const pipeline = define('test')
      .settled(['A', 'B'])
      .dispatch({ dispatches: [] }, handler1)
      .settled(['C', 'D'])
      .dispatch({ dispatches: [] }, handler2)
      .build();

    expect(pipeline.descriptor.handlers).toHaveLength(2);
    expect((pipeline.descriptor.handlers[0] as SettledHandlerDescriptor).commandTypes).toEqual(['A', 'B']);
    expect((pipeline.descriptor.handlers[1] as SettledHandlerDescriptor).commandTypes).toEqual(['C', 'D']);
  });

  it('should chain settled with on()', () => {
    const settledHandler = vi.fn();

    const pipeline = define('test')
      .settled(['CheckTests', 'CheckTypes'])
      .dispatch({ dispatches: [] }, settledHandler)
      .on('ServerGenerated')
      .emit('GenerateIA', {})
      .build();

    expect(pipeline.descriptor.handlers).toHaveLength(2);
    expect(pipeline.descriptor.handlers[0].type).toBe('settled');
    expect(pipeline.descriptor.handlers[1].type).toBe('emit');
  });

  it('should include settled handler in graph', () => {
    const pipeline = define('test')
      .settled(['CheckTests', 'CheckTypes'])
      .dispatch({ dispatches: [] }, () => {})
      .build();

    const graph = pipeline.toGraph();
    const settledNode = graph.nodes.find((n) => n.id.startsWith('settled:'));
    expect(settledNode).toBeDefined();
    expect(settledNode?.label).toBe('Settled');
  });

  it('should accept options-first dispatch with dispatches array', () => {
    const pipeline = define('test')
      .settled(['CheckA'])
      .dispatch({ dispatches: ['RetryCommand'] }, () => {})
      .build();

    const descriptor = pipeline.descriptor.handlers[0] as SettledHandlerDescriptor;
    expect(descriptor.dispatches).toEqual(['RetryCommand']);
  });
});

describe('Integration', () => {
  it('should create complete simple pipeline', () => {
    type SliceEvent = { data: { slicePath: string } };
    const pipeline = define('kanban')
      .version('1.0.0')
      .description('Kanban app generation')
      .key('bySlice', (e: SliceEvent) => e.data.slicePath ?? '')
      .on('SchemaExported')
      .emit('GenerateServer', { modelPath: './schema.json', destination: '.' })
      .on('SliceGenerated')
      .emit('ImplementSlice', (e: SliceEvent) => ({
        slicePath: e.data.slicePath,
        context: { attemptNumber: 0, previousOutputs: 'errors' },
        aiOptions: { maxTokens: 2000 },
      }))
      .on('ServerGenerated')
      .emit('GenerateIA', { modelPath: './schema.json', outputDir: './.context' })
      .emit('StartServer', { serverDirectory: './server' })
      .build();

    expect(pipeline.descriptor.name).toBe('kanban');
    expect(pipeline.descriptor.handlers).toHaveLength(3);
  });
});

describe('run() and awaitAll() - Scatter-Gather', () => {
  it('should return RunBuilder from TriggerBuilder.run()', () => {
    const builder = define('test')
      .on('BatchReady')
      .run([{ commandType: 'ProcessItem', data: { id: 1 } }]);

    expect(builder).toBeDefined();
    expect(typeof builder.awaitAll).toBe('function');
  });

  it('should accept static commands array in run()', () => {
    const pipeline = define('test')
      .on('StartBatch')
      .run([
        { commandType: 'TaskA', data: { id: 1 } },
        { commandType: 'TaskB', data: { id: 2 } },
      ])
      .awaitAll('byTaskId', (e: { data: { taskId: string } }) => e.data.taskId)
      .build();

    const handler = pipeline.descriptor.handlers[0] as RunAwaitHandlerDescriptor;
    expect(handler.commands).toHaveLength(2);
  });

  it('should accept command factory in run()', () => {
    type BatchEvent = { data: { items: Array<{ id: string }> } };
    const factory = (e: BatchEvent) =>
      e.data.items.map((item) => ({ commandType: 'ProcessItem', data: { itemId: item.id } }));

    const pipeline = define('test')
      .on('BatchReady')
      .run(factory)
      .awaitAll('byItem', (e: { data: { itemId: string } }) => e.data.itemId)
      .build();

    const handler = pipeline.descriptor.handlers[0] as RunAwaitHandlerDescriptor;
    expect(typeof handler.commands).toBe('function');
  });

  it('should configure awaitAll with key extractor', () => {
    const keyExtractor = (e: { data: { taskId: string } }) => e.data.taskId;

    const pipeline = define('test')
      .on('StartBatch')
      .run([{ commandType: 'ProcessItem', data: { items: [] } }])
      .awaitAll('byTask', keyExtractor)
      .build();

    const handler = pipeline.descriptor.handlers[0] as RunAwaitHandlerDescriptor;
    expect(handler.awaitConfig.key).toBe(keyExtractor);
    expect(handler.awaitConfig.keyName).toBe('byTask');
  });

  it('should support timeout in awaitAll', () => {
    const pipeline = define('test')
      .on('StartBatch')
      .run([{ commandType: 'ProcessItem', data: { items: [] } }])
      .awaitAll('byTask', (e: { data: { taskId: string } }) => e.data.taskId, { timeout: 30000 })
      .build();

    const handler = pipeline.descriptor.handlers[0] as RunAwaitHandlerDescriptor;
    expect(handler.awaitConfig.timeout).toBe(30000);
  });

  it('should configure onSuccess handler', () => {
    const pipeline = define('test')
      .on('StartBatch')
      .run([{ commandType: 'ProcessItem', data: { items: [] } }])
      .awaitAll('byTask', (e: { data: { taskId: string } }) => e.data.taskId)
      .onSuccess('BatchCompleted', (ctx) => ({
        results: ctx.results,
        duration: ctx.duration,
      }))
      .build();

    const handler = pipeline.descriptor.handlers[0] as RunAwaitHandlerDescriptor;
    expect(handler.onSuccess).toBeDefined();
    expect(handler.onSuccess?.eventType).toBe('BatchCompleted');
  });

  it('should configure onFailure handler', () => {
    const pipeline = define('test')
      .on('StartBatch')
      .run([{ commandType: 'ProcessItem', data: { items: [] } }])
      .awaitAll('byTask', (e: { data: { taskId: string } }) => e.data.taskId)
      .onFailure('BatchFailed', (ctx) => ({
        failedCount: ctx.failures.length,
        errors: ctx.failures.map((f) => f.error),
      }))
      .build();

    const handler = pipeline.descriptor.handlers[0] as RunAwaitHandlerDescriptor;
    expect(handler.onFailure).toBeDefined();
    expect(handler.onFailure?.eventType).toBe('BatchFailed');
  });

  it('should chain on() from GatherBuilder', () => {
    const pipeline = define('test')
      .on('StartBatch')
      .run([{ commandType: 'ProcessItem', data: { items: [] } }])
      .awaitAll('byTask', (e: { data: { taskId: string } }) => e.data.taskId)
      .onSuccess('BatchDone', () => ({}))
      .on('BatchDone')
      .emit('NotifyUser', { message: 'Complete' })
      .build();

    expect(pipeline.descriptor.handlers).toHaveLength(2);
  });

  it('should chain onSuccess and onFailure from GatherChain', () => {
    const pipeline = define('test')
      .on('StartBatch')
      .run([{ commandType: 'ProcessItem', data: {} }])
      .awaitAll('byTask', (e: { data: { taskId: string } }) => e.data.taskId)
      .onFailure('BatchFailed', (ctx) => ({ errors: ctx.failures }))
      .onSuccess('BatchDone', (ctx) => ({ count: ctx.results.length }))
      .build();

    const handler = pipeline.descriptor.handlers[0] as RunAwaitHandlerDescriptor;
    expect(handler.onSuccess?.eventType).toBe('BatchDone');
    expect(handler.onFailure?.eventType).toBe('BatchFailed');
  });

  it('should chain build() from GatherBuilder', () => {
    const pipeline = define('test')
      .on('StartBatch')
      .run([{ commandType: 'ProcessItem', data: { items: [] } }])
      .awaitAll('byTask', (e: { data: { taskId: string } }) => e.data.taskId)
      .build();

    expect(pipeline.descriptor.handlers).toHaveLength(1);
  });

  it('should create complete scatter-gather pipeline', () => {
    type BatchEvent = { data: { items: Array<{ id: string; priority: number }> } };
    type ResultEvent = { data: { itemId: string; result: unknown } };

    const pipeline = define('batch-processor')
      .version('1.0.0')
      .description('Process items in parallel with gather')
      .key('byItem', (e: ResultEvent) => e.data.itemId)
      .on('BatchReceived')
      .when((e: BatchEvent) => e.data.items.length > 0)
      .run((e: BatchEvent) =>
        e.data.items.map((item) => ({
          commandType: 'ProcessItem',
          data: { itemId: item.id, priority: item.priority },
        })),
      )
      .awaitAll('byItem', (e: ResultEvent) => e.data.itemId, { timeout: 60000 })
      .onSuccess('BatchCompleted', (ctx) => ({
        processedCount: ctx.results.length,
        totalDuration: ctx.duration,
      }))
      .onFailure('BatchFailed', (ctx) => ({
        failedItems: ctx.failures.map((f) => f.key),
        successCount: ctx.successes.length,
      }))
      .build();

    expect(pipeline.descriptor.name).toBe('batch-processor');
    expect(pipeline.descriptor.handlers).toHaveLength(1);
    const handler = pipeline.descriptor.handlers[0] as RunAwaitHandlerDescriptor;
    expect(handler.type).toBe('run-await');
    expect(handler.awaitConfig.timeout).toBe(60000);
    expect(handler.onSuccess?.eventType).toBe('BatchCompleted');
    expect(handler.onFailure?.eventType).toBe('BatchFailed');
  });
});

describe('forEach() and groupInto() - Phased Execution', () => {
  it('should return ForEachBuilder from TriggerBuilder.forEach()', () => {
    type ItemsEvent = { data: { items: Array<{ id: string }> } };
    const builder = define('test')
      .on('ItemsReady')
      .forEach((e: ItemsEvent) => e.data.items);

    expect(builder).toBeDefined();
    expect(typeof builder.groupInto).toBe('function');
  });

  it('should configure phases with groupInto()', () => {
    type Item = { id: string; type: 'critical' | 'normal' };
    const pipeline = define('test')
      .on('ItemsReady')
      .forEach((e: { data: { items: Item[] } }) => e.data.items)
      .groupInto(['critical', 'normal'], (item: Item) => item.type)
      .process('ProcessItem', (item: Item) => ({ itemId: item.id }))
      .onComplete({ success: 'Done', failure: 'Failed', itemKey: () => '' })
      .build();

    const handler = pipeline.descriptor.handlers[0] as ForEachPhasedDescriptor;
    expect(handler.phases).toEqual(['critical', 'normal']);
  });

  it('should configure emitFactory with process()', () => {
    type Item = { id: string };
    const pipeline = define('test')
      .on('ItemsReady')
      .forEach((e: { data: { items: Item[] } }) => e.data.items)
      .groupInto(['phase1'], () => 'phase1')
      .process('ProcessItem', (item: Item) => ({ itemId: item.id }))
      .onComplete({ success: 'Done', failure: 'Failed', itemKey: () => '' })
      .build();

    const handler = pipeline.descriptor.handlers[0] as ForEachPhasedDescriptor;
    expect(typeof handler.emitFactory).toBe('function');
  });

  it('should set stopOnFailure flag', () => {
    const pipeline = define('test')
      .on('ItemsReady')
      .forEach((e: { data: { items: unknown[] } }) => e.data.items)
      .groupInto(['phase1'], () => 'phase1')
      .process('ProcessItem', () => ({}))
      .stopOnFailure()
      .onComplete({ success: 'Done', failure: 'Failed', itemKey: () => '' })
      .build();

    const handler = pipeline.descriptor.handlers[0] as ForEachPhasedDescriptor;
    expect(handler.stopOnFailure).toBe(true);
  });

  it('should configure completion events', () => {
    type Item = { id: string };
    type ResultEvent = { data: { itemId: string } };
    const pipeline = define('test')
      .on('ItemsReady')
      .forEach((e: { data: { items: Item[] } }) => e.data.items)
      .groupInto(['phase1'], () => 'phase1')
      .process('ProcessItem', (item: Item) => ({ itemId: item.id }))
      .onComplete({
        success: 'AllItemsProcessed',
        failure: 'ProcessingFailed',
        itemKey: (e) => (e as unknown as ResultEvent).data.itemId,
      })
      .build();

    const handler = pipeline.descriptor.handlers[0] as ForEachPhasedDescriptor;
    expect(handler.completion.successEvent.name).toBe('AllItemsProcessed');
    expect(handler.completion.failureEvent.name).toBe('ProcessingFailed');
  });

  it('should chain on() from PhasedTerminal', () => {
    const pipeline = define('test')
      .on('ItemsReady')
      .forEach((e: { data: { items: unknown[] } }) => e.data.items)
      .groupInto(['phase1'], () => 'phase1')
      .process('ProcessItem', () => ({}))
      .onComplete({ success: 'Done', failure: 'Failed', itemKey: () => '' })
      .on('Done')
      .emit('Notify', {})
      .build();

    expect(pipeline.descriptor.handlers).toHaveLength(2);
  });

  it('should default stopOnFailure to false', () => {
    const pipeline = define('test')
      .on('ItemsReady')
      .forEach((e: { data: { items: unknown[] } }) => e.data.items)
      .groupInto(['phase1'], () => 'phase1')
      .process('ProcessItem', () => ({}))
      .onComplete({ success: 'Done', failure: 'Failed', itemKey: () => '' })
      .build();

    const handler = pipeline.descriptor.handlers[0] as ForEachPhasedDescriptor;
    expect(handler.stopOnFailure).toBe(false);
  });

  it('should create complete phased execution pipeline', () => {
    type Component = { path: string; priority: 'high' | 'medium' | 'low' };
    type ComponentEvent = { data: { components: Component[] } };
    type ResultEvent = { data: { componentPath: string } };

    const pipeline = define('component-processor')
      .version('1.0.0')
      .description('Process components in priority phases')
      .on('ComponentsGenerated')
      .when((e: ComponentEvent) => e.data.components.length > 0)
      .forEach((e: ComponentEvent) => e.data.components)
      .groupInto(['high', 'medium', 'low'], (c: Component) => c.priority)
      .process('ImplementComponent', (c: Component) => ({ componentPath: c.path }))
      .stopOnFailure()
      .onComplete({
        success: 'AllComponentsImplemented',
        failure: 'ComponentImplementationFailed',
        itemKey: (e) => (e as unknown as ResultEvent).data.componentPath,
      })
      .build();

    expect(pipeline.descriptor.name).toBe('component-processor');
    const handler = pipeline.descriptor.handlers[0] as ForEachPhasedDescriptor;
    expect(handler.type).toBe('foreach-phased');
    expect(handler.phases).toEqual(['high', 'medium', 'low']);
    expect(handler.stopOnFailure).toBe(true);
  });

  it('should throw when build() is called without onComplete()', () => {
    const chain = define('test')
      .on('ItemsReady')
      .forEach((e: { data: { items: unknown[] } }) => e.data.items)
      .groupInto(['phase1'], () => 'phase1')
      .process('ProcessItem', () => ({}));

    expect(() => chain.build()).toThrow('onComplete() must be called before build()');
  });
});

describe('handle() - Custom Handlers', () => {
  it('should capture custom handler', () => {
    const customHandler = async (e: { data: unknown }) => {
      console.log(e);
    };
    const pipeline = define('test').on('CustomEvent').handle(customHandler).build();

    const desc = pipeline.descriptor.handlers[0] as CustomHandlerDescriptor;
    expect(desc.type).toBe('custom');
    expect(desc.handler).toBe(customHandler);
  });

  it('should capture declaredEmits for graph introspection', () => {
    const pipeline = define('test')
      .on('CustomEvent')
      .handle(async () => {}, { emits: ['EventA', 'EventB'] })
      .build();

    const desc = pipeline.descriptor.handlers[0] as CustomHandlerDescriptor;
    expect(desc.declaredEmits).toEqual(['EventA', 'EventB']);
  });

  it('should chain on() from handle()', () => {
    const pipeline = define('test')
      .on('EventA')
      .handle(async () => {})
      .on('EventB')
      .emit('CommandB', {})
      .build();

    expect(pipeline.descriptor.handlers).toHaveLength(2);
  });
});
