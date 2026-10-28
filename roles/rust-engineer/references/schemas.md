# Node reports (schema_version: 2)

These are role-authored report contracts, not an installed runtime JSON Schema
validator. The engine validates declared outcome identity and delivers accepted
inputs; workers and the parent check report content, snapshot and applicability.
Reject unknown versions and inconsistent kinds/outcomes rather than inferring pass.

## Engineering brief

Every node prompt carries goal, mode, acceptance criteria, workspace and source scope,
snapshot, relevant versions/invariants, skill paths, permitted scratch outputs and
required checks. The full requirements are in [node-contract.md](node-contract.md).
Include only relevant facts. A brief is prompt context, not an outcome report; a
pre-implementation investigation must not claim to review implemented behavior.

## Common evidence

All reports include `schema_version: 2`, `outcome_id`, `loaded_skills`, `verification`
and evidence identifying actual source/artifacts/observations. `loaded_skills` lists
instructions actually read, not catalog entries or planned reading. Verification
records actual command/configuration/results; label unavailable or proposed checks.
Snapshots include committed, dirty and new content, not HEAD alone. Report paths,
versions and target scope sufficiently precisely for a consumer to check applicability.

## Implementation report

| Field | Content |
| --- | --- |
| kind | implementation |
| outcome_id | done, failed, blocked or clarification_required, as declared |
| snapshot | Resulting source/diff/artifact identity |
| changed_files | Files actually modified inside the assigned write scope |
| summary | Behavior delivered and material design/compatibility choices |
| loaded_skills | Entry and applicable implementation/test guidance actually read |
| evidence / verification | Source evidence and actual focused checks with their outcomes |
| revision_context | null initially; on repair the accepted review's source attempt, full issues/required revisions and each issue's current resolution/owner |
| open_questions | Missing evidence, blockers or the smallest unresolved user decision; empty when resolved |

Implementation experts produce only Implementation reports, never independent evidence
or gate verdicts. `done` means the stage returned its assigned work, not acceptance. Do not use done when that stage's required behavior/checks
failed; use failed or blocked with the supported reason. An implementation with
unavailable optional target evidence can finish its narrower scope with explicit limits.
Later specialists consume forwarded revision context rather than assuming all prior
issues were repaired. Do not erase another owner's unresolved issue from that context.
Intermediate implementation snapshots are stage evidence. The final reviewer checks
their continued applicability and verifies the integrated snapshot; it neither rejects
every intermediate report as stale nor treats it as approval of later changes.

## Gate report

| Field | Content |
| --- | --- |
| kind | review |
| outcome_id | pass, revise or escalate, as declared |
| gate | ownership-api, async-concurrency, unsafe-ffi, cargo-platform, performance or verification |
| reviewed_snapshot | Actual final source/diff/artifact inspected |
| loaded_skills | Relevant entry, implementation or gate guidance actually read |
| evidence / verification | Inspected evidence and actual checks, including scope and limits |
| blocking_issues | Concrete failure mechanism with stable id, trigger, consequence and supporting file/source evidence |
| required_revisions | Required outcome for each blocking issue, retaining its id |
| advisory_notes | Nonblocking preferences or optional limits, not hidden defects |

Only dedicated source-read-only review roles or verification issue Gate reports. A writing
expert cannot issue an independent verdict or act as reviewer under a different mode.
Pass requires supported acceptance criteria and no blocking issues. Revise requires
concrete fixable issues and their required outcomes. Escalate identifies essential
unavailable evidence, intent or access and the smallest useful recovery action; it
does not automatically require asking the user. A convergence reviewer owns the only
repair route. Domain evidence nodes do not emit competing repair decisions.

## Evidence report

| Field | Content |
| --- | --- |
| kind | domain-evidence or source-evidence |
| outcome_id | report |
| status | complete or partial |
| reviewed_snapshot | Applicable source/diff/artifact identity |
| question / version_scope | Concrete unknown and relevant compiler/dependency/features/target scope |
| loaded_skills | Guidance actually read to answer the question |
| findings | Claims, supporting citations/observations and limits; distinguish guarantees from inference |
| verification | Checks actually executed, with configuration/results and explicit missing checks |
| open_questions | Remaining uncertainty and the smallest useful next check; empty when answered |

Source-tracer uses source-evidence. Dedicated domain reviewers and investigation synthesis
use domain-evidence. Implementation self-checks stay in Implementation reports and never
substitute for these independent evidence producers. Complete means the assigned question was answered, even when
the answer is negative. Partial preserves essential unknowns. Both settle report;
neither means the product passes. A consumer must reconcile negative/partial evidence
and cannot pass while an essential uncertainty still affects the decision.

## Final reconciliation

Read accepted reports for the intended run and attempts. A complete graph can contain
failed, blocked, revise, escalate or partial evidence. Loop exhaustion stops execution,
not the failure mechanism. Keep unresolved work partial/blocked, preserve issue history
and inspect the actual final snapshot before reporting acceptance.
