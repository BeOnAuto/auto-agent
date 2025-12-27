export type NodeType = 'event' | 'command' | 'settled';

export interface GraphNode {
  id: string;
  type: NodeType;
  label: string;
}

export interface GraphEdge {
  from: string;
  to: string;
  label?: string;
  backLink?: boolean;
}

export interface GraphIR {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface FilterOptions {
  excludeTypes: NodeType[];
  maintainEdges: boolean;
}
