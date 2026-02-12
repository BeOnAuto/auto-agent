export interface McpClient {
  listComponents(): Promise<string>;
  getDocumentation(id: string): Promise<string>;
  getUiBuildingInstructions(): Promise<string>;
}

export interface ComponentDoc {
  id: string;
  documentation: string;
}

export interface ComponentCatalog {
  overview: string;
  instructions: string;
  componentDocs: ComponentDoc[];
}

export function extractDesignSystemIds(overview: string): string[] {
  const ids: string[] = [];
  const regex = /\((design-system-[^)]+)\)/g;
  let match = regex.exec(overview);
  while (match) {
    ids.push(match[1]);
    match = regex.exec(overview);
  }
  return ids;
}

export async function discoverComponents(mcpClient: McpClient): Promise<ComponentCatalog> {
  const [overview, instructions] = await Promise.all([
    mcpClient.listComponents(),
    mcpClient.getUiBuildingInstructions(),
  ]);

  const designSystemIds = extractDesignSystemIds(overview);

  const componentDocs: ComponentDoc[] = [];
  for (const id of designSystemIds) {
    try {
      const documentation = await mcpClient.getDocumentation(id);
      componentDocs.push({ id, documentation });
    } catch {
      // Skip docs that can't be fetched
    }
  }

  return { overview, instructions, componentDocs };
}
