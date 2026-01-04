import { describe, expect, it } from 'vitest';

import { filterGraph } from './filter-graph';
import type { GraphIR } from './types';

describe('filterGraph', () => {
  describe('P1: filter nodes by type', () => {
    it('should remove nodes of excluded type', () => {
      const graph: GraphIR = {
        nodes: [
          { id: 'evt:Start', type: 'event', label: 'Start' },
          { id: 'cmd:Process', type: 'command', label: 'Process' },
        ],
        edges: [{ from: 'evt:Start', to: 'cmd:Process' }],
      };

      const result = filterGraph(graph, { excludeTypes: ['event'], maintainEdges: false });

      expect(result).toEqual({
        nodes: [{ id: 'cmd:Process', type: 'command', label: 'Process' }],
        edges: [],
      });
    });
  });

  describe('P2: dangling edge removal', () => {
    it('should remove edges referencing filtered nodes in a chain', () => {
      const graph: GraphIR = {
        nodes: [
          { id: 'evt:A', type: 'event', label: 'A' },
          { id: 'cmd:B', type: 'command', label: 'B' },
          { id: 'evt:C', type: 'event', label: 'C' },
        ],
        edges: [
          { from: 'evt:A', to: 'cmd:B' },
          { from: 'cmd:B', to: 'evt:C' },
        ],
      };

      const result = filterGraph(graph, { excludeTypes: ['event'], maintainEdges: false });

      expect(result).toEqual({
        nodes: [{ id: 'cmd:B', type: 'command', label: 'B' }],
        edges: [],
      });
    });
  });

  describe('P3: single-hop edge maintenance', () => {
    it('should reconnect edges through single filtered node', () => {
      const graph: GraphIR = {
        nodes: [
          { id: 'evt:A', type: 'event', label: 'A' },
          { id: 'cmd:B', type: 'command', label: 'B' },
          { id: 'evt:C', type: 'event', label: 'C' },
        ],
        edges: [
          { from: 'evt:A', to: 'cmd:B' },
          { from: 'cmd:B', to: 'evt:C' },
        ],
      };

      const result = filterGraph(graph, { excludeTypes: ['command'], maintainEdges: true });

      expect(result).toEqual({
        nodes: [
          { id: 'evt:A', type: 'event', label: 'A' },
          { id: 'evt:C', type: 'event', label: 'C' },
        ],
        edges: [{ from: 'evt:A', to: 'evt:C' }],
      });
    });
  });

  describe('P4: multi-hop edge maintenance', () => {
    it('should reconnect edges through multiple consecutive filtered nodes', () => {
      const graph: GraphIR = {
        nodes: [
          { id: 'evt:A', type: 'event', label: 'A' },
          { id: 'cmd:B1', type: 'command', label: 'B1' },
          { id: 'cmd:B2', type: 'command', label: 'B2' },
          { id: 'evt:C', type: 'event', label: 'C' },
        ],
        edges: [
          { from: 'evt:A', to: 'cmd:B1' },
          { from: 'cmd:B1', to: 'cmd:B2' },
          { from: 'cmd:B2', to: 'evt:C' },
        ],
      };

      const result = filterGraph(graph, { excludeTypes: ['command'], maintainEdges: true });

      expect(result).toEqual({
        nodes: [
          { id: 'evt:A', type: 'event', label: 'A' },
          { id: 'evt:C', type: 'event', label: 'C' },
        ],
        edges: [{ from: 'evt:A', to: 'evt:C' }],
      });
    });
  });

  describe('P5: self-loop preservation', () => {
    it('should preserve self-loops created by edge reconnection and mark as backLink', () => {
      const graph: GraphIR = {
        nodes: [
          { id: 'cmd:A', type: 'command', label: 'A' },
          { id: 'evt:B', type: 'event', label: 'B' },
        ],
        edges: [
          { from: 'cmd:A', to: 'evt:B' },
          { from: 'evt:B', to: 'cmd:A' },
        ],
      };

      const result = filterGraph(graph, { excludeTypes: ['event'], maintainEdges: true });

      expect(result).toEqual({
        nodes: [{ id: 'cmd:A', type: 'command', label: 'A' }],
        edges: [{ from: 'cmd:A', to: 'cmd:A', backLink: true }],
      });
    });
  });

  describe('P6: preserve edge properties', () => {
    it('should preserve edge labels through reconnection', () => {
      const graph: GraphIR = {
        nodes: [
          { id: 'evt:A', type: 'event', label: 'A' },
          { id: 'cmd:B', type: 'command', label: 'B' },
          { id: 'evt:C', type: 'event', label: 'C' },
        ],
        edges: [
          { from: 'evt:A', to: 'cmd:B', label: 'triggers' },
          { from: 'cmd:B', to: 'evt:C' },
        ],
      };

      const result = filterGraph(graph, { excludeTypes: ['command'], maintainEdges: true });

      expect(result.edges[0]).toEqual({ from: 'evt:A', to: 'evt:C', label: 'triggers' });
    });

    it('should preserve backLink property through reconnection', () => {
      const graph: GraphIR = {
        nodes: [
          { id: 'evt:A', type: 'event', label: 'A' },
          { id: 'cmd:B', type: 'command', label: 'B' },
          { id: 'evt:C', type: 'event', label: 'C' },
        ],
        edges: [
          { from: 'evt:A', to: 'cmd:B', backLink: true },
          { from: 'cmd:B', to: 'evt:C' },
        ],
      };

      const result = filterGraph(graph, { excludeTypes: ['command'], maintainEdges: true });

      expect(result.edges[0]).toEqual({ from: 'evt:A', to: 'evt:C', backLink: true });
    });
  });

  describe('P7: multiple excluded types', () => {
    it('should filter multiple node types', () => {
      const graph: GraphIR = {
        nodes: [
          { id: 'evt:A', type: 'event', label: 'A' },
          { id: 'cmd:B', type: 'command', label: 'B' },
          { id: 'settled:C', type: 'settled', label: 'C' },
        ],
        edges: [
          { from: 'evt:A', to: 'cmd:B' },
          { from: 'cmd:B', to: 'settled:C' },
        ],
      };

      const result = filterGraph(graph, { excludeTypes: ['event', 'settled'], maintainEdges: true });

      expect(result).toEqual({
        nodes: [{ id: 'cmd:B', type: 'command', label: 'B' }],
        edges: [],
      });
    });
  });

  describe('P8: edge deduplication', () => {
    it('should deduplicate edges when multiple paths merge', () => {
      const graph: GraphIR = {
        nodes: [
          { id: 'evt:A', type: 'event', label: 'A' },
          { id: 'cmd:B1', type: 'command', label: 'B1' },
          { id: 'cmd:B2', type: 'command', label: 'B2' },
          { id: 'evt:C', type: 'event', label: 'C' },
        ],
        edges: [
          { from: 'evt:A', to: 'cmd:B1' },
          { from: 'evt:A', to: 'cmd:B2' },
          { from: 'cmd:B1', to: 'evt:C' },
          { from: 'cmd:B2', to: 'evt:C' },
        ],
      };

      const result = filterGraph(graph, { excludeTypes: ['command'], maintainEdges: true });

      expect(result.edges).toHaveLength(1);
      expect(result.edges[0]).toEqual({ from: 'evt:A', to: 'evt:C' });
    });
  });

  describe('P9: direct edge preservation with maintainEdges', () => {
    it('should preserve direct edges between non-filtered nodes', () => {
      const graph: GraphIR = {
        nodes: [
          { id: 'evt:A', type: 'event', label: 'A' },
          { id: 'evt:B', type: 'event', label: 'B' },
          { id: 'cmd:C', type: 'command', label: 'C' },
        ],
        edges: [
          { from: 'evt:A', to: 'evt:B' },
          { from: 'evt:B', to: 'cmd:C' },
        ],
      };

      const result = filterGraph(graph, { excludeTypes: ['command'], maintainEdges: true });

      expect(result).toEqual({
        nodes: [
          { id: 'evt:A', type: 'event', label: 'A' },
          { id: 'evt:B', type: 'event', label: 'B' },
        ],
        edges: [{ from: 'evt:A', to: 'evt:B' }],
      });
    });
  });

  describe('P10: edge cases', () => {
    it('should return empty graph when all nodes filtered', () => {
      const graph: GraphIR = {
        nodes: [{ id: 'evt:A', type: 'event', label: 'A' }],
        edges: [],
      };

      const result = filterGraph(graph, { excludeTypes: ['event'], maintainEdges: true });

      expect(result).toEqual({ nodes: [], edges: [] });
    });

    it('should return unchanged graph when no types excluded', () => {
      const graph: GraphIR = {
        nodes: [{ id: 'evt:A', type: 'event', label: 'A' }],
        edges: [],
      };

      const result = filterGraph(graph, { excludeTypes: [], maintainEdges: false });

      expect(result).toEqual(graph);
    });

    it('should handle empty graph input', () => {
      const graph: GraphIR = { nodes: [], edges: [] };

      const result = filterGraph(graph, { excludeTypes: ['event'], maintainEdges: true });

      expect(result).toEqual({ nodes: [], edges: [] });
    });
  });
});
