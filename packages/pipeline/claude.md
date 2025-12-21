# Development Guide

## Pomodoro + TDD + TCR + 100% Coverage

```
╔════════════════════════════════════════════════════════════════╗
║  Red -> Green -> Commit -> Refactor -> Commit                  ║
║  Small steps. Always passing. Always committed.                ║
╚════════════════════════════════════════════════════════════════╝
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
3. TCR: `test && commit || revert` (include plan update)
4. Refactor if needed
5. TCR: `test && commit || revert`
6. Move pomodoro to DONE in the `pomodoro-plan.md`, commit with TCR

**TCR Command:**

```bash
pnpm test --run && \
  git add -A && git commit -m "<COMMITIZEN FORMAT>" || \
  git checkout -- packages/<package>/
```

---

## 🎯 TDD + 100% Coverage

All thresholds enforced at 100%. Tests drive the code.

| Do                              | Don't                                    |
| ------------------------------- | ---------------------------------------- |
| Let tests drive all code        | Write code without a failing test first  |
| Add branches only when tested   | Defensive `??`, `?:`, `if/else` untested |
| Test all error paths            | Leave error handling unverified          |
| Remove dead code after each run | Keep unused code "just in case"          |

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
