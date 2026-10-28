# Rust Engineer behavioral regression scenarios

[scenarios.json](scenarios.json) specifies manual/session trials. It is not an automated
grader or a record of passing model sessions. The graph-contract tests use stubbed
worker decisions and cannot prove model skill loading, code quality or Rust behavior.

## Exercise a scenario

1. Prepare an isolated disposable fixture from setup, including real source, pinned
   versions and diagnostics. Confirm the motivating failure exists before a repair.
2. Start a fresh session with the repository's current role definition and the natural
   prompt. Keep evaluator acceptance/failure signals out of the worker's task context.
3. For staged events, use actual runtime reports and check outputs. Clearly label any
   recorded exercise material; never impersonate a live tool result.
4. Inspect the transcript, skill-content reads, graph declarations and actual starts,
   accepted attempt inputs/reports, final diff and checks. A report claiming a skill was
   loaded is insufficient without the actual read. The parent should research and
   compose the graph; domain workers implement and repair inside their scopes.
5. Record pass, fail, inconclusive or not-run with evidence. Missing fixtures, runtime
   capability or transcript makes the relevant behavioral observation inconclusive.

Record role/fixture revisions and diffs, model/host configuration, tools, dependency
versions, transcript location, actual commands and results. Setups are fixture
specifications, not bundled executable Rust projects. No full model trial is run by
adding or parsing a scenario. Run provider-backed evaluations only within the user's
authorized scope; this repository change does not deploy the role or launch paid runs.

## What to observe

Mechanical edits use a scoped domain node. Behavior changes use the relevant specialist
implementation, independent verification and bounded repair loop. Expert choice and
parallelism follow actual responsibilities and dependencies, not fixed domain quotas or
keywords. General safe Rust and regression quality remain covered. Check that workers
read their own implementation/review guidance, since parent skills do not inherit.
Implementation and review use distinct node IDs, distinct role IDs and separate sessions.
Domain reviewers own gate skills and never repair findings; implementers never serve as
independent evidence producers or reviewers. Review does not inherit the author's
conversation or an expected verdict.

Graph scenarios require real runtime evidence for start, input delivery, fresh attempts,
loop caps and accepted outcomes. Essential partial evidence never approves behavior.
Only one convergence node routes repairs; the parent does not patch source between runs.
Missing graph execution permits useful read-only investigation, not parent implementation.

The scenarios also retain technical cases for temporary-owner lifetimes, task shutdown,
Cargo host/target selection, risk false positives/negatives, stable snapshots and research
stopping. Validate those against pinned fixture versions and actual diagnostics. Tool
success and source observations cover their tested configuration, not universal soundness.

## Runtime protocol checks

From the repository root:

```sh
ROLEBOX_ROOT=/path/to/rolebox node scripts/test-runtime-contracts.mjs roles/rust-engineer/tests/graph-contract.test.js
```

These tests load the actual twelve expert roles and their assets, compile every shipped
graph shape and exercise scheduling, serial expert handoff, accepted feedback, evidence
fan-in, fresh post-repair reports, negative terminal outcomes and loop exhaustion. The
worker dispatch is stubbed. Passing establishes protocol compatibility with the tested
runtime; it does not establish that a model chooses experts well or fixes a Rust fixture.
