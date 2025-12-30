# @auto-engineer/message-store

Message store for persisting commands and events with stream-based storage and session tracking.

---

## Purpose

Without `@auto-engineer/message-store`, you would have to implement your own stream-based message persistence, handle revision tracking, manage sessions, and implement filtering across message types.

This package provides a persistence layer for CQRS/Event Sourcing architectures. It supports stream-based storage with revision tracking, session management, flexible filtering, optimistic concurrency control, and global position tracking.

---

## Installation

```bash
pnpm add @auto-engineer/message-store
```

## Quick Start

```typescript
import { MemoryMessageStore } from '@auto-engineer/message-store';

const store = new MemoryMessageStore();

await store.saveMessage('user-commands', {
  type: 'CreateUser',
  data: { name: 'Alice', email: 'alice@example.com' },
  requestId: 'req-123',
});

const messages = await store.getMessages('user-commands');
console.log(messages);
// → [{ streamId: 'user-commands', message: {...}, revision: 0n, position: 1n, ... }]
```

---

## How-to Guides

### Save Messages to a Stream

```typescript
import { MemoryMessageStore } from '@auto-engineer/message-store';

const store = new MemoryMessageStore();

await store.saveMessage('orders-123', {
  type: 'OrderPlaced',
  data: { orderId: 'ord-001', total: 99.99 },
});
```

### Use Sessions

```typescript
const store = new MemoryMessageStore();

const sessionId = await store.createSession();
await store.saveMessage('commands', { type: 'StartProcess', data: {} });
await store.saveMessage('events', { type: 'ProcessStarted', data: {} });

const sessionMessages = await store.getSessionMessages(sessionId);
await store.endSession(sessionId);
```

### Filter Messages

```typescript
const recentCommands = await store.getAllCommands({
  fromTimestamp: new Date(Date.now() - 3600000),
  messageNames: ['CreateUser', 'UpdateUser'],
});

const correlatedMessages = await store.getAllMessages({
  correlationId: 'corr-456',
});
```

### Use Optimistic Concurrency

```typescript
await store.saveMessage('orders-123', command1); // revision becomes 0

try {
  await store.saveMessage('orders-123', command2, BigInt(-1));
} catch (err) {
  // "Expected revision -1 but stream is at revision 0"
}
```

---

## API Reference

### Package Exports

```typescript
import {
  MemoryMessageStore,
  type IMessageStore,
  type ILocalMessageStore,
  type Message,
  type PositionalMessage,
  type MessageFilter,
  type StreamInfo,
  type SessionInfo,
} from '@auto-engineer/message-store';
```

### IMessageStore Interface

| Method | Description |
|--------|-------------|
| `saveMessage(streamId, message, expectedRevision?)` | Save a single message |
| `saveMessages(streamId, messages, expectedRevision?)` | Save multiple messages |
| `getMessages(streamId, fromRevision?, count?)` | Get messages from stream |
| `getAllMessages(filter?, count?)` | Get all messages with filtering |
| `getAllCommands(filter?, count?)` | Get all commands |
| `getAllEvents(filter?, count?)` | Get all events |
| `getStreamInfo(streamId)` | Get stream metadata |
| `getStreams()` | Get all stream IDs |
| `getSessions()` | Get all session info |
| `getStats()` | Get storage statistics |

### PositionalMessage

```typescript
interface PositionalMessage {
  streamId: string;
  message: Message;
  messageType: 'command' | 'event';
  revision: bigint;
  position: bigint;
  timestamp: Date;
  sessionId: string;
}
```

### MessageFilter

```typescript
interface MessageFilter {
  messageType?: 'command' | 'event';
  messageNames?: string[];
  streamId?: string;
  sessionId?: string;
  correlationId?: string;
  fromPosition?: bigint;
  toPosition?: bigint;
  fromTimestamp?: Date;
  toTimestamp?: Date;
}
```

---

## Architecture

```
src/
├── index.ts
├── types.ts
└── MemoryMessageStore.ts
```

### Key Concepts

- **Stream-based storage**: Messages organized by streamId
- **Global positioning**: Monotonically increasing position across streams
- **Session tracking**: Group related messages together
- **Optimistic concurrency**: expectedRevision parameter

### Dependencies

| Package | Usage |
|---------|-------|
| `@auto-engineer/message-bus` | Command and Event types |
| `debug` | Debug logging |
| `nanoid` | Session ID generation |
