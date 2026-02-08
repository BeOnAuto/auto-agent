---
when:
  hook: SessionStart
priority: 100
---

# IDE Diagnostics Reminder

Before committing, check IDE diagnostics on all uncommitted files.

## Pre-Commit Checklist

1. Review all files with uncommitted changes
2. Check for TypeScript errors (red squiggles)
3. Check for warnings (yellow squiggles)
4. Ensure no linting errors remain
5. Verify imports are correctly resolved

## TCR Command

```bash
pnpm test --run && git add -A && git commit -m "<MSG>" || git checkout -- .
```

The tests will catch most issues, but IDE diagnostics can catch type errors and import issues before you even run tests.
