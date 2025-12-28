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
}

interface PipelineResponse {
  nodes: GraphNode[];
  edges: Array<{ from: string; to: string; backLink?: boolean }>;
  pipelineNodes?: unknown;
  commandToEvents?: Record<string, string[]>;
  eventToCommand?: Record<string, string>;
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

    it('should not include deprecated commandToEvents and eventToCommand fields', async () => {
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
      expect(data.commandToEvents).toBeUndefined();
      expect(data.eventToCommand).toBeUndefined();
      await server.stop();
    });

    it('should not include pipelineNodes in response', async () => {
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
      expect(data.pipelineNodes).toBeUndefined();
      expect(data.nodes).toBeDefined();
      expect(data.edges).toBeDefined();
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

  describe('GET /sessions', () => {
    it('should return sessions', async () => {
      const server = new PipelineServer({ port: 0 });
      await server.start();
      const data = await fetchAs<unknown[]>(`http://localhost:${server.port}/sessions`);
      expect(Array.isArray(data)).toBe(true);
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
});
