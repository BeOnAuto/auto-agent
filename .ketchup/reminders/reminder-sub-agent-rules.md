---
when:
  hook: SessionStart
priority: 100
---

# Sub-Agent Rules Reminder

When spawning a Task agent (sub-agent), ensure:

1. **Include CLAUDE.md context** - Sub-agents must receive and follow these rules
2. **Include ketchup-plan.md** - Sub-agents work from the same plan
3. **No orphan work** - Sub-agent output must be committed by parent or sub-agent

Sub-agents follow identical rules to the parent. They are not exempt from any CLAUDE.md requirements.

## Prompt Pattern

```
You are working on [bottle name]. Follow CLAUDE.md rules exactly.

Your burst: [burst description]
Dependencies: [list completed bursts this depends on, or "none"]
Parallel with: [list of bursts running concurrently]

[specific instructions]
```
