---
name: dependency-ordering
description: Topological sorting heuristics for subtask ordering
---

# Dependency Ordering

Subtasks have dependencies. Ordering them correctly means nothing blocks, nothing fails from missing prerequisites, and independent work runs in parallel.

## Identifying Dependencies

A subtask B depends on subtask A when B requires an artifact that A produces. Typical dependency signals:

- **Type/interface definitions.** If B imports a type that A creates, A goes first.
- **Shared configuration.** If B reads a config file that A generates, A goes first.
- **Module structure.** If B adds a handler to a router that A sets up, A goes first.
- **Test fixtures.** If B's tests use helpers that A introduces, A goes first.

Ask: "Could an executor start B right now without A's output existing?" If no, there's a dependency.

## Extract Shared Prerequisites Early

When multiple subtasks depend on the same foundation (shared types, a base config, a utility module), extract that foundation as the first unit. Don't let three subtasks each partially create the shared layer.

Pattern:
```
Unit 1: Create shared types and interfaces
Unit 2: Implement feature X (depends on 1)
Unit 3: Implement feature Y (depends on 1)
Unit 4: Integration wiring (depends on 2, 3)
```

Unit 1 unblocks everything. Units 2 and 3 can proceed in parallel once 1 completes.

## Maximizing Parallel Execution

The emperor dispatches independent subtasks concurrently. Your job as chancellor is to structure the dependency graph so parallelism emerges naturally.

- Group subtasks by dependency depth. All depth-0 tasks (no dependencies) can run simultaneously.
- Minimize sequential chains. A chain of A→B→C→D forces serial execution. Can B and C actually run in parallel if you restructure?
- Express dependencies explicitly in the subtask schema's `dependencies` field. The emperor uses this to schedule.

## Cycle Detection

If subtask A depends on B and B depends on A, you have a cycle. This means the decomposition is wrong.

Cycles signal that two units are too tightly coupled to separate. Resolution options:

1. **Merge them.** If A and B are mutually dependent, they're really one unit pretending to be two.
2. **Extract the shared concern.** Often the cycle exists because both units need to create part of a shared interface. Pull that interface into a new unit that both depend on.
3. **Redefine boundaries.** The coupling indicates the cut point is in the wrong place. Find a boundary where data flows in one direction.

Never ship a plan with circular dependencies. The emperor cannot schedule it. The executors cannot complete it.

## Ordering Checklist

Before finalizing subtask order:

1. Draw the dependency edges. Every subtask lists what it needs from other subtasks.
2. Verify no cycles exist. Follow each chain; if you return to a visited node, restructure.
3. Identify the critical path (longest sequential chain). Can you shorten it by restructuring?
4. Confirm depth-0 tasks are genuinely independent. No hidden shared state.
5. Validate that each dependency is on an artifact (file, type, module), not on "understanding" or "context." Executors share artifacts, not mental models.
