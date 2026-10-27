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

## Report and judgment

Stay within the assigned read-only review scope. Use the gate report in
`references/schemas.md` with `gate: performance-platform` and cite the evidence supporting each finding.

This gate settles `pass`, `revise` or `escalate` — `escalate` when essential evidence or user
intent is unavailable, never a fabricated pass. The report `status` stays closed over
`pass | fail | needs-user-input` per `roles/dart-flutter/references/schemas.md`, and the
settled outcome id is a separate field of the submission: a `pass` report settles `pass`, a
`fail` with concrete blockers settles `revise` carrying stable `required_revisions`, and
`needs-user-input` settles `escalate` with the smallest missing question or recovery action.
