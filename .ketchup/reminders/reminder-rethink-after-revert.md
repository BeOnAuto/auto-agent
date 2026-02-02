---
when:
  hook: SessionStart
priority: 100
---

# RETHINK After Revert Reminder

After a revert, do NOT immediately retry the same approach.

## Ask These Questions First

1. **Was the burst too big?** → Split it into smaller bursts
2. **Was the design flawed?** → Try a different approach entirely
3. **Was the test wrong?** → Clarify the requirement before writing code

## Then

Only after answering these questions, write the next failing test.

Never patch failing code. The TCR pattern means:
- Pass → commit → continue
- Fail → REVERT → RETHINK (smaller steps or new design)

A revert is a signal to change your approach, not to try harder at the same thing.
