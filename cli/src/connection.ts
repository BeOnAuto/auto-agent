import { randomBytes } from 'node:crypto';
import { EventEmitter } from 'node:events';
import { hostname, userInfo, platform } from 'node:os';
import { execSync } from 'node:child_process';
import type { ModelPersistence } from './persistence.js';
import { getLogger } from './logger.js';

function gitUserName(): string | null {
  try {
    return execSync('git config user.name', { encoding: 'utf8', timeout: 2000 }).trim() || null;
  } catch {
    return null;
  }
}

function buildAgentName(sessionId: string): string {
  const gitName = gitUserName();
  const raw = gitName
    ? gitName.split(/\s+/)[0]
    : userInfo().username;
  const firstName = raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
  const shortId = sessionId.slice(0, 4);
  return `${firstName}·${shortId}`;
}

function buildAgentStatus(): Record<string, string> {
  const status: Record<string, string> = {};
  const git = gitUserName();
  if (git) status.user = git;
  status.username = userInfo().username;
  status.hostname = hostname().replace(/\.local$/, '');
  status.platform = platform();
  status.cwd = process.cwd();
  return status;
}

export interface ModelChange {
  action: 'added' | 'removed' | 'updated';
  entityType: 'scene' | 'message' | 'moment' | 'narrative';
  id: string;
  name: string;
  details?: string;
}

export interface ConnectionManagerOptions {
  serverUrl: string;
  apiKey: string;
  workspaceId: string;
  persistence: ModelPersistence;
}

export interface AgentEndpoint {
  label: string;
  url: string;
}

const BASE_RECONNECT_MS = 3000;
const MAX_RECONNECT_MS = 30000;

export class ConnectionManager extends EventEmitter {
  private ws: import('ws').WebSocket | null = null;
  private connected = false;
  private disposed = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private endpoints: AgentEndpoint[] = [];
  readonly sessionId = randomBytes(12).toString('hex');
  readonly name: string;
  readonly status: Record<string, string>;

  constructor(private options: ConnectionManagerOptions) {
    super();
    this.name = buildAgentName(this.sessionId);
    this.status = buildAgentStatus();
    this.on('error', () => {});
  }

  async connect(timeoutMs = 10000): Promise<void> {
    this.disposed = false;
    await this.doConnect(timeoutMs, true);
  }

  private async doConnect(timeoutMs: number, rejectOnError: boolean): Promise<void> {
    const log = getLogger();
    const WebSocket = (await import('ws')).default;

    const wsUrl = this.options.serverUrl.replace(/^http/, 'ws');
    const url = `${wsUrl}/api/agent/model/${this.options.workspaceId}/stream?key=${this.options.apiKey}`;

    log.info('connection', `connecting to ${wsUrl}`, { workspaceId: this.options.workspaceId, sessionId: this.sessionId });
    this.ws = new WebSocket(url);

    return new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        log.error('connection', `timeout after ${timeoutMs}ms`);
        this.ws?.close();
        this.ws = null;
        if (rejectOnError) {
          this.disposed = true;
          reject(new Error(`Connection timeout after ${timeoutMs}ms`));
        } else {
          this.scheduleReconnect();
        }
      }, timeoutMs);

      this.ws!.on('open', () => {
        log.info('connection', 'websocket open, sending hello');
        this.connected = true;
        this.ws!.send(JSON.stringify({ type: 'hello', sessionId: this.sessionId, name: this.name, status: this.status }));
        if (this.endpoints.length > 0) {
          this.sendEndpoints();
        }
      });

      this.ws!.on('message', (data: Buffer) => {
        try {
          const msg = JSON.parse(data.toString());
          log.info('connection', `received message type=${msg.type}`);
          this.processMessage(msg);
          if (msg.type === 'full') {
            clearTimeout(timeout);
            this.reconnectAttempts = 0;
            resolve();
          }
        } catch (err) {
          log.error('connection', 'failed to process message', err instanceof Error ? err : new Error(String(err)));
          this.emit('error', err);
        }
      });

      this.ws!.on('close', () => {
        log.warn('connection', 'websocket closed');
        this.connected = false;
        this.emit('disconnected');
        this.scheduleReconnect();
      });

      this.ws!.on('error', (err: Error) => {
        log.error('connection', 'websocket error', err);
        clearTimeout(timeout);
        if (rejectOnError) {
          reject(err);
        } else {
          this.emit('error', err);
        }
      });
    });
  }

  private scheduleReconnect(): void {
    if (this.disposed) return;
    const log = getLogger();
    const delay = Math.min(BASE_RECONNECT_MS * Math.pow(2, this.reconnectAttempts), MAX_RECONNECT_MS);
    this.reconnectAttempts++;
    log.info('connection', `scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (!this.disposed) {
        log.info('connection', 'attempting reconnect');
        this.doConnect(10000, false).catch((err) => {
          log.error('connection', 'reconnect failed', err instanceof Error ? err : new Error(String(err)));
        });
      }
    }, delay);
  }

  disconnect(): void {
    const log = getLogger();
    log.info('connection', 'disconnecting');
    this.disposed = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connected = false;
    this.options.persistence.destroy();
  }

  isConnected(): boolean {
    return this.connected;
  }

  getEndpoints(): AgentEndpoint[] {
    return this.endpoints;
  }

  updateEndpoints(endpoints: AgentEndpoint[]): void {
    this.endpoints = endpoints;
    this.sendEndpoints();
  }

  private sendEndpoints(): void {
    if (this.connected && this.ws) {
      this.ws.send(JSON.stringify({ type: 'update', endpoints: this.endpoints }));
    }
  }

  processMessage(msg: { type: string; model?: unknown; changes?: ModelChange[] }): void {
    if (msg.type === 'full' && msg.model) {
      this.options.persistence.update(msg.model);
      this.emit('model-updated', msg.model);
      if (!this.connected) {
        this.connected = true;
        this.emit('connected');
      }
    } else if (msg.type === 'changes' && msg.changes) {
      for (const change of msg.changes) {
        this.options.persistence.appendChange(change);
      }
    }
  }
}
