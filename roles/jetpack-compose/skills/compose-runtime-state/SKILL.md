---
name: compose-runtime-state
description: Guides Jetpack Compose runtime, recomposition, snapshots, state hoisting, remember APIs, side effects, and stability decisions. Use when writing or reviewing Compose state, effects, or recomposition-sensitive UI.
---
# Compose Runtime and State

Compose UI is a function of state. Correct Compose code makes state ownership explicit, keeps rendering pure, and uses effects only to synchronize with work outside composition.

## Core Rules

- Model UI as immutable state flowing down and events flowing up.
- Keep composables idempotent: a recomposition may run often, in a different order, or after being skipped.
- Use `remember` for composition-local object retention, not for business state that must survive process death.
- Use `rememberSaveable` for small UI state that should survive configuration changes and process recreation when a `Saver` is available.
- Use `ViewModel` or another lifecycle owner for screen state, async work, repositories, and business rules.
- Never start coroutines, perform I/O, mutate global state, or call impure APIs directly from a composable body.
- Prefer stable, immutable inputs. Avoid passing mutable collections or unstable wrapper types through large parts of the UI.

## State Ownership

Use this order when choosing where state belongs:

| State type | Owner |
| --- | --- |
| Text field draft, selected tab, expanded row | Local composable with `rememberSaveable` when restoration matters |
| Screen loading/content/error state | ViewModel exposed as immutable UI state |
| Data from repositories or remote sources | Data/domain layer, collected by ViewModel |
| Cross-screen app state | App-level state holder or repository, not random globals |
| Navigation destination | Navigation controller/state holder |

Hoist state when the parent needs to coordinate children, validate input, save it, or trigger business logic from it. Keep state local when no other component cares.

## Recomposition Model

Recomposition is normal. Optimize for correctness first, then measure.

- A composable can be skipped if parameters are stable and unchanged.
- Reading `State<T>` subscribes the current composable scope to changes.
- Moving state reads lower in the tree limits invalidation.
- Lambda allocation is usually fine; unstable captured objects and broad state reads are more important.
- `derivedStateOf` is for reducing recompositions when derived output changes less often than its inputs. Do not use it as a default memoization tool.

## remember API Choices

| API | Use when |
| --- | --- |
| `remember` | Retain an object for the lifetime of this composition location |
| `rememberSaveable` | Retain simple UI state across Activity recreation |
| `rememberUpdatedState` | An effect needs the latest lambda/value without restarting |
| `rememberCoroutineScope` | Launch work from event handlers tied to composition lifecycle |
| `derivedStateOf` | A frequently changing input produces a rarely changing derived value |
| `snapshotFlow` | Convert Compose state reads into a Flow inside a coroutine |

## Side Effect Rules

Use effects to connect composition to the outside world. Pick the smallest effect that matches lifecycle semantics.

| API | Use when |
| --- | --- |
| `LaunchedEffect(key)` | Run suspend work when entering composition or when keys change |
| `DisposableEffect(key)` | Register and unregister listeners or callbacks |
| `SideEffect` | Publish latest Compose state to a non-Compose object after successful recomposition |
| `produceState` | Convert callback/suspend sources into Compose `State` |
| `rememberUpdatedState` | Avoid stale captures inside long-running effects |

Effect keys are part of correctness. If a value should restart the work, include it in the key. If it should update without restart, wrap it with `rememberUpdatedState`.

```kotlin
@Composable
fun AnalyticsScreen(
    userId: String,
    onTimeout: () -> Unit,
) {
    val latestOnTimeout by rememberUpdatedState(onTimeout)

    LaunchedEffect(userId) {
        delay(30_000)
        latestOnTimeout()
    }
}
```

## Stability Guidance

- Prefer Kotlin immutable data classes for UI state.
- Use `List<T>` in public UI state, but avoid mutating the backing collection in place.
- Avoid passing large mutable models directly to composables. Map domain models to UI models when it clarifies stability and display behavior.
- Do not add `@Stable` or `@Immutable` to silence compiler reports unless the contract is actually true.
- Enable Compose compiler reports for hard recomposition/stability questions.

## Workflow

1. Identify all state reads in the affected composable tree.
2. Classify state as local UI state, screen UI state, domain data, navigation state, or external state.
3. Move state to the narrowest correct owner.
4. Replace side effects in composable bodies with the appropriate effect API.
5. Check effect keys and stale lambda/value captures.
6. Validate with tests, manual interaction, and recomposition/performance tools when needed.

## Validation Checklist

- [ ] Composable bodies are free of direct I/O, coroutine launches, and global mutation.
- [ ] State ownership is explicit and minimal.
- [ ] UI state exposed to composables is immutable from the UI perspective.
- [ ] Effects use correct keys and clean up external listeners when needed.
- [ ] `rememberSaveable` is used only for saveable UI state, not repositories or complex business objects.
- [ ] Stability annotations are justified by actual immutability/stability contracts.
