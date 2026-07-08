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

## Output

```md
Gate: Test Quality
Status: pass | fail | needs-user-input
Engineering State Patch:
Evidence:
Blocking Issues:
Required Revisions:
Verification:
Next Gate:
```
