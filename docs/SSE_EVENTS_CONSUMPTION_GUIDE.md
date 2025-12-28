# Pipeline SSE Events Consumption Guide

This guide explains how to consume the Server-Sent Events (SSE) endpoint at `http://localhost:5555/events` to receive real-time pipeline status updates in a client UI.

## Endpoint Overview

| Property | Value |
|----------|-------|
| URL | `http://localhost:5555/events` |
| Method | `GET` |
| Protocol | Server-Sent Events (SSE) |
| Content-Type | `text/event-stream` |

## Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `correlationId` | `string` (optional) | Filter events to only receive those matching a specific correlationId. Useful for tracking a specific pipeline execution. |

**Example with filter:**
```
http://localhost:5555/events?correlationId=corr-abc123xyz
```

## Event Message Format

Each SSE message follows the standard SSE format with a `data:` prefix. The payload is a JSON-serialized event object.

### Raw SSE Message Format
```
data: {"type":"TestsCheckPassed","data":{"targetDirectory":"./server","testsRun":15,"testsPassed":15},"correlationId":"corr-abc123","requestId":"req-xyz789","timestamp":"2025-01-15T10:30:00.000Z"}

```

Note: Each message ends with `\n\n` (double newline).

### Event Object Structure

```typescript
interface PipelineEvent {
  type: string;           // Event type name (e.g., "TestsCheckPassed", "ServerGenerated")
  data: Record<string, unknown>;  // Event-specific payload
  correlationId?: string; // Groups related events from a single pipeline run
  requestId?: string;     // Unique identifier for the originating command
  timestamp?: string;     // ISO 8601 timestamp (serialized as string from Date)
}
```

## Implementation

### React + TypeScript Implementation

```tsx
import { useEffect, useState, useCallback } from 'react';

interface PipelineEvent {
  type: string;
  data: Record<string, unknown>;
  correlationId?: string;
  requestId?: string;
  timestamp?: string;
}

interface UsePipelineEventsOptions {
  baseUrl?: string;
  correlationId?: string;
  onEvent?: (event: PipelineEvent) => void;
  onError?: (error: Event) => void;
  onOpen?: () => void;
}

export function usePipelineEvents(options: UsePipelineEventsOptions = {}) {
  const {
    baseUrl = 'http://localhost:5555',
    correlationId,
    onEvent,
    onError,
    onOpen,
  } = options;

  const [events, setEvents] = useState<PipelineEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const url = new URL('/events', baseUrl);
    if (correlationId) {
      url.searchParams.set('correlationId', correlationId);
    }

    const eventSource = new EventSource(url.toString());

    eventSource.onopen = () => {
      setIsConnected(true);
      setError(null);
      onOpen?.();
    };

    eventSource.onmessage = (messageEvent) => {
      try {
        const event = JSON.parse(messageEvent.data) as PipelineEvent;
        setEvents((prev) => [...prev, event]);
        onEvent?.(event);
      } catch (e) {
        console.error('Failed to parse SSE event:', e);
      }
    };

    eventSource.onerror = (errorEvent) => {
      setIsConnected(false);
      setError(new Error('SSE connection error'));
      onError?.(errorEvent);
    };

    return () => {
      eventSource.close();
      setIsConnected(false);
    };
  }, [baseUrl, correlationId, onEvent, onError, onOpen]);

  const clearEvents = useCallback(() => setEvents([]), []);

  return { events, isConnected, error, clearEvents };
}
```

### Vanilla JavaScript Implementation

