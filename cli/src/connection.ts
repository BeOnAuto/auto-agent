import { EventEmitter } from 'node:events';
import type { ModelPersistence } from './persistence.js';

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

export class ConnectionManager extends EventEmitter {
  private ws: import('ws').WebSocket | null = null;
  private connected = false;

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
    this.options.persistence.destroy();
  }

  isConnected(): boolean {
    return this.connected;
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
