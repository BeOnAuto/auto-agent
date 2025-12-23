import { define } from '../builder/define';
import type { GraphIR } from './types';

describe('GraphIR type', () => {
  it('should define GraphIR with nodes and edges', () => {
    const graph: GraphIR = {
      nodes: [
        { id: 'evt:Start', type: 'event', label: 'Start' },
        { id: 'cmd:Process', type: 'command', label: 'Process' },
      ],
      edges: [{ from: 'evt:Start', to: 'cmd:Process', label: 'triggers' }],
    };
    expect(graph.nodes).toHaveLength(2);
  });
});

describe('Pipeline.toGraph()', () => {
  it('should extract graph from emit handler', () => {
    const pipeline = define('test').on('Start').emit('Process', {}).build();

    const graph = pipeline.toGraph();
    expect(graph.nodes.some((n) => n.id === 'evt:Start')).toBe(true);
    expect(graph.nodes.some((n) => n.id === 'cmd:Process')).toBe(true);
  });

  it('should include edges from event to commands', () => {
    const pipeline = define('test').on('Start').emit('Process', {}).build();

    const graph = pipeline.toGraph();
    expect(graph.edges.some((e) => e.from === 'evt:Start' && e.to === 'cmd:Process')).toBe(true);
  });

  it('should extract graph from run-await handler', () => {
    const pipeline = define('test')
      .on('BatchReady')
      .run([{ commandType: 'ProcessItem', data: {} }])
      .awaitAll('byItem', () => 'key')
      .onSuccess('BatchComplete', () => ({}))
      .onFailure('BatchFailed', () => ({}))
      .build();

    const graph = pipeline.toGraph();
    expect(graph.nodes.some((n) => n.id === 'evt:BatchReady')).toBe(true);
    expect(graph.nodes.some((n) => n.id === 'cmd:ProcessItem')).toBe(true);
    expect(graph.nodes.some((n) => n.id === 'evt:BatchComplete')).toBe(true);
    expect(graph.nodes.some((n) => n.id === 'evt:BatchFailed')).toBe(true);
  });

  it('should extract graph from run-await handler with command factory', () => {
    type BatchEvent = { data: { items: Array<{ id: string }> } };
    const pipeline = define('test')
      .on('BatchReady')
      .run((e: BatchEvent) => e.data.items.map((item) => ({ commandType: 'ProcessItem', data: { id: item.id } })))
      .awaitAll('byItem', () => 'key')
      .build();

    const graph = pipeline.toGraph();
    expect(graph.nodes.some((n) => n.id === 'evt:BatchReady')).toBe(true);
    expect(graph.nodes).toHaveLength(1);
    expect(graph.edges).toHaveLength(0);
  });

  it('should extract graph from foreach-phased handler', () => {
    const pipeline = define('test')
      .on('ItemsReady')
      .forEach(() => [])
      .groupInto(['phase1'], () => 'phase1')
      .process('ProcessItem', () => ({}))
      .onComplete({ success: 'AllDone', failure: 'SomeFailed', itemKey: () => '' })
      .build();

    const graph = pipeline.toGraph();
    expect(graph.nodes.some((n) => n.id === 'evt:ItemsReady')).toBe(true);
    expect(graph.nodes.some((n) => n.id === 'cmd:ProcessItem')).toBe(true);
    expect(graph.nodes.some((n) => n.id === 'evt:AllDone')).toBe(true);
    expect(graph.nodes.some((n) => n.id === 'evt:SomeFailed')).toBe(true);
  });

  it('should include edges from command to onComplete success/failure events', () => {
    const pipeline = define('test')
      .on('ItemsReady')
      .forEach(() => [])
      .groupInto(['phase1'], () => 'phase1')
      .process('ProcessItem', () => ({}))
      .onComplete({ success: 'AllDone', failure: 'SomeFailed', itemKey: () => '' })
      .build();

    const graph = pipeline.toGraph();
    const hasSuccessEdge = graph.edges.some((e) => e.from === 'cmd:ProcessItem' && e.to === 'evt:AllDone');
    const hasFailureEdge = graph.edges.some((e) => e.from === 'cmd:ProcessItem' && e.to === 'evt:SomeFailed');
    expect(hasSuccessEdge).toBe(true);
    expect(hasFailureEdge).toBe(true);
  });

  it('should extract graph from custom handler using declaredEmits', () => {
    const pipeline = define('test')
      .on('CustomEvent')
      .handle(async () => {}, { emits: ['EventA', 'EventB'] })
      .build();

    const graph = pipeline.toGraph();
    expect(graph.nodes.some((n) => n.id === 'evt:CustomEvent')).toBe(true);
    expect(graph.nodes.some((n) => n.id === 'evt:EventA')).toBe(true);
    expect(graph.nodes.some((n) => n.id === 'evt:EventB')).toBe(true);
  });

  it('should extract graph from custom handler without declaredEmits', () => {
    const pipeline = define('test')
      .on('CustomEvent')
      .handle(async () => {})
      .build();

    const graph = pipeline.toGraph();
    expect(graph.nodes.some((n) => n.id === 'evt:CustomEvent')).toBe(true);
    expect(graph.nodes).toHaveLength(1);
  });

  it('should handle multiple handlers in pipeline', () => {
    const pipeline = define('test').on('Start').emit('ProcessA', {}).on('ProcessADone').emit('ProcessB', {}).build();

    const graph = pipeline.toGraph();
    expect(graph.nodes).toHaveLength(4);
    expect(graph.edges).toHaveLength(2);
  });

  it('should deduplicate nodes with same id', () => {
    const pipeline = define('test').on('Start').emit('Process', {}).on('Start').emit('OtherProcess', {}).build();

    const graph = pipeline.toGraph();
    const startNodes = graph.nodes.filter((n) => n.id === 'evt:Start');
    expect(startNodes).toHaveLength(1);
  });

  it('should create settled node with type settled', () => {
    const pipeline = define('test')
      .on('Start')
      .emit('CheckA', {})
      .settled(['CheckA'])
      .dispatch(() => {})
      .build();

    const graph = pipeline.toGraph();
    const settledNode = graph.nodes.find((n) => n.id.startsWith('settled:'));
    expect(settledNode).toBeDefined();
    expect(settledNode?.type).toBe('settled');
  });
});
