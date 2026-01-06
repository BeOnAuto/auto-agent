import { define } from '../builder/define';
import { PipelineServer } from './pipeline-server';

interface HealthResponse {
  status: string;
}

interface CommandMetadata {
  id: string;
  name: string;
  alias: string;
  description: string;
  fields: Record<string, unknown>;
  examples: unknown[];
}

interface RegistryResponse {
  eventHandlers: string[];
  commandHandlers: string[];
  commandsWithMetadata: CommandMetadata[];
  folds: string[];
}

interface GraphNode {
  id: string;
  type: string;
  label: string;
  status?: string;
  pendingCount?: number;
  endedCount?: number;
}

interface PipelineResponse {
  nodes: GraphNode[];
  edges: Array<{ from: string; to: string; backLink?: boolean }>;
  latestRun?: string;
}

interface GraphResponse {
  nodes: GraphNode[];
  edges: Array<{ from: string; to: string }>;
}

interface CommandResponse {
  status: string;
}

interface StoredMessage {
  message: { type: string };
}

interface StatsResponse {
  totalMessages: number;
}

async function fetchAs<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  return res.json() as Promise<T>;
}

async function fetchWithStatus(
  url: string,
  options?: RequestInit,
): Promise<{ status: number; json: <T>() => Promise<T> }> {
  const res = await fetch(url, options);
  return {
    status: res.status,
    json: <T>() => res.json() as Promise<T>,
  };
}

