import type { Event } from '@auto-engineer/message-bus';
import type { Response } from 'express';

interface SSEClient {
  id: string;
  response: Response;
  correlationIdFilter?: string;
}

export class SSEManager {
  private clients = new Map<string, SSEClient>();

  get clientCount(): number {
    return this.clients.size;
  }

  addClient(id: string, response: Response, correlationIdFilter?: string): void {
    response.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });

    response.write(':\n\n');

    this.clients.set(id, {
      id,
      response,
      correlationIdFilter,
    });

    response.on('close', () => {
      this.removeClient(id);
    });
  }

  removeClient(id: string): void {
    const client = this.clients.get(id);
    if (client !== undefined) {
      client.response.end();
      this.clients.delete(id);
    }
  }

  broadcast(event: Event): void {
    const data = JSON.stringify(event);
    const message = `data: ${data}\n\n`;
    const failedClientIds: string[] = [];

    for (const client of this.clients.values()) {
      if (this.shouldSendToClient(client, event)) {
        try {
          client.response.write(message);
        } catch {
          failedClientIds.push(client.id);
        }
      }
    }

    for (const id of failedClientIds) {
      this.removeClient(id);
    }
  }

  private shouldSendToClient(client: SSEClient, event: Event): boolean {
    if (client.correlationIdFilter === undefined) {
      return true;
    }
    return event.correlationId === client.correlationIdFilter;
  }

  closeAll(): void {
    for (const client of this.clients.values()) {
      client.response.end();
    }
    this.clients.clear();
  }
}
