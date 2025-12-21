# Pipeline Package - Pomodoro Plan

## TODO

### Pomodoro 15: when() Predicate

| Value | Conditional execution |
| Approach | Store predicate in handler |
| Size | S |

```typescript
it('should apply predicate with when()', () => {
  const predicate = (e: Event) => e.data.components?.length > 0;
  const pipeline = define('test')
    .on('ClientGenerated')
    .when(predicate)
    .emit('ImplementComponent', { path: './c' })
    .build();
  expect(pipeline.descriptor.handlers[0].predicate).toBe(predicate);
});
```

---

### Pomodoro 16: EmitChain.on() Continues Chain

| Value | Multi-handler pipelines |
| Approach | Return to on() |
| Size | M |

```typescript
it('should chain on() from EmitChain', () => {
  const pipeline = define('test').on('EventA').emit('CmdA', { d: 'a' }).on('EventB').emit('CmdB', { d: 'b' }).build();
  expect(pipeline.descriptor.handlers).toHaveLength(2);
});
```

---

### Pomodoro 17: key() Named Extractors

| Value | Reusable correlation keys |
| Approach | Store in keys Map |
| Size | S |

```typescript
it('should define named key extractors', () => {
  const extractor = (e: Event) => e.data.slicePath ?? '';
  const pipeline = define('test').key('bySlice', extractor).build();
  expect(pipeline.descriptor.keys.get('bySlice')).toBe(extractor);
});
```

---

### Pomodoro 18: Integration Test

| Value | Validates Phase 1 API |
| Approach | Complete pipeline matching spec |
| Size | S |

```typescript
it('should create complete simple pipeline', () => {
  const pipeline = define('kanban')
    .version('1.0.0')
    .description('Kanban app generation')
    .key('bySlice', (e) => e.data.slicePath ?? '')
    .on('SchemaExported')
    .emit('GenerateServer', { modelPath: './schema.json', destination: '.' })
    .on('SliceGenerated')
    .emit('ImplementSlice', (e) => ({
      slicePath: e.data.slicePath,
      context: { attemptNumber: 0, previousOutputs: 'errors' },
      aiOptions: { maxTokens: 2000 },
    }))
    .on('ServerGenerated')
    .emit('GenerateIA', { modelPath: './schema.json', outputDir: './.context' })
    .emit('StartServer', { serverDirectory: './server' })
    .build();

  expect(pipeline.descriptor.name).toBe('kanban');
  expect(pipeline.descriptor.handlers).toHaveLength(3);
});
```

---

## IN PROGRESS

(none)

---

## DONE

### Pomodoro 6-12, 14, 16, 17: Builder API (batched)

Implemented:

- define() entry point
- version() and description()
- build() returns frozen Pipeline
- on() returns TriggerBuilder
- emit() with static data
- EmitChain.build() captures handler
- Parallel emit() chain
- EmitChain.on() continues chain
- key() named extractors

All tests pass with 100% coverage.

---

### Pomodoro 5: PipelineDescriptor Type

| Value | Pipeline structure definition |
| Approach | Interface with metadata + handlers array |
| Size | S |

```typescript
it('should create PipelineDescriptor', () => {
  const descriptor: PipelineDescriptor = {
    name: 'test-pipeline',
    version: '1.0.0',
    keys: new Map(),
    handlers: [],
  };
  expect(descriptor.name).toBe('test-pipeline');
});
```

---

### Pomodoro 4: dispatch() Helper

| Value | Ergonomic CommandDispatch creation |
| Approach | Simple factory function |
| Size | S |

```typescript
it('should create CommandDispatch via dispatch()', () => {
  const cmd = dispatch('CheckTests', { targetDirectory: './src' });
  expect(cmd).toEqual({
    commandType: 'CheckTests',
    data: { targetDirectory: './src' },
  });
});
```

---

### Pomodoro 3: CommandDispatch Type

| Value | Dispatch instruction type |
| Approach | Simple interface with commandType + data |
| Size | S |

```typescript
it('should create CommandDispatch with static data', () => {
  const cmd: CommandDispatch = {
    commandType: 'CheckTests',
    data: { targetDirectory: './src', scope: 'slice' },
  };
  expect(cmd).toEqual({
    commandType: 'CheckTests',
    data: { targetDirectory: './src', scope: 'slice' },
  });
});

it('should create CommandDispatch with data factory', () => {
  const cmd: CommandDispatch = {
    commandType: 'ImplementSlice',
    data: (e) => ({ slicePath: e.data.path }),
  };
  const event: Event = { type: 'SliceGenerated', data: { path: './slice' } };
  const resolved = typeof cmd.data === 'function' ? cmd.data(event) : cmd.data;
  expect(resolved).toEqual({ slicePath: './slice' });
});
```

---

### Pomodoro 2: Core Types

| Value | Foundation types |
| Approach | Re-export message-bus types + add pipeline types |
| Size | S |

```typescript
it('should re-export Command and Event from message-bus', () => {
  const cmd: Command = { type: 'Test', data: {} };
  const evt: Event = { type: 'TestDone', data: {} };
  expect(cmd.type).toBe('Test');
  expect(evt.type).toBe('TestDone');
});
```

---

### Pomodoro 1: Package Scaffold

| Value | Foundation for all work |
| Approach | Copy patterns from `@auto-engineer/id` |
| Size | S |

**Files:**

- `package.json` - deps: `@auto-engineer/message-bus: workspace:*`
- `tsconfig.json` - extends base, composite: true
- `tsconfig.test.json` - includes \*.specs.ts
- `vitest.config.ts` - 100% coverage thresholds
- `src/index.ts` - empty export