describe('PipelineServer', () => {
  describe('middleware', () => {
    it('should apply middleware before routes on start', async () => {
      const server = new PipelineServer({ port: 0 });
      server.use((_req, res, next) => {
        res.setHeader('X-Custom-Header', 'middleware-applied');
        next();
      });
      await server.start();
      const response = await fetch(`http://localhost:${server.port}/health`);
      expect(response.headers.get('X-Custom-Header')).toBe('middleware-applied');
      await server.stop();
    });

    it('should allow chaining use() calls', async () => {
      const server = new PipelineServer({ port: 0 });
      server
        .use((_req, res, next) => {
          res.setHeader('X-First', 'first');
          next();
        })
        .use((_req, res, next) => {
          res.setHeader('X-Second', 'second');
          next();
        });
      await server.start();
      const response = await fetch(`http://localhost:${server.port}/health`);
      expect(response.headers.get('X-First')).toBe('first');
      expect(response.headers.get('X-Second')).toBe('second');
      await server.stop();
    });
  });

  describe('health endpoint', () => {
    it('should respond to /health', async () => {
      const server = new PipelineServer({ port: 0 });
      await server.start();
      const data = await fetchAs<HealthResponse>(`http://localhost:${server.port}/health`);
      expect(data.status).toBe('healthy');
      await server.stop();
    });
  });

  describe('command handlers', () => {
    it('should register command handlers', () => {
      const handler = {
        name: 'Cmd',
        handle: async () => ({ type: 'Done', data: {} }),
      };
      const server = new PipelineServer({ port: 0 });
      server.registerCommandHandlers([handler]);
      expect(server.getRegisteredCommands()).toContain('Cmd');
    });
  });

  describe('pipeline registration', () => {
    it('should register pipeline', () => {
      const pipeline = define('test').on('A').emit('B', {}).build();
      const server = new PipelineServer({ port: 0 });
      server.registerPipeline(pipeline);
      expect(server.getPipelineNames()).toContain('test');
    });
  });

  describe('GET /registry', () => {
    it('should return registry with event handlers', async () => {
      const pipeline = define('test').on('Start').emit('Cmd', {}).build();
      const server = new PipelineServer({ port: 0 });
      server.registerPipeline(pipeline);
      await server.start();
      const data = await fetchAs<RegistryResponse>(`http://localhost:${server.port}/registry`);
      expect(data.eventHandlers).toContain('Start');
      await server.stop();
    });

    it('should return registry with command metadata defaults', async () => {
      const handler = {
        name: 'MinimalCmd',
        handle: async () => ({ type: 'Done', data: {} }),
      };
      const server = new PipelineServer({ port: 0 });
      server.registerCommandHandlers([handler]);
      await server.start();
      const data = await fetchAs<RegistryResponse>(`http://localhost:${server.port}/registry`);
      const metadata = data.commandsWithMetadata[0];
      expect(metadata.alias).toBe('MinimalCmd');
      expect(metadata.description).toBe('');
      expect(metadata.fields).toEqual({});
      expect(metadata.examples).toEqual([]);
      await server.stop();
    });

    it('should return registry with command metadata', async () => {
      const handler = {
        name: 'Cmd',
        alias: 'cmd',
        description: 'Test',
        fields: { x: 1 },
        examples: ['ex'],
        handle: async () => ({ type: 'Done', data: {} }),
      };
      const server = new PipelineServer({ port: 0 });
      server.registerCommandHandlers([handler]);
      await server.start();
      const data = await fetchAs<RegistryResponse>(`http://localhost:${server.port}/registry`);
      const metadata = data.commandsWithMetadata[0];
      expect(metadata.alias).toBe('cmd');
      expect(metadata.description).toBe('Test');
      expect(metadata.fields).toEqual({ x: 1 });
      expect(metadata.examples).toEqual(['ex']);
      await server.stop();
    });

    it('should return registry with folds array', async () => {
      const server = new PipelineServer({ port: 0 });
      await server.start();
      const data = await fetchAs<RegistryResponse>(`http://localhost:${server.port}/registry`);
      expect(data.folds).toEqual([]);
      await server.stop();
    });

    it('should exclude settled handlers from eventHandlers list', async () => {
      const handler = {
        name: 'CheckTests',
        events: ['TestsPassed'],
        handle: async () => ({ type: 'TestsPassed', data: {} }),
      };
      const pipeline = define('test')
        .on('Start')
        .emit('CheckTests', {})
        .settled(['CheckTests'])
        .dispatch({ dispatches: [] }, () => {})
        .build();
      const server = new PipelineServer({ port: 0 });
      server.registerCommandHandlers([handler]);
      server.registerPipeline(pipeline);
      await server.start();
      const data = await fetchAs<RegistryResponse>(`http://localhost:${server.port}/registry`);
      expect(data.eventHandlers).toContain('Start');
      expect(data.eventHandlers).not.toContain('settled:CheckTests');
      await server.stop();
    });
  });

  describe('GET /pipeline', () => {
    it('should return pipeline graph', async () => {
      const pipeline = define('test').on('Start').emit('Cmd', {}).build();
      const server = new PipelineServer({ port: 0 });
      server.registerPipeline(pipeline);
      await server.start();
      const data = await fetchAs<GraphResponse>(`http://localhost:${server.port}/pipeline`);
      expect(data.nodes.some((n) => n.id === 'evt:Start')).toBe(true);
      await server.stop();
    });

    it('should use displayName as label for command graph nodes', async () => {
      const handler = {
        name: 'Cmd',
        displayName: 'My Command',
        handle: async () => ({ type: 'Done', data: {} }),
      };
      const pipeline = define('test').on('Start').emit('Cmd', {}).build();
      const server = new PipelineServer({ port: 0 });
      server.registerCommandHandlers([handler]);
      server.registerPipeline(pipeline);
      await server.start();
      const data = await fetchAs<GraphResponse>(`http://localhost:${server.port}/pipeline`);
      const cmdNode = data.nodes.find((n) => n.id === 'cmd:Cmd');
      expect(cmdNode?.label).toBe('My Command');
      await server.stop();
    });

    it('should use command name as graph node label when displayName not provided', async () => {
      const handler = {
        name: 'SimpleCmd',
        handle: async () => ({ type: 'Done', data: {} }),
      };
      const pipeline = define('test').on('Start').emit('SimpleCmd', {}).build();
      const server = new PipelineServer({ port: 0 });
      server.registerCommandHandlers([handler]);
      server.registerPipeline(pipeline);
      await server.start();
      const data = await fetchAs<GraphResponse>(`http://localhost:${server.port}/pipeline`);
      const cmdNode = data.nodes.find((n) => n.id === 'cmd:SimpleCmd');
      expect(cmdNode?.label).toBe('SimpleCmd');
      await server.stop();
    });

    it('should filter out event nodes when excludeTypes=event', async () => {
      const pipeline = define('test').on('Start').emit('Cmd', {}).build();
      const server = new PipelineServer({ port: 0 });
      server.registerPipeline(pipeline);
      await server.start();
      const data = await fetchAs<GraphResponse>(`http://localhost:${server.port}/pipeline?excludeTypes=event`);
      expect(data.nodes.every((n) => n.type !== 'event')).toBe(true);
      await server.stop();
    });

    it('should reconnect edges when maintainEdges=true and filter commands', async () => {
      const pipeline = define('test').on('Start').emit('Process', {}).build();
      const server = new PipelineServer({ port: 0 });
      server.registerPipeline(pipeline);
      await server.start();
      const data = await fetchAs<GraphResponse>(
        `http://localhost:${server.port}/pipeline?excludeTypes=command&maintainEdges=true`,
      );
      expect(data.nodes.every((n) => n.type !== 'command')).toBe(true);
      expect(data.edges).toHaveLength(0);
      await server.stop();
    });

    it('should filter multiple node types', async () => {
      const pipeline = define('test')
        .on('Start')
        .emit('CheckA', {})
        .emit('CheckB', {})
        .settled(['CheckA', 'CheckB'])
        .dispatch({ dispatches: [] }, () => {})
        .build();
      const server = new PipelineServer({ port: 0 });
      server.registerPipeline(pipeline);
      await server.start();
      const data = await fetchAs<GraphResponse>(`http://localhost:${server.port}/pipeline?excludeTypes=event,settled`);
      expect(data.nodes.every((n) => n.type !== 'event' && n.type !== 'settled')).toBe(true);
      await server.stop();
    });

    it('should reconnect commands through events when filtering events with maintainEdges=true', async () => {
      const generateHandler = {
        name: 'Generate',
        events: ['Generated'],
        handle: async () => ({ type: 'Generated', data: {} }),
      };
      const pipeline = define('test').on('Start').emit('Generate', {}).on('Generated').emit('Process', {}).build();
      const server = new PipelineServer({ port: 0 });
      server.registerCommandHandlers([generateHandler]);
      server.registerPipeline(pipeline);
      await server.start();
      const data = await fetchAs<GraphResponse>(
        `http://localhost:${server.port}/pipeline?excludeTypes=event&maintainEdges=true`,
      );
      expect(data.nodes.every((n) => n.type !== 'event')).toBe(true);
      expect(data.edges.some((e) => e.from === 'cmd:Generate' && e.to === 'cmd:Process')).toBe(true);
      await server.stop();
    });

    it('should have status idle on command nodes by default', async () => {
      const handler = {
        name: 'Cmd',
        events: ['Done'],
        handle: async () => ({ type: 'Done', data: {} }),
      };
      const pipeline = define('test').on('Start').emit('Cmd', {}).build();
      const server = new PipelineServer({ port: 0 });
      server.registerCommandHandlers([handler]);
      server.registerPipeline(pipeline);
      await server.start();
      const data = await fetchAs<PipelineResponse>(`http://localhost:${server.port}/pipeline`);
      const cmdNode = data.nodes.find((n) => n.id === 'cmd:Cmd');
      expect(cmdNode?.status).toBe('idle');
      await server.stop();
    });

    it('should not have status on event nodes', async () => {
      const handler = {
        name: 'Cmd',
        events: ['Done'],
        handle: async () => ({ type: 'Done', data: {} }),
      };
      const pipeline = define('test').on('Start').emit('Cmd', {}).build();
      const server = new PipelineServer({ port: 0 });
      server.registerCommandHandlers([handler]);
      server.registerPipeline(pipeline);
      await server.start();
      const data = await fetchAs<PipelineResponse>(`http://localhost:${server.port}/pipeline`);
      const eventNode = data.nodes.find((n) => n.id === 'evt:Start');
      expect(eventNode?.status).toBeUndefined();
      await server.stop();
    });

    it('should have idle status on settled nodes when no correlationId provided', async () => {
      const handler = {
        name: 'CheckTests',
        events: ['TestsPassed'],
        handle: async () => ({ type: 'TestsPassed', data: {} }),
      };
      const pipeline = define('test')
        .on('Start')
        .emit('CheckTests', {})
        .settled(['CheckTests'])
        .dispatch({ dispatches: [] }, () => {})
        .build();
      const server = new PipelineServer({ port: 0 });
      server.registerCommandHandlers([handler]);
      server.registerPipeline(pipeline);
      await server.start();
      const data = await fetchAs<PipelineResponse>(`http://localhost:${server.port}/pipeline`);
      const settledNode = data.nodes.find((n) => n.id === 'settled:CheckTests');
      expect(settledNode?.status).toBe('idle');
      expect(settledNode?.pendingCount).toBe(0);
      expect(settledNode?.endedCount).toBe(0);
      await server.stop();
    });

    it('should have status from computeSettledStats on settled nodes when correlationId provided', async () => {
      const handler = {
        name: 'CheckTests',
        events: ['TestsPassed'],
        handle: async () => ({ type: 'TestsPassed', data: {} }),
      };
      const pipeline = define('test')
        .on('Start')
        .emit('CheckTests', {})
        .settled(['CheckTests'])
        .dispatch({ dispatches: [] }, () => {})
        .build();
      const server = new PipelineServer({ port: 0 });
      server.registerCommandHandlers([handler]);
      server.registerPipeline(pipeline);
      await server.start();

      const commandResponse = await fetchAs<{ correlationId: string }>(`http://localhost:${server.port}/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'CheckTests', data: {} }),
      });

      await new Promise((r) => setTimeout(r, 100));

      const data = await fetchAs<PipelineResponse>(
        `http://localhost:${server.port}/pipeline?correlationId=${commandResponse.correlationId}`,
      );
      const settledNode = data.nodes.find((n) => n.id === 'settled:CheckTests');
      expect(settledNode?.status).toBeDefined();
      expect(settledNode?.pendingCount).toBeDefined();
      expect(settledNode?.endedCount).toBeDefined();
      await server.stop();
    });

    it('should show running status for command being executed', async () => {
      let resolveHandler: () => void = () => {};
      const handlerPromise = new Promise<void>((resolve) => {
        resolveHandler = resolve;
      });
      const handler = {
        name: 'SlowCmd',
        events: ['Done'],
        handle: async () => {
          await handlerPromise;
          return { type: 'Done', data: {} };
        },
      };
      const pipeline = define('test').on('Start').emit('SlowCmd', {}).build();
      const server = new PipelineServer({ port: 0 });
      server.registerCommandHandlers([handler]);
      server.registerPipeline(pipeline);
      await server.start();

      const commandResponse = await fetchAs<{ correlationId: string }>(`http://localhost:${server.port}/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'SlowCmd', data: {} }),
      });

      await new Promise((r) => setTimeout(r, 50));

      const data = await fetchAs<PipelineResponse>(
        `http://localhost:${server.port}/pipeline?correlationId=${commandResponse.correlationId}`,
      );
      const cmdNode = data.nodes.find((n) => n.id === 'cmd:SlowCmd');
      expect(cmdNode?.status).toBe('running');

      resolveHandler();
      await server.stop();
    });

    it('should show success status after command completes with success event', async () => {
      const handler = {
        name: 'SuccessCmd',
        events: ['CmdCompleted'],
        handle: async () => ({ type: 'CmdCompleted', data: {} }),
      };
      const pipeline = define('test').on('Start').emit('SuccessCmd', {}).build();
      const server = new PipelineServer({ port: 0 });
      server.registerCommandHandlers([handler]);
      server.registerPipeline(pipeline);
      await server.start();

      const commandResponse = await fetchAs<{ correlationId: string }>(`http://localhost:${server.port}/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'SuccessCmd', data: {} }),
      });

      await new Promise((r) => setTimeout(r, 100));

      const data = await fetchAs<PipelineResponse>(
        `http://localhost:${server.port}/pipeline?correlationId=${commandResponse.correlationId}`,
      );
      const cmdNode = data.nodes.find((n) => n.id === 'cmd:SuccessCmd');
      expect(cmdNode?.status).toBe('success');
      await server.stop();
    });

    it('should show error status after command completes with failed event', async () => {
      const handler = {
        name: 'FailCmd',
        events: ['CmdFailed'],
        handle: async () => ({ type: 'CmdFailed', data: { error: 'Something went wrong' } }),
      };
      const pipeline = define('test').on('Start').emit('FailCmd', {}).build();
      const server = new PipelineServer({ port: 0 });
      server.registerCommandHandlers([handler]);
      server.registerPipeline(pipeline);
      await server.start();

      const commandResponse = await fetchAs<{ correlationId: string }>(`http://localhost:${server.port}/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'FailCmd', data: {} }),
      });

      await new Promise((r) => setTimeout(r, 100));

      const data = await fetchAs<PipelineResponse>(
        `http://localhost:${server.port}/pipeline?correlationId=${commandResponse.correlationId}`,
      );
      const cmdNode = data.nodes.find((n) => n.id === 'cmd:FailCmd');
      expect(cmdNode?.status).toBe('error');
      await server.stop();
    });

    it('should broadcast PipelineRunStarted event when new correlationId is first seen', async () => {
      const handler = {
        name: 'StartCmd',
        events: ['Started'],
        handle: async () => ({ type: 'Started', data: {} }),
      };
      const pipeline = define('test').on('Trigger').emit('StartCmd', {}).build();
      const server = new PipelineServer({ port: 0 });
      server.registerCommandHandlers([handler]);
      server.registerPipeline(pipeline);
      await server.start();

      const commandResponse = await fetchAs<{ correlationId: string }>(`http://localhost:${server.port}/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'StartCmd', data: {} }),
      });

      await new Promise((r) => setTimeout(r, 100));

      const msgs = await fetchAs<StoredMessage[]>(`http://localhost:${server.port}/messages`);
      const pipelineRunStarted = msgs.find((m) => m.message.type === 'PipelineRunStarted');
      expect(pipelineRunStarted).toBeDefined();
      expect((pipelineRunStarted?.message as { correlationId?: string }).correlationId).toBe(
        commandResponse.correlationId,
      );
      expect((pipelineRunStarted?.message as { data?: { triggerCommand?: string } }).data?.triggerCommand).toBe(
        'StartCmd',
      );
      await server.stop();
    });

    it('should broadcast NodeStatusChanged event when command starts running', async () => {
      const handler = {
        name: 'RunCmd',
        events: ['RunDone'],
        handle: async () => ({ type: 'RunDone', data: {} }),
      };
      const pipeline = define('test').on('Trigger').emit('RunCmd', {}).build();
      const server = new PipelineServer({ port: 0 });
      server.registerCommandHandlers([handler]);
      server.registerPipeline(pipeline);
      await server.start();

      const commandResponse = await fetchAs<{ correlationId: string }>(`http://localhost:${server.port}/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'RunCmd', data: {} }),
      });

      await new Promise((r) => setTimeout(r, 100));

      const msgs = await fetchAs<StoredMessage[]>(`http://localhost:${server.port}/messages`);
      type NodeStatusChangedMessage = {
        type: string;
        correlationId?: string;
        data?: { nodeId?: string; status?: string; previousStatus?: string };
      };
      const nodeStatusChanged = msgs.filter((m) => m.message.type === 'NodeStatusChanged');
      const runningEvent = nodeStatusChanged.find(
        (m) => (m.message as NodeStatusChangedMessage).data?.status === 'running',
      );
      expect(runningEvent).toBeDefined();
      expect((runningEvent?.message as NodeStatusChangedMessage).data?.nodeId).toBe('cmd:RunCmd');
      expect((runningEvent?.message as NodeStatusChangedMessage).data?.previousStatus).toBe('idle');
      expect((runningEvent?.message as NodeStatusChangedMessage).correlationId).toBe(commandResponse.correlationId);
      await server.stop();
    });

    it('should broadcast NodeStatusChanged event when command completes', async () => {
      const handler = {
        name: 'CompleteCmd',
        events: ['CompleteDone'],
        handle: async () => ({ type: 'CompleteDone', data: {} }),
      };
      const pipeline = define('test').on('Trigger').emit('CompleteCmd', {}).build();
      const server = new PipelineServer({ port: 0 });
      server.registerCommandHandlers([handler]);
      server.registerPipeline(pipeline);
      await server.start();

      const commandResponse = await fetchAs<{ correlationId: string }>(`http://localhost:${server.port}/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'CompleteCmd', data: {} }),
      });

      await new Promise((r) => setTimeout(r, 100));

      const msgs = await fetchAs<StoredMessage[]>(`http://localhost:${server.port}/messages`);
      type NodeStatusChangedMessage = {
        type: string;
        correlationId?: string;
        data?: { nodeId?: string; status?: string; previousStatus?: string };
      };
      const nodeStatusChanged = msgs.filter((m) => m.message.type === 'NodeStatusChanged');
      const successEvent = nodeStatusChanged.find(
        (m) => (m.message as NodeStatusChangedMessage).data?.status === 'success',
      );
      expect(successEvent).toBeDefined();
      expect((successEvent?.message as NodeStatusChangedMessage).data?.nodeId).toBe('cmd:CompleteCmd');
      expect((successEvent?.message as NodeStatusChangedMessage).data?.previousStatus).toBe('running');
      expect((successEvent?.message as NodeStatusChangedMessage).correlationId).toBe(commandResponse.correlationId);
      await server.stop();
    });

    it('should persist status across multiple /pipeline calls', async () => {
      const handler = {
        name: 'PersistCmd',
        events: ['PersistDone'],
        handle: async () => ({ type: 'PersistDone', data: {} }),
      };
      const pipeline = define('test').on('Trigger').emit('PersistCmd', {}).build();
      const server = new PipelineServer({ port: 0 });
      server.registerCommandHandlers([handler]);
      server.registerPipeline(pipeline);
      await server.start();

      const commandResponse = await fetchAs<{ correlationId: string }>(`http://localhost:${server.port}/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'PersistCmd', data: {} }),
      });

      await new Promise((r) => setTimeout(r, 100));

      const firstCall = await fetchAs<PipelineResponse>(
        `http://localhost:${server.port}/pipeline?correlationId=${commandResponse.correlationId}`,
      );
      expect(firstCall.nodes.find((n) => n.id === 'cmd:PersistCmd')?.status).toBe('success');

      const secondCall = await fetchAs<PipelineResponse>(
        `http://localhost:${server.port}/pipeline?correlationId=${commandResponse.correlationId}`,
      );
      expect(secondCall.nodes.find((n) => n.id === 'cmd:PersistCmd')?.status).toBe('success');

      await server.stop();
    });

    it('should track status independently for different correlationIds', async () => {
      const handler = {
        name: 'IndependentCmd',
        events: ['IndependentDone'],
        handle: async () => ({ type: 'IndependentDone', data: {} }),
      };
      const pipeline = define('test').on('Trigger').emit('IndependentCmd', {}).build();
      const server = new PipelineServer({ port: 0 });
      server.registerCommandHandlers([handler]);
      server.registerPipeline(pipeline);
      await server.start();

      const run1 = await fetchAs<{ correlationId: string }>(`http://localhost:${server.port}/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'IndependentCmd', data: {} }),
      });

      const run2 = await fetchAs<{ correlationId: string }>(`http://localhost:${server.port}/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'IndependentCmd', data: {} }),
      });

      await new Promise((r) => setTimeout(r, 100));

      expect(run1.correlationId).not.toBe(run2.correlationId);

      const pipeline1 = await fetchAs<PipelineResponse>(
        `http://localhost:${server.port}/pipeline?correlationId=${run1.correlationId}`,
      );
      const pipeline2 = await fetchAs<PipelineResponse>(
        `http://localhost:${server.port}/pipeline?correlationId=${run2.correlationId}`,
      );

      expect(pipeline1.nodes.find((n) => n.id === 'cmd:IndependentCmd')?.status).toBe('success');
      expect(pipeline2.nodes.find((n) => n.id === 'cmd:IndependentCmd')?.status).toBe('success');

      await server.stop();
    });

    it('should show idle status for all command nodes when no correlationId provided', async () => {
      const handler = {
        name: 'IdleCmd',
        events: ['IdleDone'],
        handle: async () => ({ type: 'IdleDone', data: {} }),
      };
      const pipeline = define('test').on('Trigger').emit('IdleCmd', {}).build();
      const server = new PipelineServer({ port: 0 });
      server.registerCommandHandlers([handler]);
      server.registerPipeline(pipeline);
      await server.start();

      await fetchAs<{ correlationId: string }>(`http://localhost:${server.port}/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'IdleCmd', data: {} }),
      });

      await new Promise((r) => setTimeout(r, 100));

      const pipelineWithoutCorrelation = await fetchAs<PipelineResponse>(`http://localhost:${server.port}/pipeline`);
      const cmdNode = pipelineWithoutCorrelation.nodes.find((n) => n.id === 'cmd:IdleCmd');
      expect(cmdNode?.status).toBe('idle');

      await server.stop();
    });

    it('should return latestRun with the most recent correlationId', async () => {
      const handler = {
        name: 'LatestCmd',
        events: ['LatestDone'],
        handle: async () => ({ type: 'LatestDone', data: {} }),
      };
      const pipeline = define('test').on('Trigger').emit('LatestCmd', {}).build();
      const server = new PipelineServer({ port: 0 });
      server.registerCommandHandlers([handler]);
      server.registerPipeline(pipeline);
      await server.start();

      const run1 = await fetchAs<{ correlationId: string }>(`http://localhost:${server.port}/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'LatestCmd', data: {} }),
      });

      await new Promise((r) => setTimeout(r, 50));

      const run2 = await fetchAs<{ correlationId: string }>(`http://localhost:${server.port}/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'LatestCmd', data: {} }),
      });

      await new Promise((r) => setTimeout(r, 50));

      const data = await fetchAs<PipelineResponse>(`http://localhost:${server.port}/pipeline`);
      expect(data.latestRun).toBe(run2.correlationId);
      expect(data.latestRun).not.toBe(run1.correlationId);

      await server.stop();
    });
  });

  describe('POST /command', () => {
    it('should accept command', async () => {
      const handler = {
        name: 'Cmd',
        handle: async () => ({ type: 'Done', data: {} }),
      };
      const server = new PipelineServer({ port: 0 });
      server.registerCommandHandlers([handler]);
      await server.start();
      const data = await fetchAs<CommandResponse>(`http://localhost:${server.port}/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'Cmd', data: {} }),
      });
      expect(data.status).toBe('ack');
      await server.stop();
    });

    it('should return 404 for unknown command', async () => {
      const server = new PipelineServer({ port: 0 });
      await server.start();
      const res = await fetchWithStatus(`http://localhost:${server.port}/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'UnknownCmd', data: {} }),
      });
      expect(res.status).toBe(404);
      const data = await res.json<CommandResponse>();
      expect(data.status).toBe('nack');
      await server.stop();
    });

    it('should handle command that returns multiple events', async () => {
      const handler = {
        name: 'Multi',
        handle: async () => [
          { type: 'EventA', data: { a: 1 } },
          { type: 'EventB', data: { b: 2 } },
        ],
      };
      const server = new PipelineServer({ port: 0 });
      server.registerCommandHandlers([handler]);
      await server.start();
      await fetch(`http://localhost:${server.port}/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'Multi', data: {} }),
      });
      await new Promise((r) => setTimeout(r, 100));
      const msgs = await fetchAs<StoredMessage[]>(`http://localhost:${server.port}/messages`);
      expect(msgs.some((m) => m.message.type === 'EventA')).toBe(true);
      expect(msgs.some((m) => m.message.type === 'EventB')).toBe(true);
      await server.stop();
    });
  });

  describe('GET /messages', () => {
    it('should return messages', async () => {
      const server = new PipelineServer({ port: 0 });
      await server.start();
      const data = await fetchAs<StoredMessage[]>(`http://localhost:${server.port}/messages`);
      expect(Array.isArray(data)).toBe(true);
      await server.stop();
    });
  });

  describe('GET /stats', () => {
    it('should return stats', async () => {
      const server = new PipelineServer({ port: 0 });
      await server.start();
      const data = await fetchAs<StatsResponse>(`http://localhost:${server.port}/stats`);
      expect(data.totalMessages).toBeDefined();
      await server.stop();
    });
  });

  describe('event routing', () => {
    it('should route events through pipeline', async () => {
      const handler = {
        name: 'Init',
        handle: async () => ({ type: 'Ready', data: {} }),
      };
      const pipeline = define('test').on('Ready').emit('Next', {}).build();
      const server = new PipelineServer({ port: 0 });
      server.registerCommandHandlers([handler]);
      server.registerPipeline(pipeline);
      await server.start();
      await fetch(`http://localhost:${server.port}/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'Init', data: {} }),
      });
      await new Promise((r) => setTimeout(r, 100));
      const msgs = await fetchAs<StoredMessage[]>(`http://localhost:${server.port}/messages`);
      expect(msgs.some((m) => m.message.type === 'Next')).toBe(true);
      await server.stop();
    });

    it('should handle custom handler that emits events', async () => {
      const handler = {
        name: 'Start',
        handle: async () => ({ type: 'Started', data: {} }),
      };
      const pipeline = define('test')
        .on('Started')
        .handle(async (_e, ctx) => {
          await ctx.emit('CustomEvent', { emitted: true });
        })
        .build();
      const server = new PipelineServer({ port: 0 });
      server.registerCommandHandlers([handler]);
      server.registerPipeline(pipeline);
      await server.start();
      await fetch(`http://localhost:${server.port}/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'Start', data: {} }),
      });
      await new Promise((r) => setTimeout(r, 100));
      const msgs = await fetchAs<StoredMessage[]>(`http://localhost:${server.port}/messages`);
      expect(msgs.some((m) => m.message.type === 'CustomEvent')).toBe(true);
      await server.stop();
    });
  });

  describe('GET /pipeline/mermaid', () => {
    it('should return mermaid diagram as text', async () => {
      const pipeline = define('test').on('Start').emit('Process', {}).build();
      const server = new PipelineServer({ port: 0 });
      server.registerPipeline(pipeline);
      await server.start();
      const res = await fetch(`http://localhost:${server.port}/pipeline/mermaid`);
      expect(res.headers.get('content-type')).toContain('text/plain');
      const mermaid = await res.text();
      expect(mermaid).toContain('flowchart LR');
      await server.stop();
    });

    it('should filter out event nodes when excludeTypes=event', async () => {
      const pipeline = define('test').on('Start').emit('Process', {}).build();
      const server = new PipelineServer({ port: 0 });
      server.registerPipeline(pipeline);
      await server.start();
      const res = await fetch(`http://localhost:${server.port}/pipeline/mermaid?excludeTypes=event`);
      const mermaid = await res.text();
      expect(mermaid).not.toContain('evt_Start');
      expect(mermaid).toContain('Process[Process]');
      await server.stop();
    });

    it('should filter out settled nodes when excludeTypes=settled', async () => {
      const checkAHandler = {
        name: 'CheckA',
        events: ['CheckAPassed', 'CheckAFailed'],
        handle: async () => ({ type: 'CheckAPassed', data: {} }),
      };
      const pipeline = define('test')
        .on('Start')
        .emit('CheckA', {})
        .settled(['CheckA'])
        .dispatch({ dispatches: [] }, () => {})
        .build();
      const server = new PipelineServer({ port: 0 });
      server.registerCommandHandlers([checkAHandler]);
      server.registerPipeline(pipeline);
      await server.start();
      const res = await fetch(`http://localhost:${server.port}/pipeline/mermaid?excludeTypes=settled`);
      const mermaid = await res.text();
      expect(mermaid).not.toContain('settled_');
      expect(mermaid).toContain('CheckA');
      await server.stop();
    });

    it('should use displayName as label for command nodes in mermaid diagram', async () => {
      const handler = {
        name: 'Cmd',
        displayName: 'My Command',
        handle: async () => ({ type: 'Done', data: {} }),
      };
      const pipeline = define('test').on('Start').emit('Cmd', {}).build();
      const server = new PipelineServer({ port: 0 });
      server.registerCommandHandlers([handler]);
      server.registerPipeline(pipeline);
      await server.start();
      const res = await fetch(`http://localhost:${server.port}/pipeline/mermaid`);
      const mermaid = await res.text();
      expect(mermaid).toContain('Cmd[My Command]');
      await server.stop();
    });

    it('should include event nodes in mermaid diagram', async () => {
      const pipeline = define('test').on('Start').emit('Process', {}).build();
      const server = new PipelineServer({ port: 0 });
      server.registerPipeline(pipeline);
      await server.start();
      const res = await fetch(`http://localhost:${server.port}/pipeline/mermaid`);
      const mermaid = await res.text();
      expect(mermaid).toContain('evt_Start');
      await server.stop();
    });

    it('should use displayName as label for event nodes in mermaid diagram', async () => {
      const handler = {
        name: 'Cmd',
        events: [{ name: 'CmdCompleted', displayName: 'Command Completed' }],
        handle: async () => ({ type: 'CmdCompleted', data: {} }),
      };
      const nextHandler = {
        name: 'NextCmd',
        handle: async () => ({ type: 'Done', data: {} }),
      };
      const pipeline = define('test').on('Start').emit('Cmd', {}).on('CmdCompleted').emit('NextCmd', {}).build();
      const server = new PipelineServer({ port: 0 });
      server.registerCommandHandlers([handler, nextHandler]);
      server.registerPipeline(pipeline);
      await server.start();
      const res = await fetch(`http://localhost:${server.port}/pipeline/mermaid`);
      const mermaid = await res.text();
      expect(mermaid).toContain('evt_CmdCompleted([Command Completed])');
      await server.stop();
    });

    it('should include command nodes in mermaid diagram', async () => {
      const pipeline = define('test').on('Start').emit('Process', {}).build();
      const server = new PipelineServer({ port: 0 });
      server.registerPipeline(pipeline);
      await server.start();
      const res = await fetch(`http://localhost:${server.port}/pipeline/mermaid`);
      const mermaid = await res.text();
      expect(mermaid).toContain('Process[Process]');
      await server.stop();
    });

    it('should include edges in mermaid diagram', async () => {
      const pipeline = define('test').on('Start').emit('Process', {}).build();
      const server = new PipelineServer({ port: 0 });
      server.registerPipeline(pipeline);
      await server.start();
      const res = await fetch(`http://localhost:${server.port}/pipeline/mermaid`);
      const mermaid = await res.text();
      expect(mermaid).toContain('-->');
      await server.stop();
    });

    it('should style commands as blue and events as orange', async () => {
      const pipeline = define('test').on('Start').emit('Process', {}).build();
      const server = new PipelineServer({ port: 0 });
      server.registerPipeline(pipeline);
      await server.start();
      const res = await fetch(`http://localhost:${server.port}/pipeline/mermaid`);
      const mermaid = await res.text();
      expect(mermaid).toContain('classDef event fill:#fff3e0,stroke:#e65100');
      expect(mermaid).toContain('classDef command fill:#e3f2fd,stroke:#1565c0');
      await server.stop();
    });

    it('should style failed events with red text', async () => {
      const handler = {
        name: 'Gen',
        events: ['GenDone', 'GenFailed'],
        handle: async () => ({ type: 'GenDone', data: {} }),
      };
      const retryHandler = {
        name: 'Retry',
        events: ['RetryDone'],
        handle: async () => ({ type: 'RetryDone', data: {} }),
      };
      const pipeline = define('test').on('Start').emit('Gen', {}).on('GenFailed').emit('Retry', {}).build();
      const server = new PipelineServer({ port: 0 });
      server.registerCommandHandlers([handler, retryHandler]);
      server.registerPipeline(pipeline);
      await server.start();
      const res = await fetch(`http://localhost:${server.port}/pipeline/mermaid`);
      const mermaid = await res.text();
      expect(mermaid).toContain('classDef eventFailed fill:#fff3e0,stroke:#e65100,color:#d32f2f');
      expect(mermaid).toContain('class evt_GenFailed eventFailed');
      await server.stop();
    });

    it('should include edges from commands to their pipeline events only', async () => {
      const handler = {
        name: 'Gen',
        events: ['GenDone', 'GenFailed'],
        handle: async () => ({ type: 'GenDone', data: {} }),
      };
      const nextHandler = {
        name: 'Next',
        events: ['NextDone'],
        handle: async () => ({ type: 'NextDone', data: {} }),
      };
      const pipeline = define('test').on('Start').emit('Gen', {}).on('GenDone').emit('Next', {}).build();
      const server = new PipelineServer({ port: 0 });
      server.registerCommandHandlers([handler, nextHandler]);
      server.registerPipeline(pipeline);
      await server.start();
      const res = await fetch(`http://localhost:${server.port}/pipeline/mermaid`);
      const mermaid = await res.text();
      expect(mermaid).toContain('Gen --> evt_GenDone');
      expect(mermaid).not.toContain('GenFailed');
      await server.stop();
    });

    it('should show complete flow from event to command with command events', async () => {
      const genHandler = {
        name: 'GenerateServer',
        events: ['ServerGenerated', 'SliceGenerated'],
        handle: async () => ({ type: 'ServerGenerated', data: {} }),
      };
      const iaHandler = {
        name: 'GenerateIA',
        events: ['IAGenerated'],
        handle: async () => ({ type: 'IAGenerated', data: {} }),
      };
      const implHandler = {
        name: 'ImplementSlice',
        events: ['SliceImplemented'],
        handle: async () => ({ type: 'SliceImplemented', data: {} }),
      };
      const pipeline = define('test')
        .on('SchemaExported')
        .emit('GenerateServer', {})
        .on('ServerGenerated')
        .emit('GenerateIA', {})
        .on('SliceGenerated')
        .emit('ImplementSlice', {})
        .build();
      const server = new PipelineServer({ port: 0 });
      server.registerCommandHandlers([genHandler, iaHandler, implHandler]);
      server.registerPipeline(pipeline);
      await server.start();
      const res = await fetch(`http://localhost:${server.port}/pipeline/mermaid`);
      const mermaid = await res.text();
      expect(mermaid).toContain('evt_SchemaExported --> GenerateServer');
      expect(mermaid).toContain('GenerateServer --> evt_ServerGenerated');
      expect(mermaid).toContain('GenerateServer --> evt_SliceGenerated');
      await server.stop();
    });

    it('should only show commands and events that are used in the pipeline', async () => {
      const usedHandler = {
        name: 'UsedCommand',
        events: ['UsedEvent'],
        handle: async () => ({ type: 'UsedEvent', data: {} }),
      };
      const unusedHandler = {
        name: 'UnusedCommand',
        events: ['UnusedEvent', 'AnotherUnusedEvent'],
        handle: async () => ({ type: 'UnusedEvent', data: {} }),
      };
      const nextHandler = {
        name: 'NextCommand',
        events: ['NextDone'],
        handle: async () => ({ type: 'NextDone', data: {} }),
      };
      const pipeline = define('test')
        .on('TriggerEvent')
        .emit('UsedCommand', {})
        .on('UsedEvent')
        .emit('NextCommand', {})
        .build();
      const server = new PipelineServer({ port: 0 });
      server.registerCommandHandlers([usedHandler, unusedHandler, nextHandler]);
      server.registerPipeline(pipeline);
      await server.start();
      const res = await fetch(`http://localhost:${server.port}/pipeline/mermaid`);
      const mermaid = await res.text();
      expect(mermaid).toContain('evt_TriggerEvent');
      expect(mermaid).toContain('UsedCommand');
      expect(mermaid).toContain('evt_UsedEvent');
      expect(mermaid).not.toContain('UnusedCommand');
      expect(mermaid).not.toContain('UnusedEvent');
      expect(mermaid).not.toContain('AnotherUnusedEvent');
      await server.stop();
    });

    it('should only show events that have handlers in the pipeline, not unhandled command events', async () => {
      const startHandler = {
        name: 'StartServer',
        events: ['ServerStarted', 'ServerStartFailed'],
        handle: async () => ({ type: 'ServerStarted', data: {} }),
      };
      const processHandler = {
        name: 'ProcessRequest',
        events: ['RequestProcessed'],
        handle: async () => ({ type: 'RequestProcessed', data: {} }),
      };
      const pipeline = define('test')
        .on('TriggerEvent')
        .emit('StartServer', {})
        .on('ServerStarted')
        .emit('ProcessRequest', {})
        .build();
      const server = new PipelineServer({ port: 0 });
      server.registerCommandHandlers([startHandler, processHandler]);
      server.registerPipeline(pipeline);
      await server.start();
      const res = await fetch(`http://localhost:${server.port}/pipeline/mermaid`);
      const mermaid = await res.text();
      expect(mermaid).toContain('evt_ServerStarted');
      expect(mermaid).toContain('StartServer --> evt_ServerStarted');
      expect(mermaid).not.toContain('ServerStartFailed');
      await server.stop();
    });

    it('should show edges from commands to settled node', async () => {
      const checkAHandler = {
        name: 'CheckA',
        events: ['CheckAPassed', 'CheckAFailed'],
        handle: async () => ({ type: 'CheckAPassed', data: {} }),
      };
      const checkBHandler = {
        name: 'CheckB',
        events: ['CheckBPassed', 'CheckBFailed'],
        handle: async () => ({ type: 'CheckBPassed', data: {} }),
      };
      const pipeline = define('test')
        .on('Start')
        .emit('CheckA', {})
        .emit('CheckB', {})
        .settled(['CheckA', 'CheckB'])
        .dispatch({ dispatches: [] }, () => {})
        .build();
      const server = new PipelineServer({ port: 0 });
      server.registerCommandHandlers([checkAHandler, checkBHandler]);
      server.registerPipeline(pipeline);
      await server.start();
      const res = await fetch(`http://localhost:${server.port}/pipeline/mermaid`);
      const mermaid = await res.text();
      expect(mermaid).toContain('CheckA --> settled_CheckA_CheckB');
      expect(mermaid).toContain('CheckB --> settled_CheckA_CheckB');
      await server.stop();
    });

    it('should show edges from settled node to dispatched commands', async () => {
      const checkHandler = {
        name: 'CheckA',
        events: ['CheckAPassed', 'CheckAFailed'],
        handle: async () => ({ type: 'CheckAPassed', data: {} }),
      };
      const retryHandler = {
        name: 'RetryCommand',
        events: ['RetryDone'],
        handle: async () => ({ type: 'RetryDone', data: {} }),
      };
      const pipeline = define('test')
        .on('Start')
        .emit('CheckA', {})
        .settled(['CheckA'])
        .dispatch({ dispatches: ['RetryCommand'] }, () => {})
        .build();
      const server = new PipelineServer({ port: 0 });
      server.registerCommandHandlers([checkHandler, retryHandler]);
      server.registerPipeline(pipeline);
      await server.start();
      const res = await fetch(`http://localhost:${server.port}/pipeline/mermaid`);
      const mermaid = await res.text();
      expect(mermaid).toContain('settled_CheckA -.->|retry| RetryCommand');
      await server.stop();
    });

    it('should style backLink edges in red', async () => {
      const checkHandler = {
        name: 'CheckA',
        events: ['CheckAPassed', 'CheckAFailed'],
        handle: async () => ({ type: 'CheckAPassed', data: {} }),
      };
      const retryHandler = {
        name: 'RetryCommand',
        events: ['RetryDone'],
        handle: async () => ({ type: 'RetryDone', data: {} }),
      };
      const pipeline = define('test')
        .on('Start')
        .emit('CheckA', {})
        .settled(['CheckA'])
        .dispatch({ dispatches: ['RetryCommand'] }, () => {})
        .build();
      const server = new PipelineServer({ port: 0 });
      server.registerCommandHandlers([checkHandler, retryHandler]);
      server.registerPipeline(pipeline);
      await server.start();
      const res = await fetch(`http://localhost:${server.port}/pipeline/mermaid`);
      const mermaid = await res.text();
      expect(mermaid).toContain('linkStyle');
      expect(mermaid).toMatch(/stroke:#[a-fA-F0-9]{6}|stroke:red/);
      await server.stop();
    });

    it('should mark event-to-command edges as backLink when they create cycles', async () => {
      const generateHandler = {
        name: 'GenerateIA',
        events: ['IAGenerated', 'IAValidationFailed'],
        handle: async () => ({ type: 'IAGenerated', data: {} }),
      };
      const pipeline = define('test')
        .on('Start')
        .emit('GenerateIA', {})
        .on('IAValidationFailed')
        .emit('GenerateIA', {})
        .build();
      const server = new PipelineServer({ port: 0 });
      server.registerCommandHandlers([generateHandler]);
      server.registerPipeline(pipeline);
      await server.start();
      const data = await fetchAs<PipelineResponse>(`http://localhost:${server.port}/pipeline`);
      const backLinkEdge = data.edges.find((e) => e.from === 'evt:IAValidationFailed' && e.to === 'cmd:GenerateIA');
      expect(backLinkEdge).toBeDefined();
      expect(backLinkEdge?.backLink).toBe(true);
      await server.stop();
    });

    it('should NOT mark forward edges as backLink when cycle is broken by settled dispatch', async () => {
      const implHandler = {
        name: 'ImplementSlice',
        events: ['SliceImplemented'],
        handle: async () => ({ type: 'SliceImplemented', data: {} }),
      };
      const checkHandler = {
        name: 'CheckTests',
        events: ['TestsCheckPassed', 'TestsCheckFailed'],
        handle: async () => ({ type: 'TestsCheckPassed', data: {} }),
      };
      const pipeline = define('test')
        .on('Start')
        .emit('ImplementSlice', {})
        .on('SliceImplemented')
        .emit('CheckTests', {})
        .settled(['CheckTests'])
        .dispatch({ dispatches: ['ImplementSlice'] }, () => {})
        .build();
      const server = new PipelineServer({ port: 0 });
      server.registerCommandHandlers([implHandler, checkHandler]);
      server.registerPipeline(pipeline);
      await server.start();
      const data = await fetchAs<PipelineResponse>(`http://localhost:${server.port}/pipeline`);
      const forwardEdge = data.edges.find((e) => e.from === 'evt:SliceImplemented' && e.to === 'cmd:CheckTests');
      expect(forwardEdge).toBeDefined();
      expect(forwardEdge?.backLink).toBeUndefined();
      await server.stop();
    });

    it('should handle diamond graph patterns when detecting backlinks', async () => {
      const cmdAHandler = {
        name: 'CmdA',
        events: ['EventA'],
        handle: async () => ({ type: 'EventA', data: {} }),
      };
      const cmdBHandler = {
        name: 'CmdB',
        events: ['EventB'],
        handle: async () => ({ type: 'EventB', data: {} }),
      };
      const cmdCHandler = {
        name: 'CmdC',
        events: ['EventC'],
        handle: async () => ({ type: 'EventC', data: {} }),
      };
      const cmdDHandler = {
        name: 'CmdD',
        events: ['EventD'],
        handle: async () => ({ type: 'EventD', data: {} }),
      };
      const pipeline = define('test')
        .on('Start')
        .emit('CmdA', {})
        .on('EventA')
        .emit('CmdB', {})
        .on('EventA')
        .emit('CmdC', {})
        .on('EventB')
        .emit('CmdD', {})
        .on('EventC')
        .emit('CmdD', {})
        .on('EventD')
        .emit('CmdA', {})
        .build();
      const server = new PipelineServer({ port: 0 });
      server.registerCommandHandlers([cmdAHandler, cmdBHandler, cmdCHandler, cmdDHandler]);
      server.registerPipeline(pipeline);
      await server.start();
      const data = await fetchAs<PipelineResponse>(`http://localhost:${server.port}/pipeline`);
      const backLinkEdge = data.edges.find((e) => e.from === 'evt:EventD' && e.to === 'cmd:CmdA');
      expect(backLinkEdge).toBeDefined();
      expect(backLinkEdge?.backLink).toBe(true);
      await server.stop();
    });

    it('should add event nodes from settled handler commandToEvents when not already added', async () => {
      const checkAHandler = {
        name: 'CheckA',
        events: ['CheckAPassed', 'CheckAFailed'],
        handle: async () => ({ type: 'CheckAPassed', data: {} }),
      };
      const checkBHandler = {
        name: 'CheckB',
        events: ['CheckBPassed', 'CheckBFailed'],
        handle: async () => ({ type: 'CheckBPassed', data: {} }),
      };
      const pipeline = define('test')
        .on('Start')
        .emit('CheckA', {})
        .emit('CheckB', {})
        .settled(['CheckA', 'CheckB'])
        .dispatch({ dispatches: [] }, () => {})
        .build();
      const server = new PipelineServer({ port: 0 });
      server.registerCommandHandlers([checkAHandler, checkBHandler]);
      server.registerPipeline(pipeline);
      await server.start();
      const res = await fetch(`http://localhost:${server.port}/pipeline/mermaid`);
      const mermaid = await res.text();
      expect(mermaid).toContain('evt_CheckAPassed');
      expect(mermaid).toContain('evt_CheckAFailed');
      expect(mermaid).toContain('evt_CheckBPassed');
      expect(mermaid).toContain('evt_CheckBFailed');
      await server.stop();
    });
  });

  describe('GET /pipeline/diagram', () => {
    it('should return HTML content type', async () => {
      const pipeline = define('test').on('Start').emit('Process', {}).build();
      const server = new PipelineServer({ port: 0 });
      server.registerPipeline(pipeline);
      await server.start();
      const res = await fetch(`http://localhost:${server.port}/pipeline/diagram`);
      expect(res.headers.get('content-type')).toContain('text/html');
      await server.stop();
    });

    it('should filter nodes when excludeTypes is provided', async () => {
      const pipeline = define('test').on('Start').emit('Process', {}).build();
      const server = new PipelineServer({ port: 0 });
      server.registerPipeline(pipeline);
      await server.start();
      const res = await fetch(`http://localhost:${server.port}/pipeline/diagram?excludeTypes=event`);
      const html = await res.text();
      expect(html).not.toContain('evt_Start');
      expect(html).toContain('Process');
      await server.stop();
    });

    it('should include mermaid.js script', async () => {
      const pipeline = define('test').on('Start').emit('Process', {}).build();
      const server = new PipelineServer({ port: 0 });
      server.registerPipeline(pipeline);
      await server.start();
      const res = await fetch(`http://localhost:${server.port}/pipeline/diagram`);
      const html = await res.text();
      expect(html).toContain('mermaid');
      await server.stop();
    });

    it('should include the pipeline mermaid definition', async () => {
      const pipeline = define('test').on('Start').emit('Process', {}).build();
      const server = new PipelineServer({ port: 0 });
      server.registerPipeline(pipeline);
      await server.start();
      const res = await fetch(`http://localhost:${server.port}/pipeline/diagram`);
      const html = await res.text();
      expect(html).toContain('flowchart LR');
      expect(html).toContain('evt_Start');
      await server.stop();
    });

    it('should have a valid HTML structure', async () => {
      const pipeline = define('test').on('Start').emit('Process', {}).build();
      const server = new PipelineServer({ port: 0 });
      server.registerPipeline(pipeline);
      await server.start();
      const res = await fetch(`http://localhost:${server.port}/pipeline/diagram`);
      const html = await res.text();
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html');
      expect(html).toContain('</html>');
      await server.stop();
    });
  });

  describe('item-level tracking', () => {
    it('should extract itemKey from command data using registered extractor', async () => {
      const handler = {
        name: 'ImplementSlice',
        events: ['SliceImplemented'],
        handle: async () => ({ type: 'SliceImplemented', data: {} }),
      };
      const pipeline = define('test').on('Trigger').emit('ImplementSlice', {}).build();
      const server = new PipelineServer({ port: 0 });
      server.registerCommandHandlers([handler]);
      server.registerPipeline(pipeline);
      server.registerItemKeyExtractor('ImplementSlice', (d) => (d as { slicePath?: string }).slicePath);
      await server.start();

      const commandResponse = await fetchAs<{ correlationId: string }>(`http://localhost:${server.port}/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'ImplementSlice', data: { slicePath: '/server/slice-1' } }),
      });

      await new Promise((r) => setTimeout(r, 100));

      const data = await fetchAs<PipelineResponse>(
        `http://localhost:${server.port}/pipeline?correlationId=${commandResponse.correlationId}`,
      );
      const cmdNode = data.nodes.find((n) => n.id === 'cmd:ImplementSlice');
      expect(cmdNode?.pendingCount).toBe(0);
      expect(cmdNode?.endedCount).toBe(1);

      await server.stop();
    });

    it('should count multiple parallel items correctly', async () => {
      const handler = {
        name: 'ImplementSlice',
        events: ['SliceImplemented'],
        handle: async () => ({ type: 'SliceImplemented', data: {} }),
      };
      const pipeline = define('test').on('Trigger').emit('ImplementSlice', {}).build();
      const server = new PipelineServer({ port: 0 });
      server.registerCommandHandlers([handler]);
      server.registerPipeline(pipeline);
      server.registerItemKeyExtractor('ImplementSlice', (d) => (d as { slicePath?: string }).slicePath);
      await server.start();

      const correlationId = `corr-parallel-test`;

      await Promise.all([
        fetch(`http://localhost:${server.port}/command`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'ImplementSlice',
            data: { slicePath: '/server/slice-1' },
            correlationId,
          }),
        }),
        fetch(`http://localhost:${server.port}/command`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'ImplementSlice',
            data: { slicePath: '/server/slice-2' },
            correlationId,
          }),
        }),
        fetch(`http://localhost:${server.port}/command`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'ImplementSlice',
            data: { slicePath: '/server/slice-3' },
            correlationId,
          }),
        }),
      ]);

      await new Promise((r) => setTimeout(r, 100));

      const data = await fetchAs<PipelineResponse>(
        `http://localhost:${server.port}/pipeline?correlationId=${correlationId}`,
      );
      const cmdNode = data.nodes.find((n) => n.id === 'cmd:ImplementSlice');
      expect(cmdNode?.pendingCount).toBe(0);
      expect(cmdNode?.endedCount).toBe(3);

      await server.stop();
    });

    it('should show pending count while commands are running', async () => {
      const resolveHandlers: Array<() => void> = [];
      const handler = {
        name: 'SlowSlice',
        events: ['SlowSliceDone'],
        handle: async () => {
          await new Promise<void>((resolve) => {
            resolveHandlers.push(resolve);
          });
          return { type: 'SlowSliceDone', data: {} };
        },
      };
      const pipeline = define('test').on('Trigger').emit('SlowSlice', {}).build();
      const server = new PipelineServer({ port: 0 });
      server.registerCommandHandlers([handler]);
      server.registerPipeline(pipeline);
      server.registerItemKeyExtractor('SlowSlice', (d) => (d as { id?: string }).id);
      await server.start();

      const correlationId = `corr-slow-test`;

      void fetch(`http://localhost:${server.port}/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'SlowSlice', data: { id: 'item-1' }, correlationId }),
      });
      void fetch(`http://localhost:${server.port}/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'SlowSlice', data: { id: 'item-2' }, correlationId }),
      });
      void fetch(`http://localhost:${server.port}/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'SlowSlice', data: { id: 'item-3' }, correlationId }),
      });

      await new Promise((r) => setTimeout(r, 50));

      const midwayData = await fetchAs<PipelineResponse>(
        `http://localhost:${server.port}/pipeline?correlationId=${correlationId}`,
      );
      const midwayNode = midwayData.nodes.find((n) => n.id === 'cmd:SlowSlice');
      expect(midwayNode?.pendingCount).toBe(3);
      expect(midwayNode?.endedCount).toBe(0);
      expect(midwayNode?.status).toBe('running');

      resolveHandlers.forEach((r) => r());
      await new Promise((r) => setTimeout(r, 50));

      const finalData = await fetchAs<PipelineResponse>(
        `http://localhost:${server.port}/pipeline?correlationId=${correlationId}`,
      );
      const finalNode = finalData.nodes.find((n) => n.id === 'cmd:SlowSlice');
      expect(finalNode?.pendingCount).toBe(0);
      expect(finalNode?.endedCount).toBe(3);
      expect(finalNode?.status).toBe('success');

      await server.stop();
    });

    it('should show error status when any item fails', async () => {
      const handler = {
        name: 'MixedSlice',
        events: ['MixedSliceDone', 'MixedSliceFailed'],
        handle: async (cmd: { data: { shouldFail?: boolean } }) => {
          if (cmd.data.shouldFail === true) {
            return { type: 'MixedSliceFailed', data: {} };
          }
          return { type: 'MixedSliceDone', data: {} };
        },
      };
      const pipeline = define('test').on('Trigger').emit('MixedSlice', {}).build();
      const server = new PipelineServer({ port: 0 });
      server.registerCommandHandlers([handler]);
      server.registerPipeline(pipeline);
      server.registerItemKeyExtractor('MixedSlice', (d) => (d as { id?: string }).id);
      await server.start();

      const correlationId = `corr-mixed-test`;

      await Promise.all([
        fetch(`http://localhost:${server.port}/command`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'MixedSlice', data: { id: 'pass-1' }, correlationId }),
        }),
        fetch(`http://localhost:${server.port}/command`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'MixedSlice', data: { id: 'fail-1', shouldFail: true }, correlationId }),
        }),
        fetch(`http://localhost:${server.port}/command`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'MixedSlice', data: { id: 'pass-2' }, correlationId }),
        }),
      ]);

      await new Promise((r) => setTimeout(r, 100));

      const data = await fetchAs<PipelineResponse>(
        `http://localhost:${server.port}/pipeline?correlationId=${correlationId}`,
      );
      const cmdNode = data.nodes.find((n) => n.id === 'cmd:MixedSlice');
      expect(cmdNode?.pendingCount).toBe(0);
      expect(cmdNode?.endedCount).toBe(3);
      expect(cmdNode?.status).toBe('error');

      await server.stop();
    });

    it('should reset item to running when retry command arrives for same itemKey', async () => {
      let attemptCount = 0;
      const handler = {
        name: 'RetrySlice',
        events: ['RetrySliceDone', 'RetrySliceFailed'],
        handle: async () => {
          attemptCount++;
          if (attemptCount === 1) {
            return { type: 'RetrySliceFailed', data: {} };
          }
          return { type: 'RetrySliceDone', data: {} };
        },
      };
      const pipeline = define('test').on('Trigger').emit('RetrySlice', {}).build();
      const server = new PipelineServer({ port: 0 });
      server.registerCommandHandlers([handler]);
      server.registerPipeline(pipeline);
      server.registerItemKeyExtractor('RetrySlice', (d) => (d as { slicePath?: string }).slicePath);
      await server.start();

      const correlationId = `corr-retry-test`;
      const slicePath = '/server/retry-slice';

      await fetch(`http://localhost:${server.port}/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'RetrySlice', data: { slicePath }, correlationId }),
      });
      await new Promise((r) => setTimeout(r, 50));

      const afterFailure = await fetchAs<PipelineResponse>(
        `http://localhost:${server.port}/pipeline?correlationId=${correlationId}`,
      );
      expect(afterFailure.nodes.find((n) => n.id === 'cmd:RetrySlice')?.status).toBe('error');

      await fetch(`http://localhost:${server.port}/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'RetrySlice', data: { slicePath }, correlationId }),
      });
      await new Promise((r) => setTimeout(r, 50));

      const afterRetry = await fetchAs<PipelineResponse>(
        `http://localhost:${server.port}/pipeline?correlationId=${correlationId}`,
      );
      const node = afterRetry.nodes.find((n) => n.id === 'cmd:RetrySlice');
      expect(node?.status).toBe('success');
      expect(node?.pendingCount).toBe(0);
      expect(node?.endedCount).toBe(1);

      await server.stop();
    });

    it('should include pendingCount and endedCount in NodeStatusChanged events', async () => {
      const handler = {
        name: 'CountSlice',
        events: ['CountSliceDone'],
        handle: async () => ({ type: 'CountSliceDone', data: {} }),
      };
      const pipeline = define('test').on('Trigger').emit('CountSlice', {}).build();
      const server = new PipelineServer({ port: 0 });
      server.registerCommandHandlers([handler]);
      server.registerPipeline(pipeline);
      server.registerItemKeyExtractor('CountSlice', (d) => (d as { id?: string }).id);
      await server.start();

      const correlationId = `corr-counts-event-test`;

      await fetch(`http://localhost:${server.port}/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'CountSlice', data: { id: 'item-1' }, correlationId }),
      });

      await new Promise((r) => setTimeout(r, 100));

      const msgs = await fetchAs<StoredMessage[]>(`http://localhost:${server.port}/messages`);
      type NodeStatusChangedMessage = {
        type: string;
        correlationId?: string;
        data?: {
          nodeId?: string;
          status?: string;
          previousStatus?: string;
          pendingCount?: number;
          endedCount?: number;
        };
      };
      const nodeStatusChanged = msgs.filter((m) => m.message.type === 'NodeStatusChanged');
      const successEvent = nodeStatusChanged.find(
        (m) => (m.message as NodeStatusChangedMessage).data?.status === 'success',
      );
      expect(successEvent).toBeDefined();
      expect((successEvent?.message as NodeStatusChangedMessage).data?.pendingCount).toBe(0);
      expect((successEvent?.message as NodeStatusChangedMessage).data?.endedCount).toBe(1);

      await server.stop();
    });

    it('should use requestId as fallback when no itemKey extractor is registered', async () => {
      const handler = {
        name: 'NoExtractorCmd',
        events: ['NoExtractorDone'],
        handle: async () => ({ type: 'NoExtractorDone', data: {} }),
      };
      const pipeline = define('test').on('Trigger').emit('NoExtractorCmd', {}).build();
      const server = new PipelineServer({ port: 0 });
      server.registerCommandHandlers([handler]);
      server.registerPipeline(pipeline);
      await server.start();

      const correlationId = `corr-no-extractor-test`;

      await fetch(`http://localhost:${server.port}/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'NoExtractorCmd', data: {}, correlationId }),
      });

      await new Promise((r) => setTimeout(r, 100));

      const data = await fetchAs<PipelineResponse>(
        `http://localhost:${server.port}/pipeline?correlationId=${correlationId}`,
      );
      const cmdNode = data.nodes.find((n) => n.id === 'cmd:NoExtractorCmd');
      expect(cmdNode?.pendingCount).toBe(0);
      expect(cmdNode?.endedCount).toBe(1);
      expect(cmdNode?.status).toBe('success');

      await server.stop();
    });

    it('should show idle status with zero counts when no correlationId provided', async () => {
      const handler = {
        name: 'IdleCountCmd',
        events: ['IdleCountDone'],
        handle: async () => ({ type: 'IdleCountDone', data: {} }),
      };
      const pipeline = define('test').on('Trigger').emit('IdleCountCmd', {}).build();
      const server = new PipelineServer({ port: 0 });
      server.registerCommandHandlers([handler]);
      server.registerPipeline(pipeline);
      await server.start();

      const data = await fetchAs<PipelineResponse>(`http://localhost:${server.port}/pipeline`);
      const cmdNode = data.nodes.find((n) => n.id === 'cmd:IdleCountCmd');
      expect(cmdNode?.status).toBe('idle');
      expect(cmdNode?.pendingCount).toBe(0);
      expect(cmdNode?.endedCount).toBe(0);

      await server.stop();
    });

    it('documents behavior: status remains error after retry without itemKey extractor (fix: register extractor)', async () => {
      let callCount = 0;
      const handler = {
        name: 'RetryNoExtractor',
        events: ['RetryNoExtractorDone', 'RetryNoExtractorFailed'],
        handle: async () => {
          callCount++;
          if (callCount === 1) {
            return { type: 'RetryNoExtractorFailed', data: {} };
          }
          return { type: 'RetryNoExtractorDone', data: {} };
        },
      };
      const pipeline = define('test').on('Trigger').emit('RetryNoExtractor', {}).build();
      const server = new PipelineServer({ port: 0 });
      server.registerCommandHandlers([handler]);
      server.registerPipeline(pipeline);
      await server.start();

      const correlationId = `corr-retry-no-extractor-bug`;

      await fetch(`http://localhost:${server.port}/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'RetryNoExtractor', data: { targetDir: '/slice1' }, correlationId }),
      });
      await new Promise((r) => setTimeout(r, 50));

      const afterFailure = await fetchAs<PipelineResponse>(
        `http://localhost:${server.port}/pipeline?correlationId=${correlationId}`,
      );
      expect(afterFailure.nodes.find((n) => n.id === 'cmd:RetryNoExtractor')?.status).toBe('error');

      await fetch(`http://localhost:${server.port}/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'RetryNoExtractor', data: { targetDir: '/slice1' }, correlationId }),
      });
      await new Promise((r) => setTimeout(r, 50));

      const afterRetry = await fetchAs<PipelineResponse>(
        `http://localhost:${server.port}/pipeline?correlationId=${correlationId}`,
      );
      const node = afterRetry.nodes.find((n) => n.id === 'cmd:RetryNoExtractor');
      expect(node?.status).toBe('error');
      expect(node?.endedCount).toBe(2);

      await server.stop();
    });
  });

  describe('integration', () => {
    it('should execute complete workflow', async () => {
      const handler = {
        name: 'Gen',
        alias: 'gen',
        description: '',
        fields: {},
        examples: [],
        events: ['Done'],
        handle: async () => ({ type: 'Done', data: { id: '1' } }),
      };
      const pipeline = define('wf')
        .on('Done')
        .emit('Process', (e: { data: { id: string } }) => ({ x: e.data.id }))
        .build();
      const server = new PipelineServer({ port: 0 });
      server.registerCommandHandlers([handler]);
      server.registerPipeline(pipeline);
      await server.start();
      await fetch(`http://localhost:${server.port}/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'Gen', data: {} }),
      });
      await new Promise((r) => setTimeout(r, 200));
      const msgs = await fetchAs<StoredMessage[]>(`http://localhost:${server.port}/messages`);
      expect(msgs.some((m) => m.message.type === 'Process')).toBe(true);
      await server.stop();
    });
  });

  describe('GET /events', () => {
    it('should accept SSE connections', async () => {
      const server = new PipelineServer({ port: 0 });
      await server.start();

      const controller = new AbortController();
      const responsePromise = fetch(`http://localhost:${server.port}/events`, {
        signal: controller.signal,
      });

      await new Promise((r) => setTimeout(r, 50));
      controller.abort();

      try {
        await responsePromise;
      } catch {
        // AbortError expected
      }

      await server.stop();
    });

    it('should accept SSE connections with correlationId filter', async () => {
      const server = new PipelineServer({ port: 0 });
      await server.start();

      const controller = new AbortController();
      const responsePromise = fetch(`http://localhost:${server.port}/events?correlationId=test-123`, {
        signal: controller.signal,
      });

      await new Promise((r) => setTimeout(r, 50));
      controller.abort();

      try {
        await responsePromise;
      } catch {
        // AbortError expected
      }

      await server.stop();
    });
  });

  describe('phased execution', () => {
    it('should emit phased execution events when foreach-phased handler runs', async () => {
      type Component = { path: string; priority: 'high' | 'medium' | 'low' };
      type ComponentEvent = { data: { components: Component[] } };
      type ResultEvent = { data: { componentPath: string } };

      const generateHandler = {
        name: 'GenerateComponents',
        events: ['ComponentsGenerated'],
        handle: async () => ({
          type: 'ComponentsGenerated',
          data: { components: [{ path: '/comp/a.tsx', priority: 'high' }] },
        }),
      };

      const implementHandler = {
        name: 'ImplementComponent',
        events: ['ComponentImplemented'],
        handle: async (cmd: { data: { componentPath: string } }) => ({
          type: 'ComponentImplemented',
          data: { componentPath: cmd.data.componentPath },
        }),
      };

      const pipeline = define('test')
        .on('ComponentsGenerated')
        .forEach((e: ComponentEvent) => e.data.components)
        .groupInto(['high', 'medium', 'low'], (c: Component) => c.priority)
        .process('ImplementComponent', (c: Component) => ({ componentPath: c.path }))
        .onComplete({
          success: 'AllComponentsImplemented',
          failure: 'ComponentImplementationFailed',
          itemKey: (e: ResultEvent) => e.data.componentPath,
        })
        .build();

      const server = new PipelineServer({ port: 0 });
      server.registerCommandHandlers([generateHandler, implementHandler]);
      server.registerPipeline(pipeline);
      await server.start();

      await fetch(`http://localhost:${server.port}/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'GenerateComponents', data: {} }),
      });

      await new Promise((r) => setTimeout(r, 300));
      await server.stop();
    });
  });

  describe('POST /execute', () => {
    it('should call handler and return event directly', async () => {
      const handler = {
        name: 'TestCmd',
        handle: async () => ({ type: 'TestDone', data: { result: 'success' } }),
      };
      const server = new PipelineServer({ port: 0 });
      server.registerCommandHandlers([handler]);
      await server.start();

      const response = await fetch(`http://localhost:${server.port}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: 'TestCmd', payload: { input: 'test' } }),
      });

      const data = (await response.json()) as { event: string; data: Record<string, unknown> };
      expect(response.status).toBe(200);
      expect(data).toEqual({ event: 'TestDone', data: { result: 'success' } });

      await server.stop();
    });

    it('should return 400 for unknown command', async () => {
      const server = new PipelineServer({ port: 0 });
      await server.start();

      const response = await fetch(`http://localhost:${server.port}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: 'NonExistentCmd', payload: {} }),
      });

      const data = (await response.json()) as { error: string };
      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Unknown command: NonExistentCmd' });

      await server.stop();
    });

    it('should return first event when handler returns array', async () => {
      const handler = {
        name: 'MultiEventCmd',
        handle: async () => [
          { type: 'FirstEvent', data: { order: 1 } },
          { type: 'SecondEvent', data: { order: 2 } },
        ],
      };
      const server = new PipelineServer({ port: 0 });
      server.registerCommandHandlers([handler]);
      await server.start();

      const response = await fetch(`http://localhost:${server.port}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: 'MultiEventCmd', payload: {} }),
      });

      const data = (await response.json()) as { event: string; data: Record<string, unknown> };
      expect(response.status).toBe(200);
      expect(data).toEqual({ event: 'FirstEvent', data: { order: 1 } });

      await server.stop();
    });
  });
});
