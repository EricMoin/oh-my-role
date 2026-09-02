---
name: compose-ui-architecture
description: Applies Android Compose UI architecture with ViewModel, StateFlow, lifecycle-aware collection, UDF/MVI/MVVM, deciding where screen logic lives (ViewModel vs plain UI-logic state holder vs presenter) and how events flow (method references or sealed event sinks), dependency injection, navigation boundaries, and feature/module organization. Use when structuring Compose screens, wiring ViewModels, deciding whether to extract orchestration into a state holder, setting up navigation graphs, organizing feature modules, architecting new Compose features, or when a parameter/flag is being threaded through composable signatures that never consume it (prop drilling) and the fact should live on an existing state holder instead.
---
# Compose UI Architecture

Compose architecture should make state flow obvious, keep rendering declarative, and isolate Android/platform effects from business rules.

## Recommended Shape

Use unidirectional data flow for screens:

```text
User action -> UI event -> ViewModel -> use case/repository -> immutable UiState -> composables
```

The names may vary by project: MVVM, UDF, reducer, presenter, or MVI. Keep the underlying contract consistent.

## Screen Contract

A screen-level composable should usually have two layers:

- Route/container composable: obtains ViewModel, collects state with lifecycle awareness, wires navigation and one-off effects.
- Content/stateless composable: receives immutable state and callbacks, renders UI, and is easy to preview/test.

```kotlin
@Composable
fun ProfileRoute(
    onBack: () -> Unit,
    viewModel: ProfileViewModel = hiltViewModel(),
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()

    ProfileScreen(
        state = state,
        onAction = viewModel::onAction,
        onBack = onBack,
    )
}

@Composable
fun ProfileScreen(
    state: ProfileUiState,
    onAction: (ProfileAction) -> Unit,
    onBack: () -> Unit,
) {
    // Render only.
}
```

## ViewModel Rules

- Expose a single immutable `StateFlow<UiState>` or a small number of clearly related flows.
- Keep mutable state private: `private val _uiState = MutableStateFlow(...)`.
- Use `viewModelScope` for screen-level async work.
- Convert repositories/domain flows to UI state in the ViewModel.
- Keep Android UI types out of ViewModel state unless the project already standardizes on them.
- Avoid exposing raw repositories, mutable flows, or suspend functions directly to composables.

## UiState Design

Prefer explicit states over nullable clusters.

```kotlin
sealed interface FeedUiState {
    data object Loading : FeedUiState
    data class Content(
        val items: List<FeedItemUiModel>,
        val isRefreshing: Boolean,
    ) : FeedUiState
    data class Error(val message: String) : FeedUiState
}
```

Use a single data class when the screen has many independent fields and no exclusive modes. Use sealed states when modes are mutually exclusive and drive materially different UI.

## Events and Effects

State is for durable UI facts. Effects are for one-time work such as navigation, snackbar messages, permission prompts, or opening system UI.

Preferred options:

- Callback to parent for navigation when the event is immediate and local.
- `SharedFlow` or `Channel` from ViewModel for one-off UI effects when business logic decides the effect.
- Event wrapper objects only if the project already uses that pattern.

Collect one-off effects in a `LaunchedEffect(Unit)` and keep lifecycle behavior explicit.

## Dependency Injection

- Follow the existing DI framework: Hilt, Koin, manual factories, or another local convention.
- Inject repositories/use cases into ViewModels.
- Do not resolve dependencies in deep composables unless they are composition-local UI dependencies such as theme, strings, or ambient services.
- Use `CompositionLocal` sparingly for cross-cutting UI concerns, not as a general service locator.

## Module and Feature Boundaries

- Co-locate screen UI, UI models, actions, and tests by feature when the app is feature modularized.
- Keep design-system primitives in a shared UI/design module.
- Keep repositories and domain models out of feature UI modules unless the architecture intentionally uses vertical slices.
- Avoid circular dependencies by defining interfaces at the boundary that owns the abstraction.

