---
name: model-pool-and-budget
description: Single source of truth for topology, model pools, budget, and caps for the entire emperor tree
---

# Model Pool and Budget

## Model Pools

Three independent model pools serve the emperor tree. Each pool has an independent `maxConcurrent: 5` semaphore. Cross-pool dispatch does not compete for slots.

| Pool | Members | Semaphore |
|---|---|---|
| `tier-1-flagship` | Emperor, Reviewer | independent 5-slot |
| `tier-2-reasoning` | Chancellor, Drafter, Finalizer, Validator, UI, Backend, Test, Data, Docs, Quality | independent 5-slot |
| `tier-3-fast` | Jinyiwei | independent 5-slot |

**Full model identifiers:**

| Pool Short Name | Model ID |
|---|---|
| `tier-1-flagship` | `provider/tier-1-flagship` |
| `tier-2-reasoning` | `provider/tier-2-reasoning` |
| `tier-3-fast` | `provider/tier-3-fast` |

### Pool Membership Notes

- **tier-1-flagship pool**: Emperor and Reviewer share this pool. The emperor is idle while reviewer runs (emperor dispatches chancellor, chancellor dispatches reviewer), so contention is rare. When the emperor awaits chancellor results, the opus slot is fully available for reviewer.
- **tier-2-reasoning pool**: All strategy, validation, and execution agents (chancellor subtree, the validator, plus all six jinyiwei departments). At most 2 concurrent per parent (`maxActivePerParent: 2`), so pro-max dispatch never exceeds 2 concurrent from a given parent — well within the 5-slot semaphore.
- **tier-3-fast pool**: Jinyiwei alone, used for domain routing and simple execution. Flash is cheap and fast; the pool exists so jinyiwei sessions never compete with pro-max strategy work.

## Reviewer on Opus Pool — Rationale

### Why Reviewer Runs on Opus

The reviewer runs on `tier-1-flagship`, a distinct and stronger model than the `tier-2-reasoning` drafter it audits (see `subagents/chancellor/subagents/reviewer/role.yaml`). A meaningful veto requires an independent model that can catch flaws the drafter's own model would miss — an audit not limited by the drafter's model ceiling.

### Cost Impact

Tier-1-Flagship is more expensive per token than tier-2-reasoning. However:

- Reviewer runs typically 1-3 rounds within the chancellor convergence loop. Closed-loop validation is handled by the separate Validator (pro-max pool), so it does NOT consume the opus pool. The total reviewer token spend per request is bounded and deterministic.
- While reviewer occupies an opus slot, the emperor is idle (waiting for chancellor to return). No additional opus concurrency is consumed.
- Opus pool concurrency stays at or below 2 (emperor + reviewer), safe within the 5-slot semaphore.
- The review-round procedural cap (at most 3 rounds) remains unchanged.

### Budget Safety

- Chancellor convergence loop: at most 3 review rounds (procedural cap), each consuming one reviewer session.
- Closed-loop validate: at most 2 revise rounds, each with one Validator call. The Validator runs on the pro-max pool and never invokes the reviewer.
- Worst-case reviewer sessions per request: 3 (chancellor loop only) — the closed-loop validate step does not use the reviewer. All within the emperor's per-parent budget of 8.

## Closed-Loop Validate Budget

### What Closed-Loop Validate Is

After jinyiwei executes, the Validator validates execution reports. If validation reveals deficiencies, the emperor re-dispatches jinyiwei directly for a revise round, then the Validator re-validates. This repeats until validation passes or caps are hit.

### Caps

| Cap | Value | What It Limits |
|---|---|---|
| Strategy subtask count | 5 maximum (≤4 recommended) | Initial execution dispatches — one per subtask |
| Revise rounds | 2 maximum, budget permitting | Number of revise+validate cycles after initial execution |
| Re-dispatch per round | 1 batched jinyiwei call | All failed items + dependents in one dispatch |

Initial execution consumes N sessions (one per subtask). Each revise round adds one batched re-dispatch plus one re-validate. All count against the emperor's `maxTotalSessionsPerRequest: 8`.

### Worst-Case Session Table

The per-parent budget counts dispatches SPAWNED FROM the emperor session; the emperor's own session is not a spawn and does not count. Each subtask is one execution dispatch. Two representative worst cases:

