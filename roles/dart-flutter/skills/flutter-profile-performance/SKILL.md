---
name: flutter-profile-performance
description: Diagnose and fix Flutter performance problems including jank, rebuild storms, slow layout/paint/raster, expensive JSON parsing, image memory, startup, and platform-channel overhead. Use when profiling, optimizing, benchmarking, or reviewing performance-sensitive changes.
---
# Profiling Flutter Performance

## Diagnosis Workflow

- [ ] Reproduce the symptom and identify target platforms.
- [ ] Prefer profile mode for runtime performance diagnosis.
- [ ] Use available tooling: DevTools timeline, Performance Overlay, Flutter Inspector, logs, benchmarks, platform profilers, or screenshots.
- [ ] Classify the bottleneck: build, layout, paint, raster, shader, memory, I/O, network, or platform channel.
- [ ] Apply one targeted fix.
- [ ] Measure again or document why measurement is unavailable.

## Fix Patterns

- Rebuilds: narrow listeners/selectors, split widgets, avoid creating unstable objects repeatedly.
- Lists: use `ListView.builder`, `GridView.builder`, slivers, keys, and pagination where appropriate.
- Images: resize server-side or with cache dimensions, use placeholders/errors, avoid loading full-resolution assets unnecessarily.
- Parsing/CPU: move heavy work to `compute()` or an isolate only when measured cost is meaningful.
- Layout/paint: reduce nested expensive layout, avoid unnecessary opacity/clips/shadows in hot paths.
- Startup: defer non-critical initialization and avoid synchronous I/O.

## Validation

Run the smallest command that proves improvement:

```bash
flutter run --profile
flutter test
flutter drive --profile --target=<target> --driver=<driver>
```

Use existing benchmark or integration performance workflows when present.