## Navigation

- Keep navigation decisions close to the route/screen boundary.
- Pass stable IDs and simple arguments between destinations, not large mutable models.
- Let destination ViewModels load their own data from IDs.
- Treat deep links and process recreation as first-class navigation paths.

## Workflow

1. Inspect current architecture, DI, navigation, and naming conventions.
2. Define the screen contract: `UiState`, user actions, and one-off effects.
3. Implement or update the ViewModel to own state and async work.
4. Keep composables stateless where possible and split route from content.
5. Add previews for content states and tests for ViewModel state transitions.
6. Verify lifecycle collection and process/configuration recreation behavior.

## Common Mistakes (❌/✅)

### 1. One giant ViewModel shared across unrelated screens

❌ **Wrong** — a single ViewModel accumulating state for many screens, coupling them through a shared dependency graph:
```kotlin
@HiltViewModel
class AppViewModel @Inject constructor(
    private val userRepo: UserRepository,
    private val feedRepo: FeedRepository,
    private val settingsRepo: SettingsRepository,
) : ViewModel() {
    val userState: StateFlow<UserUiState>
    val feedState: StateFlow<FeedUiState>
    val settingsState: StateFlow<SettingsUiState>
    // grows without bound; every screen pays the DI cost for every dependency
}
```
✅ **Correct** — one ViewModel per screen (or per tightly related screen group when state genuinely overlaps):
```kotlin
@HiltViewModel
class FeedViewModel @Inject constructor(
    private val feedRepo: FeedRepository,
) : ViewModel() {
    private val _uiState = MutableStateFlow(FeedUiState.Loading)
    val uiState: StateFlow<FeedUiState> = _uiState.asStateFlow()
}
```
A mega-ViewModel becomes a coupling nexus: changing one screen's logic risks breaking another, every screen pays the injection cost for every dependency, and removed screens leave dead entangled code. Screen-scoped ViewModels bound scope, simplify testing, and keep navigation/recreation semantics predictable.

---

### 2. Leaking DTOs or network-layer models into UI state

❌ **Wrong** — raw API response types exposed directly to composables, forcing display logic into the UI layer:
```kotlin
data class FeedUiState(
    val posts: List<PostResponseDto>,  // network field names, nullable wrapper types, raw timestamps
    val pageInfo: PaginationMetaDto,
)
```
✅ **Correct** — map to flat, display-ready UI models at the ViewModel boundary:
```kotlin
data class FeedUiState(
    val posts: List<PostUiModel>,
    val nextPageCursor: String?,
)

data class PostUiModel(
    val id: String,
    val authorName: String,
    val relativeTime: String,
    val bodySnippet: String,
)
```
DTOs carry network concerns (snake_case, nullable wrappers, raw timestamps) that pollute composable code with mapping, null checks, and formatting. A ViewModel's job is to convert domain/data-layer models into UI models that composables display without transformation.

---

### 3. Injecting repositories directly into composables

❌ **Wrong** — resolving a data-layer dependency inside the composable tree, bypassing the ViewModel layer:
```kotlin
@Composable
fun PostDetailRoute(
    postId: String,
    repository: PostRepository = hiltViewModel(), // or entryPoint.get()
) {
    val post by repository.getPost(postId).collectAsStateWithLifecycle(null)
    // composable now owns data fetching, error handling, and async lifecycle
}
```
✅ **Correct** — inject repositories into a ViewModel; composables consume only immutable UiState:
```kotlin
@HiltViewModel
class PostDetailViewModel @Inject constructor(
    private val repository: PostRepository,
) : ViewModel() {
    private val _uiState = MutableStateFlow<PostDetailUiState>(PostDetailUiState.Loading)
    val uiState: StateFlow<PostDetailUiState> = _uiState.asStateFlow()
}

@Composable
fun PostDetailRoute(
    postId: String,
    viewModel: PostDetailViewModel = hiltViewModel(),
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    PostDetailScreen(state)
}
```
Composables should not own async lifecycle, error recovery, or data-layer dependencies. A ViewModel survives configuration changes and provides a process-death safety boundary; a composable does neither.

