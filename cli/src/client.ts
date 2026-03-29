import { z } from 'zod';

const GetModelResponseSchema = z.object({
  model: z.unknown(),
});

const SendModelResponseSchema = z.object({
  model: z.unknown(),
  corrections: z.array(z.string()),
  correctionCount: z.number(),
});

export class AgentClient {
  constructor(
    private serverUrl: string,
    private apiKey: string,
  ) {}

  async getModel(workspaceId: string): Promise<unknown> {
    const response = await fetch(`${this.serverUrl}/api/agent/model/${workspaceId}`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });
    if (!response.ok) {
      throw new Error(`Failed to get model: ${response.status} ${response.statusText}`);
    }
    const data = GetModelResponseSchema.parse(await response.json());
    return data.model;
  }

  async sendModel(
    workspaceId: string,
    model: unknown,
  ): Promise<{ model: unknown; corrections: string[]; correctionCount: number }> {
    const response = await fetch(`${this.serverUrl}/api/agent/model/${workspaceId}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model }),
    });
    if (!response.ok) {
      throw new Error(`Failed to send model: ${response.status} ${response.statusText}`);
    }
    return SendModelResponseSchema.parse(await response.json());
  }
}
