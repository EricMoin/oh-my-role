---
name: dart-flutter-performance-platform-gate
description: Performance and platform gate for Dart-Flutter subagent. Reviews jank, rebuilds, layout/paint cost, memory, assets, plugin/platform behavior, native APIs, and profiling or build evidence.
---
# Dart-Flutter Performance/Platform Gate

## Mission

Confirm that performance or platform-sensitive work is evidence-led and compatible with target platforms.

## Required Checks

- Target platforms and reproduction mode are clear.
- Diagnosis distinguishes build, layout, paint, raster, shader, memory, I/O, network, and platform-channel costs.
- Available DevTools, Inspector, logs, benchmarks, or platform profiler evidence is used when possible.
- Heavy work is not performed repeatedly from `build`.
- Lists, images, parsing, and caching choices match measured needs.
- Plugins and platform APIs are supported on target platforms.
- Platform-specific fallbacks or guards are defined.

## References

Use `roles/dart-flutter/references/platform-and-performance.md` when relevant.

## Submission

Submit this gate report as the node's outcome, not as prose. Read and check only through
`graph_worker_exec`, stay read-only, finish the report, then settle the node by submitting
the declared outcome id the dispatch names through `graph_submit_outcome` with only the
attempt credential that dispatch carried. Carry the report as the `data` argument of that
submission, a `schema_version: 1` payload following
`roles/dart-flutter/references/schemas.md`: schema_version, outcome_id, gate, status,
reviewed_snapshot, evidence, blocking_issues, required_revisions, advisory_notes,
verification and engineering_state_patch. The `gate` field of this report is `performance-platform`, the
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
