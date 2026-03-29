import { EventEmitter } from 'node:events';

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
  onModel?: (model: unknown) => void;
  onChange?: (change: ModelChange) => void;
}

export class ConnectionManager extends EventEmitter {
  private ws: import('ws').WebSocket | null = null;
  private connected = false;
  private model: unknown = null;
  private changes: ModelChange[] = [];

  constructor(private options: ConnectionManagerOptions) {
    super();
  }

  async connect(timeoutMs = 10000): Promise<void> {
    const WebSocket = (await import('ws')).default;

    const wsUrl = this.options.serverUrl.replace(/^http/, 'ws');
    const url = `${wsUrl}/api/agent/model/${this.options.workspaceId}/stream?key=${this.options.apiKey}`;

    this.ws = new WebSocket(url);

    return new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.disconnect();
        reject(new Error(`Connection timeout after ${timeoutMs}ms`));
      }, timeoutMs);

      this.ws!.on('open', () => {
        this.connected = true;
      });

      this.ws!.on('message', (data: Buffer) => {
        try {
          const msg = JSON.parse(data.toString());
          this.processMessage(msg);
          // Resolve on first full model received
          if (msg.type === 'full') {
            clearTimeout(timeout);
            resolve();
          }
        } catch (err) {
          this.emit('error', err);
        }
      });

      this.ws!.on('close', () => {
        this.connected = false;
        this.emit('disconnected');
      });

      this.ws!.on('error', (err: Error) => {
        clearTimeout(timeout);
        reject(err);
        this.emit('error', err);
      });
    });
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connected = false;
    this.model = null;
  }

  isConnected(): boolean {
    return this.connected;
  }

  getModel(): unknown {
    return this.model;
  }

  getChanges(): ModelChange[] {
    const result = [...this.changes];
    this.changes = [];
    return result;
  }

  processMessage(msg: { type: string; model?: unknown; changes?: ModelChange[] }): void {
    if (msg.type === 'full' && msg.model) {
      this.model = msg.model;
      this.options.onModel?.(this.model);
      this.emit('model-updated', this.model);
      if (!this.connected) {
        this.connected = true;
        this.emit('connected');
      }
    } else if (msg.type === 'changes' && msg.changes) {
      for (const change of msg.changes) {
        this.changes.push(change);
        this.options.onChange?.(change);
      }
    }
  }
}
