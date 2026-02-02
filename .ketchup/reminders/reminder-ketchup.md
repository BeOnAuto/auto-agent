---
when:
  hook: SessionStart
priority: 100
---

# Ketchup Core Reminder

> Controlled Bursts | TDD | TCR | 100% Coverage

## Core Loop

```
Red → Green → TCR → Refactor → TCR → Done
TCR: test && commit || revert
- Pass → commit → continue
- Fail → REVERT → RETHINK (smaller steps or new design)
```

Never patch failing code. Revert, learn, try differently.

## Bursts

One test, one behavior, one commit. No exceptions.

Each burst: independent, valuable, small, testable, reviewable.

The constraint is scope, not time. Keep bursts small enough that:

- You stay focused on one thing
- The operator can verify quickly
- A revert loses minimal work

E2E exception: E2E tests may combine 2 tightly-coupled bursts when splitting creates artificial boundaries.

## Workflow

1. Create `ketchup-plan.md` with TODO/DONE sections, commit before coding
2. Write ONE failing test
3. Write MINIMAL passing code
4. TCR (update plan in same commit)
5. Refactor if needed → TCR
6. Move burst to DONE → TCR
7. Next burst

```markdown
# Ketchup Plan: [Feature]

## TODO

- [ ] Burst 1: [description]

## DONE

- [x] Burst N: [description] (hash)
```

## Refactoring

Refactor for readability, not for explanation. If code is complex, rename variables or extract functions. Do not add comments.

## Coverage

100% enforced. No escape hatches.

Exclusions allowed ONLY for: barrel `index.ts` re-exports, `*.test.ts` files

Forbidden:

- Excluding files to avoid testing them
- Standalone type files (`types.ts`, `interfaces.ts`) — types live inline where used
- `@ts-ignore`, `any`, `as SomeType` casts

| Do                              | Don't                                    |
| ------------------------------- | ---------------------------------------- |
| Let tests drive all code        | Write code without a failing test first  |
| Add branches only when tested   | Defensive `??`, `?:`, `if/else` untested |
| Test all error paths            | Leave error handling unverified          |
| Remove dead code after each run | Keep unused code "just in case"          |

## Testing Rules

**Assertion Strength:** Never use weak assertions (`toBeDefined`, `toBeTruthy`, `not.toBeNull`). Assert the exact shape and value. If you don't know the exact value, use `expect.any(String)` or `expect.any(Number)`.

**Stubs over mocks:** Deterministic stubs preferred. Mock only at boundaries.

**Assert whole objects:** `expect(result).toEqual({...})` not cherry-picked properties.

**Squint test:** All tests must follow: SETUP (data) → EXECUTE (function call) → VERIFY (whole object assertion). No multiple execute/verify cycles in one test.

**No state peeking:** Test observable behavior, not internal state.

Litmus Test: "If I changed the internal data structure (e.g., Map to Array), would this test still pass?" If no, the test is coupled to implementation.

| Forbidden (Implementation)                              | Allowed (Behavior)                                                        |
| ------------------------------------------------------- | ------------------------------------------------------------------------- |
| `expect(tracker.getActiveCount()).toBe(0)`              | Test via callbacks/events                                                 |
| `expect(manager.clientCount).toBe(3)`                   | `tracker.onEvent(e => events.push(e))`                                    |
| `expect(service["internalMap"].size).toBe(2)`           | Test via return values                                                    |
| `tracker.cleanup(); expect(tracker.getCount()).toBe(0)` | Test cleanup by re-triggering: start same id, verify callback fires again |

**Do NOT expose methods solely for testing.** If you're adding `.getCount()` or `.getActiveSessionCount()` just to make tests pass, you're testing implementation, not behavior.

## Guardrails

- No comments — write self-expressing code
- No excuses, no "you're right" — keep working
- JS files only in `dist/`
- When tests fail, assume you broke it. CI passed before; your change is the variable.

**Backwards compatibility:** Ask first. Default to clean breaks. No silent preservation unless explicitly requested.

Backwards-compatibility hacks to avoid:

- Re-exporting moved/renamed symbols
- Keeping unused parameters with `_` prefix
- Adding `// @deprecated` comments for removed code
- Wrapper functions that delegate to new implementations

## Infrastructure Commits

Config files need no tests: `package.json`, `tsconfig.json`, `wrangler.toml`, `vite.config.ts`, `vitest.config.ts`, `.gitignore`, `ketchup-plan.md`

Format: `chore(scope): description`

First behavioral `.ts` file requires a test.

## Plea System

If the commit validator rejects your commit but you believe it's valid, add `plea: <reason>` to your commit message.

**Valid pleas:**

- Files must be committed together for coherence
- Existing code lacked coverage before your changes

**Invalid pleas (will be rejected):**

- Skipping tests for new code
- Untested code paths
- Any other CLAUDE.md rule bypass

## Misc

- No "Generated with Claude Code" in commits
