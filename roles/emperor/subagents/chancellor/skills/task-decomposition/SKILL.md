---
name: task-decomposition
description: How to decompose complex work into delegatable execution units
---

# Task Decomposition

Break complex work into units that a single executor/router can run independently. This skill is the foundation for [dependency-ordering](../dependency-ordering/SKILL.md): you cannot order what you have not split.

## Unit Granularity

One unit should map to roughly one module or one concern. The test: can you describe what "done" looks like in a single sentence?

**Too fine:** "Add the import statement for X" then "Add the type definition" then "Add the function body." These are fragments, not units. The dispatch overhead exceeds the work itself.

**Too broad:** "Implement the entire authentication system." No single executor can hold the full scope. Acceptance criteria become fuzzy. Failure is hard to isolate.

**Right-sized:** "Create the JWT validation middleware with token parsing, expiry check, and error responses." One concern, clear boundary, testable in isolation.

## Sizing Heuristics

- A unit touches 1-3 files in the common case
- A unit produces a verifiable artifact (a function, a module, a config file, a test suite)
- A unit can be described without referencing internal details of another unit
- If you need the word "and" more than once to describe it, consider splitting

## Delegatability Criteria

A unit is delegatable when it satisfies all three:

1. **Self-contained scope.** The executor does not need to ask "what else should I change?" All relevant context fits in the unit description.

2. **Clear acceptance criteria.** "Tests pass," "type-checks clean," "produces expected output for given input." Not "looks good" or "works correctly."

3. **Single executor can complete.** One executor/router holds enough context to finish the work without coordinating mid-flight with another executor.

## Common Mistakes

**Over-splitting** creates a swarm of trivial subtasks. Each dispatch carries overhead: context loading, verification, reporting. If ten subtasks could be three, prefer three.

**Under-splitting** produces subtasks where the executor must make architectural decisions that belong to the planner. If a subtask requires "figure out the right approach," it is too broad. The planner should have already figured that out.

**Leaking implementation details across units.** If Unit B can only succeed by knowing exactly how Unit A implemented something internally, the boundary is wrong. Units should depend on interfaces, not implementations.

## Cross-References

- `references/schemas.md` — subtask schema (the `dependencies` field, subtask structure)
- [dependency-ordering](../dependency-ordering/SKILL.md) — ordering and cycle detection once units are decomposed
