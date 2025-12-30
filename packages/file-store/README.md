# @auto-engineer/file-store

Platform-agnostic file storage abstraction with in-memory and Node.js implementations.

---

## Purpose

Without `@auto-engineer/file-store`, you would have to write platform-specific file operations, handle path normalization across operating systems, and create separate test implementations for file-dependent code.

This package provides unified interfaces for file system operations. The in-memory implementation enables testing without touching the disk, while the Node.js implementation handles real file operations with automatic directory creation.

---

## Installation

```bash
pnpm add @auto-engineer/file-store
```

## Quick Start

```typescript
import { InMemoryFileStore } from '@auto-engineer/file-store';

const store = new InMemoryFileStore();

await store.write('/data/file.txt', new TextEncoder().encode('content'));
const data = await store.read('/data/file.txt');

console.log(new TextDecoder().decode(data!));
// → "content"
```

---

## How-to Guides

### Use In-Memory Store for Testing

```typescript
import { InMemoryFileStore } from '@auto-engineer/file-store';

const store = new InMemoryFileStore();
await store.write('/input.txt', new TextEncoder().encode('data'));

const exists = await store.exists('/input.txt');
const tree = await store.listTree('/');
```

### Use Node Store for Production

```typescript
import { NodeFileStore } from '@auto-engineer/file-store/node';

const store = new NodeFileStore();

await store.writeText('config.json', JSON.stringify({ key: 'value' }));
const text = await store.readText('config.json');
```

### List Directory Tree

```typescript
import { NodeFileStore } from '@auto-engineer/file-store/node';

const store = new NodeFileStore();
const tree = await store.listTree('/project', {
  pruneDirRegex: /node_modules|\.git/,
  includeSizes: true,
});
```

### Dependency Injection

```typescript
import type { IFileStore } from '@auto-engineer/file-store';

class DocumentManager {
  constructor(private store: IFileStore) {}

  async save(id: string, content: string): Promise<void> {
    await this.store.write(`/docs/${id}.json`, new TextEncoder().encode(content));
  }
}
```

---

## API Reference

### Package Exports

```typescript
import { InMemoryFileStore, type IFileStore, type IExtendedFileStore } from '@auto-engineer/file-store';

import { NodeFileStore } from '@auto-engineer/file-store/node';
```

### Entry Points

| Entry Point | Import Path | Description |
|-------------|-------------|-------------|
| Main | `@auto-engineer/file-store` | Platform-agnostic (InMemoryFileStore, types) |
| Node | `@auto-engineer/file-store/node` | Node.js-specific (NodeFileStore) |

### IFileStore Interface

```typescript
interface IFileStore {
  write(path: string, data: Uint8Array): Promise<void>;
  read(path: string): Promise<Uint8Array | null>;
  exists(path: string): Promise<boolean>;
  listTree(root?: string, opts?: ListTreeOptions): Promise<TreeEntry[]>;
  remove(path: string): Promise<void>;
}
```

### IExtendedFileStore Interface

```typescript
interface IExtendedFileStore extends IFileStore {
  ensureDir(path: string): Promise<void>;
  readdir(path: string): Promise<DirEntry[]>;
  readText(path: string): Promise<string | null>;
  writeText(path: string, text: string): Promise<void>;
  join(...parts: string[]): string;
  dirname(p: string): string;
  fromHere(relative: string, base?: string): string;
}
```

### ListTree Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `followSymlinkDirs` | `boolean` | `true` | Traverse symlinked directories |
| `includeSizes` | `boolean` | `true` | Include file sizes |
| `pruneDirRegex` | `RegExp` | - | Skip matching directories |

---

## Architecture

```
src/
├── index.ts
├── node.ts
├── types.ts
├── path.ts
├── InMemoryFileStore.ts
└── NodeFileStore.ts
```

### Key Concepts

- **Binary-first API**: Core operations use `Uint8Array` for compatibility
- **Null over exceptions**: Read returns `null` for missing files
- **POSIX normalization**: All paths use forward slashes
- **Auto directory creation**: Write creates parent directories

### Dependencies

This package has **zero external dependencies**. It uses only Node.js built-in modules.