```javascript
class PipelineEventStream {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || 'http://localhost:5555';
    this.correlationId = options.correlationId;
    this.eventSource = null;
    this.listeners = new Map();
  }

  connect() {
    const url = new URL('/events', this.baseUrl);
    if (this.correlationId) {
      url.searchParams.set('correlationId', this.correlationId);
    }

    this.eventSource = new EventSource(url.toString());

    this.eventSource.onmessage = (messageEvent) => {
      try {
        const event = JSON.parse(messageEvent.data);
        this.emit('event', event);
        this.emit(event.type, event);
      } catch (e) {
        console.error('Failed to parse SSE event:', e);
      }
    };

    this.eventSource.onopen = () => this.emit('connected');
    this.eventSource.onerror = (error) => this.emit('error', error);

    return this;
  }

  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    return this;
  }

  on(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType).push(callback);
    return this;
  }

  off(eventType, callback) {
    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) callbacks.splice(index, 1);
    }
    return this;
  }

  emit(eventType, data) {
    const callbacks = this.listeners.get(eventType) || [];
    callbacks.forEach((cb) => cb(data));
  }
}

// Usage
const stream = new PipelineEventStream({ baseUrl: 'http://localhost:5555' });

stream
  .on('connected', () => console.log('Connected to pipeline events'))
  .on('error', (err) => console.error('Connection error:', err))
  .on('event', (event) => console.log('Received:', event.type))
  .on('TestsCheckPassed', (event) => updateTestsUI(event))
  .on('TestsCheckFailed', (event) => showTestFailures(event))
  .connect();
```

## Common Event Types

The pipeline emits various events. Here are the most common ones you'll encounter:

### Success Events

| Event Type | Description | Key Data Fields |
|------------|-------------|-----------------|
| `TestsCheckPassed` | All tests passed | `targetDirectory`, `testsRun`, `testsPassed` |
| `LintCheckPassed` | Linting passed | `targetDirectory` |
| `TypeCheckPassed` | Type checking passed | `targetDirectory` |
| `ServerGenerated` | Server code generated | `modelPath`, `destination`, `serverDir` |
| `SliceGenerated` | Individual slice generated | `flowName`, `sliceName`, `sliceType`, `slicePath` |
| `SliceImplemented` | Slice AI implementation complete | `slicePath`, `filesImplemented` |
| `ServerImplemented` | Full server implemented | `serverDirectory`, `flowsImplemented` |
| `ClientGenerated` | Client project generated | `outputDir` |
| `ClientImplemented` | Client AI implementation complete | `projectDir` |
| `IAGenerated` | Information Architecture generated | `outputPath`, `outputDir` |
| `SchemaExported` | Schema exported | `directory`, `outputPath` |
| `ImportDesignSystemCompleted` | Design system imported | `outputDir` |

### Failure Events

| Event Type | Description | Key Data Fields |
|------------|-------------|-----------------|
| `TestsCheckFailed` | Tests failed | `targetDirectory`, `errors`, `failedTests`, `testsRun`, `testsFailed` |
| `LintCheckFailed` | Linting failed | `targetDirectory`, `errors` |
| `TypeCheckFailed` | Type checking failed | `targetDirectory`, `errors` |
| `ServerGenerationFailed` | Server generation failed | `modelPath`, `destination`, `error` |
| `SliceImplementationFailed` | Slice implementation failed | `slicePath`, `error` |
| `ServerImplementationFailed` | Server implementation failed | `serverDirectory`, `error` |
| `ClientGenerationFailed` | Client generation failed | `outputDir`, `error` |
| `ClientImplementationFailed` | Client implementation failed | `error`, `projectDir` |
| `IAGenerationFailed` | IA generation failed | `error`, `outputDir` |
| `IAValidationFailed` | IA validation failed | `errors`, `outputDir`, `modelPath` |
| `SchemaExportFailed` | Schema export failed | `directory`, `error` |
| `ImportDesignSystemFailed` | Design system import failed | `error`, `outputDir` |

## Tracking Pipeline Status by Node

To update a pipeline visualization, map events to their source commands:

```typescript
// Map event types to their source command (node in the pipeline)
const eventToCommand: Record<string, string> = {
  TestsCheckPassed: 'CheckTests',
  TestsCheckFailed: 'CheckTests',
  LintCheckPassed: 'CheckLint',
  LintCheckFailed: 'CheckLint',
  TypeCheckPassed: 'CheckTypes',
  TypeCheckFailed: 'CheckTypes',
  ServerGenerated: 'GenerateServer',
  ServerGenerationFailed: 'GenerateServer',
  SliceImplemented: 'ImplementSlice',
  SliceImplementationFailed: 'ImplementSlice',
  // ... add more mappings as needed
};

// Determine status from event type
function getStatusFromEvent(eventType: string): 'success' | 'error' | 'running' {
  if (eventType.includes('Failed') || eventType.includes('Error')) {
    return 'error';
  }
  return 'success';
}

// Example: Update node status
function handleEvent(event: PipelineEvent) {
  const commandName = eventToCommand[event.type];
  if (commandName) {
    updateNodeStatus(commandName, getStatusFromEvent(event.type), event.data);
  }
}
```

