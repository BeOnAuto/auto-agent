# 🥫 The Ketchup Technique

## Controlled Bursts + TDD + TCR + 100% Coverage

```
╔═════════════════════════════════════════════════════════════════════╗
║   Red ───► Green ───►[TCR]───► Refactor ───►[TCR]───► Done          ║
║                                                                     ║
║   [TCR] = test ──┬── pass ──► commit ──► continue                   ║
║                  └── fail ──► REVERT ──► RETHINK                    ║
║                                                                     ║
║   REVERT means STOP. Don't fix in place.                            ║
║   RETHINK means try again with SMALLER STEPS OR try a NEW DESIGN    ║
╚═════════════════════════════════════════════════════════════════════╝
```

---

## 💥 Controlled Bursts

**Controlled bursts. One test, one commit, no sprawl.**

```
╔═════════════════════════════════════════════════════════════════════╗
║                                                                     ║
║   BURST ───► COMMIT ───► BURST ───► COMMIT ───► DONE                ║
║                                                                     ║
║   Each burst: one failing test → minimal code → commit              ║
║                                                                     ║
║   No burst = no code.                                               ║
║                                                                     ║
╚═════════════════════════════════════════════════════════════════════╝
```

### Why Ketchup?

**You operate in controlled bursts.**

Do not write large amounts of code at once. Each burst is one failing test → minimal passing code → commit. Stop. Wait. Next burst.

Like ketchup from a bottle: tap, controlled amount, stop. Never upend and pour.

### What's a Burst?

The smallest unit of deliverable work. One test, one behavior, one commit.

Each burst must be:

- **Independent** — works on its own
- **Valuable** — adds real functionality
- **Small** — one test, one behavior
- **Testable** — single clear assertion
- **Reviewable** — the human operator can verify correctness at a glance

The constraint is scope, not time. Keep bursts small enough that:

1. You stay focused on one thing
2. The operator can verify quickly
3. A revert loses minimal work

---

## 🥫 Ketchup Workflow

**Planning:**

- Break the feature into bursts: independent, valuable, small, testable
- For each burst define: value added, code surface size (S/M/L), complexity (S/M/L)
- 1-2 line approach description per burst
- Create `ketchup-plan.md` with sections: TODO / DONE
- Commit the plan before any code

```markdown
# Ketchup Plan: [Feature Name]

## TODO

- [ ] Burst 1: [1-2 line description]
- [ ] Burst 2: [1-2 line description]
- [ ] Burst 3: [1-2 line description]

## DONE

- [x] (completed bursts move here with commit hash)
```

**Execution:**

1. Write ONE failing test (Red)
2. Write MINIMAL code to pass (Green)
3. TCR: `test && commit || revert` (include plan update)
4. Refactor if needed
5. TCR: `test && commit || revert`
6. Move burst to DONE in `ketchup-plan.md`, commit with TCR
7. Next burst

**TCR: Test && Commit || Revert**

```
╔══════════════════════════════════════════════════════════════════════╗
║  TCR is not optional. It's how you operate.                          ║
║                                                                      ║
║  Pass → commit → continue                                            ║
║  Fail → REVERT → STOP → RETHINK                                      ║
╚══════════════════════════════════════════════════════════════════════╝
```

**Why Revert Instead of Fix?**

When a test fails, your instinct will be to patch the code until it passes. **Do not do this.**

Patching builds on broken foundations. Each fix adds complexity to compensate for a flawed approach. You end up with:

- Defensive code that handles symptoms, not causes
- Tangled logic that's hard to reason about
- Technical debt baked into the design

**Revert forces a clean slate.** The code disappears, but the _learning_ remains. You now know:

- What approach didn't work
- What edge case you missed
- What assumption was wrong

Use that knowledge to design a better approach, not to patch a bad one.

**The RETHINK Step:**

After a revert, do not immediately retry the same approach. Stop and ask:

1. Was the burst too big? → Split it smaller
2. Was the design flawed? → Try a different approach
3. Was the test wrong? → Clarify the requirement first

