import { PipelineServer } from '@auto-engineer/pipeline';
import { describe, expect, it } from 'vitest';
import { COMMANDS } from './index';

interface RegistryResponse {
  commandHandlers: string[];
  commandsWithMetadata: Array<{
    name: string;
    alias: string;
    description: string;
  }>;
}

interface CommandAck {
  status: string;
  commandId?: string;
}

interface StoredMessage {
  message: { type: string; data?: Record<string, unknown> };
  messageType: string;
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  return res.json() as Promise<T>;
}

describe('ProcessJobGraph E2E', () => {
  it('registry shows ProcessJobGraph command handler', async () => {
    const server = new PipelineServer({ port: 0 });
    server.registerCommandHandlers(COMMANDS);
    await server.start();

    const registry = await fetchJson<RegistryResponse>(`http://localhost:${server.port}/registry`);

    expect(registry.commandHandlers).toContain('ProcessJobGraph');
    expect(registry.commandsWithMetadata).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'ProcessJobGraph',
          alias: 'process:job-graph',
          description: 'Process a directed acyclic graph of jobs with dependency tracking and failure policies',
        }),
      ]),
    );

    await server.stop();
  });

  it('command dispatch returns ack and produces graph.dispatching event', async () => {
    const server = new PipelineServer({ port: 0 });
    server.registerCommandHandlers(COMMANDS);
    await server.start();

    const ack = await fetchJson<CommandAck>(`http://localhost:${server.port}/command`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'ProcessJobGraph',
        data: {
          graphId: 'e2e-g1',
          jobs: [{ id: 'a', dependsOn: [], target: 'build', payload: { src: './app' } }],
          failurePolicy: 'halt',
        },
      }),
    });

    expect(ack.status).toBe('ack');

    await new Promise((r) => setTimeout(r, 200));

    const messages = await fetchJson<StoredMessage[]>(`http://localhost:${server.port}/messages`);
    const eventTypes = messages.filter((m) => m.messageType === 'event').map((m) => m.message.type);

    expect(eventTypes).toContain('graph.dispatching');

    await server.stop();
  });

  it('full lifecycle produces graph.completed via correlation', async () => {
    const server = new PipelineServer({ port: 0 });
    server.registerCommandHandlers(COMMANDS);
    await server.start();

    const completed: Array<{ type: string; data: Record<string, unknown> }> = [];
    server.getMessageBus().subscribeToEvent('graph.completed', {
      name: 'e2e-completion-tracker',
      handle: (event) => {
        completed.push(event);
      },
    });

    await fetchJson<CommandAck>(`http://localhost:${server.port}/command`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'ProcessJobGraph',
        data: {
          graphId: 'e2e-g2',
          jobs: [{ id: 'a', dependsOn: [], target: 'build', payload: {} }],
          failurePolicy: 'halt',
        },
      }),
    });

    await new Promise((r) => setTimeout(r, 200));

    await server.getMessageBus().publishEvent({
      type: 'BuildCompleted',
      data: { output: 'ok' },
      correlationId: 'graph:e2e-g2:a',
    });

    await new Promise((r) => setTimeout(r, 100));

    expect(completed).toEqual([{ type: 'graph.completed', data: { graphId: 'e2e-g2' } }]);

    await server.stop();
  });
});
