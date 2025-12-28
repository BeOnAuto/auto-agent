# Pipeline UI Integration Guide

This guide explains how to integrate with the Pipeline Server to display real-time command execution status.

## API Endpoints

### 1. GET `/pipeline`

Returns the pipeline graph structure with node status.

**Query Parameters:**
- `correlationId` (optional): Filter status to a specific pipeline run

**Response:**
```json
{
  "nodes": [
    {
      "id": "cmd:ImplementSlice",
      "type": "command",
      "label": "Implement Slice",
      "status": "running",
      "pendingCount": 3,
      "endedCount": 7
    },
    {
      "id": "evt:SliceImplemented",
      "type": "event",
      "label": "Slice Implemented"
    }
  ],
  "edges": [
    { "from": "evt:SliceGenerated", "to": "cmd:ImplementSlice" },
    { "from": "cmd:ImplementSlice", "to": "evt:SliceImplemented" }
  ],
  "latestRun": "corr-abc123"
}
```

**Node Status Values:**
- `idle` - Command has not been invoked yet
- `running` - Command is currently executing (at least one item pending)
- `success` - All items completed successfully
- `error` - All items completed, at least one failed

**Counts (for commands only):**
- `pendingCount` - Number of work items currently running
- `endedCount` - Number of work items that have completed (success or error)

### 2. GET `/events` (Server-Sent Events)

Real-time event stream for status updates.

**Query Parameters:**
- `correlationId` (optional): Filter to events for a specific pipeline run

**Event Types:**

#### `NodeStatusChanged`
Fired when a command node's status changes.

```json
{
  "type": "NodeStatusChanged",
  "data": {
    "nodeId": "cmd:ImplementSlice",
    "status": "running",
    "previousStatus": "idle",
    "pendingCount": 3,
    "endedCount": 7
  },
  "correlationId": "corr-abc123"
}
```

#### `PipelineRunStarted`
Fired when a new pipeline run begins.

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

### 3. POST `/command`

Dispatch a command to the pipeline.

**Request:**
```json
{
  "type": "ImplementSlice",
  "data": {
    "slicePath": "/server/slice-1"
  }
}
```

**Response:**
```json
{
  "status": "ack",
  "commandId": "req-xyz789",
  "correlationId": "corr-abc123",
  "timestamp": "2025-12-28T07:31:31.562Z"
}
```

## Integration Patterns

### Pattern 1: Initial Load + SSE Updates

1. Fetch the pipeline graph with `GET /pipeline?correlationId=<latestRun>`
2. Subscribe to SSE at `GET /events?correlationId=<latestRun>`
3. On `NodeStatusChanged`, update the corresponding node's status in local state

### Pattern 2: React Hook Example

```typescript
interface GraphNode {
  id: string;
  type: 'event' | 'command' | 'settled';
  label: string;
  status?: 'idle' | 'running' | 'success' | 'error';
  pendingCount?: number;
  endedCount?: number;
}

interface GraphEdge {
  from: string;
  to: string;
  backLink?: boolean;
}

interface PipelineGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  latestRun: string;
}

function usePipelineGraph(baseUrl: string) {
  const [graph, setGraph] = useState<PipelineGraph | null>(null);
  const [correlationId, setCorrelationId] = useState<string | null>(null);

  // Fetch initial graph
  useEffect(() => {
    async function fetchGraph() {
      const url = correlationId
        ? `${baseUrl}/pipeline?correlationId=${correlationId}`
        : `${baseUrl}/pipeline`;
      const res = await fetch(url);
      const data = await res.json();
      setGraph(data);
      if (!correlationId && data.latestRun) {
        setCorrelationId(data.latestRun);
      }
    }
    fetchGraph();
  }, [baseUrl, correlationId]);

  // Subscribe to SSE updates
  useEffect(() => {
    if (!correlationId) return;

    const eventSource = new EventSource(
      `${baseUrl}/events?correlationId=${correlationId}`
    );

    eventSource.onmessage = (event) => {
      const parsed = JSON.parse(event.data);

      if (parsed.type === 'NodeStatusChanged') {
        setGraph((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            nodes: prev.nodes.map((node) =>
              node.id === parsed.data.nodeId
                ? {
                    ...node,
                    status: parsed.data.status,
                    pendingCount: parsed.data.pendingCount,
                    endedCount: parsed.data.endedCount,
                  }
                : node
            ),
          };
        });
      }

      if (parsed.type === 'PipelineRunStarted') {
        setCorrelationId(parsed.data.correlationId);
      }
    };

    return () => eventSource.close();
  }, [baseUrl, correlationId]);

  return { graph, correlationId, setCorrelationId };
}
```

