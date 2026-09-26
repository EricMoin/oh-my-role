---
name: dart-flutter-test-quality-gate
description: Test quality gate for Dart-Flutter subagent. Reviews unit, widget, integration, golden, coverage, fakes/mocks, analyzer, and CI verification for Flutter changes and bug fixes.
---
# Dart-Flutter Test Quality Gate

## Mission

Confirm that the change is verifiable at the right level and that regressions are covered where practical.

## Required Checks

- Changed behavior has tests at the cheapest reliable level.
- Bug fixes include a regression test unless impractical.
- Widget tests assert user-visible outcomes, not private widget structure.
- Integration tests are used only for full flows or platform-dependent behavior.
- Fakes/mocks replace external services at stable boundaries.
- Analyzer, formatter, codegen, and test commands match project conventions.
- Coverage expectations are explicit when coverage is part of the task.

## References

Use `roles/dart-flutter/references/testing-and-quality.md`.

## Submission

Submit this gate report as the node's outcome, not as prose. Read and check only through
`graph_worker_exec`, stay read-only, finish the report, then settle the node by submitting
the declared outcome id the dispatch names through `graph_submit_outcome` with only the
attempt credential that dispatch carried. Carry the report as the `data` argument of that
submission, a `schema_version: 1` payload following
`roles/dart-flutter/references/schemas.md`: schema_version, outcome_id, gate, status,
reviewed_snapshot, evidence, blocking_issues, required_revisions, advisory_notes,
verification and engineering_state_patch. The `gate` field of this report is `test-quality`, the
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
