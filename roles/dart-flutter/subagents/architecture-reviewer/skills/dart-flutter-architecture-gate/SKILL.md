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

## Report and judgment

Stay within the assigned read-only review scope. Use the gate report in
`references/schemas.md` with `gate: architecture` and cite the evidence supporting each finding.

This gate settles `pass`, `revise` or `escalate` — `escalate` when essential evidence or user
intent is unavailable, never a fabricated pass. The report `status` stays closed over
`pass | fail | needs-user-input` per `roles/dart-flutter/references/schemas.md`, and the
settled outcome id is a separate field of the submission: a `pass` report settles `pass`, a
`fail` with concrete blockers settles `revise` carrying stable `required_revisions`, and
`needs-user-input` settles `escalate` with the smallest missing question or recovery action.
