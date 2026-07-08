---
name: flutter-engineering-gate
description: Build a Flutter Engineering State and route non-trivial work through architecture, UI/layout/accessibility, test-quality, performance/platform, or release gates. Use before broad feature work, refactors, platform changes, performance work, or release-sensitive Flutter tasks.
---
# Flutter Engineering Gate

## Purpose

Use this skill to keep larger Flutter work deliberate without slowing down small edits. It creates a shared Engineering State, selects specialist gates, and records verification requirements.

## Load References

- For state shape, read `roles/dart-flutter/references/templates/engineering-state.md`.
- For internal reports, read `roles/dart-flutter/references/templates/gate-report.md`.
- For gate-specific checks, read only the relevant guide in `roles/dart-flutter/references/`.

## Workflow

- [ ] Decide whether the task is trivial. If it is a small focused edit with low blast radius, use the relevant skill and skip subagent dispatch.
- [ ] For non-trivial work, inspect project facts: `pubspec.yaml`, SDK constraints, platforms, package layout, analysis options, state management, routing, codegen, tests, and CI/release conventions.
- [ ] Create or update the Flutter Engineering State.
- [ ] Dispatch only the gates needed by the risk:
  - Architecture: feature structure, state ownership, data boundaries, persistence, dependency injection, or refactors.
  - UI/Layout/A11y: screens, widgets, constraints, interactions, forms, semantics, text scaling, or adaptive layout.
  - Test Quality: bug fixes, regression coverage, test strategy, coverage, mocks/fakes, or CI commands.
  - Performance/Platform: jank, rebuilds, memory, assets, plugins, native APIs, platform behavior, or build diagnostics.
  - Release: flavors, permissions, signing, packaging, store release, or CI deployment.
- [ ] If a gate fails, revise the design or implementation plan before proceeding.
- [ ] Finalize with the verification commands that fit the project.

## Gate Status Rules

- `pass`: implementation can proceed or final answer can ship.
- `fail`: a correctness, maintainability, platform, accessibility, or verification issue must be fixed first.
- `needs-user-input`: product intent or platform/release facts are missing and cannot be discovered locally.
