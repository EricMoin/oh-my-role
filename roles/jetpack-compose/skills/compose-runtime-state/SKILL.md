---
name: compose-runtime-state
description: Guides Jetpack Compose runtime, recomposition, snapshots, state hoisting, remember APIs, side effects, and stability decisions. Use when writing or reviewing Compose state, side effects, recomposition-sensitive UI, or debugging unexpected recompositions and snapshot state loss.
---
# Compose Runtime and State

Compose UI is a function of state. Correct Compose code makes state ownership explicit, keeps rendering pure, and uses effects only to synchronize with work outside composition.

## Core Rules

- Model UI as immutable state flowing down and events flowing up.
- Keep composables idempotent: a recomposition may run often, in a different order, or after being skipped.
- Use `remember` for composition-local object retention, not for business state that must survive process death.
- Use `rememberSaveable` for small UI state that should survive configuration changes and process recreation when a `Saver` is available.
- Use `ViewModel` or another lifecycle owner for screen state, async work, repositories, and business rules.
- **NEVER** call impure APIs or start side effects (coroutines, I/O, global-state mutation) directly in a composable body — use the effect APIs.
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

## Stability and Strong Skipping

Stability decides whether the Compose runtime can skip a composable during recomposition. Strong skipping — enabled by default with Kotlin 2.0.20 — marks nearly all restartable composables as skippable and memoizes lambdas, but stability still governs the skip decision: unstable parameters are compared by instance identity (`===`), stable ones by object equality.

- Prefer Kotlin immutable data classes for UI state.
- Use `List<T>` in public UI state, but avoid mutating the backing collection in place.
- Avoid passing large mutable models directly to composables. Map domain models to UI models when it clarifies stability and display behavior.
- Enable Compose compiler reports for hard recomposition/stability questions.

### 1. Primitive-state specializations

`mutableIntStateOf` and `mutableFloatStateOf` (along with `mutableLongStateOf` and `mutableDoubleStateOf`) store the value as an unboxed primitive. Plain `mutableStateOf` remains correct for every other type — there is no Boolean specialization, and no specialization for `String` or reference types.

**Version requirement:** the primitive state API requires Compose runtime 1.6+ — a Compose BOM of 2024.05.00 or later (BOM 2024.05.00 maps to runtime 1.6.7). On the 1.6+ line `mutableIntStateOf`/`mutableFloatStateOf` are stable APIs and need no `@OptIn`. EXPERIMENTAL — confirm with the user before @OptIn: if the project is pinned to an older runtime these functions do not exist and no annotation will help — upgrade the Compose BOM instead of forcing the API through.

❌ **Wrong** — boxing an `Int`/`Float` through the generic holder:
```kotlin
var count by remember { mutableStateOf(0) }     // Int boxed inside MutableState<Int>
var alpha by remember { mutableStateOf(0.5f) }  // Float boxed inside MutableState<Float>
```
✅ **Correct** — use the primitive specialization for `Int`/`Float`:
```kotlin
var count by remember { mutableIntStateOf(0) }    // MutableIntState, unboxed Int value
var alpha by remember { mutableFloatStateOf(0.5f) } // MutableFloatState, unboxed Float value
```
The specialized functions return `MutableIntState`/`MutableFloatState`, whose `value` reads and writes a primitive directly and avoids boxing. For other types — `Boolean`, `String`, collections, domain objects — plain `mutableStateOf` is still the right API.

### 2. Strong skipping implications

Since Kotlin 2.0.20, strong skipping is on by default. Two compiler behaviors change: every restartable composable becomes skippable regardless of unstable parameters, and lambdas are automatically memoized — wrapped in `remember` keyed by their captures. Stability matters more, not less, under this mode. `@Stable`/`@Immutable` types are compared by value, so a new instance with equal data still allows skipping; unstable parameters are compared by identity, so a new instance always recomposes.

**Version requirement:** strong skipping requires the Kotlin 2.0 Compose compiler — the compiler plugin that ships with Kotlin 2.0.20 enables it by default. On the legacy 1.5.x compiler line it was an opt-in feature flag, not an annotation (experimental since 1.5.4, declared production-ready in 1.5.13). Nothing needs to be enabled on Kotlin 2.0.20+. EXPERIMENTAL — confirm with the user before @OptIn: do not flip experimental compiler feature flags or add `@OptIn` to force the behavior on an older compiler; upgrade the Compose compiler instead.

❌ **Wrong** — an unstable lambda defeats strong skipping. The receiver gets a fresh lambda instance, its parameter fails instance equality, and it recomposes:
```kotlin
@Composable
fun ProfileCard(profile: Profile) {        // Profile unstable: new instance per refresh
    FollowButton(onClick = { follow(profile) })  // compiler memoizes as remember(profile)
}
```
The compiler keys the memoized lambda on the capture `profile`. Because `Profile` is unstable, the key is compared by identity — a refreshed `Profile` holding identical data produces a new lambda, and `FollowButton` recomposes even though nothing it displays changed.

