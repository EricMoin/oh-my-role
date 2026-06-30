---
name: cost-model
description: Cost/budget awareness reference for dispatch decisions
---

# Cost Model

## Why "Prefer DIRECT" Is the Default

Every dispatch spawns a subagent session. Each session consumes tokens for context loading, tool calls, and reasoning. A DIRECT response uses zero additional sessions: the Emperor answers inline, paying only its own generation cost.

The cost geometry is simple: one dispatch doubles the token spend; two dispatches triple it. Most requests (roughly 80%) need a single focused answer, not orchestration. Dispatching those wastes budget on session overhead that produces no extra value.

DIRECT is the cheap path. Dispatch is the expensive path. Choose expensive only when the work genuinely requires a separate execution context.

## Three Layers of Cost Defense

### Layer 1: Default DIRECT

The first line of defense. If a request can be answered without spawning children, it should be. This covers straightforward questions, single-file edits, quick lookups, and anything where the Emperor's own tools suffice.

Roughly 80% of incoming requests fall here. No dispatch cost incurred.

### Layer 2: Per-Session Caps

When dispatch is warranted, structural limits prevent runaway spending:

- `maxActivePerParent: 2` caps a single parent to two concurrent child sessions. This prevents "fan-out storms" where one complex request spawns five parallel agents.
- `maxConcurrent: 5` limits per-model concurrent sessions. Since the tree uses two model pools (Opus for emperor, tier-2-reasoning for chancellor/departments, tier-3-fast for jinyiwei routing), each pool has its own 5-slot semaphore. Background tasks use 4 slots (5 minus 1 reserved for sync).

These caps mean even aggressive dispatching can't exceed a bounded cost envelope per time-slice.

### Layer 3: Per-Parent-Session Hard Cap

- `maxTotalSessionsPerRequest: 8` sets a per-parent-session cap — each direct parent session (emperor, chancellor independently) gets ≤8 sessions total.

This prevents deep recursion or wide fan-out from compounding into unbounded spend.

**Enforcement:** `parseDispatchConfig` parses the field (`config.ts:209`) and `manager.ts:405` enforces it as a per-parent-session cap.

## Cost Intuition

| Pattern | Sessions | Relative Cost |
|---------|----------|---------------|
| DIRECT answer | 1 | 1x |
| Single dispatch | 2 | ~2x |
| Dispatch + sub-dispatch | 3 | ~3x |
| Max per-parent (cap hit) | 8 | ≤8× per parent |

Note: `maxTotalSessionsPerRequest` is counted **per direct parent session** (keyed by the caller's session ID in `manager.ts`). Emperor, chancellor, and jinyiwei each have their own independent ≤8 budget. The theoretical tree-wide maximum is ~24 sessions, but the three-department loop and dispatch config keep typical usage well under that.

The multiplier is approximate. Smaller tasks cost less per-session, but the overhead of context loading and tool warm-up means even a trivial dispatch is never free.

## Phase 2: Three-Department Loop (Per-Parent-Session Budget)

The three-department nested loop changes the cost geometry significantly. Each parent session (emperor, chancellor) gets its own independent ≤8 budget — the chancellor's subtree does not consume the emperor's budget:

| Request Stage | Sessions | Cumulative |
|---------------|----------|------------|
| Emperor triage | 1 | 1 |
| Chancellor orchestrate | 1 | 2 |
| Drafter draft (round 1) | 1 | 3 |
| Reviewer verdict (round 1) | 1 | 4 |
| Drafter revision (round 2) | 1 | 5 |
| Reviewer verdict (round 2) ← pass | 1 | 6 |
| Finalizer finalize | 1 | 7 |
| Jinyiwei execute × N | 1-3 | 8-10 |

### Budget Math

- **`maxTotalSessionsPerRequest` set to 8** (Phase 2 value)
- The budget counts sessions per direct parent session: the emperor's subtree (emperor + chancellor dispatch + any siblings) is capped at ≤8, and the chancellor's subtree (chancellor + drafters + reviewers + finalizer + jinyiwei) is independently capped at ≤8
- The chancellor's own loop iteration cap (≤3 rounds via `continue_max`) is the **inner bound** preventing runaway within a single dispatch
- The `maxTotalSessionsPerRequest=8` is the **outer safety net** — if the loop somehow exceeds expectations, the per-parent budget stops it cleanly
- Worst-case (chancellor subtree): 1 chancellor + 5 drafter/reviewer rounds + 1 finalizer + 1 jinyiwei = 8 sessions (hits the cap)
- Typical case (chancellor subtree): 1 chancellor + ~3 drafter/reviewer rounds + 1 finalizer = 6 sessions (under budget)
- **Why 8 and not higher**: 8 accommodates the worst-case three-department loop plus jinyiwei headroom, while still preventing unbounded per-parent trees. A higher number would weaken the safety-net purpose.

### Interaction with Existing Layers

- Layer 1 (DIRECT default) unchanged
- Layer 2 (`maxActivePerParent: 2`, `maxConcurrent: 5` per-model pool) unchanged
- Layer 3: ceiling ≤8 per direct parent session
- New: chancellor's `continue_max: 3` per-loop cap serves as Layer 2.5 — an inner bound between per-session concurrency and per-parent-session budget

### Model Pool Layout

| Model | Used By | Semaphore Pool |
|-------|---------|----------------|
| `provider/tier-1-flagship` | Emperor | independent 5-slot |
| `provider/tier-2-reasoning` | Chancellor, Drafter, Reviewer, Finalizer, UI, Backend, Test | independent 5-slot |
| `provider/tier-3-fast` | Jinyiwei | independent 5-slot |

Each model pool has its own `maxConcurrent: 5` semaphore. Cross-pool dispatch does not compete for the same slots.
