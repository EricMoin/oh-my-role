# Flutter Performance Guide

Use this guide for jank, slow startup, rebuild storms, large lists, assets, memory, or platform runtime issues.

## Diagnosis Order

- Reproduce in profile mode when possible.
- Identify the symptom: build, layout, paint, raster, shader, memory, I/O, network, or platform channel.
- Use available tooling: DevTools timeline, Flutter Inspector, performance overlay, logs, benchmarks, screenshots, or platform profilers.
- Measure before and after for non-trivial optimizations.

## Checks

- Keep expensive work out of `build`.
- Use lazy lists for large collections.
- Avoid rebuilding broad subtrees for small state changes.
- Size and cache images intentionally.
- Move heavy parsing or CPU work off the UI isolate only when profiling shows cost.
- Prefer targeted fixes over speculative optimization.
