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

- **tier-1-flagship pool**: Emperor and Reviewer share this pool. The emperor is idle while reviewer runs (emperor dispatches chancellor, chancellor dispatches reviewer), so contention is rare. When the emperor awaits chancellor results, the tier-1-flagship slot is fully available for reviewer.
- **tier-2-reasoning pool**: All strategy, validation, and execution agents (chancellor subtree, the validator, plus all six jinyiwei departments). At most 3 concurrent per parent (`maxActivePerParent: 3`), so tier-2-reasoning dispatch never exceeds 3 concurrent from a given parent — well within the 5-slot semaphore.
- **tier-3-fast pool**: Jinyiwei alone, used for domain routing and simple execution. tier-3-fast is cheap and fast; the pool exists so jinyiwei sessions never compete with tier-2-reasoning strategy work.

## Reviewer on tier-1-flagship Pool — Rationale

### Why Reviewer Runs on tier-1-flagship

The reviewer runs on `tier-1-flagship`, a distinct and stronger model than the `tier-2-reasoning` drafter it audits (see `subagents/chancellor/subagents/reviewer/role.yaml`). A meaningful veto requires an independent model that can catch flaws the drafter's own model would miss — an audit not limited by the drafter's model ceiling.

### Cost Impact

Tier-1-Flagship is more expensive per token than tier-2-reasoning. However:

- Reviewer runs typically 1-3 rounds within the chancellor convergence loop. Closed-loop validation is handled by the separate Validator (tier-2-reasoning pool), so it does NOT consume the tier-1-flagship pool. The total reviewer token spend per request is bounded and deterministic.
- While reviewer occupies a tier-1-flagship slot, the emperor is idle (waiting for chancellor to return). No additional tier-1-flagship concurrency is consumed.
- tier-1-flagship pool concurrency stays at or below 2 (emperor + reviewer), safe within the 5-slot semaphore.
- The review-round procedural cap (at most 3 rounds) remains unchanged.

### Budget Safety

- Chancellor convergence loop: at most 3 review rounds (procedural cap), each consuming one reviewer session.
- Closed-loop validate: at most 2 revise rounds, each with one Validator call. The Validator runs on the tier-2-reasoning pool and never invokes the reviewer.
- Worst-case reviewer sessions per request: 3 (chancellor loop only) — the closed-loop validate step does not use the reviewer. All within the emperor's per-parent budget of 20.

## Closed-Loop Validate Budget

### What Closed-Loop Validate Is

After jinyiwei executes, the Validator validates execution reports. If validation reveals deficiencies, the emperor re-runs the failed jinyiwei node via `graph_run(graph_id, node_id=…, retry=true, modify_prompt=…)` — one session per failed node — for a revise round, then the Validator re-validates. This repeats until validation passes or caps are hit. Falls back to a fresh `graph_add_node` when the original node is unavailable (see synthesize.md Step 4b).

### Caps

| Cap | Value | What It Limits |
|---|---|---|
| Strategy subtask count | 10 maximum (≤8 recommended) | Initial execution dispatches — one per subtask |
| Revise rounds | 2 maximum, budget permitting | Number of revise+validate cycles after initial execution |
| Retries per round (via graph_run retry) | 1 `graph_run(node_id, retry=true)` re-run per failed node (+ dependents) | Each failed node re-run in its own isolated session, dependency-root order |

Initial execution consumes N sessions (one per subtask). Each revise round adds one `graph_run(node_id, retry=true)` session PER failed node plus one re-validate. All count against the emperor's self-accounted `emperor_sessions_used` cap of 20.

### Worst-Case Session Table

The per-parent budget counts dispatches SPAWNED FROM the emperor session; the emperor's own session is not a spawn and does not count. Each subtask is one execution dispatch. Two representative worst cases:

**Wide plan (N = 8 subtasks, 1 revise round):**

| Stage | Sessions | Running Total |
|---|---|---|
| Chancellor plan+loop+finalize | 1 | 1 |
| Jinyiwei execute subtasks 1..8 | 8 | 9 |
| Validate (validator) | 1 | 10 |
| Re-dispatch round 1 (1 failed item, own session) | 1 | 11 |
| Validate round 1 | 1 | 12 |
| Final synthesize | (in emperor session) | 12 |

At N=8 the budget covers retrying multiple failed items; at N=10 (happy path = 12), 8 sessions remain for revise rounds.

**Narrow plan (N = 5 subtasks, all fail once):**

