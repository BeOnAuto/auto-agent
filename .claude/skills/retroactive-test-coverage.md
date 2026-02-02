# Retroactive Test Coverage Skill

Add test coverage to existing packages using behavioral testing principles. This skill is for packages that already have production code but lack adequate test coverage.

---

## Core Principles

### Behavior First, Not Coverage First

You are NOT trying to "hit lines" to satisfy a coverage tool. You are trying to verify that the code does what it's supposed to do. Coverage is a side effect of good behavioral tests, not the goal.

```
╔══════════════════════════════════════════════════════════════════════════╗
║  The goal is BEHAVIORAL VERIFICATION, not LINE COVERAGE.                 ║
║  If your test doesn't verify observable behavior, it's worthless.        ║
║  Coverage that comes from worthless tests is a lie.                      ║
╚══════════════════════════════════════════════════════════════════════════╝
```

### What Makes a Test Valuable

A test is valuable if it would catch a bug that matters. Ask yourself:

1. "If someone broke this behavior, would this test fail?"
2. "If this test passes, am I confident the feature works?"
3. "Does this test verify something a user/consumer would care about?"

If the answer to any of these is "no", the test is coverage theater.

---

## The Retroactive Coverage Workflow

### Phase 1: Audit the Package

Before writing any tests, understand what you're dealing with.

1. **Run coverage to identify gaps**
   ```bash
   pnpm test --coverage
   ```

2. **Categorize uncovered code into:**
   - **Behavioral code**: Functions that transform inputs to outputs, handle events, make decisions
   - **Type-only code**: Interfaces, type definitions, re-exports (exclude from coverage)
   - **Infrastructure code**: File I/O, network calls, dynamic imports (needs dependency injection)
   - **Dead code**: Code that's never called (delete it)

3. **Identify consumers**: For each uncovered file, find what imports it. The consumers tell you what behaviors need testing.

### Phase 2: Prioritize by Value

Not all coverage gaps are equal. Prioritize:

1. **High priority**: Core business logic, state machines, data transformations
2. **Medium priority**: Adapters, converters, builders
3. **Low priority**: Simple pass-through functions, trivial projections
4. **Exclude**: Type-only files, barrel exports

### Phase 3: Write Tests in Bursts

Follow the Ketchup Technique for each test:

```
╔═════════════════════════════════════════════════════════════════════╗
║   BURST ───► COMMIT ───► BURST ───► COMMIT ───► DONE                ║
║                                                                     ║
║   Each burst: one test → verify it fails without the code →         ║
║               verify it passes with the code → commit               ║
╚═════════════════════════════════════════════════════════════════════╝
```

For retroactive testing, "Red" means: temporarily break the production code to verify your test would catch it, then restore.

---

## Anti-Patterns to Avoid

### 1. Type-Only Test Files

```ts
// ❌ NEVER DO THIS
// types.specs.ts
it('should create a Command object', () => {
  const cmd: Command = { type: 'Test', data: {} };
  expect(cmd.type).toBe('Test');
});
```

**Why it's wrong**: TypeScript already validates this at compile time. This test adds zero value.

**What to do instead**:
1. Find what USES the Command type
2. Test THAT code's behavior
3. The types get covered implicitly

```ts
// ✅ DO THIS INSTEAD
// handler.specs.ts - tests the code that uses Command
it('should dispatch follow-up command when condition met', () => {
  const result = handler.handle({ type: 'ProcessItem', data: { id: '1' } });
  expect(result.dispatched).toContainEqual({
    type: 'NotifyComplete',
    data: { itemId: '1' }
  });
});
```

### 2. Trivial Projection Tests

```ts
// ❌ NEVER DO THIS
it('increments counter', () => {
  const result = evolve({ count: 0 }, { type: 'Increment' });
  expect(result.count).toBe(1);
});
```

**Why it's wrong**: You're testing arithmetic, not behavior. If `count: existing.count + 1` is wrong, you have bigger problems.

**What to do instead**: Test projections through integration - append events, query read model, verify state.

```ts
// ✅ DO THIS INSTEAD
it('should reflect all events in stats after processing', async () => {
  await eventStore.appendToStream('pipeline-c1', [
    { type: 'CommandDispatched', data: { commandType: 'A' } },
    { type: 'CommandDispatched', data: { commandType: 'B' } },
    { type: 'EventEmitted', data: { eventType: 'ADone' } },
  ]);

  const stats = await readModel.getStats();
  expect(stats).toEqual({
    totalMessages: 3,
    totalCommands: 2,
    totalEvents: 1,
  });
});
```

### 3. State Peeking

```ts
// ❌ NEVER DO THIS
it('should cleanup after completion', () => {
  tracker.start('c1');
  tracker.complete('c1');
  expect(tracker.getActiveCount()).toBe(0);  // Peeking at internal state
});
```

**What to do instead**: Test cleanup via re-triggering behavior.

