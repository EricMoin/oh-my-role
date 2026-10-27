# Performance measurement recipes

Use after naming the performance question and choosing a representative build/device.
These examples preserve useful setup and interpretation detail without making a new
benchmark module mandatory for every fix. Resolve plugin/library versions from the project.

## Read compiler reports as evidence

Enable reports with the parent skill's `composeCompiler` block, then compile the affected
variant. Read the relevant function in `*-composables.txt` and its parameter types in
`*-classes.txt`. Check whether the unexpected classification comes from a mutable field,
collection, generic type or an external module. The CSV supports comparisons across builds.

A `restartable`/`skippable` marker is a compiler capability, not a measurement of wasted
frame time. Strong skipping changes the interpretation of unstable parameters; compare
instances and captures before changing architecture. Non-restartable functions may be
intentional. Re-run the report for the same variant after a type change, then measure the
actual user journey rather than declaring success from changed report labels.

### Stability configuration is an explicit contract

A stability configuration can describe an external type whose immutability cannot be
inferred by the consuming compiler. It does not make mutation observable. First prefer
correct types/ownership and examine the producer's compiled metadata.

For Kotlin Compose compiler plugin 2.1.0 and later, the module configuration
is separate from merely enabling reports:

```kotlin
composeCompiler {
    stabilityConfigurationFiles.add(
        rootProject.layout.projectDirectory.file("compose-stability.conf")
    )
}
```

An example entry in that file is `java.time.LocalDateTime`, whose immutable contract must
still match the use. Do not blanket-mark all `kotlin.collections.*` or an entire data-layer
package stable to silence diagnostics. Wildcards and generic masks can expand the promise
beyond one type; review every matched mutable field and all producer/consumer modules.
Keep the config in version control and verify the actual plugin's supported option names.

Sources: [fix stability](https://developer.android.com/develop/ui/compose/performance/stability/fix)
and [compiler stability-file option](https://kotlinlang.org/api/kotlin-gradle-plugin/compose-compiler-gradle-plugin/org.jetbrains.kotlin.compose.compiler.gradle/-compose-compiler-gradle-plugin-extension/stability-configuration-files.html).

## Keep lazy-item identity and reuse separate

A movable item's `key` represents its durable identity; a `contentType` groups compatible
composition shapes. For example, a header and an article can have different content types
while every article has its own ID. An item ID used as its content type prevents grouping.
Do not reuse a key across independently emitted sections of the same lazy container.

Pass a row's needed UI model/fields and a straightforward event callback. Sorting in every
item lambda, decoding oversized images, repeated upstream emissions and unbounded nested
measurement are different bottlenecks; adding `remember` or keys does not repair all of
them. Preserve placeholders with realistic dimensions to avoid repeated layout changes.
Validate moves with row-local saved state as well as scroll performance.

## A cold-start Macrobenchmark

Prerequisites: an existing `com.android.test` benchmark module with the appropriate runner
and `benchmark-macro-junit4`, pointing at the installed target app. The target should be
non-debuggable, profileable and representative of release optimization. Use a physical
device for timing claims. This test uses the established `startActivityAndWait` API; an
existing project may instead use its configured UI Automator DSL.

```kotlin
import androidx.benchmark.macro.CompilationMode
import androidx.benchmark.macro.StartupMode
import androidx.benchmark.macro.StartupTimingMetric
import androidx.benchmark.macro.junit4.MacrobenchmarkRule
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class StartupBenchmark {
    @get:Rule
    val benchmark = MacrobenchmarkRule()

    @Test
    fun coldStart() = benchmark.measureRepeated(
        packageName = "com.example.app",
        metrics = listOf(StartupTimingMetric()),
        compilationMode = CompilationMode.None(),
        startupMode = StartupMode.COLD,
        iterations = 10,
        setupBlock = { pressHome() },
    ) {
        startActivityAndWait()
    }
}
```

Replace the package and iteration count for the experiment. `None` deliberately measures
without ahead-of-time compilation; it is not the correct choice for every production
comparison. To measure a packaged Baseline Profile, compare a configuration requiring that
profile with the intended baseline under otherwise equivalent conditions. Full compilation
can reduce JIT noise but is generally not a representative user installation state.

For scrolling, measure `FrameTimingMetric` around a repeatable interaction with the same
content and start position. Read the emitted metric names and units: frame duration and
frame-overrun percentiles are not interchangeable with an invented “jank percentage”.
Readiness, network/data fixtures, animations and device thermals can invalidate a comparison.
Keep JSON output and per-iteration traces, and inspect the slow interval to locate the work.
A debug Layout Inspector session is useful for diagnosis, not a release benchmark result.

Sources: [Macrobenchmark setup and execution](https://developer.android.com/topic/performance/benchmarking/macrobenchmark-overview),
[profile measurement modes](https://developer.android.com/topic/performance/baselineprofiles/measure-baselineprofile).

## Generate a profile for a real journey

In a configured Baseline Profile producer module, this test covers startup only. Add the
actual important navigation/scroll interactions if they belong to the profile's objective.
The current collection method is `collect`, not the old fictitious `collectBaselineProfile`.

```kotlin
import androidx.benchmark.macro.junit4.BaselineProfileRule
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class StartupProfileGenerator {
    @get:Rule
    val profile = BaselineProfileRule()

    @Test
    fun startup() = profile.collect(packageName = "com.example.app") {
        startActivityAndWait()
    }
}
```

The producer module targets the application module; the application consumes its generated
profile through the configured plugin/dependency wiring. Inspect real tasks (`tasks --all`
on that module) and variant output instead of assuming a fixed module name. A modern
plugin can generate into the profiled app's `src/<variant>/generated/baselineProfiles/`,
but configuration and plugin version decide the actual path. Confirm packaging in the
release artifact, then measure; generating a file is not evidence of a speedup.

Do not copy a fixed dependency version or expected percentage benefit from a tutorial.
Record build identity, device/API, data fixture, startup/compilation modes and iteration
results for both versions. Keep setup failures and unavailable evidence explicit.
Source: [create Baseline Profiles](https://developer.android.com/topic/performance/baselineprofiles/create-baselineprofile).
