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

## Report and judgment

Stay within the assigned read-only review scope. Use the gate report in
`references/schemas.md` with `gate: test-quality` and cite the evidence supporting each finding.

This gate settles `pass`, `revise` or `escalate` — `escalate` when essential evidence or user
intent is unavailable, never a fabricated pass. The report `status` stays closed over
`pass | fail | needs-user-input` per `roles/dart-flutter/references/schemas.md`, and the
settled outcome id is a separate field of the submission: a `pass` report settles `pass`, a
`fail` with concrete blockers settles `revise` carrying stable `required_revisions`, and
`needs-user-input` settles `escalate` with the smallest missing question or recovery action.
