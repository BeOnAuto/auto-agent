import { createServer, type Server as HttpServer } from 'node:http';
import {
  type Command,
  type CommandHandler,
  createMessageBus,
  type Event,
  type MessageBus,
} from '@auto-engineer/message-bus';
import cors from 'cors';
import express from 'express';
import getPort from 'get-port';
import { nanoid } from 'nanoid';
import type { Pipeline } from '../builder/define';
import { filterGraph } from '../graph/filter-graph';
import type { FilterOptions, GraphIR, NodeStatus, NodeType } from '../graph/types';
import type { PipelineContext } from '../runtime/context';
import type { EventDefinition } from '../runtime/event-command-map';
import { EventCommandMapper } from '../runtime/event-command-map';
import { PhasedExecutor } from '../runtime/phased-executor';
import { PipelineRuntime } from '../runtime/pipeline-runtime';
import { SettledTracker } from '../runtime/settled-tracker';
import { createPipelineEventStore, type PipelineEventStoreContext } from '../store/pipeline-event-store';
import { SSEManager } from './sse-manager';

export type { EventDefinition };

export interface CommandHandlerWithMetadata extends CommandHandler {
  alias?: string;
  description?: string;
  displayName?: string;
  fields?: Record<string, unknown>;
  examples?: unknown[];
  events?: EventDefinition[];
}

export interface PipelineServerConfig {
  port: number;
}

interface EventWithCorrelation extends Event {
  correlationId: string;
}

export class PipelineServer {
  private app: express.Application;
  private httpServer: HttpServer;
  private messageBus: MessageBus;
  private readonly commandHandlers: Map<string, CommandHandlerWithMetadata> = new Map();
  private readonly pipelines: Map<string, Pipeline> = new Map();
  private readonly runtimes: Map<string, PipelineRuntime> = new Map();
  private actualPort: number;
  private readonly requestedPort: number;
  private readonly settledTracker: SettledTracker;
  private readonly eventCommandMapper: EventCommandMapper;
  private readonly phasedExecutor: PhasedExecutor;
  private readonly sseManager: SSEManager;
  private readonly eventStoreContext: PipelineEventStoreContext;
  private latestCorrelationId?: string;
  private readonly itemKeyExtractors = new Map<string, (data: unknown) => string | undefined>();

