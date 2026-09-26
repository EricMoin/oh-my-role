---
name: flutter-engineering-gate
description: Build a Flutter Engineering brief and route non-trivial work through architecture, UI/layout/accessibility, test-quality, performance/platform, or release gates declared on the rolebox graph v3 outcome protocol. Use before broad feature work, refactors, platform changes, performance work, or release-sensitive Flutter tasks.
---
# Flutter Engineering Gate

## Purpose

Use this skill to keep larger Flutter work deliberate without slowing down small edits. It creates a shared Engineering brief, selects specialist gates, and records verification requirements.

## Load References

- For the Engineering brief fields and the gate report payload, read `roles/dart-flutter/references/schemas.md`.
- For the canonical v3 declaration, the accepted-outcome transport and the bounded repair rule, read `roles/dart-flutter/references/graph-protocol.md`.
- For gate-specific checks, read only the relevant guide in `roles/dart-flutter/references/`.

## Workflow

- [ ] Decide whether the task is trivial. If it is a small focused edit with low blast radius, use the relevant skill and skip gate review entirely.
- [ ] For non-trivial work, inspect project facts: `pubspec.yaml`, SDK constraints, platforms, package layout, analysis options, state management, routing, codegen, tests, and CI/release conventions.
- [ ] Create or update the Engineering brief and embed it in every node prompt.
- [ ] Run only the gates needed by the risk as independent ROOTS of ONE v3 declaration, submitted with a single `graph_declare({declaration: {...}})` call — one node per gate (max 5), with `agent` = `dart-flutter--{gate}` and the node ids `architecture`, `ui-layout`, `test-quality`, `performance-platform`, `release`; every node declares the outcomes `pass`, `revise` and `escalate` with `completion: {mode: "explicit"}` and `budget: {timeout_ms: 300000}`. Keep `edges` empty and declare `inputs`/`join` only for a real evidence dependency. Never author `max_retries` or `loop_groups`, there is no dry run, and never use the task tool or the deprecated `dispatch` tool.
  - Architecture: feature structure, state ownership, data boundaries, persistence, dependency injection, or refactors.
  - UI/Layout/A11y: screens, widgets, constraints, interactions, forms, semantics, text scaling, or adaptive layout.
  - Test Quality: bug fixes, regression coverage, test strategy, coverage, mocks/fakes, or CI commands.
  - Performance/Platform: jank, rebuilds, memory, assets, plugins, native APIs, platform behavior, or build diagnostics.
  - Release: flavors, permissions, signing, packaging, store release, or CI deployment.
- [ ] Inspect the `graph_declare` result: the persisted plan AND `start.kind`. `started` and `resumed` are real dispatch; `saved`, `blocked` and `refused` are not. Then end the turn and yield for GRAPH COMPLETE / GRAPH BLOCKED.
- [ ] Collect accepted gate reports once with `graph_status({graph_id, scope: "all", format: "json", include_output: true, include_history: true})`, reading `attempts[].accepted` for the outcome identity and `attempts[].result` for the report.
- [ ] If a gate settles `revise`, repair the work and declare a FRESH batch for the updated snapshot — at most two substantive repair/re-review rounds per design. A settled graph is not acceptance.
- [ ] Finalize with the verification commands that fit the project.

## Outcome Rules

Each gate settles a declared outcome id — `pass`, `revise` or `escalate` — and that id is separate from the gate report `status` (`pass`, `fail`, `needs-user-input`): a `pass` report settles `pass`, a `fail` with concrete blockers settles `revise` carrying stable `required_revisions`, and `needs-user-input` settles `escalate` with the smallest missing question.

- `pass`: no supported blocking issue in the assigned scope; implementation can proceed or the final answer can ship.
- `revise`: a correctness, maintainability, platform, accessibility, or verification issue must be fixed first.
- `escalate`: product intent or platform/release facts are missing and cannot be discovered locally.
- Only an accepted decision (verdict committed or replayed, with no refusals) settles a node; a refusal writes nothing, so repair the payload or the missing evidence and resubmit.
