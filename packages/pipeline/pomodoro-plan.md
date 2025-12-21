# Pipeline Package - Pomodoro Plan

## TODO

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

### Pomodoro 6: define() Entry Point

| Value | API entry point |
| Approach | Factory returning PipelineBuilder |
| Size | S |

```typescript
it('should create PipelineBuilder via define()', () => {
  const builder = define('my-pipeline');
  expect(builder).toBeDefined();
  expect(typeof builder.version).toBe('function');
  expect(typeof builder.on).toBe('function');
  expect(typeof builder.build).toBe('function');
});
```

---

### Pomodoro 7: version() and description()

| Value | Fluent metadata |
| Approach | Methods returning this |
| Size | S |

```typescript
it('should chain version() and description()', () => {
  const pipeline = define('test').version('1.0.0').description('Test pipeline').build();
  expect(pipeline.descriptor.name).toBe('test');
  expect(pipeline.descriptor.version).toBe('1.0.0');
  expect(pipeline.descriptor.description).toBe('Test pipeline');
});
```

---

### Pomodoro 8: build() Returns Pipeline

| Value | Terminal operation |
| Approach | Return frozen Pipeline object |
| Size | S |

```typescript
it('should return frozen Pipeline from build()', () => {
  const pipeline = define('test').build();
  expect(pipeline.descriptor).toBeDefined();
  expect(Object.isFrozen(pipeline.descriptor)).toBe(true);
});
```

---

### Pomodoro 9: EmitHandlerDescriptor Type

| Value | Descriptor for emit handlers |
| Approach | Interface with type discriminator |
| Size | S |

```typescript
it('should create EmitHandlerDescriptor', () => {
  const descriptor: EmitHandlerDescriptor = {
    type: 'emit',
    eventType: 'SchemaExported',
    commands: [{ commandType: 'GenerateServer', data: { modelPath: '.' } }],
  };
  expect(descriptor.type).toBe('emit');
  expect(descriptor.commands).toHaveLength(1);
});
```

---

### Pomodoro 10: on() Returns TriggerBuilder

| Value | Event handler entry point |
| Approach | Return TriggerBuilder instance |
| Size | M |

```typescript
it('should return TriggerBuilder from on()', () => {
  const trigger = define('test').on('SchemaExported');
  expect(typeof trigger.emit).toBe('function');
  expect(typeof trigger.when).toBe('function');
});
```

---

### Pomodoro 11: emit() with Static Data

| Value | Simple emit handler |
| Approach | Create EmitChain with command |
| Size | M |

```typescript
it('should create EmitChain from emit()', () => {
  const chain = define('test').on('SchemaExported').emit('GenerateServer', { modelPath: './schema.json' });
  expect(typeof chain.emit).toBe('function');
  expect(typeof chain.build).toBe('function');
});
```

---

### Pomodoro 12: EmitChain.build() Captures Handler

| Value | Complete simple emit flow |
| Approach | Add handler to descriptor |
| Size | M |

```typescript
it('should capture emit handler in descriptor', () => {
  const pipeline = define('test').on('SchemaExported').emit('GenerateServer', { modelPath: './schema.json' }).build();
  expect(pipeline.descriptor.handlers).toHaveLength(1);
  const handler = pipeline.descriptor.handlers[0] as EmitHandlerDescriptor;
  expect(handler.type).toBe('emit');
  expect(handler.eventType).toBe('SchemaExported');
  expect(handler.commands).toEqual([{ commandType: 'GenerateServer', data: { modelPath: './schema.json' } }]);
});
```

---

### Pomodoro 13: emit() with Data Factory

| Value | Dynamic command data |
| Approach | Accept function in emit() |
| Size | S |

```typescript
it('should accept data factory in emit()', () => {
  const factory = (e: Event) => ({ slicePath: e.data.path });
  const pipeline = define('test').on('SliceGenerated').emit('ImplementSlice', factory).build();
  const handler = pipeline.descriptor.handlers[0] as EmitHandlerDescriptor;
  expect(typeof handler.commands[0].data).toBe('function');
});
```

---

### Pomodoro 14: Parallel emit() Chain

| Value | Multiple commands from one event |
| Approach | Accumulate commands in chain |
| Size | M |

```typescript
it('should chain emit() for parallel commands', () => {
  const pipeline = define('test')
    .on('ServerGenerated')
    .emit('GenerateIA', { modelPath: './schema.json' })
    .emit('StartServer', { serverDirectory: './server' })
    .build();
  const handler = pipeline.descriptor.handlers[0] as EmitHandlerDescriptor;
  expect(handler.commands).toHaveLength(2);
  expect(handler.commands[0].commandType).toBe('GenerateIA');
  expect(handler.commands[1].commandType).toBe('StartServer');
});
```

---

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
