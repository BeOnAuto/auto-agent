# @auto-engineer/id

Generate cryptographically secure, URL-safe, unbiased base-62 identifiers.

---

## Purpose

Without `@auto-engineer/id`, you would have to implement your own ID generation with proper cryptographic security, handle modulo bias in random number generation, and ensure URL-safe character encoding.

This package provides compact, URL-safe identifiers using base-62 encoding with cryptographically secure random values. The implementation uses rejection sampling to ensure uniform distribution across all characters.

---

## Installation

```bash
pnpm add @auto-engineer/id
```

## Quick Start

```typescript
import { generateId } from '@auto-engineer/id';

const id = generateId();
console.log(id);
// → "aP9ZfWcLQ"
```

---

## How-to Guides

### Generate a Default ID

```typescript
import { generateId } from '@auto-engineer/id';

const id = generateId();
// 9-character base-62 token
```

### Generate with Prefix

```typescript
import { generateId } from '@auto-engineer/id';

const userId = generateId({ prefix: 'user-' });
// → "user-xYz7GhtR2"
```

### Generate with Custom Length

```typescript
import { generateId } from '@auto-engineer/id';

const longId = generateId({ length: 12 });
// → "QwErTyUiOp12"
```

### Combine Options

```typescript
import { generateId } from '@auto-engineer/id';

const orderId = generateId({ prefix: 'ord-', length: 6 });
// → "ord-Ab3Xyz"
```

---

## API Reference

### Package Exports

```typescript
import { generateId, type GenerateIdOptions } from '@auto-engineer/id';

import { BASE62_ALPHABET, BASE62_TOKEN_REGEX, SAFE_PREFIX_REGEX } from '@auto-engineer/id/constants';

import { generateBase62Token, assertSafePrefix } from '@auto-engineer/id/core';
```

### Functions

#### `generateId(options?: GenerateIdOptions): string`

Generate a unique identifier with optional prefix and length.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `prefix` | `string` | - | String to prepend (must be URL-safe) |
| `length` | `number` | 9 | Token length |

### GenerateIdOptions

```typescript
type GenerateIdOptions = {
  prefix?: string;
  length?: number;
};
```

### Constants

| Constant | Value | Description |
|----------|-------|-------------|
| `BASE62_ALPHABET` | A-Za-z0-9 | 62-character alphabet |
| `BASE62_TOKEN_REGEX` | `/^[A-Za-z0-9]+$/` | Token validation |
| `SAFE_PREFIX_REGEX` | `/^[A-Za-z0-9_-]+$/` | Prefix validation |

---

## Architecture

```
src/
├── index.ts
├── core.ts
└── constants.ts
```

### Key Concepts

- **Base-62 Encoding**: Uses A-Z, a-z, 0-9 for URL-safe identifiers
- **Rejection Sampling**: Ensures unbiased character distribution
- **Cryptographic Security**: Uses `crypto.getRandomValues()`

### Entropy Analysis

With default 9-character token:
- Combinations: 62^9 = ~13.5 quadrillion
- Entropy: ~53.6 bits

### Dependencies

This package has minimal dependencies and uses the Web Crypto API for random number generation.
