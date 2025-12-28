# Node Status Integration Guide

This guide explains how to integrate pipeline node status tracking into a UI, enabling real-time visualization of command execution states.

## Overview

The pipeline server provides:
1. **Status on graph nodes** — Command nodes include a `status` field
2. **Real-time SSE events** — `NodeStatusChanged` and `PipelineRunStarted` events
3. **Per-run tracking** — Each `correlationId` tracks status independently

## Node Status Values

| Status | Description |
|--------|-------------|
| `idle` | Command has not started (default) |
| `running` | Command is currently executing |
| `success` | Command completed successfully |
| `error` | Command failed (event type contains "Failed") |

## API Endpoints

### GET /pipeline

Returns the pipeline graph with node status.

**Without correlationId:**
```
GET /pipeline
```
All command nodes return `status: 'idle'`.

**With correlationId:**
```
GET /pipeline?correlationId=corr-abc123
```
Returns status for that specific pipeline run.

**Response:**
```json
{
  "nodes": [
    { "id": "evt:Start", "type": "event", "label": "Start" },
    { "id": "cmd:GenerateServer", "type": "command", "label": "Generate Server", "status": "success" },
    { "id": "cmd:CheckTests", "type": "command", "label": "Check Tests", "status": "running" }
  ],
  "edges": [
    { "from": "evt:Start", "to": "cmd:GenerateServer" },
    { "from": "cmd:GenerateServer", "to": "cmd:CheckTests" }
  ]
}
```

### POST /command

Execute a command and receive its `correlationId` for tracking.

**Request:**
```json
{
  "type": "GenerateServer",
  "data": { "modelPath": "./model.ts", "destination": "./server" }
}
```

**Response:**
```json
{
  "status": "ack",
  "commandId": "req-abc123",
  "correlationId": "corr-xyz789",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

Store the `correlationId` to track this pipeline run's status.

### GET /events (SSE)

Subscribe to real-time status updates.

```
GET /events
GET /events?correlationId=corr-abc123
```

## SSE Event Types

### PipelineRunStarted

Emitted when a new pipeline run begins (first command with a new correlationId).

```json
{
  "type": "PipelineRunStarted",
  "data": {
    "correlationId": "corr-abc123",
    "triggerCommand": "GenerateServer"
  },
  "correlationId": "corr-abc123"
}
```

### NodeStatusChanged

Emitted when a command's status changes.

```json
{
  "type": "NodeStatusChanged",
  "data": {
    "nodeId": "cmd:CheckTests",
    "status": "running",
    "previousStatus": "idle"
  },
  "correlationId": "corr-abc123"
}
```

## React Integration

### usePipelineGraph Hook

```tsx
import { useState, useEffect, useCallback } from 'react';

interface GraphNode {
  id: string;
  type: 'event' | 'command' | 'settled';
  label: string;
  status?: 'idle' | 'running' | 'success' | 'error';
}

interface GraphEdge {
  from: string;
  to: string;
  backLink?: boolean;
}

interface PipelineGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

interface UsePipelineGraphOptions {
  baseUrl?: string;
  correlationId?: string;
  pollInterval?: number;
}

