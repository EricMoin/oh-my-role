---
name: compose-performance
description: Diagnoses and improves Jetpack Compose performance with recomposition analysis, stability fixes, Lazy layout tuning, compiler reports, Macrobenchmark, Baseline Profiles, and profiling tools. Use when profiling jank, diagnosing recomposition storms, tuning Lazy layouts, setting up Macrobenchmarks, or reviewing performance-sensitive Compose code.
---
# Compose Performance

Compose performance work should be measured. Avoid speculative rewrites until you know whether the issue is recomposition, layout, drawing, allocation, data loading, or startup.

## Diagnosis First

Use the smallest tool that answers the question:

| Question | Tool |
| --- | --- |
| Is too much recomposing? | Layout Inspector recomposition counts, compiler metrics, targeted logging |
| Are frames slow? | System Trace, Perfetto, Android Studio profiler |
| Is startup slow? | Macrobenchmark startup, Baseline Profiles |
| Are lists janky? | Macrobenchmark scroll, Lazy layout keys/content types, trace sections |
| Are parameters unstable? | Compose compiler stability reports |
| Is data work blocking UI? | Coroutine dispatchers, StrictMode, traces |

→ stability root cause found? Hand off to the **Stability and Strong Skipping** section in the `compose-runtime-state` skill for the fix workflow.

## Common Fixes

- Move broad state reads down to the composable that needs them.
- Pass only the fields a child needs instead of an unstable aggregate object.
- Use stable item keys in lazy lists.
- Add `contentType` for heterogeneous lazy list items.
- Avoid expensive sorting/filtering/mapping directly inside item lambdas.
- Use `remember` for expensive pure calculations scoped to stable keys.
- Use `derivedStateOf` only when it reduces updates from rapidly changing input.
- Keep animation, image loading, and layout work measured and bounded.
- Fix unstable types at the source before adding annotations.

## Stability

Do not cargo-cult `@Stable` and `@Immutable`.

- `@Immutable` means all public properties are immutable and never change after construction.
- `@Stable` means reads are stable and Compose can rely on change notification semantics.
- Mutable collections are not stable just because the property is `val`.
- Interfaces and generic wrappers can make stability unclear; inspect compiler reports.

Prefer immutable UI models:

```kotlin
data class ArticleRowUiModel(
    val id: String,
    val title: String,
    val subtitle: String,
    val isBookmarked: Boolean,
)
```

### Compiler Reports — Exact Setup

Compiler reports are not enabled by default; they require explicit activation. With the Compose compiler Gradle plugin (Kotlin 2.0), add a `composeCompiler` block to the module's `build.gradle.kts`:

```kotlin
composeCompiler {
    reportsDestination = layout.buildDirectory.dir("compose_compiler")
    metricsDestination = layout.buildDirectory.dir("compose_compiler")
    stabilityConfigurationFile = rootProject.layout.projectDirectory.file("stability_config.conf")
}
```

`reportsDestination` emits per-module reports, `metricsDestination` emits overall project statistics, and `stabilityConfigurationFile` points at the stability config described below. The legacy alternative before the Gradle plugin existed was to activate reports via the `-PcomposeCompilerReports=true` Gradle property (`./gradlew assembleRelease -PcomposeCompilerReports=true`), or the equivalent `freeCompilerArgs` entry `-P plugin:androidx.compose.compiler.plugins.kotlin:reportsDestination=<dir>`; prefer the `composeCompiler` block in new projects.

Reports are written to `<module>/build/compose_compiler` as three files:

- `<module>-composables.txt`: pseudo-Kotlin signatures for every composable in the module, showing the `restartable` / `skippable` flags and per-parameter `stable` / `unstable` markers. A composable that is `restartable` but NOT `skippable` has at least one unstable parameter (often a collection type) and recomposes even when its inputs are unchanged; that is the primary signal to chase.
- `<module>-classes.txt`: stability inference per class, field by field, with a `<runtime stability>` line, showing exactly which field makes a class unstable.
- `<module>-composables.csv`: CSV version of the composables report for spreadsheets or scripted processing.

The `stability_config.conf` file forces classes to be treated as stable at compile time (supported since Compose Compiler 1.5.5). It is a plain text file with one class declaration per line; `//` comments, `*` and `**` wildcards, and generic type parameters are supported:

```text
// Consider this stdlib type stable
java.time.LocalDateTime
// This package and everything below it
com.datalayer.**
// Consider this generic stable based on its first type parameter only
com.example.GenericClass<*,_>
```