| Stage | Sessions | Running Total |
|---|---|---|
| Chancellor plan+loop+finalize | 1 | 1 |
| Jinyiwei execute subtasks 1..5 | 5 | 6 |
| Validate (validator) | 1 | 7 |
| Re-dispatch round 1 (5 failed items, one session each) | 5 | 12 |
| Validate round 1 | 1 | 13 |
| Final synthesize | (in emperor session) | 13 |

Seven sessions remain — enough for another round of up to 3 failed items (3 retries + 1 revalidate = 4 sessions).

Both fit the 20-session budget. General rule: the initial phase costs `1 (plan) + N (execute) + 1 (validate) = N + 2` sessions; each revise round adds `F + 1` (F per-item retries + one revalidate), where F is the number of failed nodes re-run that round (via `graph_run(graph_id, node_id=…, retry=true, modify_prompt=…)`). The emperor tracks `emperor_sessions_used` and stops dispatching before the count would exceed 20, reporting any remaining items as budget-capped. This is why the planner caps strategies at 10 subtasks — ≤8 recommended, and ≤7 leaves room to retry more than one failed item in a revise round. The final synthesize step runs inside the emperor's own session and consumes no dispatch slot.

> **Note on the cap denominator**: These tables count only child dispatches, per the documented counting rule ("each spawn from a parent increments that parent's counter"). Correctness does not depend on this interpretation: the emperor's budget-aware scheduling (PROMPT.md #7) checks remaining budget before every dispatch and truncates gracefully. Even if a kernel also counted the parent's own session, the system would degrade to one fewer revise round — never a silent mid-execution drop.

### Re-Run Routing (via graph_run retry)

Re-runs use `graph_run(graph_id, node_id=…, retry=true, modify_prompt=…)` to reopen the original failed node's session, keeping the closed loop fast (emperor → jinyiwei → validate). They never pass through the chancellor. When the original node is unavailable, a fresh `graph_add_node` for `emperor--jinyiwei` serves as fallback (see synthesize.md Step 4b).

## Per-Parent Budget

Each direct parent session maintains an independent session counter. Budgets do not stack or share across trees.

| Parent Subtree | Budget | Members Counted |
|---|---|---|
| Emperor | 20 | Emperor + chancellor + jinyiwei nodes + validate nodes + re-runs (graph_run retry) |
| Chancellor | 20 | Chancellor + drafter + reviewer + finalizer sessions |
| Jinyiwei | 20 | Jinyiwei + department worker dispatches |

### How Budget Counting Works

- The dispatch system keys session counts by the caller's session ID. Each spawn from a parent increments that parent's counter.
- When the emperor dispatches chancellor, the emperor's counter increments. When chancellor dispatches drafter, the chancellor's counter increments. The emperor's counter is unaffected by chancellor's internal dispatches.
- The request-wide session cap (20) is self-accounted by each orchestrating role (emperor, chancellor, jinyiwei) via its `emperor_sessions_used` counter — the engine's `graph_status(include_budget=true)` corroborates per-graph consumption.
- When a parent's counter reaches 20, further dispatch from that parent is rejected. This is a hard stop, not a warning.

### Jinyiwei Budget

Jinyiwei self-accounts its department-worker node sessions (max 20 per request) independent of the emperor's own per-parent budget. The graph engine enforces per-node `timeout_ms`/`max_retries` and engine-managed concurrency; the request-wide cap is the jinyiwei `emperor_sessions_used` counter.

## Cost Intuition

| Pattern | Emperor budget consumed (child dispatches) | When |
|---|---|---|
| DIRECT answer | 0 (emperor answers inline) | Trivial queries, read-only lookups, research, explanations |
| Single jinyiwei dispatch | 1 | Clear single-step execution tasks |
| Chancellor path (plan -> execute per subtask -> validate) | N + 2 (≤12) | Complex multi-step work needing strategy |
| Chancellor + closed loop (revise rounds) | up to 20 | Planned path with revision cycles, budget permitting |
| Destructive path (chancellor -> user approval -> jinyiwei) | 2 | Destructive operations requiring confirmation |

The per-parent cap counts only dispatches spawned FROM the emperor; the emperor's own session is free. DIRECT therefore consumes zero budget — which is exactly why it is the default (see Cost Defense above).

### What Each Pattern Entails

**DIRECT answer (0 dispatches):** The emperor answers inline using its own read-only tools. No dispatch cost. Roughly 80% of incoming requests fall here.