### Pattern 3: Vue Composable

```typescript
import { ref, watch, onUnmounted } from 'vue';

export function usePipelineGraph(baseUrl: string) {
  const graph = ref<PipelineGraph | null>(null);
  const correlationId = ref<string | null>(null);
  let eventSource: EventSource | null = null;

  async function fetchGraph() {
    const url = correlationId.value
      ? `${baseUrl}/pipeline?correlationId=${correlationId.value}`
      : `${baseUrl}/pipeline`;
    const res = await fetch(url);
    graph.value = await res.json();
    if (!correlationId.value && graph.value?.latestRun) {
      correlationId.value = graph.value.latestRun;
    }
  }

  watch(correlationId, (newId) => {
    if (eventSource) eventSource.close();
    if (!newId) return;

    eventSource = new EventSource(
      `${baseUrl}/events?correlationId=${newId}`
    );

    eventSource.onmessage = (event) => {
      const parsed = JSON.parse(event.data);

      if (parsed.type === 'NodeStatusChanged' && graph.value) {
        const node = graph.value.nodes.find(
          (n) => n.id === parsed.data.nodeId
        );
        if (node) {
          node.status = parsed.data.status;
          node.pendingCount = parsed.data.pendingCount;
          node.endedCount = parsed.data.endedCount;
        }
      }

      if (parsed.type === 'PipelineRunStarted') {
        correlationId.value = parsed.data.correlationId;
      }
    };
  }, { immediate: true });

  onUnmounted(() => eventSource?.close());

  fetchGraph();

  return { graph, correlationId };
}
```

## Status Display Guidelines

### Command Node States

| Status | pendingCount | endedCount | Display |
|--------|--------------|------------|---------|
| `idle` | 0 | 0 | Gray/neutral |
| `running` | > 0 | any | Blue/animated spinner |
| `success` | 0 | > 0 | Green checkmark |
| `error` | 0 | > 0 | Red X |

### Progress Indicator

For commands with multiple items, show progress:

```
ImplementSlice: 7/10 completed (3 running)
```

Derived from:
- Total = pendingCount + endedCount
- Completed = endedCount
- Running = pendingCount

### Handling Retries

When a failed item is retried:
1. `pendingCount` increases (item is running again)
2. `endedCount` may decrease (item moved from ended to pending)
3. Status may change from `error` back to `running`

The UI should handle this gracefully - a command can go from `error` → `running` when retries occur.

## Testing the Integration

### Manual Testing with curl

```bash
# Start a command
curl -X POST http://localhost:5555/command \
  -H "Content-Type: application/json" \
  -d '{"type": "ImplementSlice", "data": {"slicePath": "/test/slice-1"}}'

# Get the correlationId from response, then:
curl "http://localhost:5555/pipeline?correlationId=corr-xxx"

# Watch SSE events
curl -N "http://localhost:5555/events?correlationId=corr-xxx"
```

### Example Response After Command Execution

```json
{
  "nodes": [
    {
      "id": "cmd:ImplementSlice",
      "type": "command",
      "label": "Implement Slice",
      "status": "error",
      "pendingCount": 0,
      "endedCount": 1
    }
  ],
  "edges": [...],
  "latestRun": "corr-fQnvQO9eldagFYpgNEW33"
}
```

## Troubleshooting

### Status not updating in UI

1. **Check SSE connection**: Ensure `EventSource` is connected to `/events`
2. **Check correlationId filter**: If filtering by correlationId, ensure it matches the active run
3. **Check event handling**: Log incoming SSE messages to verify they're being received
4. **Check node ID matching**: `NodeStatusChanged.data.nodeId` uses format `cmd:CommandName`

### No nodes have status

The `/pipeline` endpoint requires `?correlationId=<id>` to return status. Without it, nodes have no status field. Use `latestRun` from the response to get the current run's correlationId.

### Events not filtering correctly

SSE events are broadcast to all connected clients. Client-side filtering by correlationId should be done even when using the query parameter, as a safeguard.