For automated analysis, the `compose-stability-analyzer` tooling reports composable stability in real time inside Android Studio (gutter icons, hover tooltips, inline parameter hints, inspections) and can export stability compatibility reports via Gradle tasks, so stability regressions surface without reading text dumps.

→ After fixing stability at the source (`compose-runtime-state`), re-run the compiler reports to confirm skippable/restartable status.

## Lazy Layout Performance

- Use stable keys based on durable IDs, not indices.
- Use `contentType` for different row/card/header shapes.
- Keep composable item content free of blocking work.
- Avoid `remember` keyed by list index when item identity can move.
- For very frequent list updates, verify diffing/data emissions in the upstream layer.
- For image-heavy lists, use an image loader that supports Compose and set appropriate sizes/placeholders.

## Recomposition Containment

```kotlin
@Composable
fun FeedScreen(state: FeedUiState, onBookmark: (String) -> Unit) {
    LazyColumn {
        items(state.items, key = { it.id }) { item ->
            FeedRow(
                title = item.title,
                subtitle = item.subtitle,
                isBookmarked = item.isBookmarked,
                onBookmark = { onBookmark(item.id) },
            )
        }
    }
}
```

Pass stable primitives or stable UI models. Keep callbacks simple and measure before over-optimizing with `remember`.

## Baseline Profiles and Macrobenchmarks

For production apps, performance work should include repeatable benchmarks:

- Generate the Baseline Profile with `./gradlew :baselineprofile:generateBaselineProfile` (a `generateBaselineProfile` task exists per target module, e.g. `:app:generateBaselineProfile`). The generator writes the profile to `baseline-prof.txt` in the profiled module's `src/<variant>/generated/baselineProfiles/` directory.
- Run Macrobenchmark startup, scroll, navigation, and animation-sensitive scenarios with `./gradlew :macrobenchmark:connectedBenchmarkAndroidTest` (or `:macrobenchmark:connectedCheck` for the whole module).
- Run benchmarks on physical devices or stable emulator configurations according to project practice.
- Compare before/after metrics and preserve benchmark scenarios for regressions.

**Versions:** these task names apply to the `androidx.baselineprofile` Gradle plugin (stable lines 1.2.x, 1.3.x, and 1.4.x — current stable 1.4.1) and the `androidx.benchmark:benchmark-macro-junit4` macrobenchmark library (stable 1.4.1). Neither is part of the Compose BOM, so they version independently — check the project's dependency versions before use.

**Experimental APIs:** `FrameTimingMetric` and `StartupTimingMetric` are stable, but advanced metrics such as `TraceSectionMetric` carry the `@ExperimentalMetricApi` opt-in annotation (`androidx.benchmark.macro.ExperimentalMetricApi`) and require `@OptIn`. EXPERIMENTAL — confirm with the user before @OptIn: do not add `@OptIn(ExperimentalMetricApi::class)` just to silence the compiler; prefer a stable metric, or get explicit confirmation before adopting the experimental surface.

## Cite the Source

When this skill asserts compiler-report, stability, or profiling behavior, back the claim with the androidx source: `[source: GitHub — androidx/androidx/{path}:L{line} — {what was verified}]`. For platform or framework source, cite cs.android.com instead.

When behavior is uncertain or version-sensitive, do not guess. Route through the `android-source-research` skill workflow, which traces behavior to source before the claim is written. For deep source navigation, use the `jetpack-compose--source-tracer` subagent.

NEVER assert API behavior from training data alone.

## Workflow

1. Define the symptom: startup, scroll, input, animation, transition, memory, or battery.
2. Reproduce on a representative build type and device.
3. Capture evidence with profiler, Layout Inspector, compiler reports, or benchmark.
4. Apply the smallest fix that matches the measured bottleneck.
5. Re-run the same measurement and document before/after results.
6. Add benchmark or regression coverage when the flow is important.

## Validation Checklist

- [ ] There is evidence for the bottleneck before changing architecture.
- [ ] Fixes preserve correctness, lifecycle behavior, and state ownership.
- [ ] Lazy lists use stable keys and content types where needed.
- [ ] Stability annotations are true, not suppressions.
- [ ] Benchmark/profiler results show the change helped or at least did not regress.
- [ ] Critical performance fixes are covered by repeatable benchmark scenarios when feasible.
