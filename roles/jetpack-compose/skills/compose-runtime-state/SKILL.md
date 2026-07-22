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

## Common Mistakes (❌/✅)

### 1. `derivedStateOf` as default memoization

❌ **Wrong** — wrapping a computation that is read every recomposition in `derivedStateOf`:
```kotlin
val price = derivedStateOf { item.basePrice * item.quantity }
Text("${price.value}")
```
✅ **Correct** — `derivedStateOf` only pays off when the derived value changes less often than its inputs. Simple arithmetic read in every recomposition should be plain Kotlin:
```kotlin
val price = item.basePrice * item.quantity
Text("$price")
```
The `derivedStateOf` overhead (allocation + snapshot observation) is wasted when the value is read unconditionally — the framework already knows when `basePrice` or `quantity` changes. Reserve `derivedStateOf` for cases where the derived value is a subset or aggregation that changes infrequently compared to its upstream sources.

---

### 2. `snapshotFlow` vs `LaunchedEffect` with key

❌ **Wrong** — restarting a coroutine on every state change for fire-and-forget observation:
```kotlin
LaunchedEffect(scrollState.firstVisibleItemIndex) {
    analytics.trackScrollPosition(scrollState.firstVisibleItemIndex)
}
```
✅ **Correct** — use `snapshotFlow` when the effect should fire on each change without tearing down and relaunching the coroutine:
```kotlin
LaunchedEffect(Unit) {
    snapshotFlow { scrollState.firstVisibleItemIndex }
        .distinctUntilChanged()
        .collect { position -> analytics.trackScrollPosition(position) }
}
```
`LaunchedEffect(key)` cancels the coroutine and restarts it every time the key changes. For event-tracking, logging, or publishing to external systems, restarting drops buffered emissions and adds jank. `snapshotFlow` keeps the coroutine alive and emits values in-place.

---

### 3. Stale lambda captures without `rememberUpdatedState`

❌ **Wrong** — a long-running `LaunchedEffect(Unit)` captures a callback lambda that becomes stale across recompositions:
```kotlin
LaunchedEffect(Unit) {
    delay(30_000)
    onTimeout() // calls the onTimeout from first composition forever
}
```
✅ **Correct** — wrap mutable callbacks with `rememberUpdatedState` so long-lived effects always call the latest:
```kotlin
val latestOnTimeout by rememberUpdatedState(onTimeout)
LaunchedEffect(Unit) {
    delay(30_000)
    latestOnTimeout()
}
```
Without `rememberUpdatedState`, a `LaunchedEffect(Unit)` captures values from the first composition and never re-reads them. When the parent replaces `onTimeout` (e.g. due to a new navigation destination), the effect still invokes the stale reference.

---

### 4. Reading `State<T>` too high in the composition tree

❌ **Wrong** — reading all ViewModel state at the screen root, forcing the entire subtree to recompose on any single change:
```kotlin
@Composable
fun FeedScreen(viewModel: FeedViewModel) {
    val posts by viewModel.posts.collectAsStateWithLifecycle()
    val filter by viewModel.filter.collectAsStateWithLifecycle()
    Scaffold {
        Column {
            FilterBar(filter)       // recomposed when posts change
            PostList(posts, filter)  // recomposed when filter changes
        }
    }
}
```
✅ **Correct** — push state reads down to the narrowest composable scope that needs them:
```kotlin
@Composable
fun FeedScreen(viewModel: FeedViewModel) {
    Scaffold {
        Column {
            FilterBar(viewModel)    // reads only filter internally
            PostList(viewModel)     // reads only posts internally
        }
    }
}
```
Compose recomposition granularity is bounded by the nearest restartable scope where a state read occurs. Reading all state at the screen level means every field change invalidates the entire screen tree.

---

### 5. `remember` with plain mutable collections

❌ **Wrong** — caching a `mutableListOf` in `remember`; mutations are invisible to Compose:
```kotlin
val items = remember { mutableListOf<Item>() }
items.add(newItem)  // no recomposition triggered — list reference unchanged
```
✅ **Correct** — use Compose's snapshot-aware collection wrappers so mutations trigger recomposition:
```kotlin
val items = remember { mutableStateListOf<Item>() }
items.add(newItem)  // recomposition triggered — snapshot system observes the write
```
Plain `mutableListOf()` / `mutableMapOf()` are not Compose-aware. Mutating them does not notify the snapshot system. Use `mutableStateListOf`, `mutableStateMapOf`, or replace the collection wholesale through `mutableStateOf` so Compose observes the change.

---

### 6. `SideEffect` for coroutine-launching side work

❌ **Wrong** — launching coroutines inside `SideEffect`, which runs on *every* successful recomposition:
```kotlin
SideEffect {
    scope.launch { repository.sync() } // fires on every recomposition
}
```
✅ **Correct** — `SideEffect` is for publishing Compose state to non-Compose objects. Use `LaunchedEffect` for lifecycle-tied coroutine work:
```kotlin
LaunchedEffect(Unit) {
    repository.sync() // runs once per composition life, cancelled on leave
}
```
`SideEffect` guarantees execution after every successful recomposition — not once per composition lifespan. Its block is non-cancellable and non-lifecycle-aware. Launching a coroutine there will fire repeatedly as the composition updates.