```ts
// ✅ DO THIS INSTEAD
it('should allow new session after completion', () => {
  const completed: string[] = [];
  tracker.onComplete((id) => completed.push(id));

  tracker.start('c1');
  tracker.complete('c1');
  tracker.start('c1');  // Re-use same id
  tracker.complete('c1');

  expect(completed).toEqual(['c1', 'c1']);  // Fired twice = cleanup worked
});
```

### 4. Mock Verification Instead of Output Verification

```ts
// ❌ NEVER DO THIS
it('should call the logger', () => {
  const mockLogger = vi.fn();
  process(input, { logger: mockLogger });
  expect(mockLogger).toHaveBeenCalledWith('Processing...');
});
```

**What to do instead**: Verify outputs and side effects that matter.

```ts
// ✅ DO THIS INSTEAD
it('should return processed result', () => {
  const result = process(input);
  expect(result).toEqual({ status: 'complete', data: transformedData });
});
```

---

## Handling Hard-to-Test Code

### File System / Network / External Dependencies

Don't exclude these from coverage. Inject dependencies and stub them.

```ts
// Production code with injectable dependency
function loadConfig(readFile = fs.readFileSync) {
  const content = readFile('./config.json', 'utf-8');
  return JSON.parse(content);
}

// Test with stub
it('should parse config from file', () => {
  const stubReadFile = () => '{"key": "value"}';
  const result = loadConfig(stubReadFile);
  expect(result).toEqual({ key: 'value' });
});
```

### Dynamic Imports / Plugins

```ts
// Production code with injectable loader
class PluginLoader {
  constructor(private importModule = (path: string) => import(path)) {}

  async load(name: string) {
    const mod = await this.importModule(name);
    return mod.default;
  }
}

// Test with stub
it('should load plugin exports', async () => {
  const stubImport = async () => ({ default: { name: 'TestPlugin' } });
  const loader = new PluginLoader(stubImport);
  const plugin = await loader.load('test-plugin');
  expect(plugin.name).toBe('TestPlugin');
});
```

---

## Tracing Coverage Gaps to Their Source

When you find a file that needs coverage:

1. **Search for consumers**
   ```bash
   grep -r "from './uncovered-file'" src/
   grep -r "from '../uncovered-file'" src/
   ```

2. **Check if consumers have tests**
   - If YES but coverage is missing: Consumer tests are incomplete. Add test cases.
   - If NO: Write tests for consumers. Coverage follows automatically.

3. **Never write tests that exist solely to import a file**

```
╔══════════════════════════════════════════════════════════════════════════╗
║  If types.ts needs a types.specs.ts to get coverage, that's a smell.    ║
║  The code that USES those types should be tested, not the types.        ║
║  Trace back to the consumer and test THAT.                              ║
╚══════════════════════════════════════════════════════════════════════════╝
```

---

## Coverage Exclusions

Only exclude files that are genuinely 0% logic:

```ts
// vitest.config.ts
coveragePathIgnorePatterns: [
  'src/**/*.specs.ts',      // Test files themselves
  'src/**/index.ts',        // Barrel exports (re-exports only)
  'src/**/types.ts',        // Pure type definitions (no runtime code)
  'src/**/interfaces.ts',   // Pure interfaces
]
```

**NEVER exclude:**
- Files with any runtime logic
- "Infrastructure" code
- "Hard to test" code
- Code you're too lazy to test

---

## Test Structure Template

Every test should follow SETUP → EXECUTE → VERIFY:

```ts
describe('ComponentName', () => {
  describe('featureName', () => {
    it('should [observable behavior] when [condition]', () => {
      // SETUP - create inputs and dependencies
      const input = createTestInput();
      const dependency = createStub();

      // EXECUTE - call the thing being tested
      const result = component.doThing(input, dependency);

      // VERIFY - assert on observable output
      expect(result).toEqual(expectedOutput);
    });
  });
});
```

---

## Checklist Before Committing Tests

- [ ] Each test verifies observable behavior, not internal state
- [ ] Test titles accurately describe what's being tested
- [ ] No mocks where stubs would work
- [ ] No type-only test files
- [ ] No tests that just increment counters or copy fields
- [ ] Coverage comes from meaningful tests, not coverage theater
- [ ] Hard-to-test code uses dependency injection, not exclusions

---

## Example: Auditing a Package

```bash
# 1. Run coverage
pnpm test --coverage

# 2. Identify gaps (example output)
# src/core/types.ts         0% ← Type-only, exclude
# src/utils/transform.ts   45% ← Needs behavioral tests
# src/handlers/process.ts  60% ← Missing error path tests
# src/projections/stats.ts 80% ← Consider integration test

# 3. For each gap, find consumers
grep -r "from './transform'" src/

# 4. Write tests for consumers that exercise the uncovered paths
# The coverage follows automatically
```

---

## The Golden Rule

```
╔══════════════════════════════════════════════════════════════════════════╗
║  If a test doesn't verify behavior that could break in production,       ║
║  it's not a test—it's coverage theater.                                 ║
║                                                                          ║
║  Delete coverage theater. Write real tests.                             ║
╚══════════════════════════════════════════════════════════════════════════╝
```
