import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

interface CallToolResult {
  content: Array<{ type: string; text?: string }>;
}

async function connectToMcp(baseUrl: string) {
  const url = new URL(`${baseUrl}/mcp`);
  const transport = new StreamableHTTPClientTransport(url);
  const client = new Client({ name: 'react-component-implementer', version: '1.0.0' });
  await client.connect(transport);

  return {
    async callTool(name: string, args: Record<string, unknown>): Promise<string> {
      const result = await client.callTool({ name, arguments: args });
      const castResult = result as CallToolResult;
      const textContent = castResult.content.find((c) => c.type === 'text');
      if (!textContent || typeof textContent.text !== 'string') {
        throw new Error(`No text content in response for tool: ${name}`);
      }
      return textContent.text;
    },
    close(): Promise<void> {
      return client.close();
    },
  };
}

export async function connectMcpClient(config: { baseUrl: string }) {
  const connection = await connectToMcp(config.baseUrl);

  return {
    async listComponents(): Promise<string> {
      return connection.callTool('list-all-documentation', {});
    },
    async getStoryUrl(exportName: string, absoluteStoryPath: string): Promise<string> {
      return connection.callTool('preview-stories', {
        stories: [{ exportName, absoluteStoryPath }],
      });
    },
    async getUiBuildingInstructions(): Promise<string> {
      return connection.callTool('get-storybook-story-instructions', {});
    },
    async getDocumentation(id: string): Promise<string> {
      return connection.callTool('get-documentation', { id });
    },
    close: connection.close.bind(connection),
  };
}
