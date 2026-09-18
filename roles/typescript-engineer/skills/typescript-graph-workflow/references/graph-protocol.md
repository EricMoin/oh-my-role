# rolebox graph protocol

These contracts follow rolebox's graph tool interfaces and execution paths. The active
runtime's tool schema is authoritative if its version differs. No shell command substitutes
for calling the engine's graph tools during role execution.

## Signals carry control flow

| Node mode | Completion signal | Meaning |
|---|---|---|
| Change application | answer | Requested edit and its local checks are recorded; independent review follows |
| Evidence/investigation | answer | Investigation completed and its observations are available, including negative evidence |
| Review/synthesis | answer | Required evidence supports acceptance; no unresolved required finding |
| Review with a repair back-edge | revise_needed | Concrete correctable defects, with actionable items |
| Any worker unable to fulfill its task | escalate | Missing environment/input or scope conflict prevents completion |
| Declared approval-proposal gate | need_approval | Concrete proposal ready; action has not run |

Before the terminal/pausing signal, write a concise report for downstream consumption:
scope and source state, changed files if applicable, commands and outcomes, observations,
artifact paths and verification gaps. Then emit an explicit signal with a compact payload.
Do not rely on the engine inferring answer when a worker stops speaking.

Use `signal({type: "revise_needed", payload: {items: [{id, file, problem, required_change,
evidence}]}})` for a repairable review failure. IDs should remain stable across rounds.
The engine reads top-level nonempty `items`, `findings` or `unresolved` in an answer payload
as unresolved work in a loop, and can downgrade it to revision. Therefore evidence reports
use `{assessment: "pass" | "fail" | "partial", observations: [...], checks: [...]}`;
only review nodes produce the routing verdict. This is data/control separation, not a way
to hide failure: final review must inspect every negative/partial report.

A read-only review without a repair loop returns its findings as an investigation report;
do not emit revise_needed into a graph with nowhere to repair. Report inability to assess
required claims as a blocker, not as an affirmative verdict.

## Approval is a proposal followed by an action

`needs_approval: true` does not make a node's code safe to execute. The engine pauses when
that node emits `need_approval`. On `graph_approve(..., action: "approve")`, it completes
the blocked node and activates forward answer edges; it does not resume that worker to
perform the proposed action.

For a requested external action that needs a user decision:

1. Complete implementation, verification and a concrete action proposal first.
2. Run a source-read-only `approval-proposal` node with `needs_approval: true`. It names
   the exact artifact, destination/version, command and material irreversible effects,
   emits `need_approval`, and performs no external mutation.
3. Connect its answer edge to a separate change-applier node containing that exact action.
   That node verifies that the artifact/scope still matches the approved proposal before
   executing. If it differs, escalate rather than silently publishing something else.
4. Present the concrete proposal on the blocked notification and call `graph_approve` only
   from the user's applicable decision. A rejected gate outside a loop escalates and must
   not activate the action; keep this gate outside the implementation repair loop.

Already-authorized actions need no duplicate user question. A request to prepare a package
without publishing does not need a dormant publication branch. Ordinary local manifest,
dependency and declaration changes need no human gate solely because of their file type.
Unexpected authorization needs stop the affected worker before mutation; it escalates so
the parent can prepare a proper gate. A stray `need_approval` from a node not declared with
`needs_approval` is not a reliable pause mechanism.

## Engine completion and recovery

`graph_run` is non-blocking. Yield after launch and resume from notifications. Inspect node
outputs and errors: a fully settled graph can still contain exhausted loops or escalation.
On a transient environment problem resolved by the user/environment, retry the affected
node using the live tool schema and inspect downstream invalidation. Do not use manual
retry to conceal exhausted review cycles or repeat an external side effect with unknown
outcome. Diagnose and reconcile that outcome first.

Do not mutate a running graph's topology as a substitute for handling its results. Cancel
superseded work before constructing a replacement; carry forward observed failures and
remaining budgets rather than resetting them silently.

## Source locations for maintenance

In a rolebox checkout, verify protocol changes against:

- `src/graph/tools/graph-tools.ts`: GraphAddNodeArgs, GraphAddLoopArgs, GraphRunArgs,
  GraphStatusArgs and GraphApproveArgs.
- `src/graph/engine/engine-advance.ts`: pause/approve paths and downstream activation.
- `src/graph/engine/join-evaluator.ts`: fan-in and revision-edge root discovery.
- `src/graph/engine/loop-group-executor.ts`: convergence and unresolved answer payloads.
- `src/graph/engine/signal-propagation.ts`: repair traversal/staleness and invalidation.
- `src/loader/role-loader.ts` and `src/resolver/skill-resolver.ts`: child discovery,
  inheritance and skill resolution.

The companion contract tests use these real modules with scripted node signals. They
verify topology/runtime semantics, not model judgment or real package publication.
