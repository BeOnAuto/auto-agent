# Development Guide

## Pomodoro + TDD + TCR + 100% Coverage

```
╔═══════════════════════════════════════════════════════════════════════╗
║                                                                       ║
║   Red ───► Green ───►[TCR]───► Refactor ───►[TCR]───► Done           ║
║                                                                       ║
║   [TCR] = test ──┬── pass ──► commit ──► continue                    ║
║                  └── fail ──► REVERT ──► rethink                     ║
║                                                                       ║
║   REVERT means STOP. Don't fix in place. Rethink:                    ║
║     • Same approach, smaller step  OR  • Different approach          ║
║                                                                       ║
╚═══════════════════════════════════════════════════════════════════════╝
```

---

## 🍅 Pomodoro Workflow

One atomic test + implementation per cycle (5-15 min).

**Planning a Pomodoro:**

- Independent, valuable, small, testable
- Define: value added, code surface size (S/M/L), complexity (S/M/L)
- 1-2 line approach description
- Create `pomodoro-plan.md` with sections: TODO / DONE
- Commit the plan with initial pomodoros

**Execution:**

1. Write ONE failing test (Red)
2. Write MINIMAL code to pass (Green)
3. Run TCR — this verifies and commits in one step
4. Refactor if needed
5. Run TCR
6. Move pomodoro to DONE in the `pomodoro-plan.md`, commit with TCR

**TCR Command:**

Do NOT run tests or checks separately before TCR. TCR _is_ the verification — that's the T.

```bash
pnpm test --run && pnpm -w run check 2>&1 | tail -30 && \
  git add -A && git commit -m "<COMMITIZEN FORMAT>" || \
  git checkout -- packages/<package>/
```

**CRITICAL: Revert Means Rethink**

When you notice your implementation is broken:

- **DO NOT** continue down the same path trying to patch errors
- **DO NOT** add more code to fix the code you just wrote
- **DO** execute the revert immediately
- **DO** ask: was the approach wrong, or was the step too big?

After reverting, choose one:

1. **Same approach, smaller step** — the idea was sound, but you skipped TDD discipline. Break it into tinier increments.
2. **Different approach** — the design itself was flawed. Try a fundamentally different angle.

The revert is not a punishment—it is the process. Patching broken code compounds the mistake.

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
╔═══════════════════════════════════════════════════════════════════════╗
║  Excluding a file from coverage to avoid testing it is FORBIDDEN.    ║
║  "Hard to test" code (file system, dynamic imports, network, etc.)   ║
║  → Use mocks/stubs at boundaries. That's what they're for.           ║
╚═══════════════════════════════════════════════════════════════════════╝
```

Coverage exclusions are ONLY for:

- Type-only files (interfaces, type definitions)
- Barrel exports (index.ts re-exports)
- Files that are genuinely 0% logic (pure declarations)

If you're tempted to exclude a file because it's "infrastructure" or "integration-focused" — STOP. Inject dependencies and mock them. The coverage requirement exists precisely to force testable design.

---

## 📝 Testing Guidelines

### Test Title = Spec

The `it('should...')` title defines what you're testing. Body proves exactly that.

```ts
// ✅ Title matches body
it('should reject empty usernames', () => {
  const result = validate({ username: '' });
  expect(result.valid).toBe(false);
});

// ❌ Body does more than title claims
it('should reject empty usernames', () => {
  const result = validate({ username: '' });
  expect(result.valid).toBe(false);
  expect(result.errors).toContain('Username required'); // second spec
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

it('creates user with generated id', () => {
  const generateId = createTestIdGenerator();
  const user = createUser({ name: 'Alice' }, generateId);
  expect(user).toEqual({ id: 'test-id-0', name: 'Alice' });
});

// ❌ Mocking couples tests to implementation
it('creates user with generated id', () => {
  const mockGenerateId = vi.fn().mockReturnValue('user-123');
  const user = createUser({ name: 'Alice' }, mockGenerateId);
  expect(mockGenerateId).toHaveBeenCalled();
});
```

### Assert Whole Objects

Catch structural changes. Don't cherry-pick properties.

```ts
// ✅ Catches any unexpected changes
expect(result).toEqual({ type: 'USER', name: 'Alice', processed: true });

// ❌ Misses if extra properties added/removed
expect(result.type).toBe('USER');
expect(result.processed).toBe(true);
```

### Squint Test

All tests should look identical when you squint: **SETUP → EXECUTE → VERIFY**

```ts
// ✅ Single clear structure
it('transforms user to uppercase', () => {
  const input = { type: 'user' }; // SETUP
  const result = transform(input); // EXECUTE
  expect(result).toEqual({ type: 'USER' }); // VERIFY
});

// ❌ Multiple execute/verify = split into separate tests
it('does too many things', () => {
  const result = transform({ type: 'user' });
  expect(result.type).toBe('USER');
  const updated = updateResult(result); // second execute
  expect(updated.modified).toBe(true); // second verify
});
```

---