---

### 4. Storing one-shot events as persistent `UiState` fields

❌ **Wrong** — a navigation or snackbar event stored as a `Boolean`/`String?` field that the composable must reset:
```kotlin
data class CheckoutUiState(
    val navigateToReceipt: Boolean = false,   // composable must mutate state to clear it
    val snackbarMessage: String? = null,
)
```
✅ **Correct** — use `SharedFlow` or `Channel` for one-off effects that are consumed exactly once:
```kotlin
// In ViewModel
private val _events = Channel<CheckoutEvent>(Channel.BUFFERED)
val events = _events.receiveAsFlow()

// In composable
LaunchedEffect(Unit) {
    viewModel.events.collect { event ->
        when (event) {
            is CheckoutEvent.NavigateToReceipt -> onNavigateToReceipt(event.orderId)
        }
    }
}
```
One-shot signals stored in state break the state-equals-UI contract: after the composable acts on `navigateToReceipt = true`, it must set it back to `false`, creating a race condition and an untruthful state snapshot. Events are not state — use a flow or channel so they are consumed once and discarded.

---

### 5. Navigation logic embedded deep inside composables

❌ **Wrong** — a nested composable directly invokes `navController.navigate()`, coupling it to a specific navigation library:
```kotlin
@Composable
fun ProductCard(product: Product, navController: NavController) {
    Card(onClick = { navController.navigate("detail/${product.id}") }) { /* ... */ }
}
```
✅ **Correct** — bubble intent up via a callback; let the route-level composable decide navigation:
```kotlin
@Composable
fun ProductCard(product: Product, onClick: () -> Unit) {
    Card(onClick = onClick) { /* ... */ }
}

// At route level:
ProductCard(product = product, onClick = { onNavigateToDetail(product.id) })
```
A composable that receives `NavController` is tied to a specific navigation library and route graph. Callbacks keep leaf composables reusable across screens, previewable without a NavHost, and testable in isolation. Navigation decisions belong at the outermost route layer.

---

### 6. Skipping per-screen state holders for complex local state

❌ **Wrong** — business logic and multiple `remember` blocks scattered directly in a composable body with no extraction:
```kotlin
@Composable
fun SearchRoute() {
    var query by rememberSaveable { mutableStateOf("") }
    var suggestions by remember { mutableStateOf(emptyList<String>()) }
    var isSearching by remember { mutableStateOf(false) }

    LaunchedEffect(query) {
        if (query.length >= 3) {
            isSearching = true
            suggestions = searchRepo.search(query)
            isSearching = false
        }
    }
    // layout mixed with state management
}
```
✅ **Correct** — extract state and logic into a plain Kotlin class with `@Stable`, instantiated via `remember`:
```kotlin
@Stable
class SearchStateHolder(
    private val searchRepo: SearchRepository,
    private val scope: CoroutineScope,
) {
    var query by mutableStateOf("")
        private set
    var suggestions by mutableStateOf(emptyList<String>())
        private set
    var isSearching by mutableStateOf(false)
        private set

    fun onQueryChanged(newQuery: String) {
        query = newQuery
        if (query.length >= 3) {
            scope.launch {
                isSearching = true
                suggestions = searchRepo.search(query)
                isSearching = false
            }
        }
    }
}

@Composable
fun rememberSearchStateHolder(searchRepo: SearchRepository): SearchStateHolder {
    val scope = rememberCoroutineScope()
    return remember(searchRepo, scope) { SearchStateHolder(searchRepo, scope) }
}
```
Not every screen needs a full ViewModel, but complex local state with business logic should still be extracted into a plain Kotlin state holder class. This keeps the composable body declarative, makes the logic unit-testable without Compose tooling, and survives recomposition cleanly through `remember`. Note `rememberCoroutineScope()` is a `@Composable` call: obtain it in the composable body and pass it in — never call it inside the `remember { }` lambda (a non-composable context).

