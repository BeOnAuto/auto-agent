---
when:
  hook: SessionStart
priority: 100
---

# Documentation Reminder

Documentation is code. Outdated docs are bugs.

## When to Update Docs

Update documentation when:
- Adding features
- Changing APIs
- Completing milestones

## When NOT to Create New Docs

Do not create new documentation files unless the feature explicitly requires them.

Avoid:
- Creating README files proactively
- Adding markdown files "for completeness"
- Documenting internal implementation details

Prefer:
- Self-documenting code
- Updating existing docs
- Inline JSDoc for public APIs only