✅ **Correct** — keep lambda captures stable so the memoized instance survives recompositions:
```kotlin
@Composable
fun ProfileCard(profileId: Long, onFollow: (Long) -> Unit) {
    FollowButton(onClick = { onFollow(profileId) })  // stable captures: same instance every time
}
```
`profileId` is a primitive (immutable) capture and `onFollow` is a hoisted callback, so the memoized lambda keeps its identity across recompositions and `FollowButton` is skipped. In general, `remember`-cached instances — including the lambdas the compiler memoizes for you — stay stable across recompositions; only fresh allocations break the comparison.

Because the compiler already memoizes lambdas by their captures, hand-wrapping an event handler in `remember(a, b, c, …) { { … } }` buys almost nothing under strong skipping — and a long key list is a *symptom*: the composable is capturing too many collaborators and doing orchestration the UI layer should not own. The fix is structural, not deleting the `remember`: move that logic to its proper owner — usually the ViewModel, or a plain UI-logic state holder when it depends on UI-scoped objects (a `View`, snapshot state, composition scope) the ViewModel must not hold — and pass a method reference (stable by construction). Reach for the simplest owner that works; see `compose-ui-architecture` → Common Mistakes for the decision ladder.

### 3. Fix unstable types at the source before annotating

`@Stable` and `@Immutable` override what the compiler infers about a type. The rule is to fix unstable types at the source before annotating: do not add the annotations merely to silence compiler reports. If the type is actually mutable, the runtime will trust the annotation and skip recompositions that should have happened. Restructure the type first — immutable data class, stable `val` fields — and only annotate once the contract is genuinely true.

❌ **Wrong** — annotating a mutable wrapper to quiet the stability report:
```kotlin
@Immutable
data class Cart(val items: MutableList<Item>)  // lie: items mutates in place
```
The compiler trusts `@Immutable` and marks `Cart` stable. Later `items.add(...)` calls are invisible to the snapshot system, and any composable that should have recomposed is skipped, leaving stale UI.

✅ **Correct** — fix the type at the source so stability is real:
```kotlin
data class Cart(val items: List<Item>)  // immutable val field: compiler infers stable
```
Use an immutable collection (or a plain `val` of an immutable type), and let the compiler infer stability. If the type genuinely needs mutable fields, route mutations through Compose state (`mutableStateOf`, `mutableStateListOf`) and reserve `@Stable` for classes whose mutation is snapshot-observed — never as a way to silence the compiler report.

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

---

### 7. `DisposableEffect` registration into order-sensitive structures

A `DisposableEffect` registration lives exactly as long as the composable's presence at its composition location. When the target is an order-sensitive external structure — a listener stack where "last registered wins," a handler chain, a focus dispatcher — that lifecycle binding becomes a semantic claim: *every remount looks like a brand-new participant that jumps the queue*.

❌ **Wrong** — assuming registration order tracks visual/logical order when the registering composable can remount:
```kotlin
// Inside a composable that lives under AnimatedContent / an if-branch / movableContentOf
DisposableEffect(sharedDispatcher) {
    val unregister = sharedDispatcher.register(handler) // pushed to top of stack
    onDispose { unregister() }
}
```
A mode switch, `AnimatedContent` target change, or conditional branch remounts this composable. It re-registers and silently steals the top-of-stack position from a logically "higher" participant that never moved. The bug is invisible in the happy path and appears only under specific interaction sequences.

✅ **Correct** — key the registration to the stable logical owner, and make the external structure treat same-owner re-registration as an in-place update:
```kotlin
val surface = LocalOwningSurface.current   // stable across remounts of this UI region
DisposableEffect(sharedDispatcher, surface) {
    val unregister = sharedDispatcher.register(owner = surface, handler)
    onDispose { unregister() }              // slot survives; only the handler is detached
}
```
The general rule: a composable instance is an implementation detail of the UI tree, not a logical identity. Before registering into any shared, ordered structure, decide what the *logical participant* is (a screen, a surface, a state holder) and key the registration to that. If the external API only supports append-to-end semantics, fix the API — do not compensate by suppressing other participants from the outside.

---

When this skill asserts runtime, snapshot, or stability behavior, back the claim with the androidx source: `[source: GitHub — androidx/androidx/{path}:L{line} — {what was verified}]`. For platform or framework source, cite cs.android.com instead.

When behavior is uncertain or version-sensitive, do not guess. Route through the `android-source-research` skill workflow, which traces behavior to source before the claim is written. For deep source navigation, use the `jetpack-compose--source-tracer` subagent.

NEVER assert API behavior from training data alone.
