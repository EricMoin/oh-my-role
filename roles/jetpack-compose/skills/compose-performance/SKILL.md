---
name: compose-performance
description: Diagnose measured Compose performance problems using traces, compiler reports, lazy-layout identity, Macrobenchmark and Baseline Profiles. Use for jank, startup, recomposition, allocation or memory investigations; keep changes proportional to evidence.
---
# Compose Performance

Measure the affected journey before changing architecture. Identify whether the bottleneck
is composition, layout, drawing, allocation, loading or startup. Runtime state and effect
correctness belong to `compose-runtime-state`; platform lifecycle work belongs to
`android-platform-engineering`. The performance reference supplies review/evidence criteria.

For a concrete setup or interpretation, load
[measurement recipes](references/measurement-recipes.md): report reading, stability
configuration, lazy-item identity/reuse, a startup benchmark and a profile generator.
These recipes supplement the decision rules below; they do not replace measurement.

## Choose Evidence for the Question

| Question | Starting point |
| --- | --- |
| Which scopes recompose or skip? | Layout Inspector counts, then compiler reports for the affected code |
| What blocks a slow frame? | System trace/Perfetto and targeted profiler evidence |
| Is startup or scrolling slower? | Repeatable Macrobenchmark of that journey |
| Is memory retained or allocated excessively? | Allocation/heap evidence and resource ownership |
| Which visible state precedes a transient glitch? | Bounded recording plus inspected frames; correlate traces when timing matters |

Counts locate work; they do not measure frame cost. Do not add a counter that writes
Compose state read by the same UI after every composition: the measurement itself can
keep invalidating that UI. A video can locate a symptom but recording FPS is not display
FPS. Follow `references/device-video-debugging.md` only when temporal evidence is needed.

Each diagnostic attempt must answer a named hypothesis. At most three attempts share that
hypothesis and implementation across tools, run names and graphs; stop earlier when no new
evidence appears. After roughly ten minutes without an effective change or decisive evidence,
reassess scope and strategy. Stop once selected acceptance and required checks pass without
a blocking defect. Keep compact results per `references/device-test-memory.md`; optional
record enrichment can run in the lead's background recorder graph after evidence is sealed.

## Stability and Skipping

Check the actual Kotlin/compiler plugin version and flags before interpreting reports.
[Strong skipping](https://developer.android.com/develop/ui/compose/performance/stability/strongskipping)
is enabled by default from Kotlin 2.0.20: restartable composables can skip even with unstable
parameters, and lambdas created inside composables are automatically memoized. Unstable
parameters use instance comparison; stable parameters use equality. A new equal instance
of an unstable type may therefore matter. Do not require manual `remember` for every
callback or treat every non-skippable/non-restartable function as a defect.

Use the stability workflow in `compose-runtime-state` when a measured bottleneck points
there. `@Stable`, `@Immutable` and stability configuration are contracts, not fixes for
unobservable mutation. Collections cannot be made truly immutable by adding an annotation.
Prefer compiler inference for simple immutable models and verify any explicit contract.
See [fix stability issues](https://developer.android.com/develop/ui/compose/performance/stability/fix).

## Compiler Reports

For a module already using the Kotlin Compose compiler Gradle plugin, configure:

```kotlin
composeCompiler {
    reportsDestination = layout.buildDirectory.dir("compose_compiler")
    metricsDestination = layout.buildDirectory.dir("compose_compiler")
}
```

Build the relevant variant. Inspect `*-classes.txt`, `*-composables.txt` and
`*-composables.csv` under the configured destination; metrics provide aggregate statistics.
Use the [report setup guide](https://developer.android.com/develop/ui/compose/performance/stability/diagnose)
and the project's plugin version. `-PcomposeCompilerReports=true` has no universal meaning:
it works only when project build logic consumes that property. For older compiler setups,
check their supported options instead of mixing legacy flags with the new plugin.
Do not add a stability configuration file merely to enable reports.

## Apply Only the Relevant Fix

- Narrow frequent state reads to the scope or phase that consumes them. Re-executing a
  parent does not imply every descendant executes; eligible children can skip.
- Use stable unique IDs for movable lazy items. Default identity is position-based;
  keys protect state across insertions and moves. Keep Android saved-state key types
  saveable. See [item keys](https://developer.android.com/develop/ui/compose/lists#item-keys).
- Use `contentType` to group compatible heterogeneous item compositions for reuse; it
  does not eliminate measurement. Avoid forcing fixed sizes that break content or text scaling.
- Move expensive pure sorting/filtering out of item lambdas; cache with all changing inputs
  keyed correctly. Use `derivedStateOf` only when its update filtering justifies its overhead.
- Size decoded images appropriately and investigate actual cache/retention pressure.
- Keep blocking work off the UI thread. Starting a suspending load during startup is not
  itself a defect; arbitrary `delay()` does not make blocking work safe or prove improvement.

## Macrobenchmark and Baseline Profiles

Use the existing benchmark setup for material performance claims. If setup is needed, follow
[Macrobenchmark setup](https://developer.android.com/topic/performance/benchmarking/macrobenchmark-overview)
for a separate test module and a representative, non-debuggable target. Discover module,
variant and task names from the project; do not assume `:macrobenchmark` or a universal
`connectedBenchmarkAndroidTest` task. Use physical devices for credible timing comparisons.

Follow [Baseline Profile generation](https://developer.android.com/topic/performance/baselineprofiles/create-baselineprofile)
for the installed plugin and its app/producer modules. Verify the generated profile is
packaged in the target release. Record the actual task and output location rather than
hard-coding a plugin version, path or expected percentage improvement. Profiles and benchmark
libraries version independently of the Compose BOM. A small behavior fix does not require
adding a benchmark/profile module unless its acceptance or measured risk warrants it.

Report before/after metrics with build, device, journey, iterations and compilation mode.
Use the same conditions for comparison and state noise or missing evidence. Resolve API
uncertainty through `android-source-research`; a benchmark configuration is not a result.
