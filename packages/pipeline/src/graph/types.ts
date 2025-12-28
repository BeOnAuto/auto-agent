export type NodeType = 'event' | 'command' | 'settled';

export type NodeStatus = 'idle' | 'running' | 'success' | 'error';

export interface GraphNode {
  id: string;
  type: NodeType;
  label: string;
  status?: NodeStatus;
  pendingCount?: number;
  endedCount?: number;
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