---

### 7. Choosing where screen logic lives — don't reach past the simplest rung

Two opposite failures share one root cause: not matching the tool to the need.

❌ **Over-abstraction** — wrapping a plain screen in a "Coordinator"/"Presenter"/"Manager" whose methods only forward to the ViewModel:
```kotlin
@Stable
class ProfileCoordinator(private val vm: ProfileViewModel) {
    fun onRefresh() = vm.refresh()
    fun onSave(draft: Draft) = vm.save(draft)   // pure delegation — adds a layer, buys nothing
}
```
The ViewModel already *is* the state holder. If the wrapper only forwards, delete it and pass method references: `ProfileScreen(onRefresh = vm::refresh, onSave = vm::save)`.

❌ **Under-abstraction** — the god-composable: 5+ collaborators captured into `remember(...)`-keyed event lambdas with `rememberUpdatedState` shadows. The long key list is the smell (see `compose-runtime-state` → strong skipping).

✅ **Pick the lowest rung that removes the pain.** Escalate only when the current rung actually hurts:

| The situation | Where the logic goes | Precedent |
| --- | --- | --- |
| Screen state + events whose logic fits in the ViewModel (the common case) | ViewModel; composable passes `vm::method` refs. **No extra holder.** | Now in Android |
| Local UI-element state (expanded, query text) with a little logic | Hoisted state, or a small `@Stable` holder via `remember` | AndroidX `DrawerState` |
| Complex *UI* logic (multi-step sequencing, gestures, animation) that depends on UI-scoped objects — a `View`, Compose snapshot state, the composition scope — and therefore **cannot** live in the ViewModel | Plain `@Stable` UI-logic state holder, composition-scoped | Google state-holder guidance; NiA `NiaAppState` |
| A large callback surface over an existing sealed-action vocabulary | Optionally collapse the `onX` bag into one `onEvent(SealedEvent)` sink — **orthogonal** to whether a holder exists | the ViewModel's own `Action`/`executeAction` |
| The team wants all screen logic as testable, runtime-driven presenters | Presenter-as-composable — a **project-wide** architecture bet, not a per-screen move | Slack Circuit, Cash App Molecule |

The plain UI-logic state holder (rung 3), when justified:
```kotlin
@Stable
class RecorderUiState(          // name it for its job; "Coordinator"/"Presenter" are just conventions
    private val vm: RecorderViewModel,
    private val surface: CaptureSurface,   // wraps an Android View — must not enter the ViewModel
    private val scope: CoroutineScope,     // reuse the composition/session scope, not a new one
) {
    fun onEvent(e: RecorderEvent) { /* imperative sequencing that needs surface + scope */ }
}
```
Load-bearing rules, most important first:
- **Justify the rung.** Extract a holder only when BOTH hold: the UI logic is genuinely complex *and* it depends on UI-scoped objects the ViewModel must not hold. If it is just "many fields," a data class of hoisted state is enough; if the logic has no UI-scoped dependency, it belongs in the ViewModel.
- **Keep it cohesive — one screen concern.** A holder that accumulates unrelated duties (capture + navigation + analytics + permissions) is a god object wearing a new name; split it or push parts back to the ViewModel/leaves. Relocating a mess is not fixing it.
- **Composition-scoped, not a ViewModel.** It coordinates composition-lifetime objects, so it must not survive configuration changes and must not leak `View` references. Reuse the session/composition scope so a `remember` key change doesn't cancel in-flight work.
- **Keep declarative effects in the composable.** Move only imperative sequencing into the holder; `LaunchedEffect` / `collectAsStateWithLifecycle` stay in the UI.
- **Refresh, don't capture, mutable callbacks.** If the holder exposes `var onX` callbacks, reassign them each recomposition in the `remember…` factory (this replaces `rememberUpdatedState`, and is why the key list shrinks); read them only inside event handlers, never during composition (an untracked read on a `@Stable` class corrupts the skip decision).

