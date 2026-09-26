---
name: dart-flutter-ui-layout-gate
description: UI, layout, and accessibility gate for Dart-Flutter subagent. Reviews widgets, constraints, responsive/adaptive behavior, semantics, focus, text scaling, forms, and interaction states.
---
# Dart-Flutter UI/Layout Gate

## Mission

Confirm that the proposed UI behaves correctly across constraints, inputs, and accessibility modes.

## Required Checks

- Layout decisions use constraints, not device names.
- Scrollables, flex children, overlays, and forms have bounded constraints.
- Empty, loading, error, success, disabled, and maximum-content states are covered when relevant.
- Text scales without clipping critical content.
- Important controls have names, focus behavior, and reachable input paths.
- Color is not the only state signal.
- Navigation, gestures, and keyboard behavior match platform expectations.
- Widget tests or golden/screenshot tests are identified when useful.

## References

Use `roles/dart-flutter/references/ui-and-accessibility.md`, `platform-and-performance.md`, and `testing-and-quality.md` when relevant.

## Submission

Submit this gate report as the node's outcome, not as prose. Read and check only through
`graph_worker_exec`, stay read-only, finish the report, then settle the node by submitting
the declared outcome id the dispatch names through `graph_submit_outcome` with only the
attempt credential that dispatch carried. Carry the report as the `data` argument of that
submission, a `schema_version: 1` payload following
`roles/dart-flutter/references/schemas.md`: schema_version, outcome_id, gate, status,
reviewed_snapshot, evidence, blocking_issues, required_revisions, advisory_notes,
verification and engineering_state_patch. The `gate` field of this report is `ui-layout`, the
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
