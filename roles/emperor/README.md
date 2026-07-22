# Emperor

Top-level orchestrator that classifies incoming requests, dispatches work to a planner or executor subtree, and synthesizes results into a final answer. It never writes code, edits files, or plans implementation details.

## When to use

Use this role when you need multi-step orchestration across different domains (frontend, backend, testing, data, docs, quality). It handles complex workflows that require strategy before execution, dependency-ordered subtask scheduling, risk assessment, and validation loops.

Don't use it for simple single-turn tasks. A direct answer, a quick lookup, or a single-file edit doesn't need orchestration overhead.

## Architecture: classify, dispatch, synthesize

The emperor operates on a three-action loop:

1. **Classify** the incoming request (simple? complex? destructive?)
2. **Dispatch** to the appropriate subtree (planner for strategy, executor for implementation)
3. **Synthesize** execution reports into a user-facing final answer

The orchestrator never touches implementation. It reads, it routes, it summarizes. That's it.

## Topology

```
emperor (tier-1-flagship)
├── chancellor [planner] (tier-2-reasoning)
│   ├── drafter (tier-2-reasoning)       — produces strategy draft
│   ├── reviewer (tier-1-flagship)     — audits draft, veto or pass
│   └── finalizer (tier-2-reasoning)     — produces final_strategy
├── validator (tier-2-reasoning)         — judges execution reports against acceptance criteria
└── jinyiwei [executor/router] (tier-3-fast)
    ├── ui (tier-2-reasoning)            — frontend, components, styling
    ├── backend (tier-2-reasoning)       — API, services, server logic
    ├── test (tier-2-reasoning)          — tests, mocking, coverage
    ├── data (tier-2-reasoning)          — schema, migrations, queries
    ├── docs (tier-2-reasoning)          — documentation, guides
    ├── quality (tier-2-reasoning)       — lint, format, static analysis
    ├── devops (tier-2-reasoning)        — CI/CD, infrastructure, deployment
    └── security (tier-2-reasoning)      — vulnerability scanning, auth audit
```

The planner subtree runs a three-stage loop: draft a strategy, review it (veto sends it back for revision, up to 3 rounds), then finalize. The executor/router receives individual subtasks and routes each one to exactly one department based on domain keywords. The validator independently verifies execution reports by running tests, builds, and linters, then returns a per-item pass/revise verdict.

## Live risk gate

When the planner returns a strategy marked `risk: high`, the orchestrator stops and presents the strategy to the user. Execution only proceeds after explicit user approval.

This gate is unconditional. Even in `|auto|` mode, a high-risk strategy still requires user sign-off before dispatch.

Approval is a two-turn handshake: the orchestrator re-prints the full strategy and waits; the next user message is read as an approval response — approve, reject (which cancels any running tasks), or partial ("skip subtask 3", which drops that subtask and its dependents). The orchestrator recovers the pending strategy from its own conversation history, so no external state is needed. Destructiveness discovered at execution time is routed back through this same gate.

Low-risk strategies proceed immediately without confirmation.

## Closed-loop validation

After execution completes, the orchestrator validates results against the original strategy's acceptance criteria. The loop works like this:

1. Collect all execution reports.
2. Dispatch validation to the validator.
3. If verdict is `pass`, synthesize the final answer.
4. If verdict is `revise`, retry each failed subtask via `dispatch_retry(task_id)` — one per executor session, in dependency-root order — directly to the executor (not through the planner or validator). Falls back to a fresh `dispatch` when the original `task_id` is unavailable. Then re-validate once.

Caps prevent infinite loops:

| Cap | Limit |
|-----|-------|
| Strategy subtask count | 10 maximum (≤8 recommended, ≤7 to retry more than one failure) |
| Revise rounds | 2 maximum, budget permitting |
| Retries per round (via dispatch_retry) | one session per failed item (never batched) |
| Per-parent session budget | 20 (chancellor + N execute + validate + per-item retries) |

Because each failed item is retried in its own isolated session, a revise round costs `F + 1` sessions (F failed items + one revalidate). Wider plans therefore afford fewer retries — a deliberate trade of breadth for per-item focus. See [model-pool-and-budget.md](references/model-pool-and-budget.md).