  constructor(config: PipelineServerConfig) {
    this.requestedPort = config.port;
    this.actualPort = config.port;
    this.app = express();
    this.app.use(cors());
    this.app.use(express.json());
    this.httpServer = createServer(this.app);
    this.messageBus = createMessageBus();
    this.eventStoreContext = createPipelineEventStore();
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

  registerItemKeyExtractor(commandType: string, extractor: (data: unknown) => string | undefined): void {
    this.itemKeyExtractors.set(commandType, extractor);
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

    await new Promise<void>((resolve) => {
      this.httpServer.listen(this.actualPort, () => {
        resolve();
      });
    });
  }

  async stop(): Promise<void> {
    this.sseManager.closeAll();
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
      void (async () => {
        const commandToEvents = this.buildCommandToEvents();
        const rawGraph = this.buildCombinedGraph();
        const pipelineEvents = this.extractPipelineEvents(rawGraph, commandToEvents);
        const graphWithEvents = this.addCommandEventEdgesToGraph(rawGraph, commandToEvents, pipelineEvents);
        const graphWithEnrichedEvents = this.enrichEventLabels(graphWithEvents);
        const completeGraph = this.markBackLinks(graphWithEnrichedEvents);
        const filterOptions = this.parseFilterOptions(req.query);
        const filteredGraph = filterGraph(completeGraph, filterOptions);
        const correlationId = req.query.correlationId as string | undefined;
        const graphWithStatus = await this.addStatusToCommandNodes(filteredGraph, correlationId);

        res.json({
          nodes: graphWithStatus.nodes,
          edges: graphWithStatus.edges,
          latestRun: this.latestCorrelationId,
        });
      })();
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

        await this.emitCommandDispatched(correlationId, requestId, commandWithIds.type, commandWithIds.data);

        void this.processCommand(commandWithIds);

        res.json({
          status: 'ack',
          commandId: commandWithIds.requestId,
          correlationId: commandWithIds.correlationId,
          timestamp: new Date().toISOString(),
        });
      })();
    });

    this.app.get('/messages', (_req, res) => {
      void (async () => {
        const messages = await this.eventStoreContext.readModel.getMessages();
        const serialized = messages.map((m, index) => ({
          message: {
            type: m.messageName,
            data: m.messageData,
            correlationId: m.correlationId,
            requestId: m.requestId,
          },
          messageType: m.messageType,
          revision: String(index),
          position: String(index),
        }));
        res.json(serialized);
      })();
    });

    this.app.get('/stats', (_req, res) => {
      void (async () => {
        const stats = await this.eventStoreContext.readModel.getStats();
        res.json(stats);
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

    return this.enrichCommandLabels(combinedGraph);
  }

  private enrichCommandLabels(graph: GraphIR): GraphIR {
    return {
      nodes: graph.nodes.map((node) => {
        if (node.type !== 'command') {
          return node;
        }
        const handler = this.commandHandlers.get(node.label);
        if (handler?.displayName === undefined) {
          return node;
        }
        return { ...node, label: handler.displayName };
      }),
      edges: graph.edges,
    };
  }

  private enrichEventLabels(graph: GraphIR): GraphIR {
    const eventDisplayNames = this.buildEventDisplayNames();
    return {
      nodes: graph.nodes.map((node) => {
        if (node.type !== 'event') {
          return node;
        }
        const displayName = eventDisplayNames.get(node.label);
        if (displayName === undefined) {
          return node;
        }
        return { ...node, label: displayName };
      }),
      edges: graph.edges,
    };
  }

  private async addStatusToCommandNodes(graph: GraphIR, correlationId?: string): Promise<GraphIR> {
    const nodesWithStatus = await Promise.all(
      graph.nodes.map(async (node) => {
        if (node.type !== 'command') {
          return node;
        }
        const commandName = node.id.replace(/^cmd:/, '');
        if (correlationId === undefined) {
          return { ...node, status: 'idle' as NodeStatus, pendingCount: 0, endedCount: 0 };
        }
        const stats = await this.computeCommandStats(correlationId, commandName);
        return {
          ...node,
          status: stats.aggregateStatus,
          pendingCount: stats.pendingCount,
          endedCount: stats.endedCount,
        };
      }),
    );
    return {
      nodes: nodesWithStatus,
      edges: graph.edges,
    };
  }

  private async emitItemStatusChanged(
    correlationId: string,
    commandType: string,
    itemKey: string,
    requestId: string,
    status: 'running' | 'success' | 'error',
    attemptCount: number,
  ): Promise<void> {
    await this.eventStoreContext.eventStore.appendToStream(`pipeline-${correlationId}`, [
      {
        type: 'ItemStatusChanged',
        data: {
          correlationId,
          commandType,
          itemKey,
          requestId,
          status,
          attemptCount,
        },
      },
    ]);
  }

  private async emitNodeStatusChanged(
    correlationId: string,
    commandName: string,
    status: NodeStatus,
    previousStatus: NodeStatus,
  ): Promise<void> {
    const stats = await this.computeCommandStats(correlationId, commandName);
    await this.eventStoreContext.eventStore.appendToStream(`pipeline-${correlationId}`, [
      {
        type: 'NodeStatusChanged',
        data: {
          correlationId,
          commandName,
          nodeId: `cmd:${commandName}`,
          status,
          previousStatus,
          pendingCount: stats.pendingCount,
          endedCount: stats.endedCount,
        },
      },
    ]);
  }

  private async emitCommandDispatched(
    correlationId: string,
    requestId: string,
    commandType: string,
    commandData: Record<string, unknown>,
  ): Promise<void> {
    await this.eventStoreContext.eventStore.appendToStream(`pipeline-${correlationId}`, [
      {
        type: 'CommandDispatched',
        data: {
          correlationId,
          requestId,
          commandType,
          commandData,
          timestamp: new Date(),
        },
      },
    ]);
  }

  private async emitDomainEventEmitted(
    correlationId: string,
    requestId: string,
    eventType: string,
    eventData: Record<string, unknown>,
  ): Promise<void> {
    await this.eventStoreContext.eventStore.appendToStream(`pipeline-${correlationId}`, [
      {
        type: 'DomainEventEmitted',
        data: {
          correlationId,
          requestId,
          eventType,
          eventData,
          timestamp: new Date(),
        },
      },
    ]);
  }

  private async emitPipelineRunStarted(correlationId: string, triggerCommand: string): Promise<void> {
    await this.eventStoreContext.eventStore.appendToStream(`pipeline-${correlationId}`, [
      {
        type: 'PipelineRunStarted',
        data: {
          correlationId,
          triggerCommand,
        },
      },
    ]);
  }

  private async updateNodeStatus(correlationId: string, commandName: string, status: NodeStatus): Promise<void> {
    const existing = await this.eventStoreContext.readModel.getNodeStatus(correlationId, commandName);
    const previousStatus: NodeStatus = existing?.status ?? 'idle';
    await this.emitNodeStatusChanged(correlationId, commandName, status, previousStatus);
    await this.broadcastNodeStatusChanged(correlationId, commandName, status, previousStatus);
  }

  private async broadcastNodeStatusChanged(
    correlationId: string,
    commandName: string,
    status: NodeStatus,
    previousStatus: NodeStatus,
  ): Promise<void> {
    const stats = await this.computeCommandStats(correlationId, commandName);
    const event: Event & { correlationId: string } = {
      type: 'NodeStatusChanged',
      data: {
        nodeId: `cmd:${commandName}`,
        status,
        previousStatus,
        pendingCount: stats.pendingCount,
        endedCount: stats.endedCount,
      },
      correlationId,
    };
    this.sseManager.broadcast(event);
  }

  private async broadcastPipelineRunStarted(correlationId: string, triggerCommand: string): Promise<void> {
    const event: Event & { correlationId: string } = {
      type: 'PipelineRunStarted',
      data: { correlationId, triggerCommand },
      correlationId,
    };
    this.sseManager.broadcast(event);
    await this.emitPipelineRunStarted(correlationId, triggerCommand);
  }

  private extractItemKey(commandType: string, data: unknown, requestId: string): string {
    const extractor = this.itemKeyExtractors.get(commandType);
    if (extractor !== undefined) {
      const key = extractor(data);
      if (key !== undefined) return key;
    }
    return requestId;
  }

  private async getOrCreateItemStatus(
    correlationId: string,
    commandType: string,
    itemKey: string,
    requestId: string,
  ): Promise<{ attemptCount: number }> {
    const existing = await this.eventStoreContext.readModel.getItemStatus(correlationId, commandType, itemKey);
    const attemptCount = (existing?.attemptCount ?? 0) + 1;

    await this.emitItemStatusChanged(correlationId, commandType, itemKey, requestId, 'running', attemptCount);

    return { attemptCount };
  }

  private async updateItemStatus(
    correlationId: string,
    commandType: string,
    itemKey: string,
    status: 'running' | 'success' | 'error',
  ): Promise<void> {
    const existing = await this.eventStoreContext.readModel.getItemStatus(correlationId, commandType, itemKey);
    if (existing !== null) {
      await this.emitItemStatusChanged(
        correlationId,
        commandType,
        itemKey,
        existing.currentRequestId,
        status,
        existing.attemptCount,
      );
    }
  }

  private async computeCommandStats(
    correlationId: string,
    commandType: string,
  ): Promise<{ pendingCount: number; endedCount: number; aggregateStatus: NodeStatus }> {
    return this.eventStoreContext.readModel.computeCommandStats(correlationId, commandType);
  }

  private getEventName(event: EventDefinition): string {
    return typeof event === 'string' ? event : event.name;
  }

  private buildCommandToEvents(): Record<string, string[]> {
    const commandToEvents: Record<string, string[]> = {};
    for (const [name, handler] of this.commandHandlers.entries()) {
      if (handler.events !== undefined && Array.isArray(handler.events)) {
        commandToEvents[name] = handler.events.map((e) => this.getEventName(e));
      }
    }
    return commandToEvents;
  }

  private buildEventDisplayNames(): Map<string, string> {
    const eventDisplayNames = new Map<string, string>();
    for (const handler of this.commandHandlers.values()) {
      if (handler.events === undefined) {
        continue;
      }
      for (const event of handler.events) {
        if (typeof event !== 'string' && event.displayName !== undefined) {
          eventDisplayNames.set(event.name, event.displayName);
        }
      }
    }
    return eventDisplayNames;
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
    const graphWithEvents = this.addCommandEventEdgesToGraph(rawGraph, commandToEvents, pipelineEvents);
    const graphWithEnrichedEvents = this.enrichEventLabels(graphWithEvents);
    const completeGraph = this.markBackLinks(graphWithEnrichedEvents);
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

  private markBackLinks(graph: GraphIR): GraphIR {
    const outgoingEdgesWithBackLink = new Map<string, Array<{ to: string; isBackLink: boolean }>>();
    for (const edge of graph.edges) {
      const existing = outgoingEdgesWithBackLink.get(edge.from) ?? [];
      existing.push({ to: edge.to, isBackLink: edge.backLink === true });
      outgoingEdgesWithBackLink.set(edge.from, existing);
    }

    const markedEdges = graph.edges.map((edge) => {
      if (edge.backLink === true) {
        return edge;
      }
      if (edge.from.startsWith('evt:') && edge.to.startsWith('cmd:')) {
        const createsBackLink = this.hasPathToExcludingBackLinks(edge.to, edge.from, outgoingEdgesWithBackLink);
        if (createsBackLink) {
          return { ...edge, backLink: true };
        }
      }
      return edge;
    });

    return { nodes: graph.nodes, edges: markedEdges };
  }

  private hasPathToExcludingBackLinks(
    from: string,
    target: string,
    outgoingEdges: Map<string, Array<{ to: string; isBackLink: boolean }>>,
  ): boolean {
    const visited = new Set<string>();
    const queue = [from];

    while (queue.length > 0) {
      const current = queue.shift();
      if (current === undefined) {
        break;
      }
      if (current === target) {
        return true;
      }
      if (visited.has(current)) {
        continue;
      }
      visited.add(current);

      const neighbors = outgoingEdges.get(current) ?? [];
      for (const neighbor of neighbors) {
        if (neighbor.isBackLink) {
          continue;
        }
        if (!visited.has(neighbor.to)) {
          queue.push(neighbor.to);
        }
      }
    }

    return false;
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
        lines.push(`  ${safeId}([${node.label}])`);
      } else if (node.id.startsWith('cmd:')) {
        const commandName = node.id.replace('cmd:', '');
        commandNodes.add(commandName);
        lines.push(`  ${commandName}[${node.label}]`);
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
      if (edge.backLink === true) {
        lines.push(`  ${from} -.->|retry| ${to}`);
        edgeContext.backLinkIndices.push(edgeContext.index);
      } else {
        lines.push(`  ${from} --> ${to}`);
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

    const isNewCorrelationId = !(await this.eventStoreContext.readModel.hasCorrelation(command.correlationId));
    if (isNewCorrelationId) {
      await this.broadcastPipelineRunStarted(command.correlationId, command.type);
      this.latestCorrelationId = command.correlationId;
    }

    const itemKey = this.extractItemKey(command.type, command.data, command.requestId);
    await this.getOrCreateItemStatus(command.correlationId, command.type, itemKey, command.requestId);

    await this.updateNodeStatus(command.correlationId, command.type, 'running');
    this.settledTracker.onCommandStarted(command);

    const resultEvent = await handler.handle(command);
    const events = Array.isArray(resultEvent) ? resultEvent : [resultEvent];

    const finalStatus = this.getStatusFromEvents(events);
    const itemFinalStatus = finalStatus === 'idle' ? 'success' : finalStatus;
    await this.updateItemStatus(command.correlationId, command.type, itemKey, itemFinalStatus);
    await this.updateNodeStatus(command.correlationId, command.type, finalStatus);

    const eventsWithIds: EventWithCorrelation[] = events.map((event) => ({
      ...event,
      correlationId: command.correlationId,
      requestId: command.requestId,
    }));

    await Promise.all(
      eventsWithIds.map((e) =>
        this.emitDomainEventEmitted(e.correlationId, command.requestId, e.type, e.data as Record<string, unknown>),
      ),
    );

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

  private getStatusFromEvents(events: Event[]): NodeStatus {
    for (const event of events) {
      if (event.type.includes('Failed')) {
        return 'error';
      }
    }
    return 'success';
  }

  private async dispatchFromSettled(commandType: string, data: unknown, correlationId: string): Promise<void> {
    const requestId = `req-${nanoid()}`;
    const command: Command & { correlationId: string; requestId: string } = {
      type: commandType,
      data: data as Record<string, unknown>,
      correlationId,
      requestId,
    };
    await this.emitCommandDispatched(correlationId, requestId, commandType, data as Record<string, unknown>);
    await this.processCommand(command);
  }

  private async handlePhasedComplete(event: Event, correlationId: string): Promise<void> {
    const requestId = `req-${nanoid()}`;
    const eventWithIds: EventWithCorrelation = {
      ...event,
      correlationId,
    };
    await this.emitDomainEventEmitted(correlationId, requestId, event.type, event.data as Record<string, unknown>);
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
        const requestId = `req-${nanoid()}`;
        const event: EventWithCorrelation = {
          type,
          data: data as Record<string, unknown>,
          correlationId,
        };
        await this.emitDomainEventEmitted(correlationId, requestId, type, data as Record<string, unknown>);
        this.sseManager.broadcast(event);
        await this.routeEventToPipelines(event);
      },
      sendCommand: async (type: string, data: unknown) => {
        const requestId = `req-${nanoid()}`;
        const command: Command & { correlationId: string; requestId: string } = {
          type,
          data: data as Record<string, unknown>,
          correlationId,
          requestId,
        };
        await this.emitCommandDispatched(correlationId, requestId, type, data as Record<string, unknown>);
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
