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

## Output

```md
Gate: Performance/Platform
Status: pass | fail | needs-user-input
Engineering State Patch:
Evidence:
Blocking Issues:
Required Revisions:
Verification:
Next Gate:
```
