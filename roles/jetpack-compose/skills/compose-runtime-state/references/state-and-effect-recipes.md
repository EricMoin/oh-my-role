# State and effect recipes

Load the section for the concrete problem. Examples require the target project's Compose
runtime/foundation, lifecycle and coroutine dependencies; they are small components, not an
Android host project. Imports are shown where the API boundary matters. Keep business work
with its owner; these recipes describe composition-scoped state and external synchronization.

## Save small custom UI input

A custom `Saver` specifies the persisted representation. Store input/IDs, then reconstruct
loaded data; do not serialize a repository, large list or Activity reference.

```kotlin
import androidx.compose.runtime.Composable
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.listSaver
import androidx.compose.runtime.saveable.rememberSaveable

data class FilterDraft(val query: String, val categoryId: String)

private val FilterDraftSaver = listSaver<FilterDraft, String>(
    save = { listOf(it.query, it.categoryId) },
    restore = { FilterDraft(query = it[0], categoryId = it[1]) },
)

@Composable
fun rememberFilterDraft(): MutableState<FilterDraft> =
    rememberSaveable(stateSaver = FilterDraftSaver) {
        mutableStateOf(FilterDraft(query = "", categoryId = "all"))
    }
```

`stateSaver` saves the value inside `MutableState`; `saver` is for saving the returned
object itself. Saved state is restoration support, not long-term persistence. If inputs
should reset the value, pass them to `rememberSaveable` deliberately; a changing initial
argument is not automatically reapplied. Test recreation and the chosen reset behavior.