Only then write the next failing test.

**TCR Command:**

```bash
pnpm test --run && \
  git add -A && git commit -m "<COMMITIZEN FORMAT>" || \
  git checkout -- packages/<package>/
```

Before committing, check IDE diagnostics on all uncommitted files to catch errors the test suite might miss.

**The Rule:** No burst, no code. Every line of production code starts with a failing test in a planned burst.

---

## 🎯 TDD + 100% Coverage

All thresholds enforced at 100%. Tests drive the code.

| Do                              | Don't                                    |
| ------------------------------- | ---------------------------------------- |
| Let tests drive all code        | Write code without a failing test first  |
| Add branches only when tested   | Defensive `??`, `?:`, `if/else` untested |
| Test all error paths            | Leave error handling unverified          |
| Remove dead code after each run | Keep unused code "just in case"          |

**NEVER Exclude Files to Dodge Coverage**

```
╔══════════════════════════════════════════════════════════════════════╗
║  Excluding a file from coverage to avoid testing it is FORBIDDEN.    ║
║  "Hard to test" code (file system, dynamic imports, network, etc.)   ║
║  → Inject dependencies and mock them. That's what mocks are for.     ║
╚══════════════════════════════════════════════════════════════════════╝
```

Coverage exclusions are ONLY for:

- Type-only files (interfaces, type definitions)
- Barrel exports (index.ts re-exports)
- Files that are genuinely 0% logic (pure declarations)

If you're tempted to exclude a file because it's "infrastructure" or "integration-focused" — STOP. The coverage requirement exists precisely to force testable design.

---

## 🧠 Design Philosophy

### Behavior First, Everything Else Emerges

```
╔═══════════════════════════════════════════════════════════════════════╗
║  Start with BEHAVIOR. Always.                                         ║
║  Types, interfaces, data structures — these emerge to serve behavior. ║
║  If it doesn't affect runtime outcomes, it's not the design.          ║
╚═══════════════════════════════════════════════════════════════════════╝
```

**The Core Insight:**

Software exists to _do things_. A program that compiles perfectly but produces wrong outputs is worthless. A program with ugly types that produces correct outputs is valuable. This tells us where to focus.

Behavior is the only thing that matters at runtime. Everything else — types, interfaces, abstractions, patterns — exists solely to help us write correct behavior more reliably.

**The Wrong Way (Structure-First):**

```
1. Design the data shapes / types / interfaces
2. Define the abstractions and relationships
3. Finally, implement the actual behavior
```

This is backwards. You're making decisions about shape before you understand what transformations you need. You're building a warehouse before you know what you're storing.

**The Right Way (Behavior-First):**

```
1. What OUTCOME do I need? (input → output)
2. Write a test that asserts on that outcome
3. Implement the simplest code that produces the outcome
4. Let structure emerge to support the behavior
```

**Why This Works:**

- You only create structure that's _actually needed_
- Tests verify behavior, which implicitly validates any supporting structure
- You discover the real shape of data by _using_ it, not by speculating
- Refactoring is safe because behavior is locked in by tests

**Practical Rule:**

Your first test for any feature should call a **function** and assert on its **output**. Whatever types, interfaces, or data shapes that function needs will get created _because_ the function needs them — not before, not separately, not speculatively.

```ts
// ❌ WRONG: Starting with structure
// "Create User type"
// "Create UserService interface"
// "Design the repository pattern"

// ✅ RIGHT: Starting with behavior
it("creates user with generated id", () => {
  const result = createUser({ name: "Alice" });
  expect(result).toEqual({ id: expect.any(String), name: "Alice" });
});
// Types, interfaces, whatever — they emerge because this function needs them
```

**The Mantra:**

> "What should this function return when given this input?"

If you can't answer that question, you're not ready to write code. If you _can_ answer it, write the test first, then make it pass. The rest takes care of itself.

---

## 📝 Testing Guidelines

### Test Title = Spec

The `it('should...')` title defines what you're testing. Body proves exactly that.

