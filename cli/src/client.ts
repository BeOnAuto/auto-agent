import { z } from 'zod';
import { getLogger } from './logger.js';

const GetModelResponseSchema = z.object({
  model: z.unknown(),
});

const SendModelResponseSchema = z.object({
  model: z.any(),
  corrections: z.array(z.string()),
  correctionCount: z.number(),
});

export class AgentClient {
  constructor(
    private serverUrl: string,
    private apiKey: string,
  ) {}

  async getModel(workspaceId: string): Promise<unknown> {
    const log = getLogger();
    log.info('client', `GET model for workspace ${workspaceId}`);
    const response = await fetch(`${this.serverUrl}/api/agent/model/${workspaceId}`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });
    if (!response.ok) {
      log.error('client', `GET model failed: ${response.status} ${response.statusText}`);
      throw new Error(`Failed to get model: ${response.status} ${response.statusText}`);
    }
    const data = GetModelResponseSchema.parse(await response.json());
    log.info('client', 'GET model success');
    return data.model;
  }

  async sendModel(
    workspaceId: string,
    model: unknown,
  ): Promise<z.infer<typeof SendModelResponseSchema>> {
    const log = getLogger();
    log.info('client', `POST model for workspace ${workspaceId}`);
    const response = await fetch(`${this.serverUrl}/api/agent/model/${workspaceId}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model }),
    });
    if (!response.ok) {
      log.error('client', `POST model failed: ${response.status} ${response.statusText}`);
      throw new Error(`Failed to send model: ${response.status} ${response.statusText}`);
    }
    const result = SendModelResponseSchema.parse(await response.json());
    log.info('client', `POST model success, ${result.correctionCount} corrections`);
    return result;
  }
}