Source: [state saving](https://developer.android.com/develop/ui/compose/state-saving).

## Cache calculations versus filter frequent updates

Plain parameters are not observable snapshot reads inside a retained closure. Cache a
pure calculation with every changing input; a mutable collection modified in place can
still invalidate that assumption. Pass immutable replacements or observe snapshot state.

```kotlin
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember

@Composable
fun rememberMatchingNames(names: List<String>, query: String): List<String> =
    remember(names, query) {
        names.filter { it.contains(query, ignoreCase = true) }
    }
```

For a cheap calculation use plain Kotlin instead. Use `derivedStateOf` when UI needs a
coarser result from frequently changing **snapshot** inputs:

```kotlin
import androidx.compose.foundation.lazy.LazyListState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.State
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.remember

@Composable
fun rememberShowScrollToTop(listState: LazyListState): State<Boolean> =
    remember(listState) {
        derivedStateOf { listState.firstVisibleItemIndex > 0 }
    }
```

Reading this Boolean in composition is normal. Its usefulness comes from the result
changing less often than the scroll position, not from avoiding reads. Do not create a new
`derivedStateOf` each composition or wrap ordinary parameter arithmetic by default.

## Observe snapshot changes without restarting on each value

Use an effect key for the observed holder, and `snapshotFlow` for its changing values.
This example reports entering the region beyond the first item, including an initial true
value if the effect starts while already scrolled. It does not log every scroll mutation.

```kotlin
import androidx.compose.foundation.lazy.LazyListState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.snapshotFlow
import kotlinx.coroutines.flow.collect
import kotlinx.coroutines.flow.filter

@Composable
fun ObserveScrolledRegion(listState: LazyListState, onEntered: () -> Unit) {
    val latestOnEntered by rememberUpdatedState(onEntered)
    LaunchedEffect(listState) {
        snapshotFlow { listState.firstVisibleItemIndex > 0 }
            .filter { it }
            .collect { latestOnEntered() }
    }
}
```

Keying `LaunchedEffect` by the index instead would cancel/restart its work as the index
changes; that is correct only when restart is intended. `snapshotFlow` already suppresses
equal results, is conflated state observation, and requires a read-only block. Composition
lifetime does not imply foreground lifecycle; add the appropriate lifecycle boundary when
background observation is unwanted.

## Register a listener and remove it from the same owner

```kotlin
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.rememberUpdatedState
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.LifecycleOwner

@Composable
fun ObserveScreenStart(owner: LifecycleOwner, onStarted: () -> Unit) {
    val latestOnStarted by rememberUpdatedState(onStarted)
    DisposableEffect(owner) {
        val observer = LifecycleEventObserver { _, event ->
            if (event == Lifecycle.Event.ON_START) latestOnStarted()
        }
        owner.lifecycle.addObserver(observer)
        onDispose { owner.lifecycle.removeObserver(observer) }
    }
}
```

The owner changes registration lifetime; the callback can change without a new registration.
`onDispose` is the final expression of the effect and releases the exact registered listener.
For ordered shared registries, this mechanism alone does not preserve logical ordering:
see [shared UI coordination](../../compose-ui-architecture/references/ui-coordination.md).

## Adapt a callback source and dispose the subscription

The illustrative source below serializes state changes, current-value reads and callback
delivery on the UI thread, and returns a close operation that stops delivery. Its callbacks
report changes in order. Match those assumptions to the actual
API; scheduling and thread-safe disposal are part of the source's contract.

```kotlin
import androidx.compose.runtime.Composable
import androidx.compose.runtime.State
import androidx.compose.runtime.key
import androidx.compose.runtime.produceState

interface DisplayNameSource {
    val currentName: String
    fun subscribe(onName: (String) -> Unit): AutoCloseable
}

@Composable
fun rememberDisplayName(source: DisplayNameSource): State<String> = key(source) {
    produceState(initialValue = source.currentName, key1 = source) {
        val subscription = source.subscribe { value = it }
        value = source.currentName
        awaitDispose { subscription.close() }
    }
}
```

Subscribe before re-reading the current value in the same UI-thread turn: the composition
read used for `initialValue` may be older by the time the producer starts. The second read
closes that gap; do not insert a suspension between subscription and the read. An external
API with different threading/ordering needs its own atomic current-value/subscription
contract or a correctly synchronized adapter.

The outer `key` creates a new state location when the source changes, so the old source's
value is not reused as the new source's initial value. Without it, a restarted producer
retains the existing State until it writes a replacement; choose that behavior explicitly.
`produceState` cancels when its keys change or its location leaves composition. For an
existing Flow, prefer the appropriate collect-as-state adapter rather than wrapping it in
another callback bridge. Equal state values do not imply delivery of every callback event.

## Publish committed UI state; do not launch work per recomposition

```kotlin
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect

interface SelectionSink { var selectedId: String }

@Composable
fun PublishSelection(selectedId: String, sink: SelectionSink) {
    SideEffect { sink.selectedId = selectedId }
}
```

The sink update must tolerate repetition. Starting a coroutine inside `SideEffect` would
start another job on every successful recomposition; use a correctly keyed `LaunchedEffect`
for suspend work or a composition-owned scope from an event handler. Do not count
recompositions by writing Compose state that the same UI renders; that creates more work.

## Make collection mutations observable

For composition-local mutable containers, the concrete APIs are `mutableStateListOf` and
`mutableStateMapOf`:

```kotlin
import androidx.compose.runtime.Composable
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.snapshots.SnapshotStateList
import androidx.compose.runtime.snapshots.SnapshotStateMap

@Composable
fun rememberSelectedIds(): SnapshotStateList<String> =
    remember { mutableStateListOf<String>() }

@Composable
fun rememberDraftsById(): SnapshotStateMap<String, String> =
    remember { mutableStateMapOf<String, String>() }
```

Event handlers can use `selectedIds.add(id)`, `selectedIds.remove(id)` or
`draftsById[id] = newText`; reads of affected snapshot state can then invalidate their
observers. These remembered containers alone do not save state across recreation.
Choose either immutable replacement through `MutableState<List<T>>` or such a snapshot-aware
collection. A remembered ordinary `MutableList` does not notify Compose. A snapshot list
observes insert/remove/set operations, not arbitrary mutation of a field inside an element.
For example, with immutable row values, replace the row at its index when its label changes;
with observable row objects, make the changing property snapshot state itself. Do not
mutate either model from the composable body as a side effect of rendering.

Review cases: key/source replacement, a new callback without re-registration, leave/re-enter,
configuration/process restoration, cancellation, and collection mutation versus replacement.
Sources: [state](https://developer.android.com/develop/ui/compose/state) and
[effects, keys, derived state and snapshotFlow](https://developer.android.com/develop/ui/compose/side-effects).