---

### 8. Coordinating peer UI instances — arbitrate in the shared owner, don't cross-suppress

The situation: two (or more) instances of the same component are alive at once — a base screen's bar plus an overlay's borrowed copy, duplicate panes in list-detail, a dialog re-hosting a shared editor — and they compete for a singleton concern routed through a shared object: focus requests, back handling, an event stream, an exclusive resource. Exactly one instance must win at any moment.

❌ **Wrong** — one side (or an orchestrator) observes the other side's visibility and suppresses the loser. The suppression signal travels through whatever channel is handy — a threaded parameter, a `CompositionLocal` flag, a toggle on a shared manager — but all variants share the flaw: peers that should be ignorant of each other are now coupled through a visibility fact, and every new peer multiplies the suppression wiring:
```kotlin
// Orchestrator flips the loser off when the winner appears — coupling, whatever the channel
SharedInputManager.setBaseBarEventsEnabled(!overlayVisible)
```
Note what the flag really is: `baseBarEventsEnabled` sounds generic, but its semantics are "feature X's overlay is currently showing" — one feature's situation baked into a shared component under a neutral name. The shared component now carries knowledge only one caller understands, and the next overlay feature will add a second flag rather than reuse anything. Shared components accept changes expressed in their own vocabulary (identity, ordering, arbitration — general capabilities); they must not accept encodings of a particular caller's circumstances.

❌ **Also wrong** — pre-declaring a static priority registry (enum of layers, priority ints) for what is really a dynamic stacking order. Every future overlay scenario must edit the registry, which decays into a manually sorted global list:
```kotlin
enum class InputLayer { Base, Overlay /*, Overlay2, Dialog, ...? */ }
```

✅ **Correct** — move the exclusivity into the shared owner as a *derived* rule over facts the participants declare about themselves only:
```kotlin
// Shared owner keeps an ordered stack keyed by a STABLE identity (the surface/state-holder
// object, not the composable instance). Router picks the topmost live entry.
fun register(owner: Any, handler: Handler): Unregister { /* same owner ⇒ replace in place */ }
private fun route(event: Event) = entries.lastOrNull { it.live }?.handler?.invoke(event)
```
Three properties make this the right shape, and each is a test you can apply to any competing design:
- **Ownership**: the winner is computed by the shared object's single rule; no participant knows another exists. Adding a third overlay requires zero changes to existing code.
- **Emergence**: stacking order comes from actual mount order (a dynamic fact derived at runtime), not from a static registry someone must maintain.
- **Identity**: registration is keyed to the stable logical owner. A composable that remounts (via `AnimatedContent`, `if` branches, mode switches) is a *content refresh*, not a new participant — same-owner re-registration must update in place, never re-push to the top. Binding lifecycle to the composable instance is how "last registered wins" silently becomes "last remounted steals".

The precedent is `BackHandler` / `OnBackPressedDispatcher`: every handler registers into a shared dispatcher; the innermost enabled one wins; nobody suppresses anybody. When you find yourself threading an `enabled`-style flag from one feature into another feature's component, stop and ask which shared object should own the arbitration instead.

The one-sentence test tells the two shapes apart before any code is written: "add a flag so the *camera overlay* can win focus" names a feature — special case; "let the router pick the topmost live surface" names a capability any future participant uses for free — general. The general solution is rarely more code; it differs only in where the change lands (arbitration rule in the shared owner) versus where the special case lands (feature knowledge smeared across participants).
- **A refactor preserves behavior.** When relocating logic, keep *where* gating happens and any conditional guards intact — moving a guard by accident is a behavior change, not a refactor.

---

