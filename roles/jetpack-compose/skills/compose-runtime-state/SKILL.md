---
name: compose-runtime-state
description: Guides Compose state ownership, restoration, effect keys, snapshot observation, recomposition, and stability. Use for state loss, stale callbacks, unexpected recomposition, or side-effect lifetime bugs.
---
# Compose Runtime and State

Keep rendering idempotent. Do not start I/O, launch coroutines, or mutate external
objects directly in a composable body. Choose state ownership before choosing APIs.
Screen architecture belongs in [compose-ui-architecture](../compose-ui-architecture/SKILL.md);
measured optimization belongs in [compose-performance](../compose-performance/SKILL.md).

## Worked patterns

Use [state and effect recipes](references/state-and-effect-recipes.md) for custom saved
input, keyed memoization versus derived state, snapshot observation, listener cleanup,
callback-to-state adapters and publishing committed state. The rules below choose the
mechanism; the recipes show its lifetime and failure cases.

## Ownership and lifetime

| Need | Owner/API |
| --- | --- |
| Object retained at a composition location | `remember`, keyed by inputs that invalidate it |
| Small restorable UI input | `rememberSaveable` with supported values or a `Saver` |
| Screen business state and work | ViewModel, repositories, lifecycle-aware collection |
| Business input needed after process recreation | `SavedStateHandle` or persistence, then rebuild derived state |
| App/shared data | Repository or explicit shared owner with the required lifetime |

Hoist to the lowest owner that needs to read or change the state. A ViewModel survives
configuration changes, not process death. Saved state is bounded: save IDs and input,
not large loaded datasets. `remember` is positional; leaving its composition location
forgets the value. Recomposition alone does not recreate it.

Use immutable replacements through observable state or snapshot-aware collections.
`remember { mutableListOf() }` does not make mutations observable. Snapshot lists observe
their structural mutations, not arbitrary mutation of fields inside their elements.

## Effects

| API | Contract |
| --- | --- |
| `LaunchedEffect(keys)` | Suspend work; cancelled on leaving composition or changing keys |
| `rememberCoroutineScope()` | Composition-bound scope for event-handler work |
| `DisposableEffect(keys)` | Register a resource/listener and pair it with cleanup |
| `SideEffect` | Publish to a non-Compose object after successful composition |
| `produceState` | Adapt a suspend/callback source to state; clean up subscriptions |
| `rememberUpdatedState` | Read the latest value without restarting a long-lived effect |

Key effects with changing owners and inputs that should restart the work. For callbacks
that should update without restarting, use `rememberUpdatedState`. `Unit` means the
call site's lifetime; it does not mean once per screen, app, or process.

Illustrative function; imports are omitted (`runtime` and `kotlinx.coroutines.delay`):

```kotlin
@Composable
fun SessionTimeout(sessionId: String, onTimeout: () -> Unit) {
    val latestOnTimeout by rememberUpdatedState(onTimeout)
    LaunchedEffect(sessionId) {
        delay(30_000)
        latestOnTimeout()
    }
}
```

Composition lifetime and Android foreground lifecycle differ. Use lifecycle-aware
collection or `repeatOnLifecycle` when work must stop in the background. An effect
remaining in composition is not proof that its UI is visible.

`DisposableEffect` keys do not preserve registration order across disposal/remount.
If peers compete for focus/back/resource ownership, the shared owner must define identity,
ordering and removal. A retained logical slot needs explicit cleanup when its owner ends;
do not leak inactive slots to work around remounts.

## Derived state and observation

- Use plain Kotlin for cheap calculations. Use `remember(inputs)` for expensive pure
  calculations that can be reused while inputs are unchanged.
- Use a remembered `derivedStateOf` when snapshot inputs change more frequently than the
  result needed by UI, such as a scroll threshold. Reading the result every composition
  is normal; the benefit depends on the result's change frequency.
- `snapshotFlow` observes snapshot state in a coroutine and emits unequal results. Its
  block must be read-only and free of side effects. It is state observation, not a lossless
  event log; do not promise delivery of every intermediate mutation.
- Key the collecting effect with the state holder it observes. Avoid stale collaborators
  by keying them or accessing their latest values. An immediate `distinctUntilChanged()`
  adds nothing to unchanged `snapshotFlow` output; it can help after a transformation.

## Recomposition and stability

State reads invalidate their observing scopes. Children with unchanged parameters can
still skip; reading state at a screen route does not force every child to execute.
Keep reusable children parameter-based rather than passing a ViewModel down purely to
move collection. Defer high-frequency reads to the phase that needs them when measured.

Strong skipping is enabled by default with Kotlin 2.0.20. It makes eligible restartable
composables skippable and memoizes lambdas using their captures. Unstable parameters and
captures use identity comparison; stable ones use equality. Ordinary `remember` keys use
equality. New instances, changed callbacks and explicit opt-outs still matter; a method
reference or `remember` does not make its receiver's type stable or guarantee skipping.

- Kotlin `List`, `Set` and `Map` are read-only interfaces, not proof of immutability;
  the compiler normally treats them as unstable. `val items: List<Item>` does not fix this.
- Keep collection backing data immutable from the UI's perspective. Consider supported
  immutable collections only when needed; verify the compiler report for the actual build.
- `@Stable` and `@Immutable` are promises, not fixes. Do not annotate an unobservably mutable
  object to suppress diagnostics. Stable classes must notify changes to public properties.
- Primitive state APIs (`mutableIntStateOf`, `mutableLongStateOf`, `mutableFloatStateOf`,
  `mutableDoubleStateOf`) were added in runtime **1.5.0** and avoid boxing on the JVM.
  Generic `mutableStateOf` is still correct. Do not invent Boolean/String specializations
  or upgrade a project's BOM just to replace correct generic state.

## Verification and sources

Check ownership, restoration, key changes, cancellation and stale callbacks first.
Use compiler reports and traces for performance claims. Verify version-sensitive behavior
against resolved dependencies through `android-source-research`; current docs alone do not
establish behavior on an older project version.

Checked 2026-10-27:

- [State and restoration](https://developer.android.com/develop/ui/compose/state)
- [Effect lifecycle, keys and snapshotFlow](https://developer.android.com/develop/ui/compose/side-effects)
- [Strong skipping and lambda comparisons](https://developer.android.com/develop/ui/compose/performance/stability/strongskipping)
- [Collection stability](https://developer.android.com/develop/ui/compose/performance/stability/fix)
- [Primitive state API versions](https://developer.android.com/reference/kotlin/androidx/compose/runtime/package-summary#mutableIntStateOf(kotlin.Int))
