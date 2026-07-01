---
name: finalization-criteria
description: Objective criteria for merging an approved draft into the canonical final strategy without introducing drift
---

# Finalization Criteria

How to turn an approved (or best-effort) draft into the canonical `final_strategy`.
The schema is canonical in `references/schemas.md` (Strategy contract) — this skill
covers what finalization may and may not change.

## Core Rule

Finalization is a MERGE, not a re-plan. Preserve the approved draft's subtasks and
structure. You may polish wording and incorporate review notes; you MUST NOT invent
new subtasks, drop approved ones, or re-scope the objective.

## What Finalization MAY Do

1. **Incorporate review notes.** Apply concrete fixes the review stage requested
   that the draft did not fully resolve.
2. **Polish descriptions.** Tighten wording for clarity, without changing intent.
3. **Flag unresolved concerns.** If the planner signals a round-3 best-effort
   (veto never cleared), record the open concerns in the optional `notes` field so
   the orchestrator sees them.
4. **Normalize schema.** Ensure integer IDs (monotonic from 1), scalar `risk`,
   integer dependency arrays.

## What Finalization MUST NOT Do

1. **Add or remove subtasks** beyond what review approved. The subtask set is
   locked at approval.
2. **Exceed the subtask budget.** The strategy MUST stay within 5 subtasks (≤4
   recommended). If the approved draft already exceeds it, flag this in `notes`
   rather than silently expanding.
3. **Re-scope the objective.** The `objective` reflects the approved intent.
4. **Emit forbidden fields.** No `risks` (list form), no `final_notes`, no
   string-typed subtask IDs. Use scalar `risk` and optional `notes`.
5. **Downgrade risk.** Never change `risk: high` to `low`. Risk only escalates
   during finalization, never relaxes.

## Field Conformance Checklist

Before emitting the `final_strategy` fence, confirm:

| Field | Requirement |
|-------|-------------|
| `objective` | Single sentence, matches approved intent |
| `subtasks[].id` | Integer, monotonic from 1, no gaps or duplicates |
| `subtasks[].dependencies` | Integer array, valid DAG, no cycles |
| `subtasks[].target` | `jinyiwei` |
| `subtasks[].acceptance` | Tool-verifiable done-condition |
| `risk` | Scalar `low` or `high`, never relaxed from the draft |
| `notes` | Optional single string; use for unresolved concerns |
| subtask count | ≤ 5 |

## Unresolved-Concern Handling

If review reached the round-3 cap with an unresolved veto, the strategy still
finalizes (best-effort), but you MUST surface every unresolved concern in `notes`
so the orchestrator can weigh the risk before dispatch. Never hide an unresolved
review concern by omitting it.
