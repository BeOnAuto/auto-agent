export interface CommandMetadata {
  id: string;
  name: string;
  alias: string;
  description: string;
  package: string;
  version?: string;
  category?: string;
  icon: string;
}

export interface RegistryResponse {
  eventHandlers: string[];
  commandHandlers: string[];
  commandsWithMetadata: CommandMetadata[];
  folds: string[];
}

export interface PipelineNode {
  id: string;
  name: string;
  title: string;
  alias?: string;
  description?: string;
  package?: string;
  version?: string;
  category?: string;
  icon?: string;
  status: 'None' | 'idle' | 'running' | 'pass' | 'fail';
}

export interface PipelineEdge {
  from: string;
  to: string;
}

export interface PipelineResponse {
  commandToEvents: Record<string, string[]>;
  eventToCommand: Record<string, string>;
  nodes: PipelineNode[];
  edges: PipelineEdge[];
}

export interface SessionInfo {
  sessionId: string;
  startedAt: string;
  messageCount: number;
  commandCount: number;
  eventCount: number;
  lastActivity: string;
}

export interface PositionalMessage {
  streamId: string;
  message: {
    type: string;
    data: Record<string, unknown>;
    requestId?: string;
    correlationId?: string;
    timestamp?: string;
  };
  messageType: 'command' | 'event';
  revision: string;
  position: string;
  timestamp: string;
  sessionId: string;
}

export interface StatsResponse {
  totalMessages: number;
  totalCommands: number;
  totalEvents: number;
  totalStreams: number;
  totalSessions: number;
  memoryUsage?: number;
  oldestMessage?: string;
  newestMessage?: string;
}

export interface CommandAck {
  status: 'ack' | 'nack';
  commandId?: string;
  timestamp?: string;
  error?: string;
  availableCommands?: string[];
}

export interface PipelineSnapshot {
  timestamp: number;
  nodes: Array<{ id: string; status: string }>;
}

export interface SanitizedEvent {
  type: string;
  data: Record<string, unknown>;
  position: string;
}

export interface GoldenMaster {
  baseline: {
    registry: RegistryResponse;
    pipeline: PipelineResponse;
    sessions: SessionInfo[];
  };
  execution: {
    statusProgression: PipelineSnapshot[];
    events: PositionalMessage[];
    commands: PositionalMessage[];
  };
  final: {
    pipeline: PipelineResponse;
    stats: StatsResponse;
  };
}
