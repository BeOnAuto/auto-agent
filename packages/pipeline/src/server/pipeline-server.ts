import express from 'express';
import cors from 'cors';
import { createServer, type Server as HttpServer } from 'http';
import getPort from 'get-port';
import { nanoid } from 'nanoid';
import {
  createMessageBus,
  type MessageBus,
  type Event,
  type Command,
  type CommandHandler,
} from '@auto-engineer/message-bus';
import { MemoryMessageStore, type ILocalMessageStore } from '@auto-engineer/message-store';
import type { Pipeline } from '../builder/define';
import { PipelineRuntime } from '../runtime/pipeline-runtime';
import type { PipelineContext } from '../runtime/context';
import type { GraphIR } from '../graph/types';

export interface CommandHandlerWithMetadata extends CommandHandler {
  alias?: string;
  description?: string;
  fields?: Record<string, unknown>;
  examples?: unknown[];
  events?: string[];
}

export interface PipelineServerConfig {
  port: number;
  messageStore?: ILocalMessageStore;
}

interface EventWithCorrelation extends Event {
  correlationId: string;
}

export class PipelineServer {
  private app: express.Application;
  private httpServer: HttpServer;
  private messageBus: MessageBus;
  private messageStore: ILocalMessageStore;
  private readonly commandHandlers: Map<string, CommandHandlerWithMetadata> = new Map();
  private readonly pipelines: Map<string, Pipeline> = new Map();
  private readonly runtimes: Map<string, PipelineRuntime> = new Map();
  private actualPort: number;
  private readonly requestedPort: number;
  private currentSessionId?: string;

  constructor(config: PipelineServerConfig) {
    this.requestedPort = config.port;
    this.actualPort = config.port;
    this.app = express();
    this.app.use(cors());
    this.app.use(express.json());
    this.httpServer = createServer(this.app);
    this.messageBus = createMessageBus();
    this.messageStore = config.messageStore ?? new MemoryMessageStore();
    this.setupRoutes();
  }

  get port(): number {
    return this.actualPort;
  }

  registerCommandHandlers(handlers: CommandHandlerWithMetadata[]): void {
    for (const handler of handlers) {
      this.commandHandlers.set(handler.name, handler);
      this.messageBus.registerCommandHandler(handler);
    }
  }

  getRegisteredCommands(): string[] {
    return Array.from(this.commandHandlers.keys());
  }

  registerPipeline(pipeline: Pipeline): void {
    this.pipelines.set(pipeline.descriptor.name, pipeline);
    this.runtimes.set(pipeline.descriptor.name, new PipelineRuntime(pipeline.descriptor));
  }

  getPipelineNames(): string[] {
    return Array.from(this.pipelines.keys());
  }

  async start(): Promise<void> {
    if (this.requestedPort === 0) {
      this.actualPort = await getPort();
    }

    this.currentSessionId = await this.messageStore.createSession();

    await new Promise<void>((resolve) => {
      this.httpServer.listen(this.actualPort, () => {
        resolve();
      });
    });
  }

  async stop(): Promise<void> {
    if (this.currentSessionId !== undefined) {
      await this.messageStore.endSession(this.currentSessionId);
    }
    await new Promise<void>((resolve) => {
      this.httpServer.close(() => resolve());
    });
  }

