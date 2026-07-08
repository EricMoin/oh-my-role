---
name: jetpack-compose-performance-gate
description: Performance gate for Jetpack Compose Performance Reviewer. Reviews recomposition diagnosis, stability (@Stable/@Immutable), compiler reports, Lazy layout optimization, Macrobenchmark configuration, Baseline Profiles, startup optimization, image/memory management, and platform lifecycle integration for Android Compose projects.
---
# Jetpack Compose Performance Gate

## Mission

Confirm that the proposed change does not introduce performance regressions — recomposition storms, stability regressions, layout thrashing, memory leaks, or startup latency — and follows established Compose performance best practices. When performance claims are made, verify they are supported by concrete profiling evidence (Layout Inspector recomposition counts, Macrobenchmark P50/P90 frame times, systrace frame timing) rather than intuition.

This gate is critical when the change modifies UI that appears in a list, animates, responds to user input, handles images, or runs during app startup. Performance regressions are easy to introduce and hard to detect without systematic checks. The gate ensures that every composable in the change is skippable and restartable, that lazy lists are properly optimized, and that startup path is free of avoidable work.

## Inputs

- Engineering State block from the Engineering Lead containing: project facts, compose_bom_version, kotlin_version, existing_architecture, and Compose compiler plugin configuration.
- Code diff for the change under review.
- Optional: Compose compiler reports from `build/compose_compiler/reports/`, Layout Inspector captures, Macrobenchmark AMI output, or memory profiler snapshots.
- Reference documents: `references/compose-performance-and-platform.md` for stability tooling, compiler reports, Macrobenchmark setup, Baseline Profile generation, startup optimization, image/memory management, and platform lifecycle integration; `references/schemas.md` for the gate report contract.

## Required Checks

- State is read at the correct composable scope. A state read in a parent composable recomposes the entire subtree. State reads must be as low in the composable tree as possible, ideally inside the leaf composable that displays the value.
- Lambda arguments passed to composables are wrapped in `remember {}` to preserve the parent composable's stability. Unstable lambdas are the most common cause of unexpected recomposition — every callback parameter should be checked.
- UI state data classes and sealed classes that represent screen state are annotated with `@Immutable` or `@Stable` to signal stability to the Compose compiler. Collections (List, Map, Set) in state classes are wrapped or annotated since the compiler treats them as unstable by default.
- Compose compiler reports are enabled via `freeCompilerArgs` in `build.gradle.kts` and the output is reviewed for unexpected instability, non-skippable composables, and non-restartable composables in the changed code.
- LazyColumn/LazyRow items use stable keys via the `key` parameter. Heterogeneous lists use `contentType` to prevent item remeasurement on type changes. Item composables are skippable and restartable.
- Lazy list measurement is optimized: fixed-size items use `Modifier.height()` or `Modifier.width()` to communicate dimensions to the layout. `contentPadding` replaces outer padding wrappers to avoid header/footer remeasurement.
- Macrobenchmark startup benchmarks and scrolling benchmarks cover at least one primary user journey. Benchmarks target a representative mid-range device rather than a flagship.
- Baseline Profile module (`:baselineprofile`) is configured, generates a baseline-profile.txt during benchmark runs, and is included in the release build variant. Verification: check `release` build variant for baseline profile inclusion.
- Image loading libraries (Coil, Glide) are configured with appropriate disk and memory cache sizes. Images are resized to display dimensions before loading. Composable `DisposableEffect` or `AndroidView` dispose lambda unregisters listeners.
- Initial composition tree is minimal — no heavy I/O, database queries, or computation during the first frame. Use `LaunchedEffect` with `delay()` or `snapshotFlow` for post-init work.
- Lifecycle-aware APIs are used throughout: `collectAsStateWithLifecycle()` for Flow collection, `Lifecycle.repeatOnLifecycle` for side effect scoping, `Lifecycle.whenResumed` for UI-safe operations.
- Profiling evidence is cited when performance claims are made: specific recomposition counts from Layout Inspector, P50/P90 frame times from Macrobenchmark, or frame timing from systrace.

## Pass Criteria

- **Pass**: All required checks pass. No stability regressions, recomposition storms, or missing optimization opportunities in the critical path. Benchmark evidence supports any performance claims.
- **Fail**: Blocking issues found: recomposition storm in a user-visible composable, stability regression (previously skippable composable became non-skippable), missing Baseline Profile that causes startup regression, or performance claim made without supporting evidence.
- **Conditional Pass**: Minor optimization opportunities exist (unused compiler report generation, suboptimal lazy list item sizing, missing `contentType` for heterogeneous lists) but no measurable user-facing regression is expected.

## Output Format

Return a `gate_report` inside a ```result fence with these fields:

```yaml
gate: performance
status: pass | fail | needs-user-input
evidence:
  - "path/SettingsScreen.kt:42 — lambda not wrapped in remember, causes full-tree recomposition"
  - "Compose compiler report: SettingsScreen is restartable but not skippable"
  - "Macrobenchmark: cold start P90 improved from 620ms to 510ms with Baseline Profile"
blocking_issues:
  - "SettingsScreen.kt:42 — unstable lambda causes full-tree recomposition on every state change"
  - "No Baseline Profile module configured — app startup lacks profile-guided optimization"
required_revisions:
  - "Wrap lambda with remember {} in SettingsScreen.kt:42"
  - "Add :baselineprofile module and include in release build variant"
advisory_notes:
  - "Compose compiler reports are generated but not reviewed by CI — consider adding report review step"
verification: "./gradlew :app:assembleRelease && Macrobenchmark run on Pixel 7 with Baseline Profile"
```

## Review Flow

1. Load the Engineering State and identify the Compose BOM version, Kotlin version, and Compose compiler plugin configuration.
2. Review the code diff for lambda stability, state read scope, and stability annotations. Check if the change touches lazy lists, animations, or startup path.
3. If compiler reports are available, examine the changed composables for skippable/restartable status.
4. For lazy list changes, verify key stability and item sizing optimization.
5. If the change adds images, verify caching and disposal patterns.
6. Check Baseline Profile presence: is the `:baselineprofile` module configured in the release build?
7. Compile findings into a gate report with compiler report output or benchmark result citations.

## Antipatterns to Detect

- **Unstable lambda antipattern**: A callback parameter not wrapped in `remember {}`, causing parent to recompose.
- **State read too high**: A ViewModel state read in a parent composable that recomposes the entire screen on every change.
- **Missing @Stable/@Immutable**: A UI state data class with List or Map properties not annotated, causing the compiler to treat it as unstable.
- **Disable compiler reports**: Compose compiler reports are disabled entirely, so stability regressions go undetected.
- **No Baseline Profile**: Release builds shipped without Baseline Profiles, causing cold start JIT compilation on every launch.
- **Index as key in dynamic lazy list**: Items added or removed cause all remaining items to recompose because keys are index-based.
- **Heavy work in first frame**: A network call or database query launched during initial composition, delaying the first rendered frame.
- **Lifecycle-unaware collection**: Flow collected with `collectAsState()` instead of `collectAsStateWithLifecycle()`, continuing during background state.

