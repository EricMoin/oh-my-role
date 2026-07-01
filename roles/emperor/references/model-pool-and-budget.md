---
name: model-pool-and-budget
description: Single source of truth for topology, model pools, budget, and caps for the entire emperor tree
---

# Model Pool and Budget

## Model Pools

Three independent model pools serve the emperor tree. Each pool has an independent `maxConcurrent: 5` semaphore. Cross-pool dispatch does not compete for slots.

| Pool | Members | Semaphore |
|---|---|---|
| `opus-4.6` | Emperor, Reviewer | independent 5-slot |
| `deepseek-v4-pro-max` | Chancellor, Drafter, Finalizer, Validator, UI, Backend, Test, Data, Docs, Quality | independent 5-slot |
| `deepseek-v4-flash` | Jinyiwei | independent 5-slot |

**Full model identifiers:**

| Pool Short Name | Model ID |
|---|---|
| `opus-4.6` | `hfai-anthropic/cloudsway-claude-opus-4.6-cache-1M` |
| `deepseek-v4-pro-max` | `hfai/deepseek-v4-pro-max` |
| `deepseek-v4-flash` | `hfai/deepseek-v4-flash` |

### Pool Membership Notes

- **opus-4.6 pool**: Emperor and Reviewer share this pool. The emperor is idle while reviewer runs (emperor dispatches chancellor, chancellor dispatches reviewer), so contention is rare. When the emperor awaits chancellor results, the opus slot is fully available for reviewer.
- **deepseek-v4-pro-max pool**: All strategy, validation, and execution agents (chancellor subtree, the validator, plus all six jinyiwei departments). At most 2 concurrent per parent (`maxActivePerParent: 2`), so pro-max dispatch never exceeds 2 concurrent from a given parent — well within the 5-slot semaphore.
- **deepseek-v4-flash pool**: Jinyiwei alone, used for domain routing and simple execution. Flash is cheap and fast; the pool exists so jinyiwei sessions never compete with pro-max strategy work.

## Reviewer on Opus Pool — Rationale

### Why Reviewer Runs on Opus

The reviewer runs on `opus-4.6`, a distinct and stronger model than the `deepseek-v4-pro-max` drafter it audits (see `subagents/chancellor/subagents/reviewer/role.yaml`). A meaningful veto requires an independent model that can catch flaws the drafter's own model would miss — an audit not limited by the drafter's model ceiling.

### Cost Impact

Opus-4.6 is more expensive per token than deepseek-v4-pro-max. However:

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

After jinyiwei executes, the Validator validates execution reports. If validation reveals deficiencies, the emperor re-dispatches jinyiwei directly — one session per failed item — for a revise round, then the Validator re-validates. This repeats until validation passes or caps are hit.

### Caps

| Cap | Value | What It Limits |
|---|---|---|
| Strategy subtask count | 5 maximum (≤4 recommended) | Initial execution dispatches — one per subtask |
| Revise rounds | 2 maximum, budget permitting | Number of revise+validate cycles after initial execution |
| Re-dispatch per round | 1 jinyiwei call per failed item (+ dependents) | Each failed item re-dispatched in its own session, dependency-root order |

Initial execution consumes N sessions (one per subtask). Each revise round adds one re-dispatch session PER failed item plus one re-validate. All count against the emperor's `maxTotalSessionsPerRequest: 8`.

### Worst-Case Session Table

The per-parent budget counts dispatches SPAWNED FROM the emperor session; the emperor's own session is not a spawn and does not count. Each subtask is one execution dispatch. Two representative worst cases:

**Wide plan (N = 4 subtasks, 1 revise round):**

| Stage | Sessions | Running Total |
|---|---|---|
| Chancellor plan+loop+finalize | 1 | 1 |
| Jinyiwei execute subtasks 1..4 | 4 | 5 |
| Validate (validator) | 1 | 6 |
| Re-dispatch round 1 (1 failed item, own session) | 1 | 7 |
| Validate round 1 | 1 | 8 |
| Final synthesize | (in emperor session) | 8 |

At N=4 the budget covers re-dispatching only ONE failed item; additional failures in that round are reported as budget-capped.

**Narrow plan (N = 2 subtasks, both fail once):**