**Wide plan (N = 4 subtasks, 1 revise round):**

| Stage | Sessions | Running Total |
|---|---|---|
| Chancellor plan+loop+finalize | 1 | 1 |
| Jinyiwei execute subtasks 1..4 | 4 | 5 |
| Validate (validator) | 1 | 6 |
| Re-dispatch round 1 (1 batched jinyiwei call) | 1 | 7 |
| Validate round 1 | 1 | 8 |
| Final synthesize | (in emperor session) | 8 |

**Narrow plan (N = 2 subtasks, 2 revise rounds):**

| Stage | Sessions | Running Total |
|---|---|---|
| Chancellor plan+loop+finalize | 1 | 1 |
| Jinyiwei execute subtasks 1..2 | 2 | 3 |
| Validate (validator) | 1 | 4 |
| Re-dispatch round 1 + validate | 2 | 6 |
| Re-dispatch round 2 + validate | 2 | 8 |
| Final synthesize | (in emperor session) | 8 |

Both fit the 8-session budget. General rule: the initial phase costs `1 (plan) + N (execute) + 1 (validate) = N + 2` sessions; each revise round adds 2 (one batched re-dispatch + one re-validate). The emperor tracks `emperor_sessions_used` and stops dispatching before the count would exceed 8, reporting any remaining items as budget-capped. This is why the planner caps strategies at 5 subtasks (≤4 recommended, to preserve one revise round). The final synthesize step runs inside the emperor's own session and consumes no dispatch slot.

> **Note on the cap denominator**: These tables count only child dispatches, per the documented counting rule ("each spawn from a parent increments that parent's counter"). Correctness does not depend on this interpretation: the emperor's budget-aware scheduling (PROMPT.md #7) checks remaining budget before every dispatch and truncates gracefully. Even if a kernel also counted the parent's own session, the system would degrade to one fewer revise round — never a silent mid-execution drop.

### Re-Dispatch Routing

Re-dispatches go from emperor to jinyiwei directly. They never pass through the chancellor. This keeps the closed loop fast (emperor -> jinyiwei -> validate) and avoids inflating the chancellor's subtree budget with revise cycles.

## Per-Parent Budget

Each direct parent session maintains an independent session counter. Budgets do not stack or share across trees.

| Parent Subtree | Budget | Members Counted |
|---|---|---|
| Emperor | 8 | Emperor + chancellor + jinyiwei dispatches + validate dispatches + re-dispatches |
| Chancellor | 8 | Chancellor + drafter + reviewer + finalizer sessions |
| Jinyiwei | 8 | Jinyiwei + department worker dispatches |

### How Budget Counting Works

- The dispatch system keys session counts by the caller's session ID. Each spawn from a parent increments that parent's counter.
- When the emperor dispatches chancellor, the emperor's counter increments. When chancellor dispatches drafter, the chancellor's counter increments. The emperor's counter is unaffected by chancellor's internal dispatches.
- The `maxTotalSessionsPerRequest: 8` field is set explicitly on each role that dispatches: emperor, chancellor, and jinyiwei.
- When a parent's counter reaches 8, further dispatch from that parent is rejected. This is a hard stop, not a warning.

### Jinyiwei Budget

Jinyiwei sets `maxTotalSessionsPerRequest: 8` explicitly in its `role.yaml`, alongside `maxActivePerParent: 2`. This caps jinyiwei's department-worker dispatches at 8 cumulative sessions per request, independent of the emperor's own per-parent budget. Without this field, jinyiwei's department dispatches would have no per-parent cap.

## Cost Intuition

| Pattern | Emperor budget consumed (child dispatches) | When |
|---|---|---|
| DIRECT answer | 0 (emperor answers inline) | Trivial queries, single-file edits, quick lookups |
| Single jinyiwei dispatch | 1 | Clear single-step execution tasks |
| Chancellor path (plan -> execute per subtask -> validate) | N + 2 (≤7) | Complex multi-step work needing strategy |
| Chancellor + closed loop (revise rounds) | up to 8 | Planned path with revision cycles, budget permitting |
| Destructive path (chancellor -> user approval -> jinyiwei) | 2 | Destructive operations requiring confirmation |

The per-parent cap counts only dispatches spawned FROM the emperor; the emperor's own session is free. DIRECT therefore consumes zero budget — which is exactly why it is the default (see Cost Defense above).

