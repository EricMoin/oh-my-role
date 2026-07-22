---
name: compose-ui-architecture
description: Applies Android Compose UI architecture with ViewModel, StateFlow, lifecycle-aware collection, UDF/MVI/MVVM, dependency injection, navigation boundaries, and feature/module organization.
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
fun rememberSearchStateHolder(searchRepo: SearchRepository): SearchStateHolder =
    remember(searchRepo) { SearchStateHolder(searchRepo, rememberCoroutineScope()) }
```
Not every screen needs a full ViewModel, but complex local state with business logic should still be extracted into a plain Kotlin state holder class. This keeps the composable body declarative, makes the logic unit-testable without Compose tooling, and survives recomposition cleanly through `remember`.