```ts
// ✅ Title matches body
it("should reject empty usernames", () => {
  const result = validate({ username: "" });
  expect(result.valid).toBe(false);
});

// ❌ Body does more than title claims
it("should reject empty usernames", () => {
  const result = validate({ username: "" });
  expect(result.valid).toBe(false);
  expect(result.errors).toContain("Username required"); // second spec
  expect(logger.warn).toHaveBeenCalled(); // third spec
});
```

### Stubs Over Mocks

Use deterministic stubs. Mock at boundaries only when stubs aren't possible.

```ts
// ✅ Deterministic stub
function createTestIdGenerator() {
  let counter = 0;
  return () => `test-id-${counter++}`;
}

it("creates user with generated id", () => {
  const generateId = createTestIdGenerator();
  const user = createUser({ name: "Alice" }, generateId);
  expect(user).toEqual({ id: "test-id-0", name: "Alice" });
});

// ❌ Mocking couples tests to implementation
it("creates user with generated id", () => {
  const mockGenerateId = vi.fn().mockReturnValue("user-123");
  const user = createUser({ name: "Alice" }, mockGenerateId);
  expect(mockGenerateId).toHaveBeenCalled();
});
```

### Assert Whole Objects

Catch structural changes. Don't cherry-pick properties.

```ts
// ✅ Catches any unexpected changes
expect(result).toEqual({ type: "USER", name: "Alice", processed: true });

// ❌ Misses if extra properties added/removed
expect(result.type).toBe("USER");
expect(result.processed).toBe(true);
```

### Squint Test

All tests should look identical when you squint: **SETUP → EXECUTE → VERIFY**

```ts
// ✅ Single clear structure
it("transforms user to uppercase", () => {
  const input = { type: "user" }; // SETUP
  const result = transform(input); // EXECUTE
  expect(result).toEqual({ type: "USER" }); // VERIFY
});

// ❌ Multiple execute/verify = split into separate tests
it("does too many things", () => {
  const result = transform({ type: "user" });
  expect(result.type).toBe("USER");
  const updated = updateResult(result); // second execute
  expect(updated.modified).toBe(true); // second verify
});
```

### Behavioral Testing (No State Peeking)

```
╔════════════════════════════════════════════════════════════════════════╗
║  Tests verify OBSERVABLE BEHAVIOR, not INTERNAL STATE.                  ║
║  If a test calls `.getCount()`, `.size`, or peeks into a Map/Set,      ║
║  it's testing implementation — not behavior.                            ║
╚════════════════════════════════════════════════════════════════════════╝
```

Tests coupled to internal state break when you refactor. Tests verifying behavior remain stable as implementation evolves.

**The Litmus Test:**

> "If I changed how this is stored internally, would this test still pass?"

If no, the test is coupled to implementation.

**Forbidden Patterns:**

```ts
// ❌ Peeking at internal counts
expect(tracker.getActiveInstanceCount()).toBe(0);
expect(manager.clientCount).toBe(3);
expect(executor.getActiveSessionCount()).toBe(1);

// ❌ Accessing internal collections
expect(service["internalMap"].size).toBe(2);
expect(handler.pendingItems.length).toBe(0);

// ❌ Testing cleanup via size checks
tracker.cleanup();
expect(tracker.getCount()).toBe(0);
```

**Allowed Patterns:**

```ts
// ✅ Test via callbacks/events
const events: Event[] = [];
tracker.onEvent((e) => events.push(e));
tracker.process(input);
expect(events).toEqual([{ type: "Completed", data: { id: "x" } }]);

// ✅ Test via dispatched commands
const dispatched: Command[] = [];
executor.onDispatch((cmd) => dispatched.push(cmd));
executor.start({ items: ["a", "b"] });
expect(dispatched).toEqual([
  { type: "ProcessItem", data: { id: "a" } },
  { type: "ProcessItem", data: { id: "b" } },
]);

// ✅ Test via boolean query APIs
expect(tracker.isWaitingFor("correlationId", "HandlerA")).toBe(true);
expect(tracker.isPending("key")).toBe(false);

// ✅ Test cleanup via re-triggering behavior
tracker.complete("c1");
tracker.start("c1"); // Same id reused
expect(tracker.isActive("c1")).toBe(true); // Proves cleanup worked
```

