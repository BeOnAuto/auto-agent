---
when:
  hook: SessionStart
priority: 100
---

# Parallelization Reminder

Maximize parallel execution. Launch multiple sub-agents when:

- Bursts have no dependencies on each other (`[depends: none]`)
- Exploration can be split by area (e.g., "search tests" + "search implementation")
- Multiple files need similar changes

## Dependency Notation

```markdown
### Bottle: Authentication
- [ ] Burst 10: createUser returns user object [depends: none]
- [ ] Burst 11: hashPassword uses bcrypt [depends: none]
- [ ] Burst 12: validatePassword checks hash [depends: 11]
```

**Rules:**
- `[depends: none]` - can start immediately, parallelizable with other `none` bursts
- `[depends: N]` - must wait for burst N to complete
- Bursts at the same dependency level can run in parallel