| Stage | Sessions | Running Total |
|---|---|---|
| Chancellor plan+loop+finalize | 1 | 1 |
| Jinyiwei execute subtasks 1..2 | 2 | 3 |
| Validate (validator) | 1 | 4 |
| Re-dispatch round 1 (2 failed items, one session each) | 2 | 6 |
| Validate round 1 | 1 | 7 |
| Final synthesize | (in emperor session) | 7 |

One session remains — not enough for another round (a round needs at least F+1 = 2 sessions). Under per-item re-dispatch a narrow plan trades the old second revise round for isolated, focused fixes in the first.

Both fit the 8-session budget. General rule: the initial phase costs `1 (plan) + N (execute) + 1 (validate) = N + 2` sessions; each revise round adds `F + 1` (F per-item re-dispatches + one revalidate), where F is the number of failed items re-dispatched that round. The emperor tracks `emperor_sessions_used` and stops dispatching before the count would exceed 8, reporting any remaining items as budget-capped. This is why the planner caps strategies at 5 subtasks — ≤4 recommended, and ≤3 leaves room to re-dispatch more than one failed item in a revise round. The final synthesize step runs inside the emperor's own session and consumes no dispatch slot.

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
| DIRECT answer | 0 (emperor answers inline) | Trivial queries, read-only lookups, research, explanations |
| Single jinyiwei dispatch | 1 | Clear single-step execution tasks |
| Chancellor path (plan -> execute per subtask -> validate) | N + 2 (≤7) | Complex multi-step work needing strategy |
| Chancellor + closed loop (revise rounds) | up to 8 | Planned path with revision cycles, budget permitting |
| Destructive path (chancellor -> user approval -> jinyiwei) | 2 | Destructive operations requiring confirmation |

The per-parent cap counts only dispatches spawned FROM the emperor; the emperor's own session is free. DIRECT therefore consumes zero budget — which is exactly why it is the default (see Cost Defense above).

### What Each Pattern Entails

**DIRECT answer (0 dispatches):** The emperor answers inline using its own read-only tools. No dispatch cost. Roughly 80% of incoming requests fall here.

**Single jinyiwei dispatch (1 dispatch):** Emperor triages, then dispatches jinyiwei once; jinyiwei executes and returns a report. No strategy needed. Covers straightforward implementation tasks, including single-file edits — the emperor has no Write/Edit/Bash and never edits files itself.

**Chancellor path (emperor budget = N + 2 sessions):** Full orchestration. Emperor dispatches chancellor (1); the chancellor runs the three-stage loop (drafter+reviewer+finalizer) entirely within its OWN independent 8-budget; then the emperor dispatches ONE jinyiwei execution per subtask (N, one per subtask); then the Validator validates (1). Emperor-budget sessions: chancellor(1) + N execute + validate(1) = N + 2. With the ≤5 subtask cap this is at most 7. Chancellor-budget sessions (separate counter): chancellor(1) + drafter(1-3) + reviewer(1-3) + finalizer(1) = up to 7.

**Chancellor + closed loop (up to 8 sessions):** The path above plus revise rounds. Each round adds one jinyiwei re-dispatch PER failed item plus one validate. A round is affordable while `used + F + 1 <= 8` (F = failed items that round). A 4-subtask plan leaves room for one failed item in a single round; a 2-subtask plan leaves room for two. Wider plans afford fewer per-item re-dispatches — the isolation-per-item trade-off the design intends.

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

1. **Default DIRECT.** If a request can be answered without spawning children, it is. Covers questions, read-only lookups, research, and anything the emperor's own read-only tools can satisfy. A request that modifies files — even one line — is a single jinyiwei dispatch, not DIRECT.
2. **Per-session concurrency caps.** `maxActivePerParent: 2` caps a single parent to two concurrent children (prevents fan-out storms); `maxConcurrent: 5` is a per-model-pool semaphore. Even aggressive dispatching cannot exceed a bounded cost envelope per time-slice.
3. **Per-parent-session hard cap.** `maxTotalSessionsPerRequest: 8` — each direct parent (emperor, chancellor, jinyiwei) gets at most 8 cumulative child dispatches. A hard stop, not a warning. Combined with the planner's ≤5 subtask cap and budget-aware scheduling, this prevents deep recursion or wide fan-out from compounding into unbounded spend.

This document is the single authoritative source for model pools and budget.
