---
name: model-pool
description: Model pool configuration — three independent pools (tier-1-flagship, tier-2-reasoning, tier-3-fast) each with a 5-slot semaphore
---

# Model Pool

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
- **tier-2-reasoning pool**: All strategy, validation, and execution agents (chancellor subtree, the validator, plus all six jinyiwei departments). Dispatch concurrency within the pool is engine-managed (frontier scheduling); the pool's independent 5-slot semaphore bounds how many tier-2 sessions run concurrently across all parents.
- **tier-3-fast pool**: Jinyiwei alone, used for domain routing and simple execution. tier-3-fast is cheap and fast; the pool exists so jinyiwei sessions never compete with tier-2-reasoning strategy work.

## Reviewer on tier-1-flagship Pool — Rationale

### Why Reviewer Runs on tier-1-flagship

The reviewer runs on `tier-1-flagship`, a distinct and stronger model than the `tier-2-reasoning` drafter it audits (see `subagents/chancellor/subagents/reviewer/role.yaml`). A meaningful veto requires an independent model that can catch flaws the drafter's own model would miss — an audit not limited by the drafter's model ceiling.

### Cost Impact

Tier-1-Flagship is more expensive per token than tier-2-reasoning. However:

- Reviewer runs are bounded by the chancellor convergence loop's `max_traversals`. Closed-loop validation is handled by the separate Validator (tier-2-reasoning pool), so it does NOT consume the tier-1-flagship pool. The total reviewer token spend per request is bounded and deterministic.
- While reviewer occupies a tier-1-flagship slot, the emperor is idle (waiting for chancellor to return). No additional tier-1-flagship concurrency is consumed.
- tier-1-flagship pool concurrency stays at or below 2 (emperor + reviewer), safe within the 5-slot semaphore.
- The review-round procedural cap (the convergence loop's `max_traversals`) remains unchanged.

### Session Bounds

- Chancellor convergence loop: review rounds bounded by the loop group's `max_traversals` (procedural cap), each consuming one reviewer session.
- Closed-loop validate: revise rounds bounded by qualitative termination (pass verdict, stalled progress, engine rejection, or validate failure), each round with one Validator call. The Validator runs on the tier-2-reasoning pool and never invokes the reviewer.

## Procedural Caps

| Cap | Value | What It Limits |
|---|---|---|
| Retries per round (via graph_run retry) | 1 `graph_run(node_id, retry=true)` re-run per failed node (+ dependents) | Each failed node re-run in its own isolated session, dependency-root order |

The revise loop itself is bounded by qualitative termination (a `pass` verdict, stalled progress, engine rejection, or validate failure) with the loop group's `max_traversals` as the engine-side backstop.

## Orchestration Configuration Reference

The legacy `dispatch:` block (parent-scoped concurrency ceiling, `maxConcurrent`, `syncPromptTimeoutMs`, `backgroundStaleTimeoutMs`) was **removed** in the Phase C graph-engine migration. Orchestration now runs on the graph engine:

- **Concurrency** is engine-managed (the graph dispatches `ready` nodes within its frontier; no parent-scoped concurrency hand-tuning).
- **Per-node timeouts / retries** are carried on `graph_add_node(…, timeout_ms, max_retries)`.
- **Stale/orphaned nodes** are handled by the engine (vanished task → `timeout`/`escalate`) and reclaimed with `graph_cancel(graph_id, node_id?)`.

Resource ceilings, if any, are owned and enforced by the rolebox plugin/engine, not by prompt-level accounting.

## Cost Defense: Why DIRECT Is the Default

Every graph node spawns a subagent session that consumes tokens for context loading, tool calls, and reasoning. A DIRECT response uses zero additional sessions — the emperor answers inline, paying only its own generation cost. Roughly 80% of incoming requests need a single focused answer, not orchestration. Routing those through the graph wastes tokens on session overhead that produces no extra value. DIRECT is the cheap path; graph orchestration is the expensive path. Choose expensive only when the work genuinely requires a separate execution context.

Two layers of cost defense keep spend bounded:

1. **Default DIRECT.** If a request can be answered without spawning children, it is. Covers questions, read-only lookups, research, and anything the emperor's own read-only tools can satisfy. A request that modifies files — even one line — is a single jinyiwei graph node, not DIRECT.
2. **Engine-managed concurrency.** The graph engine bounds how many `ready` nodes dispatch concurrently (frontier scheduling), preventing fan-out storms from exceeding a bounded cost envelope per time-slice.

This document is the single authoritative source for the model pool topology and procedural caps.
