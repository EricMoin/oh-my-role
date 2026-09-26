---
name: model-pool
description: Model-tier assignments and orchestration cost policy
---
# Model tiers

| Tier | Roles |
|---|---|
| provider/tier-1-flagship | Emperor, Reviewer |
| provider/tier-2-reasoning | Chancellor, Drafter, Finalizer, Validator, eight departments |
| provider/tier-3-fast | Jinyiwei, Approval |

These are configurable model identifiers, not declarations of semaphore capacity.
Actual concurrency and resource limits belong to the rolebox runtime configuration.
Do not promise five slots or independent pools without inspecting that configuration.

Reduce overhead by answering read-only questions directly, dispatching known domains
to workers without a router session, and using review/finalization only when needed.
A clear implementation still requires independent validation. Keep cohesive changes
together; split genuinely independent concerns and serialize conflicting writers.

Repair budgets and separate continuation counters follow graph-protocol.md.
Run budget.max_executions bounds attempts in one run, not repairs across new graphs.
Honor engine budget/capacity rejection and report unresolved work. Never claim a
fixed token/cost bound merely from the number of stages.