### 9. Threading a decision through signatures that don't consume it (prop drilling past a state holder)

The situation: a top-level composable owns a mechanism (an animation state, a transition controller, a manager) and derives from it a fact that only a deeply nested layer consumes — "hide this layer while the overlay flies". The instinctive move is to compute the decision at the top and thread it down as a parameter.

❌ **Wrong** — encode the decision where the mechanism lives, then drill it through every signature in between:
```kotlin
// Top level knows the animation…
ScreenRoot {
    ScreenContent(
        // hide the review layer while the retake transition is flying
        reviewContentAlpha = { if (retakeFlight.isRunning) 0f else 1f },
        /* … */
    )
}
// …and every layer between decision and consumption carries a value it never reads:
private fun ScreenContent(/* … */, reviewContentAlpha: () -> Float, /* … */)
private fun ReviewLayer(/* … */, contentAlpha: () -> Float, /* … */)  // finally consumed here
```
Two smells compound. The middle signatures carry a parameter they neither understand nor consume — each is a level the *feature knowledge* ("a retake flight animation exists") has leaked into. And the parameter encodes the **why** (a specific animation is running) instead of the **what** (this layer must not draw its content right now), so no future transition can reuse it without another parameter.

✅ **Correct** — name the invariant first ("the same content must never be drawn by both the layer and the transition overlay"), then record it as a fact on the `@Stable` state holder that is *already threaded through the same path*, expressed in the holder's own vocabulary:
```kotlin
@Stable
class CaptureReviewState {
    /** Content is "borrowed" by a transition overlay: set at takeoff, returned when the animation settles. */
    var contentInFlight by mutableStateOf(false)
}

// Write where the orchestration already lives — the same event handler that starts the animation:
if (retakeFlight.start(/* … */)) review.contentInFlight = true   // and reset on Phase.Idle / clearReview()

// Read at the consumption point — no signature between them changes:
ReviewStackContent(
    modifier = Modifier.graphicsLayer { alpha = if (review.contentInFlight) 0f else 1f },
)
```

Load-bearing rules:

- **Check the pipeline before adding a parameter.** If a `@Stable` state holder already flows from the decision point to the consumption point, the fact belongs on the holder — a new parameter that merely rides alongside it is a duplicate channel. The strongest smell: the holder and the new parameter appear in the *same* signatures.
- **Translate mechanism into fact at the boundary.** The orchestration point (which knows the animation) writes a mechanism-free fact (`contentInFlight`); the consumer reads only the fact. Neither middle layers nor the consumer ever learn the animation exists — a future "enter editor" flight reuses the same fact for free.
- **Name the fact in the holder's vocabulary, not the feature's.** `contentInFlight` ("my content is delegated to an overlay") is a capability any transition can use; `retakeAnimationRunning` is feature knowledge wearing a state-holder field. Same boolean, opposite architecture — this is the same neutrality test as mistake #8.
- **Preserve the read-site performance contract.** A `() -> Float` lambda parameter is usually there to defer the read to the draw phase. Reading snapshot state inside `graphicsLayer {}` / `drawBehind {}` keeps exactly that property — draw-phase read, zero recomposition — so the refactor loses nothing.
- **Don't "fix" drilling by passing the mechanism down.** Handing `retakeFlight` itself to the content layer removes the lambda but inverts the coupling: now the content tree knows the animation machinery. That is strictly worse than the parameter.
- **Plain one-hop data flow is not drilling.** Passing state to a direct stateless child is normal Compose. The smell threshold is a **non-consuming middle layer** carrying a value derived from a mechanism the consumer shouldn't know about.

The one-sentence test, same shape as mistake #8: "thread `reviewContentAlpha` so the *retake animation* can hide the layer" names a feature — special case; "the review state records when its content is borrowed by an overlay" names a capability — general. When the first idea for a coordination problem is a flag or lambda threaded through signatures, stop and ask which object already in the pipeline should own the fact.
