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
emperor (opus-4.6)
├── chancellor [planner] (pro-max)
│   ├── drafter (pro-max)       — produces strategy draft
│   ├── reviewer (opus-4.6)     — audits draft, veto or pass
│   └── finalizer (pro-max)     — produces final_strategy
├── validator (pro-max)         — judges execution reports against acceptance criteria
└── jinyiwei [executor/router] (flash)
    ├── ui (pro-max)            — frontend, components, styling
    ├── backend (pro-max)       — API, services, server logic
    ├── test (pro-max)          — tests, mocking, coverage
    ├── data (pro-max)          — schema, migrations, queries
    ├── docs (pro-max)          — documentation, guides
    └── quality (pro-max)       — lint, format, static analysis
```

The planner subtree runs a three-stage loop: draft a strategy, review it (veto sends it back for revision, up to 3 rounds), then finalize. The executor/router receives individual subtasks and routes each one to exactly one department based on domain keywords. The validator is a dedicated read-only judge: after execution it compares each subtask's report against the strategy's acceptance criteria and returns a per-item pass/revise verdict.

## Live risk gate

When the planner returns a strategy marked `risk: high`, the orchestrator stops and presents the strategy to the user. Execution only proceeds after explicit user approval.

This gate is unconditional. Even in `|auto|` mode, a high-risk strategy still requires user sign-off before dispatch.

Low-risk strategies proceed immediately without confirmation.

## Closed-loop validation

After execution completes, the orchestrator validates results against the original strategy's acceptance criteria. The loop works like this:

1. Collect all execution reports.
2. Dispatch validation to the validator.
3. If verdict is `pass`, synthesize the final answer.
4. If verdict is `revise`, re-dispatch only the failed subtasks directly to the executor (not through the planner or validator). Then re-validate.

Caps prevent infinite loops:

| Cap | Limit |
|-----|-------|
| Strategy subtask count | 5 maximum (≤4 recommended) |
| Revise rounds | 2 maximum, budget permitting |
| Per-parent session budget | 8 (chancellor + N execute + validate + re-dispatches) |

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
| opus-4.6 | `hfai-anthropic/cloudsway-claude-opus-4.6-cache-1M` | Emperor, Reviewer |
| deepseek-v4-pro-max | `hfai/deepseek-v4-pro-max` | Chancellor, Drafter, Finalizer, Validator, UI, Backend, Test, Data, Docs, Quality |
| deepseek-v4-flash | `hfai/deepseek-v4-flash` | Jinyiwei |

The reviewer shares the opus pool with the emperor. Since the emperor is idle while the reviewer runs (it's waiting for the chancellor to return), contention between them is rare.

Per-parent session budget is 8 across all subtrees. See [model-pool-and-budget.md](references/model-pool-and-budget.md) for worst-case session tables and cost patterns.

## End-to-end sequence

A typical complex request flows like this:

1. User sends a multi-step request.
2. Emperor classifies it as complex. Dispatches to the chancellor (planner).
3. Chancellor runs the three-stage loop: drafter produces a strategy, reviewer audits it (veto sends it back, pass advances it), finalizer locks the final strategy.
4. Chancellor returns the `final_strategy` to the emperor. Strategy includes `subtasks[]` with dependency ordering and a `risk` field.
5. If `risk: high`, emperor presents the strategy to the user and waits for approval.
6. Emperor reads the dependency graph. Dispatches depth-0 subtasks (empty dependencies) to jinyiwei — one dispatch per subtask — bounded by `maxActivePerParent: 2` (concurrency) and remaining per-parent budget. Strategies are capped at 5 subtasks so the fan-out fits the 8-session budget; if budget can't cover all runnable subtasks, emperor dispatches lowest-id first and reports the rest as budget-capped.
7. Jinyiwei routes each subtask to the appropriate department (ui, backend, test, etc.). Department executes and returns a structured execution report.
8. As subtasks complete, emperor dispatches newly-unblocked subtasks until all are done.
9. Emperor dispatches validation to the validator with all execution reports.
10. If validation passes, emperor synthesizes a final answer. If it fails, emperor re-dispatches failed subtasks (up to 2 rounds), then synthesizes regardless.
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
| [departments.md](references/departments.md) | All 6 departments with scope, evidence tags, and recommended skills |

## Kernel compatibility

Tested with rolebox v0.13.0. Requires dispatch support (`dispatch`, `dispatch_output`, `dispatch_cancel` tools) and subagent resolution from `subagents/` directories.
