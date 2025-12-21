import type { EmitHandlerDescriptor } from '../core/descriptors';
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
    expect(pipeline.descriptor.handlers[0].predicate).toBe(predicate);
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
