---
when:
  hook: SessionStart
priority: 100
---

# Emergent Design Reminder

Behavior first. Types/interfaces emerge from tests.

## The Principle

Don't design types upfront. Let them emerge from what the tests require.

## Example

```typescript
// First: Write a test that calls a function and asserts output
it("creates user with generated id", () => {
  const result = createUser({ name: "Alice" });
  expect(result).toEqual({ id: expect.any(String), name: "Alice" });
});

// Then: Types emerge because the function needs them
// The test drove the need for: input type, output type, id generation
```

## Anti-Pattern

```typescript
// Don't do this: types/user.ts
interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  // ... 20 more fields "just in case"
}
```

Types should be minimal and driven by actual test requirements, not speculative design.
