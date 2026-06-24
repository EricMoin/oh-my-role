---
name: compose-performance
description: Diagnoses and improves Jetpack Compose performance with recomposition analysis, stability fixes, Lazy layout tuning, compiler reports, Macrobenchmark, Baseline Profiles, and profiling tools.
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

- Add or update Baseline Profile generation for startup and critical flows.
- Use Macrobenchmark for startup, scroll, navigation, and animation-sensitive paths.
- Run benchmarks on physical devices or stable emulator configurations according to project practice.
- Compare before/after metrics and preserve benchmark scenarios for regressions.

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
