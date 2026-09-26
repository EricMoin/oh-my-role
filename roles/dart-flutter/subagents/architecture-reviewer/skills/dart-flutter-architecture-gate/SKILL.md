---
name: dart-flutter-architecture-gate
description: Architecture gate for Dart-Flutter subagent. Reviews feature structure, state ownership, repository/data boundaries, dependency injection, code generation, and maintainability before broad Flutter implementation or refactoring proceeds.
---
# Dart-Flutter Architecture Gate

## Mission

Confirm that the proposed Flutter change fits the existing architecture and does not introduce avoidable coupling.

## Required Checks

- Existing project conventions were inspected and preserved unless intentionally changed.
- UI, presentation state, domain, data, and platform boundaries are clear.
- State has one owner and side effects do not run from widget `build`.
- Repositories/services hide transport, persistence, platform APIs, caching, and retries.
- Dependencies are injectable for tests.
- DTO/domain separation is intentional.
- Code generation choices match local conventions.
- The change avoids unrelated refactors.

## References

Use `roles/dart-flutter/references/flutter-architecture.md`, `references/state-management.md`, and `references/networking-and-data.md` when relevant.

## Submission

Submit this gate report as the node's outcome, not as prose. Read and check only through
`graph_worker_exec`, stay read-only, finish the report, then settle the node by submitting
the declared outcome id the dispatch names through `graph_submit_outcome` with only the
attempt credential that dispatch carried. Carry the report as the `data` argument of that
submission, a `schema_version: 1` payload following
`roles/dart-flutter/references/schemas.md`: schema_version, outcome_id, gate, status,
reviewed_snapshot, evidence, blocking_issues, required_revisions, advisory_notes,
verification and engineering_state_patch. The `gate` field of this report is `architecture`, the
same id as the declared node. Only an accepted decision (verdict committed or replayed, with
no refusals) settles the node; a refusal writes nothing, so repair the payload or the missing
evidence and resubmit. Never declare, control, query or audit graphs and never create child
graphs: the declaring lead session owns orchestration, synthesis, repair and acceptance, and a
settled graph is not acceptance of the reviewed change.

This gate settles `pass`, `revise` or `escalate` — `escalate` when essential evidence or user
intent is unavailable, never a fabricated pass. The report `status` stays closed over
`pass | fail | needs-user-input` per `roles/dart-flutter/references/schemas.md`, and the
settled outcome id is a separate field of the submission: a `pass` report settles `pass`, a
`fail` with concrete blockers settles `revise` carrying stable `required_revisions`, and
`needs-user-input` settles `escalate` with the smallest missing question or recovery action.
