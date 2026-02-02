---
when:
  hook: SessionStart
priority: 100
---

# Test Title = Spec Reminder

The test body must prove exactly what `it('should...')` claims.

## The Principle

**Title = Spec:** One assertion per behavior. The test title is the specification; the test body is the proof.

## Example

```typescript
// Good: Title matches what's being tested
it("creates user with generated id", () => {
  const result = createUser({ name: "Alice" });
  expect(result).toEqual({ id: expect.any(String), name: "Alice" });
});

// Bad: Title doesn't match assertion
it("creates user with generated id", () => {
  const result = createUser({ name: "Alice" });
  expect(result.name).toBe("Alice"); // Not testing the ID!
});
```

## Ask Yourself

"Does this test body prove exactly what the `it()` description claims?"

If not, either:
1. Fix the test body to prove the claim
2. Fix the title to match what you're actually testing