Validation only runs on the plan-execute path. Direct answers skip it entirely.

## Safety precedence

Before any dispatch decision, constraints are evaluated in this fixed order:

1. **destructive** — Request matches a destructive pattern (delete, drop, force-push, migration, etc.)? Requires plan, then user approval, then execute. No exceptions.
2. **effort** — `|plan|` mode active? Forces plan-then-approve-then-execute regardless of complexity.
3. **mode** — `|auto|` active? Classify and dispatch without confirmation (unless destructive).
4. **default** — Orchestrator decides: simple gets a direct answer, complex gets the planner.

When unsure whether something is destructive, treat it as destructive.

## Model pools

Three independent pools, each with a 5-slot semaphore. Cross-pool dispatch doesn't compete for slots.

| Pool | Model | Members |
|------|-------|---------|
| tier-1-flagship | `provider/tier-1-flagship` | Emperor, Reviewer |
| tier-2-reasoning | `provider/tier-2-reasoning` | Chancellor, Drafter, Finalizer, Validator, UI, Backend, Test, Data, Docs, Quality, DevOps, Security |
| tier-3-fast | `provider/tier-3-fast` | Jinyiwei |

The reviewer shares the tier-1-flagship pool with the emperor. Since the emperor is idle while the reviewer runs (it's waiting for the chancellor to return), contention between them is rare.

Per-parent session budget is 20 across all subtrees. See [model-pool-and-budget.md](references/model-pool-and-budget.md) for worst-case session tables and cost patterns.

## End-to-end sequence

A typical complex request flows like this:

1. User sends a multi-step request.
2. Emperor classifies it as complex. Dispatches to the chancellor (planner).
3. Chancellor runs the three-stage loop: drafter produces a strategy, reviewer audits it (veto sends it back, pass advances it), finalizer locks the final strategy.
4. Chancellor returns the `final_strategy` to the emperor. Strategy includes `subtasks[]` with dependency ordering and a `risk` field.
5. If `risk: high`, emperor presents the strategy to the user and waits for approval.
6. Emperor reads the dependency graph. Dispatches depth-0 subtasks (empty dependencies) to jinyiwei — one dispatch per subtask — bounded by `maxActivePerParent: 3` (concurrency) and remaining per-parent budget. Strategies are capped at 10 subtasks so the fan-out fits the 20-session budget; if budget can't cover all runnable subtasks, emperor dispatches lowest-id first and reports the rest as budget-capped.
7. Jinyiwei routes each subtask to the appropriate department (ui, backend, test, etc.). Department executes and returns a structured execution report.
8. As subtasks complete, emperor dispatches newly-unblocked subtasks until all are done.
9. Emperor dispatches validation to the validator with all execution reports.
10. If validation passes, emperor synthesizes a final answer. If it fails, emperor retries failed subtasks one per session via `dispatch_retry` (up to 2 rounds, budget permitting), then synthesizes regardless.
11. Emperor emits a `final_answer` fence. Always. Even on partial failure.

## Extension guide

To add a new department:

1. Create `subagents/jinyiwei/subagents/{name}/` with a `role.yaml`, execution function, report function, and scope skill.
2. Register it in the jinyiwei domain-routing keyword table.
3. Add a row to the department registry.

Full instructions and existing department definitions are in [departments.md](references/departments.md).

## Reference documents

| Document | What it covers |
|----------|---------------|
| [schemas.md](references/schemas.md) | Inter-agent contract schemas (strategy, review verdict, validate result, execution report) |
| [terminology-and-style.md](references/terminology-and-style.md) | De-theming glossary, language rules, style guide |
| [model-pool-and-budget.md](references/model-pool-and-budget.md) | Three model pools, budget caps, worst-case session tables, dispatch config |
| [departments.md](references/departments.md) | All 8 departments with scope, evidence tags, and recommended skills |

## Kernel compatibility

Requires rolebox dispatch subsystem and subagent resolution from `subagents/` directories.