**Single jinyiwei dispatch (1 dispatch):** Emperor triages, then dispatches jinyiwei once; jinyiwei executes and returns a report. No strategy needed. Covers straightforward implementation tasks, including single-file edits — the emperor has no Write/Edit/Bash and never edits files itself.

**Chancellor path (emperor budget = N + 2 sessions):** Full orchestration. Emperor dispatches chancellor (1); the chancellor runs the three-stage loop (drafter+reviewer+finalizer) entirely within its OWN independent 20-budget; then the emperor dispatches ONE jinyiwei execution per subtask (N, one per subtask); then the Validator validates (1). Emperor-budget sessions: chancellor(1) + N execute + validate(1) = N + 2. With the ≤10 subtask cap this is at most 12. Chancellor-budget sessions (separate counter): chancellor(1) + drafter(1-3) + reviewer(1-3) + finalizer(1) = up to 7.

**Chancellor + closed loop (up to 20 sessions):** The path above plus revise rounds. Each round adds one jinyiwei re-run (`graph_run(graph_id, node_id=…, retry=true, modify_prompt=…)`) PER failed node plus one validate. A round is affordable while `used + F + 1 <= 20` (F = failed items that round). An 8-subtask plan leaves room for several failed items in a single round; a 5-subtask plan leaves room for several more. Wider plans afford fewer per-item retries — the isolation-per-item trade-off the design intends.

**Destructive path (2 dispatches):** Emperor dispatches chancellor for risk assessment. Chancellor returns a strategy flagged `risk: high`. Emperor presents to user for approval. On approval, emperor dispatches jinyiwei. Child dispatches: chancellor(1) + jinyiwei(1) = 2 (the emperor's own session is free).

## Orchestration Configuration Reference

The legacy `dispatch:` block (`maxActivePerParent` / `maxConcurrent` / `syncPromptTimeoutMs` / `backgroundStaleTimeoutMs` / `maxTotalSessionsPerRequest`) was **removed** in the Phase C graph-engine migration. Orchestration now runs on the graph engine:

- **Concurrency** is engine-managed (the graph dispatches `ready` nodes within its frontier; no per-parent `maxActivePerParent` hand-tuning).
- **Per-node timeouts / retries** are carried on `graph_add_node(…, timeout_ms, max_retries)`; per-graph ceilings on `graph_create(…, budget={ max_total_sessions: 20 })`.
- **The request-wide 20-session cap** is self-accounted by each orchestrating role via `emperor_sessions_used` (a working-note counter), corroborated per-graph by `graph_status(graph_id, include_budget=true)` (reports `sessionsSpawned`). This counter is the authoritative enforcement gate — `include_budget` is advisory per-graph data, not a cross-graph hard stop.
- **Stale/orphaned nodes** are handled by the engine (vanished task → `timeout`/`escalate`) and reclaimed with `graph_cancel(graph_id, node_id?)`.

**Session-cap semantics (unchanged model, new surface):** Each orchestrating role maintains an independent session counter. A node session spawned from a parent increments that parent's counter; budgets do not stack or share across trees. When a parent's counter reaches 20, the emperor stops adding nodes and reports remaining items as budget-capped (a hard stop, not a warning).

## Cost Defense: Why DIRECT Is the Default

Every graph node spawns a subagent session that consumes tokens for context loading, tool calls, and reasoning. A DIRECT response uses zero additional sessions — the emperor answers inline, paying only its own generation cost. Roughly 80% of incoming requests need a single focused answer, not orchestration. Routing those through the graph wastes budget on session overhead that produces no extra value. DIRECT is the cheap path; graph orchestration is the expensive path. Choose expensive only when the work genuinely requires a separate execution context.

Three layers of cost defense keep spend bounded:

1. **Default DIRECT.** If a request can be answered without spawning children, it is. Covers questions, read-only lookups, research, and anything the emperor's own read-only tools can satisfy. A request that modifies files — even one line — is a single jinyiwei graph node, not DIRECT.
2. **Engine-managed concurrency.** The graph engine bounds how many `ready` nodes dispatch concurrently (frontier scheduling), preventing fan-out storms from exceeding a bounded cost envelope per time-slice.
3. **Self-accounted session hard cap.** Each orchestrating role enforces `emperor_sessions_used <= 20` — a hard stop, not a warning — before adding another node (`graph_add_node`/`graph_run`). Combined with the planner's ≤10 subtask cap and budget-aware scheduling, this prevents deep recursion or wide fan-out from compounding into unbounded spend.

This document is the single authoritative source for model pools and budget.
