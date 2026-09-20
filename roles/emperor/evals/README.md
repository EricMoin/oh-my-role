# Evaluation and decision review

These are behavioral specifications, not recorded model results. The current set
contains 45 cases in 8 target groups and 6 multi-turn scenarios. It restores useful
failure, scope and recovery coverage without asserting a fixed agent chain.

## Decisions checked against counterexamples

| Decision | Counterexample that must remain supported | Evidence |
|---|---|---|
| Keep direct domain dispatch | Six known documentation edits should not require a planner/router | large-known-change; real loader resolves all departments |
| Select planning by uncertainty | One reversible shared-interface change may still warrant review | low-risk-shared-interface-review |
| Preserve independent acceptance | A one-line change or confident worker report is not a Validator verdict | worker-proof-is-not-independent; real resolver retains Validator |
| Require explicit execution outcomes | A partial result fence must not satisfy a function's completion predicate | real rolebox condition evaluator checks every worker and Validator |
| Escalate incomplete reports | A failed required check must not release answer-only consumers | real dispatch status mapping and graph engine regression test |
| Separate continuation from repair | Several approvals must not exhaust defect recovery | runtime continuation graph test; continuations-do-not-spend-repairs |
| Record finite task-specific limits | A fixed two-round ceiling need not fit every task; graph recreation must not reset the chosen limit | task-specific-repair-limit; renaming-repair-is-not-continuation |
| Reuse only unaffected independent evidence | A changed shared config invalidates an earlier pass | reuse-unaffected-independent-check; uncertain-impact-reruns |
| Resolve the actual blocker | Graph need_approval may represent a clarification pause | real dispatch status mapping test; normalized-blocker-is-not-consent |

The review keeps planning, review and finalization conditional. It retains scope,
authorization, explicit failure reporting and independent acceptance. Task-specific
checks replace unconditional LSP/test requirements for prose. Style guidance links
to the behavioral authorities instead of maintaining a conflicting second policy.

## What the automated tests establish

`scripts/tests/emperor-rolebox.test.ts` loads this role through the sibling rolebox
loader/resolver, evaluates real function conditions, dry-runs the graph templates,
and drives real graph transitions with a fake dispatch port. Python mutation tests
check discovery, tools, skill registration and generated-copy drift. These tests
do not launch LLM workers or demonstrate that models follow every instruction.

Role-authored reports and revision counters remain protocol contracts. rolebox does
not validate an Execution Report's acceptance evidence before scheduling an answer
edge. Explicit outcomes, consumer preconditions and independent validation reduce
that exposure; they are not a new engine-enforced payload validator. Do not claim
that a malformed answer is mechanically impossible or that two prompts prove a
performance gain.

## Live comparison protocol (not run)

Compare baseline `9b7d9871af70d9ab26bbb946923add8172d16e69` with the candidate on
identical disposable repository fixtures, model/runtime configuration and budgets.
Confirm that the intended role/subagent and this checkout's assets are loaded for
each target; merely copying files into a CLI config is insufficient evidence.

Start with clear-change, large-known-change, low-risk-shared-interface-review,
incomplete-work-non-success, runtime-approval-continuation,
approval-continuation-followed-by-repair and uncertain-impact-reruns. Seed the
specified graph/approval state and use test resources for external operations.
Keep actual prompts, signals, graphs, workspace diffs and check outputs. Run paired
repetitions to distinguish model variance from an actual change.

Measure independently verified completion, scope/authorization violations, stale
evidence reuse, duplicate effects, repair sessions, dispatch count, wall time and
tokens. Quality regressions disqualify latency savings. Report failures and missing
measurements, and distinguish engine tests, authored cases and actual model runs.