export function usePipelineGraph(options: UsePipelineGraphOptions = {}) {
  const { baseUrl = 'http://localhost:5555', correlationId, pollInterval } = options;
  const [graph, setGraph] = useState<PipelineGraph | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchGraph = useCallback(async () => {
    try {
      const url = new URL('/pipeline', baseUrl);
      if (correlationId) {
        url.searchParams.set('correlationId', correlationId);
      }
      const response = await fetch(url.toString());
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setGraph(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [baseUrl, correlationId]);

  useEffect(() => {
    fetchGraph();
    if (pollInterval) {
      const interval = setInterval(fetchGraph, pollInterval);
      return () => clearInterval(interval);
    }
  }, [fetchGraph, pollInterval]);

  return { graph, isLoading, error, refetch: fetchGraph };
}
```

### useNodeStatusEvents Hook

```tsx
import { useEffect, useCallback, useRef } from 'react';

interface NodeStatusChangedEvent {
  type: 'NodeStatusChanged';
  data: {
    nodeId: string;
    status: 'idle' | 'running' | 'success' | 'error';
    previousStatus: 'idle' | 'running' | 'success' | 'error';
  };
  correlationId: string;
}

interface PipelineRunStartedEvent {
  type: 'PipelineRunStarted';
  data: {
    correlationId: string;
    triggerCommand: string;
  };
  correlationId: string;
}

type PipelineEvent = NodeStatusChangedEvent | PipelineRunStartedEvent;

interface UseNodeStatusEventsOptions {
  baseUrl?: string;
  correlationId?: string;
  onNodeStatusChanged?: (event: NodeStatusChangedEvent) => void;
  onPipelineRunStarted?: (event: PipelineRunStartedEvent) => void;
}

export function useNodeStatusEvents(options: UseNodeStatusEventsOptions = {}) {
  const { baseUrl = 'http://localhost:5555', correlationId, onNodeStatusChanged, onPipelineRunStarted } = options;
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const url = new URL('/events', baseUrl);
    if (correlationId) {
      url.searchParams.set('correlationId', correlationId);
    }

    const eventSource = new EventSource(url.toString());
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (messageEvent) => {
      try {
        const event = JSON.parse(messageEvent.data) as PipelineEvent;
        if (event.type === 'NodeStatusChanged') {
          onNodeStatusChanged?.(event as NodeStatusChangedEvent);
        } else if (event.type === 'PipelineRunStarted') {
          onPipelineRunStarted?.(event as PipelineRunStartedEvent);
        }
      } catch (err) {
        console.error('Failed to parse SSE event:', err);
      }
    };

    return () => {
      eventSource.close();
      eventSourceRef.current = null;
    };
  }, [baseUrl, correlationId, onNodeStatusChanged, onPipelineRunStarted]);
}
```

### Complete Pipeline Visualization Component

```tsx
import { useState, useCallback } from 'react';
import { usePipelineGraph } from './usePipelineGraph';
import { useNodeStatusEvents } from './useNodeStatusEvents';

type NodeStatus = 'idle' | 'running' | 'success' | 'error';

const STATUS_COLORS: Record<NodeStatus, string> = {
  idle: '#9e9e9e',
  running: '#2196f3',
  success: '#4caf50',
  error: '#f44336',
};

const STATUS_ICONS: Record<NodeStatus, string> = {
  idle: '○',
  running: '◐',
  success: '●',
  error: '✕',
};

interface PipelineVisualizationProps {
  correlationId?: string;
}

export function PipelineVisualization({ correlationId }: PipelineVisualizationProps) {
  const [nodeStatuses, setNodeStatuses] = useState<Map<string, NodeStatus>>(new Map());
  const { graph, isLoading, error, refetch } = usePipelineGraph({ correlationId });

  const handleNodeStatusChanged = useCallback((event: { data: { nodeId: string; status: NodeStatus } }) => {
    setNodeStatuses((prev) => {
      const next = new Map(prev);
      next.set(event.data.nodeId, event.data.status);
      return next;
    });
  }, []);

  useNodeStatusEvents({
    correlationId,
    onNodeStatusChanged: handleNodeStatusChanged,
    onPipelineRunStarted: () => refetch(),
  });

  if (isLoading) return <div>Loading pipeline...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!graph) return null;

  const commandNodes = graph.nodes.filter((n) => n.type === 'command');

  return (
    <div className="pipeline-visualization">
      <h2>Pipeline Status</h2>
      <div className="nodes-grid">
        {commandNodes.map((node) => {
          const status = nodeStatuses.get(node.id) ?? node.status ?? 'idle';
          return (
            <div
              key={node.id}
              className="node-card"
              style={{ borderColor: STATUS_COLORS[status] }}
            >
              <span className="status-icon" style={{ color: STATUS_COLORS[status] }}>
                {STATUS_ICONS[status]}
              </span>
              <span className="node-label">{node.label}</span>
              <span className="status-badge" style={{ backgroundColor: STATUS_COLORS[status] }}>
                {status}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

### CSS for the Component

```css
.pipeline-visualization {
  padding: 1rem;
}

.nodes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.node-card {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: 2px solid;
  border-radius: 8px;
  background: white;
  transition: border-color 0.2s ease;
}

.status-icon {
  font-size: 1.25rem;
  font-weight: bold;
}

.node-label {
  flex: 1;
  font-weight: 500;
}

.status-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  color: white;
  text-transform: uppercase;
}

/* Animations for running status */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.node-card[data-status="running"] .status-icon {
  animation: pulse 1s ease-in-out infinite;
}
```

## Workflow Example

### 1. Initial Load

```tsx
function App() {
  const [correlationId, setCorrelationId] = useState<string | null>(null);

  return (
    <div>
      <CommandTrigger onCommandSent={setCorrelationId} />
      {correlationId && <PipelineVisualization correlationId={correlationId} />}
    </div>
  );
}
```

### 2. Trigger a Command

```tsx
function CommandTrigger({ onCommandSent }: { onCommandSent: (id: string) => void }) {
  const handleClick = async () => {
    const response = await fetch('http://localhost:5555/command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'GenerateServer',
        data: { modelPath: './model.ts', destination: './server' },
      }),
    });
    const { correlationId } = await response.json();
    onCommandSent(correlationId);
  };

  return <button onClick={handleClick}>Generate Server</button>;
}
```

### 3. Real-Time Updates Flow

```
User clicks "Generate Server"
       ↓
POST /command → { correlationId: "corr-abc123" }
       ↓
SSE: PipelineRunStarted { triggerCommand: "GenerateServer" }
       ↓
SSE: NodeStatusChanged { nodeId: "cmd:GenerateServer", status: "running" }
       ↓
(command executes...)
       ↓
SSE: NodeStatusChanged { nodeId: "cmd:GenerateServer", status: "success" }
       ↓
SSE: NodeStatusChanged { nodeId: "cmd:CheckTests", status: "running" }
       ↓
(downstream commands continue...)
```

## Multiple Pipeline Runs

Track multiple concurrent runs by storing each `correlationId`:

```tsx
function MultiRunDashboard() {
  const [runs, setRuns] = useState<string[]>([]);

  const startNewRun = async () => {
    const response = await fetch('http://localhost:5555/command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'GenerateServer', data: {} }),
    });
    const { correlationId } = await response.json();
    setRuns((prev) => [...prev, correlationId]);
  };

  return (
    <div>
      <button onClick={startNewRun}>Start New Run</button>
      <div className="runs-container">
        {runs.map((correlationId) => (
          <PipelineVisualization key={correlationId} correlationId={correlationId} />
        ))}
      </div>
    </div>
  );
}
```

## Tips

1. **Store correlationId immediately** — Capture it from the `/command` response before the command executes

2. **Use SSE for real-time updates** — Polling `/pipeline` works but SSE provides instant feedback

3. **Handle reconnection** — SSE connections can drop; implement reconnection logic

4. **Filter by correlationId** — Use the query parameter to avoid mixing status from different runs

5. **Combine approaches** — Use SSE for real-time updates but periodically poll `/pipeline` as a fallback

6. **Status determination** — Events with "Failed" in the type name result in `error` status; all others result in `success`
