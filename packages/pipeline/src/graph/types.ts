export type NodeType = 'event' | 'command';

export interface GraphNode {
  id: string;
  type: NodeType;
  label: string;
}

export interface GraphEdge {
  from: string;
  to: string;
  label?: string;
}

export interface GraphIR {
  nodes: GraphNode[];
  edges: GraphEdge[];
}