  private setupRoutes(): void {
    this.app.get('/health', (_req, res) => {
      res.json({
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      });
    });

    this.app.get('/registry', (_req, res) => {
      const eventHandlers: string[] = [];
      for (const pipeline of this.pipelines.values()) {
        for (const handler of pipeline.descriptor.handlers) {
          if (!eventHandlers.includes(handler.eventType)) {
            eventHandlers.push(handler.eventType);
          }
        }
      }

      const commandsWithMetadata = Array.from(this.commandHandlers.entries()).map(([name, handler]) => {
        const alias = handler.alias ?? name;
        const description = handler.description ?? '';
        const fields = handler.fields ?? {};
        const examples = handler.examples ?? [];
        return { id: alias, name, alias, description, fields, examples };
      });

      res.json({
        eventHandlers,
        commandHandlers: Array.from(this.commandHandlers.keys()),
        commandsWithMetadata,
      });
    });

    this.app.get('/pipeline', (_req, res) => {
      const combinedGraph: GraphIR = { nodes: [], edges: [] };
      const nodeSet = new Set<string>();

      for (const pipeline of this.pipelines.values()) {
        const graph = pipeline.toGraph();
        for (const node of graph.nodes) {
          if (!nodeSet.has(node.id)) {
            nodeSet.add(node.id);
            combinedGraph.nodes.push(node);
          }
        }
        combinedGraph.edges.push(...graph.edges);
      }

      res.json(combinedGraph);
    });

    this.app.post('/command', (req, res) => {
      void (async () => {
        const command = req.body as Command;

        if (!this.commandHandlers.has(command.type)) {
          res.status(404).json({
            status: 'nack',
            error: `Command handler not found: ${command.type}`,
          });
          return;
        }

        const requestId = command.requestId ?? `req-${nanoid()}`;
        const correlationId = command.correlationId ?? `corr-${nanoid()}`;
        const commandWithIds: Command & { correlationId: string; requestId: string } = {
          ...command,
          requestId,
          correlationId,
        };

        await this.messageStore.saveMessage('$all', commandWithIds, undefined, 'command');

        void this.processCommand(commandWithIds);

        res.json({
          status: 'ack',
          commandId: commandWithIds.requestId,
          timestamp: new Date().toISOString(),
        });
      })();
    });

    this.app.get('/messages', (_req, res) => {
      void (async () => {
        const messages = await this.messageStore.getMessages('$all');
        const serialized = messages.map((m) => ({
          ...m,
          revision: m.revision.toString(),
          position: m.position.toString(),
        }));
        res.json(serialized);
      })();
    });

    this.app.get('/stats', (_req, res) => {
      void (async () => {
        const stats = await this.messageStore.getStats();
        res.json(stats);
      })();
    });

    this.app.get('/sessions', (_req, res) => {
      void (async () => {
        const sessions = await this.messageStore.getSessions();
        res.json(sessions);
      })();
    });
  }

  private async processCommand(command: Command & { correlationId: string; requestId: string }): Promise<void> {
    const handler = this.commandHandlers.get(command.type);
    if (!handler) return;

    const resultEvent = await handler.handle(command);
    const events = Array.isArray(resultEvent) ? resultEvent : [resultEvent];

    for (const event of events) {
      const eventWithIds: EventWithCorrelation = {
        ...event,
        correlationId: command.correlationId,
        requestId: command.requestId,
      };

      await this.messageStore.saveMessage('$all', eventWithIds, undefined, 'event');
      await this.routeEventToPipelines(eventWithIds);
    }
  }

  private async routeEventToPipelines(event: EventWithCorrelation): Promise<void> {
    const ctx = this.createContext(event.correlationId);

    for (const runtime of this.runtimes.values()) {
      await runtime.handleEvent(event, ctx);
    }
  }

  private createContext(correlationId: string): PipelineContext {
    return {
      correlationId,
      emit: async (type: string, data: unknown) => {
        const event: EventWithCorrelation = {
          type,
          data: data as Record<string, unknown>,
          correlationId,
        };
        await this.messageStore.saveMessage('$all', event, undefined, 'event');
        await this.routeEventToPipelines(event);
      },
      sendCommand: async (type: string, data: unknown) => {
        const command: Command & { correlationId: string; requestId: string } = {
          type,
          data: data as Record<string, unknown>,
          correlationId,
          requestId: `req-${nanoid()}`,
        };
        await this.messageStore.saveMessage('$all', command, undefined, 'command');
        await this.processCommand(command);
      },
    };
  }
}