### What Each Pattern Entails

**DIRECT answer (0 dispatches):** The emperor answers inline using its own read-only tools. No dispatch cost. Roughly 80% of incoming requests fall here.

**Single jinyiwei dispatch (1 dispatch):** Emperor triages, then dispatches jinyiwei once; jinyiwei executes and returns a report. No strategy needed. Covers straightforward implementation tasks.

**Chancellor path (emperor budget = N + 2 sessions):** Full orchestration. Emperor dispatches chancellor (1); the chancellor runs the three-stage loop (drafter+reviewer+finalizer) entirely within its OWN independent 8-budget; then the emperor dispatches ONE jinyiwei execution per subtask (N, one per subtask); then the Validator validates (1). Emperor-budget sessions: chancellor(1) + N execute + validate(1) = N + 2. With the ≤5 subtask cap this is at most 7. Chancellor-budget sessions (separate counter): chancellor(1) + drafter(1-3) + reviewer(1-3) + finalizer(1) = up to 7.

**Chancellor + closed loop (up to 8 sessions):** The path above plus revise rounds. Each round adds one batched jinyiwei re-dispatch and one validate. Rounds continue only while `N + 2 + 2·rounds <= 8`, so a 4-subtask plan affords 1 revise round and a 2-subtask plan affords 2.

**Destructive path (2 dispatches):** Emperor dispatches chancellor for risk assessment. Chancellor returns a strategy flagged `risk: high`. Emperor presents to user for approval. On approval, emperor dispatches jinyiwei. Child dispatches: chancellor(1) + jinyiwei(1) = 2 (the emperor's own session is free).

## Dispatch Configuration Reference

The canonical dispatch configuration for the emperor role, as declared in `role.yaml`:

```yaml
dispatch:
  maxActivePerParent: 2
  maxConcurrent: 5
  syncPromptTimeoutMs: 600000
  backgroundStaleTimeoutMs: 300000
  maxTotalSessionsPerRequest: 8
```

**Field semantics:**

| Field | Meaning |
|---|---|
| `maxActivePerParent: 2` | A single parent may have at most 2 active child sessions concurrently. Prevents fan-out storms. |
| `maxConcurrent: 5` | Per-model-pool semaphore. Each of the three model pools has its own independent 5-slot limit. Background tasks use at most 4 slots (5 minus 1 reserved for sync). |
| `syncPromptTimeoutMs: 600000` | Synchronous dispatch timeout. Set to 10 minutes to cover the full three-department nested loop (draft -> review -> finalize). |
| `backgroundStaleTimeoutMs: 300000` | Background task staleness timeout. Tasks not collected within 5 minutes are considered stale. |
| `maxTotalSessionsPerRequest: 8` | Hard per-parent-session cap. Counts all sessions dispatched from one parent. Independent per subtree. |

## Cost Defense: Why DIRECT Is the Default

Every dispatch spawns a subagent session that consumes tokens for context loading, tool calls, and reasoning. A DIRECT response uses zero additional sessions — the emperor answers inline, paying only its own generation cost. Roughly 80% of incoming requests need a single focused answer, not orchestration. Dispatching those wastes budget on session overhead that produces no extra value. DIRECT is the cheap path; dispatch is the expensive path. Choose expensive only when the work genuinely requires a separate execution context.

Three layers of cost defense keep spend bounded:

1. **Default DIRECT.** If a request can be answered without spawning children, it is. Covers questions, single-file edits, quick lookups, and anything the emperor's own read-only tools can satisfy.
2. **Per-session concurrency caps.** `maxActivePerParent: 2` caps a single parent to two concurrent children (prevents fan-out storms); `maxConcurrent: 5` is a per-model-pool semaphore. Even aggressive dispatching cannot exceed a bounded cost envelope per time-slice.
3. **Per-parent-session hard cap.** `maxTotalSessionsPerRequest: 8` — each direct parent (emperor, chancellor, jinyiwei) gets at most 8 cumulative child dispatches. A hard stop, not a warning. Combined with the planner's ≤5 subtask cap and budget-aware scheduling, this prevents deep recursion or wide fan-out from compounding into unbounded spend.

This document is the single authoritative source for model pools and budget.
