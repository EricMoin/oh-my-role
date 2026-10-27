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

## Report and judgment

Stay within the assigned read-only review scope. Use the gate report in
`references/schemas.md` with `gate: ui-layout` and cite the evidence supporting each finding.

This gate settles `pass`, `revise` or `escalate` — `escalate` when essential evidence or user
intent is unavailable, never a fabricated pass. The report `status` stays closed over
`pass | fail | needs-user-input` per `roles/dart-flutter/references/schemas.md`, and the
settled outcome id is a separate field of the submission: a `pass` report settles `pass`, a
`fail` with concrete blockers settles `revise` carrying stable `required_revisions`, and
`needs-user-input` settles `escalate` with the smallest missing question or recovery action.
