---
name: scope-guard
description: Discipline to stay within assigned subtask boundaries
---

# Scope Guard

You receive a single assigned subtask. Complete that task and nothing else.

## Rules

1. **Only modify files directly relevant to the assigned subtask.** If a file isn't named in the task or clearly required by it, don't touch it.

2. **Do NOT refactor adjacent code.** You'll notice things that could be "better." Leave them alone. Refactoring unrelated modules isn't your job right now.

3. **Do NOT add tests for unrelated functionality.** Write tests for *your* change. Not for the function next door that happens to be untested.

4. **If scope is fuzzy, report back.** When the task description is ambiguous about what is in-bounds, stop and report back rather than expanding scope yourself. A short clarification request costs less than undoing overreach.

5. **Cross-boundary changes: note, don't execute.** You might discover that completing your task properly requires changing something outside your boundary. Document it in your result output. Don't make the change yourself.

## Why This Matters

Scope creep in subtasks causes:
- Merge conflicts with parallel work
- Unreviewed changes slipping through
- Cascading failures from "helpful" modifications nobody asked for
- Wasted effort on work that gets reverted

## Self-Check

Before committing any change, ask:
- "Was this file mentioned in my task?"
- "Does this change directly serve the stated goal?"
- "Would removing this change break my task's acceptance criteria?"

If the answer to all three is "no," you've drifted. Back up.