**What to Test vs. What NOT to Test:**

| Test This (Observable)    | Not This (Internal)      |
| ------------------------- | ------------------------ |
| Events/callbacks fired    | Internal array lengths   |
| Commands dispatched       | Map/Set sizes            |
| Return values             | Private field values     |
| Query API responses       | Collection contents      |
| Side effects (HTTP, logs) | Internal state mutations |

**Testing Cleanup Without State Peeking:**

```ts
// ❌ WRONG: Testing cleanup via internal count
it("cleans up after completion", () => {
  tracker.start("c1");
  tracker.complete("c1");
  expect(tracker.getActiveCount()).toBe(0);
});

// ✅ RIGHT: Testing cleanup via re-triggering
it("allows new session after completion", () => {
  const completed: string[] = [];
  tracker.onComplete((id) => completed.push(id));

  tracker.start("c1");
  tracker.complete("c1");

  tracker.start("c1"); // Re-use same id
  tracker.complete("c1");

  expect(completed).toEqual(["c1", "c1"]); // Fired twice = cleanup worked
});
```

**Do NOT expose methods solely for testing:**

```ts
// ❌ WRONG: Adding getters just for tests
class SessionManager {
  private sessions = new Map();
  getSessionCount(): number {
    return this.sessions.size;
  } // Test-only method
}

// ✅ RIGHT: Test via behavior, not state inspection
class SessionManager {
  private sessions = new Map();
  // No count getter — test by observing callbacks/events
}
```

---

## 🛡️ Project Guardrails

### TypeScript Strictness

- No `@ts-ignore`, `any`, or `as SomeType` casts
- Fix the type system, don't escape it
- JS files belong only in `dist/`

### When Tests Fail

Assume you broke it. The git history is the source of truth.

- Check `origin/main` or the branch before your changes
- CI passed before; your change is the variable

### Code Style

- No comments. Write self-expressing code with clear names.
- No excuses. No "you're right." Just keep working.

---

## 🔥 Extreme Ownership

```
╔══════════════════════════════════════════════════════════════════════╗
║  Every problem is YOUR problem.                                      ║
║  No exceptions. No excuses. No deflection.                           ║
╚══════════════════════════════════════════════════════════════════════╝
```

**The Principle:**

When you encounter broken code, failing tests, confusing architecture, or technical debt — own it. Do not explain it away. Do not attribute it to others. Do not treat it as outside your scope.

**Forbidden Responses:**

- "This appears to have been broken before..."
- "The existing code has issues that..."
- "This is outside the scope of the current task..."
- "The original implementation didn't account for..."
- "I'm only addressing X, not Y..."

These are deflections. They shift responsibility instead of solving problems.

**The Standard:**

When you see a problem, you have two options:

1. **Fix it** — as part of your current work
2. **Flag it** — add a burst to the plan to address it

There is no third option where you acknowledge a problem and walk past it.

**Practical Application:**

| Situation                   | Wrong Response                          | Extreme Ownership                    |
| --------------------------- | --------------------------------------- | ------------------------------------ |
| Find a bug in existing code | "The existing code has a bug where..."  | Fix it or add a burst to fix it      |
| Test suite has gaps         | "Coverage was incomplete before..."     | Add the missing tests                |
| Confusing function names    | "The naming is unclear in this file..." | Rename them in refactor phase        |
| Missing error handling      | "Error handling wasn't implemented..."  | Add it now                           |
| Flaky test                  | "This test appears to be unreliable..." | Stabilize it or add bursts to fix it |

**Why This Matters:**

Deflection wastes tokens and solves nothing. The user doesn't need an explanation of who caused a problem — they need the problem solved. Every sentence spent attributing blame is a sentence not spent fixing.

**The Rule:**

If you read a file, you're responsible for its state when you're done. If you saw a problem and didn't address it, you chose to leave it broken.
