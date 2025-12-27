import { createServer, type Server as HttpServer } from 'node:http';
import {
  type Command,
  type CommandHandler,
  createMessageBus,
  type Event,
  type MessageBus,
} from '@auto-engineer/message-bus';
import { type ILocalMessageStore, MemoryMessageStore } from '@auto-engineer/message-store';
import cors from 'cors';
import express from 'express';
import getPort from 'get-port';
import { nanoid } from 'nanoid';
import type { Pipeline } from '../builder/define';
import { filterGraph } from '../graph/filter-graph';
import type { FilterOptions, GraphIR, NodeType } from '../graph/types';
import type { PipelineContext } from '../runtime/context';
import { EventCommandMapper } from '../runtime/event-command-map';
import { PhasedExecutor } from '../runtime/phased-executor';
import { PipelineRuntime } from '../runtime/pipeline-runtime';
import { SettledTracker } from '../runtime/settled-tracker';
import { SSEManager } from './sse-manager';

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
  private readonly settledTracker: SettledTracker;
  private readonly eventCommandMapper: EventCommandMapper;
  private readonly phasedExecutor: PhasedExecutor;
  private readonly sseManager: SSEManager;

  constructor(config: PipelineServerConfig) {
    this.requestedPort = config.port;
    this.actualPort = config.port;
    this.app = express();
    this.app.use(cors());
    this.app.use(express.json());
    this.httpServer = createServer(this.app);
    this.messageBus = createMessageBus();
    this.messageStore = config.messageStore ?? new MemoryMessageStore();
    this.eventCommandMapper = new EventCommandMapper([]);
    this.settledTracker = new SettledTracker({
      onDispatch: (commandType, data, correlationId) => {
        void this.dispatchFromSettled(commandType, data, correlationId);
      },
    });
    this.phasedExecutor = new PhasedExecutor({
      onDispatch: (commandType, data, correlationId) => {
        void this.dispatchFromSettled(commandType, data, correlationId);
      },
      onComplete: (event, correlationId) => {
        void this.handlePhasedComplete(event, correlationId);
      },
    });
    this.sseManager = new SSEManager();
    this.setupRoutes();
  }

  get port(): number {
    return this.actualPort;
  }

  registerCommandHandlers(handlers: CommandHandlerWithMetadata[]): void {
    for (const handler of handlers) {
      this.commandHandlers.set(handler.name, handler);
      this.messageBus.registerCommandHandler(handler);
      this.eventCommandMapper.addHandler(handler);
    }
  }

  getRegisteredCommands(): string[] {
    return Array.from(this.commandHandlers.keys());
  }

  registerPipeline(pipeline: Pipeline): void {
    this.pipelines.set(pipeline.descriptor.name, pipeline);
    this.runtimes.set(pipeline.descriptor.name, new PipelineRuntime(pipeline.descriptor));

    for (const handler of pipeline.descriptor.handlers) {
      if (handler.type === 'settled') {
        this.settledTracker.registerHandler({
          commandTypes: handler.commandTypes,
          handler: handler.handler,
        });
      }
    }
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
    this.sseManager.closeAll();
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
          if (handler.type === 'settled') {
            continue;
          }
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
        folds: [],
      });
    });

    this.app.get('/pipeline', (req, res) => {
      const commandToEvents = this.buildCommandToEvents();
      const rawGraph = this.buildCombinedGraph();
      const pipelineEvents = this.extractPipelineEvents(rawGraph, commandToEvents);
      const completeGraph = this.addCommandEventEdgesToGraph(rawGraph, commandToEvents, pipelineEvents);
      const filterOptions = this.parseFilterOptions(req.query);
      const filteredGraph = filterGraph(completeGraph, filterOptions);
      const allPipelineNodes = this.buildPipelineNodes();
      const connectedCommandIds = this.extractConnectedCommandIds(filteredGraph);
      const pipelineNodes = allPipelineNodes.filter((node) => connectedCommandIds.has(node.name));

      res.json({
        nodes: filteredGraph.nodes,
        edges: filteredGraph.edges,
        pipelineNodes,
      });
    });

    this.app.get('/pipeline/mermaid', (req, res) => {
      const filterOptions = this.parseFilterOptions(req.query);
      const mermaid = this.buildMermaidDiagram(filterOptions);
      res.type('text/plain').send(mermaid);
    });

    this.app.get('/pipeline/diagram', (req, res) => {
      const filterOptions = this.parseFilterOptions(req.query);
      const mermaidDefinition = this.buildMermaidDiagram(filterOptions);
      const html = this.buildDiagramHtml(mermaidDefinition);
      res.type('text/html').send(html);
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

    this.app.get('/events', (req, res) => {
      const clientId = `sse-${nanoid()}`;
      const correlationIdFilter = req.query.correlationId as string | undefined;
      this.sseManager.addClient(clientId, res, correlationIdFilter);
    });
  }

  private buildCombinedGraph(): GraphIR {
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

    return combinedGraph;
  }

  private buildCommandToEvents(): Record<string, string[]> {
    const commandToEvents: Record<string, string[]> = {};
    for (const [name, handler] of this.commandHandlers.entries()) {
      if (handler.events !== undefined && Array.isArray(handler.events)) {
        commandToEvents[name] = handler.events;
      }
    }
    return commandToEvents;
  }

  private buildPipelineNodes(): Array<{ id: string; name: string; title: string; alias?: string; status: 'None' }> {
    return Array.from(this.commandHandlers.entries()).map(([name, handler]) => ({
      id: name,
      name,
      title: handler.description ?? '',
      alias: handler.alias,
      status: 'None' as const,
    }));
  }

  private extractConnectedCommandIds(graph: GraphIR): Set<string> {
    const commandIds = new Set<string>();
    for (const node of graph.nodes) {
      if (node.type === 'command') {
        commandIds.add(node.label);
      }
    }
    return commandIds;
  }

  private parseFilterOptions(query: Record<string, unknown>): FilterOptions {
    const excludeTypesParam = query.excludeTypes;
    const maintainEdgesParam = query.maintainEdges;

    const excludeTypes: NodeType[] = [];
    if (typeof excludeTypesParam === 'string' && excludeTypesParam.length > 0) {
      const types = excludeTypesParam.split(',');
      for (const t of types) {
        if (t === 'event' || t === 'command' || t === 'settled') {
          excludeTypes.push(t);
        }
      }
    }

    const maintainEdges = maintainEdgesParam === 'true';

    return { excludeTypes, maintainEdges };
  }

  private buildMermaidDiagram(filterOptions?: FilterOptions): string {
    const commandToEvents = this.buildCommandToEvents();
    const rawGraph = this.buildCombinedGraph();
    const pipelineEvents = this.extractPipelineEvents(rawGraph, commandToEvents);
    const completeGraph = this.addCommandEventEdgesToGraph(rawGraph, commandToEvents, pipelineEvents);
    const graph = filterOptions ? filterGraph(completeGraph, filterOptions) : completeGraph;
    const lines: string[] = ['flowchart LR'];

    const eventNodes = new Set<string>();
    const commandNodes = new Set<string>();
    const settledNodes = new Set<string>();
    const edgeContext = { index: 0, backLinkIndices: [] as number[] };

    this.addGraphNodesToMermaid(graph, lines, eventNodes, commandNodes, settledNodes);
    this.addGraphEdgesToMermaid(graph, lines, edgeContext);
    this.addMermaidStyles(lines, eventNodes, commandNodes, settledNodes, edgeContext.backLinkIndices);

    return lines.join('\n');
  }

  private addCommandEventEdgesToGraph(
    graph: GraphIR,
    commandToEvents: Record<string, string[]>,
    pipelineEvents: Set<string>,
  ): GraphIR {
    const commandNodes = new Set(graph.nodes.filter((n) => n.type === 'command').map((n) => n.id.replace('cmd:', '')));
    const existingEventIds = new Set(graph.nodes.filter((n) => n.type === 'event').map((n) => n.id));
    const newNodes = [...graph.nodes];
    const newEdges = [...graph.edges];

    for (const [commandName, events] of Object.entries(commandToEvents)) {
      if (!commandNodes.has(commandName)) {
        continue;
      }
      for (const eventName of events) {
        if (!pipelineEvents.has(eventName)) {
          continue;
        }
        const eventId = `evt:${eventName}`;
        if (!existingEventIds.has(eventId)) {
          newNodes.push({ id: eventId, type: 'event', label: eventName });
          existingEventIds.add(eventId);
        }
        newEdges.push({ from: `cmd:${commandName}`, to: eventId });
      }
    }

    return { nodes: newNodes, edges: newEdges };
  }

  private extractPipelineEvents(graph: GraphIR, commandToEvents: Record<string, string[]>): Set<string> {
    const pipelineEvents = new Set<string>();

    for (const node of graph.nodes) {
      if (node.id.startsWith('evt:')) {
        pipelineEvents.add(node.id.replace('evt:', ''));
      }
      if (node.id.startsWith('settled:')) {
        const commandTypes = node.id.replace('settled:', '').split(',');
        for (const commandType of commandTypes) {
          const events = commandToEvents[commandType];
          if (events !== undefined) {
            for (const eventName of events) {
              pipelineEvents.add(eventName);
            }
          }
        }
      }
    }

    return pipelineEvents;
  }

  private addGraphNodesToMermaid(
    graph: GraphIR,
    lines: string[],
    eventNodes: Set<string>,
    commandNodes: Set<string>,
    settledNodes: Set<string>,
  ): void {
    for (const node of graph.nodes) {
      if (node.id.startsWith('evt:')) {
        const eventName = node.id.replace('evt:', '');
        const safeId = `evt_${eventName}`;
        eventNodes.add(safeId);
        lines.push(`  ${safeId}([${eventName}])`);
      } else if (node.id.startsWith('cmd:')) {
        const commandName = node.id.replace('cmd:', '');
        commandNodes.add(commandName);
        lines.push(`  ${commandName}[${commandName}]`);
      } else if (node.id.startsWith('settled:')) {
        const commandTypes = node.id.replace('settled:', '').split(',');
        const safeId = `settled_${commandTypes.join('_')}`;
        settledNodes.add(safeId);
        lines.push(`  ${safeId}{{${commandTypes.join(', ')}}}`);
      }
    }
  }

  private addGraphEdgesToMermaid(
    graph: GraphIR,
    lines: string[],
    edgeContext: { index: number; backLinkIndices: number[] },
  ): void {
    for (const edge of graph.edges) {
      const from = this.normalizeNodeId(edge.from);
      const to = this.normalizeNodeId(edge.to);
      lines.push(`  ${from} --> ${to}`);
      if (edge.backLink === true) {
        edgeContext.backLinkIndices.push(edgeContext.index);
      }
      edgeContext.index++;
    }
  }

  private normalizeNodeId(nodeId: string): string {
    if (nodeId.startsWith('evt:')) {
      return `evt_${nodeId.replace('evt:', '')}`;
    }
    if (nodeId.startsWith('cmd:')) {
      return nodeId.replace('cmd:', '');
    }
    const commandTypes = nodeId.replace('settled:', '').split(',');
    return `settled_${commandTypes.join('_')}`;
  }

  private addMermaidStyles(
    lines: string[],
    eventNodes: Set<string>,
    commandNodes: Set<string>,
    settledNodes: Set<string>,
    backLinkIndices: number[],
  ): void {
    const failedEvents = [...eventNodes].filter((id) => id.toLowerCase().includes('failed'));
    const normalEvents = [...eventNodes].filter((id) => !id.toLowerCase().includes('failed'));

    lines.push('');
    lines.push('  classDef event fill:#fff3e0,stroke:#e65100');
    lines.push('  classDef eventFailed fill:#fff3e0,stroke:#e65100,color:#d32f2f');
    lines.push('  classDef command fill:#e3f2fd,stroke:#1565c0');
    lines.push('  classDef settled fill:#f3e5f5,stroke:#7b1fa2');

    if (normalEvents.length > 0) {
      lines.push(`  class ${normalEvents.join(',')} event`);
    }
    if (failedEvents.length > 0) {
      lines.push(`  class ${failedEvents.join(',')} eventFailed`);
    }
    if (commandNodes.size > 0) {
      lines.push(`  class ${[...commandNodes].join(',')} command`);
    }
    if (settledNodes.size > 0) {
      lines.push(`  class ${[...settledNodes].join(',')} settled`);
    }
    if (backLinkIndices.length > 0) {
      lines.push(`  linkStyle ${backLinkIndices.join(',')} stroke:#d32f2f,stroke-width:2px`);
    }
  }

  private async processCommand(command: Command & { correlationId: string; requestId: string }): Promise<void> {
    const handler = this.commandHandlers.get(command.type);
    if (!handler) return;

    this.settledTracker.onCommandStarted(command);

    const resultEvent = await handler.handle(command);
    const events = Array.isArray(resultEvent) ? resultEvent : [resultEvent];

    const eventsWithIds: EventWithCorrelation[] = events.map((event) => ({
      ...event,
      correlationId: command.correlationId,
      requestId: command.requestId,
    }));

    await Promise.all(eventsWithIds.map((e) => this.messageStore.saveMessage('$all', e, undefined, 'event')));

    for (const eventWithIds of eventsWithIds) {
      this.sseManager.broadcast(eventWithIds);

      const sourceCommand = this.eventCommandMapper.getSourceCommand(eventWithIds.type);
      if (sourceCommand !== undefined) {
        this.settledTracker.onEventReceived(eventWithIds, sourceCommand);
      }

      this.routeEventToPhasedExecutor(eventWithIds);
    }

    await Promise.all(eventsWithIds.map((e) => this.routeEventToPipelines(e)));
  }

  private async dispatchFromSettled(commandType: string, data: unknown, correlationId: string): Promise<void> {
    const command: Command & { correlationId: string; requestId: string } = {
      type: commandType,
      data: data as Record<string, unknown>,
      correlationId,
      requestId: `req-${nanoid()}`,
    };
    await this.messageStore.saveMessage('$all', command, undefined, 'command');
    await this.processCommand(command);
  }

  private async handlePhasedComplete(event: Event, correlationId: string): Promise<void> {
    const eventWithIds: EventWithCorrelation = {
      ...event,
      correlationId,
    };
    await this.messageStore.saveMessage('$all', eventWithIds, undefined, 'event');
    this.sseManager.broadcast(eventWithIds);
    await this.routeEventToPipelines(eventWithIds);
  }

  private async routeEventToPipelines(event: EventWithCorrelation): Promise<void> {
    const ctx = this.createContext(event.correlationId);
    const runtimes = Array.from(this.runtimes.values());
    await Promise.all(runtimes.map((runtime) => runtime.handleEvent(event, ctx)));
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
        this.sseManager.broadcast(event);
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
      startPhased: (handler, event) => {
        this.phasedExecutor.startPhased(handler, event, correlationId);
      },
    };
  }

  private routeEventToPhasedExecutor(event: EventWithCorrelation): void {
    for (const pipeline of this.pipelines.values()) {
      for (const handler of pipeline.descriptor.handlers) {
        if (handler.type === 'foreach-phased') {
          const itemKey = handler.completion.itemKey(event);
          this.phasedExecutor.onEventReceived(event, itemKey);
        }
      }
    }
  }

  private buildDiagramHtml(mermaidDefinition: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pipeline Diagram</title>
  <script type="module">
    import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';
    mermaid.initialize({ startOnLoad: true, theme: 'default' });
  </script>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      padding: 20px;
      background: #f5f5f5;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    h1 {
      margin-top: 0;
      color: #333;
    }
    .mermaid {
      display: flex;
      justify-content: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Pipeline Diagram</h1>
    <div class="mermaid">
${mermaidDefinition}
    </div>
  </div>
</body>
</html>`;
  }
}