## Using with Pipeline Graph

Fetch the pipeline graph structure from `/pipeline` to get node metadata:

```typescript
interface PipelineNode {
  id: string;
  name: string;
  title: string;
  displayName: string;
  alias?: string;
  status: 'None' | 'Running' | 'Success' | 'Error';
}

interface PipelineGraph {
  nodes: Array<{ id: string; type: 'event' | 'command' | 'settled'; label: string }>;
  edges: Array<{ from: string; to: string; backLink?: boolean }>;
  pipelineNodes: PipelineNode[];
}

async function fetchPipelineGraph(): Promise<PipelineGraph> {
  const response = await fetch('http://localhost:5555/pipeline');
  return response.json();
}
```

## Reconnection Strategy

SSE connections can drop. Implement reconnection:

```typescript
function createReconnectingEventSource(url: string, options: { maxRetries?: number; retryDelay?: number } = {}) {
  const { maxRetries = 5, retryDelay = 3000 } = options;
  let retryCount = 0;
  let eventSource: EventSource | null = null;

  function connect() {
    eventSource = new EventSource(url);

    eventSource.onopen = () => {
      retryCount = 0; // Reset on successful connection
    };

    eventSource.onerror = () => {
      eventSource?.close();

      if (retryCount < maxRetries) {
        retryCount++;
        console.log(`Reconnecting... attempt ${retryCount}/${maxRetries}`);
        setTimeout(connect, retryDelay);
      } else {
        console.error('Max reconnection attempts reached');
      }
    };

    return eventSource;
  }

  return {
    connect,
    disconnect: () => eventSource?.close(),
  };
}
```

## Complete React Component Example

```tsx
import { usePipelineEvents } from './usePipelineEvents';

interface NodeStatus {
  id: string;
  name: string;
  displayName: string;
  status: 'idle' | 'running' | 'success' | 'error';
  lastEvent?: PipelineEvent;
}

export function PipelineStatusPanel() {
  const [nodes, setNodes] = useState<Map<string, NodeStatus>>(new Map());

  const { isConnected, error } = usePipelineEvents({
    onEvent: (event) => {
      // Determine which command produced this event
      const commandName = getCommandFromEvent(event.type);
      if (!commandName) return;

      setNodes((prev) => {
        const next = new Map(prev);
        const existing = next.get(commandName) || {
          id: commandName,
          name: commandName,
          displayName: commandName,
          status: 'idle',
        };

        next.set(commandName, {
          ...existing,
          status: event.type.includes('Failed') ? 'error' : 'success',
          lastEvent: event,
        });

        return next;
      });
    },
  });

  return (
    <div className="pipeline-status">
      <div className="connection-status">
        {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
        {error && <span className="error">{error.message}</span>}
      </div>

      <div className="nodes">
        {Array.from(nodes.values()).map((node) => (
          <div key={node.id} className={`node node--${node.status}`}>
            <span className="node-name">{node.displayName}</span>
            <span className="node-status">{node.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Tips

1. **Use correlationId for filtering**: When starting a pipeline run, capture the correlationId from the command response and use it to filter events for that specific run.

2. **Handle connection drops gracefully**: SSE connections can be interrupted. Always implement reconnection logic.

3. **Parse timestamps**: The `timestamp` field is serialized as an ISO 8601 string. Parse it with `new Date(event.timestamp)` if you need a Date object.

4. **Event ordering**: Events arrive in the order they're emitted, but network latency may cause slight variations. Use `timestamp` for precise ordering if needed.

5. **Memory management**: If storing events in state, implement a maximum buffer size to prevent memory issues in long-running sessions.
