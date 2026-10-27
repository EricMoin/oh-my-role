# Screen state, actions and boundaries

Read only the pattern needed by the feature. Preserve the project's existing architecture;
these examples do not require adding Hilt, Koin, MVI, a domain layer or a new module.

## Turn a repository stream into screen state

The repository owns data access. The ViewModel maps it into an observable contract, and
the route collects that contract with lifecycle awareness. This illustrative ViewModel
requires AndroidX lifecycle-viewmodel-ktx and kotlinx-coroutines; the app supplies a real
repository through its existing DI/factory. An empty content list differs from loading.

```kotlin
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import java.io.IOException
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn

data class Topic(val id: String, val title: String)

interface TopicsRepository {
    fun observeTopics(): Flow<List<Topic>>
}

sealed interface TopicsUiState {
    object Loading : TopicsUiState
    data class Content(val topics: List<Topic>) : TopicsUiState
    object Unavailable : TopicsUiState
}

class TopicsViewModel(repository: TopicsRepository) : ViewModel() {
    val uiState: StateFlow<TopicsUiState> = repository.observeTopics()
        .map<List<Topic>, TopicsUiState> { TopicsUiState.Content(it) }
        .catch { failure ->
            if (failure !is IOException) throw failure
            emit(TopicsUiState.Unavailable)
        }
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(stopTimeoutMillis = 5_000),
            initialValue = TopicsUiState.Loading,
        )
}
```

This sample models mutually exclusive modes; it is not a complete retry/offline policy.
`catch` emitting a fallback completes that upstream attempt rather than retrying it. Use
the repository's refresh/retry contract when required. For a refreshing screen that must
keep old content, use a data class with content, refresh status and an error independently;
do not replace all content with Loading merely because another request began.

### Select the sharing lifetime

| Policy | When upstream runs | Decision consequence |
| --- | --- | --- |
| `Eagerly` | Starts immediately in the supplied scope | Useful when production must begin before a collector; may do offscreen work |
| `Lazily` | Starts at the first subscriber and continues until its scope ends | A later subscriber gap does not stop upstream |
| `WhileSubscribed` | Starts with subscribers; stops after the configured gap | Fits lifecycle-collected UI data when restarting is acceptable |

`stopTimeoutMillis` delays stopping after the last collector leaves. It can bridge short
configuration-change gaps; recomposition with the same collection does not itself require
a restart. The separate `replayExpirationMillis` controls when the cached value resets
after stopping; with `stateIn`, reset returns to `initialValue`. The default keeps the
cache. Decide stale-data display and refresh behavior explicitly, rather than treating
5 seconds as a correctness constant. Tests must subscribe to activate WhileSubscribed
upstream; simply reading `.value` is not a subscription.

For imperative state without an upstream stream, private `MutableStateFlow<UiState>` plus
public `asStateFlow()` is valid. Keep side effects outside atomic `update` lambdas, which
may run multiple times. UI collection belongs in the route; see the parent skill's
`ProfileRoute` example. Collecting with lifecycle awareness does not by itself stop a
producer deliberately shared eagerly or owned elsewhere.

Sources: [state production](https://developer.android.com/topic/architecture/ui-layer/state-production),
[architecture recommendations](https://developer.android.com/topic/architecture/recommendations), and
[WhileSubscribed](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/-sharing-started/-companion/-while-subscribed.html).

## Choose callbacks or an explicit action vocabulary

UDF describes ownership and direction. MVVM-style named methods and an MVI-style action
sink can both implement it. A few meaningful callbacks are usually simplest. A sealed
action is useful when the feature already has a coherent action vocabulary, or dispatch
needs exhaustive handling/logging; it does not require an event bus or another coordinator.

This independent plain-Kotlin reducer shows the contract without a framework:

```kotlin
data class FilterState(val query: String = "", val onlySaved: Boolean = false)

sealed interface FilterAction {
    data class QueryChanged(val value: String) : FilterAction
    data class SavedOnlyChanged(val value: Boolean) : FilterAction
}

fun reduceFilter(state: FilterState, action: FilterAction): FilterState = when (action) {
    is FilterAction.QueryChanged -> state.copy(query = action.value)
    is FilterAction.SavedOnlyChanged -> state.copy(onlySaved = action.value)
}
```

A ViewModel can call this reducer from `onAction`; for two fields it can also expose named
methods. A repository request or navigation is not a pure reducer operation. Logging
must handle sensitive action payloads deliberately; a sealed type is not automatic undo,
replay safety or exactly-once delivery.

For business-produced messages, retain the fact in state when loss is unacceptable and
acknowledge a specific message ID. Clear only the acknowledged ID, so completion of an
older snackbar cannot clear a newer one. Choose queueing/replacement and persistence
from the product contract. Immediate user navigation can be a route callback. See the
parent skill's Events and delivery section for lifecycle/cancellation caveats.

## Resolve dependencies at the lifetime boundary

| Existing setup | Concrete wiring to inspect |
| --- | --- |
| Hilt | `@HiltViewModel` and constructor `@Inject` on the ViewModel, bindings for repository interfaces, and the actual owner supplied to the composable ViewModel lookup |
| Koin | A ViewModel definition in the loaded module, repository lifetime, and the owner/key passed by the configured Compose integration |
| Manual DI | The screen's ViewModel factory, creation extras/SavedStateHandle support, and the chosen ViewModelStoreOwner |

Obtain the screen ViewModel at a route/graph boundary and pass state/actions to reusable
children. The default owner may be an Activity or navigation entry depending on context;
verify it rather than assuming a lookup helper always means a destination scope. A shared
flow such as checkout can deliberately use a parent graph owner. Repository DI scope is
separate and is not made navigation-scoped merely because a ViewModel consumes it.

Use the project's current integration artifacts/imports. Hilt/Koin APIs evolve independently
of the Compose BOM; verify the configured version before copying lookup syntax. Avoid the
old invalid shortcut of assigning `hiltViewModel()` to a repository-typed parameter.

## Keep navigation intent at the route boundary

A reusable product card emits `onOpen(productId)` or `onClick`; the route translates that
intent into the project's navigation API. The destination takes an ID and reconstructs
its data through its owner/repository. This keeps previews independent of a NavController.
Use the project's supported typed routes or argument encoding; concatenating arbitrary
user text into a route is not an argument protocol.

For a graph-scoped owner, verify back navigation, deep-link entry without earlier screens,
process restoration, and graph exit cleanup. Do not introduce a singleton just to avoid
passing an ID. Leaf callbacks are normal UDF, not evidence that a new coordinator is needed.

## Put module and data boundaries where they have a job

A possible existing feature structure is:

```text
app/                         application assembly and navigation host
core/ui/                     shared design primitives
core/data/                   data contracts and source-of-truth policy
feature/topics/              screen, state owner, UI models and tests
feature/profile/             its own cohesive feature
```

This is an example, not a requirement to split packages into Gradle modules or to add
`data/domain/presentation` directories everywhere. Extract shared contracts into an owner
that avoids cycles; do not make feature A import B's internals merely for one reusable row.
An application assembly layer can connect feature navigation callbacks.

A repository read API can expose `Flow<DomainValue>` from a local source of truth while
an explicit refresh writes remote results into it. Define error/freshness/conflict behavior;
an unused injected `remote` field does not implement synchronization. Map DTOs when wire
names, nullable transport fields, timestamps or pagination details would otherwise leak
into screen policy. Do not add a duplicate model where the existing domain value already
fits. A use case earns its place by coordinating a real domain responsibility, not by
forwarding one repository call or providing test access.

Source: [offline-first data layer](https://developer.android.com/topic/architecture/data-layer/offline-first).
