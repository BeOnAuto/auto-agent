import type { FilterOptions, GraphEdge, GraphIR, NodeType } from './types';

export function filterGraph(graph: GraphIR, options: FilterOptions): GraphIR {
  const excludeSet = new Set<NodeType>(options.excludeTypes);
  const remainingNodes = graph.nodes.filter((node) => !excludeSet.has(node.type));
  const removedNodeIds = new Set(graph.nodes.filter((n) => excludeSet.has(n.type)).map((n) => n.id));

  if (!options.maintainEdges) {
    return filterEdgesSimple(graph, remainingNodes, removedNodeIds);
  }

  return reconnectEdges(graph, remainingNodes, removedNodeIds);
}

function filterEdgesSimple(graph: GraphIR, remainingNodes: GraphIR['nodes'], removedNodeIds: Set<string>): GraphIR {
  const remainingEdges = graph.edges.filter((edge) => !removedNodeIds.has(edge.from) && !removedNodeIds.has(edge.to));
  return { nodes: remainingNodes, edges: remainingEdges };
}

function reconnectEdges(graph: GraphIR, remainingNodes: GraphIR['nodes'], removedNodeIds: Set<string>): GraphIR {
  const outgoingEdges = buildOutgoingEdgesMap(graph.edges);
  const reconnectedEdges: GraphEdge[] = [];
  const seenEdges = new Set<string>();

  for (const edge of graph.edges) {
    if (!removedNodeIds.has(edge.from)) {
      processEdge(edge, removedNodeIds, outgoingEdges, reconnectedEdges, seenEdges);
    }
  }

  return { nodes: remainingNodes, edges: reconnectedEdges };
}

function buildOutgoingEdgesMap(edges: GraphEdge[]): Map<string, GraphEdge[]> {
  const outgoingEdges = new Map<string, GraphEdge[]>();
  for (const edge of edges) {
    const existing = outgoingEdges.get(edge.from) ?? [];
    existing.push(edge);
    outgoingEdges.set(edge.from, existing);
  }
  return outgoingEdges;
}

function processEdge(
  edge: GraphEdge,
  removedNodeIds: Set<string>,
  outgoingEdges: Map<string, GraphEdge[]>,
  reconnectedEdges: GraphEdge[],
  seenEdges: Set<string>,
): void {
  if (!removedNodeIds.has(edge.to)) {
    addEdgeIfNew(edge, reconnectedEdges, seenEdges);
    return;
  }

  const targets = findFinalTargets(edge.to, removedNodeIds, outgoingEdges);
  for (const target of targets) {
    const isSelfLoop = target === edge.from;
    addReconnectedEdge(edge, target, reconnectedEdges, seenEdges, isSelfLoop);
  }
}

function addEdgeIfNew(edge: GraphEdge, reconnectedEdges: GraphEdge[], seenEdges: Set<string>): void {
  const key = `${edge.from}->${edge.to}`;
  if (!seenEdges.has(key)) {
    seenEdges.add(key);
    reconnectedEdges.push(edge);
  }
}

function addReconnectedEdge(
  sourceEdge: GraphEdge,
  target: string,
  reconnectedEdges: GraphEdge[],
  seenEdges: Set<string>,
  isSelfLoop: boolean,
): void {
  const key = `${sourceEdge.from}->${target}`;
  if (seenEdges.has(key)) {
    return;
  }
  seenEdges.add(key);

  const newEdge: GraphEdge = { from: sourceEdge.from, to: target };
  if (sourceEdge.label !== undefined) {
    newEdge.label = sourceEdge.label;
  }
  if (isSelfLoop || sourceEdge.backLink === true) {
    newEdge.backLink = true;
  }
  reconnectedEdges.push(newEdge);
}

function findFinalTargets(
  nodeId: string,
  removedNodeIds: Set<string>,
  outgoingEdges: Map<string, GraphEdge[]>,
): string[] {
  const edges = outgoingEdges.get(nodeId) ?? [];
  const targets: string[] = [];

  for (const edge of edges) {
    if (removedNodeIds.has(edge.to)) {
      targets.push(...findFinalTargets(edge.to, removedNodeIds, outgoingEdges));
    } else {
      targets.push(edge.to);
    }
  }

  return targets;
}
