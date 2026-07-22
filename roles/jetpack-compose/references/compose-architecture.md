# Compose Architecture Patterns

This reference covers the architectural patterns, ViewModel conventions, DI strategies, and module organization practices idiomatic to Jetpack Compose and modern Android development.

---

## 1. ViewModel Patterns

### ViewModel + StateFlow (Recommended)

```kotlin
class SettingsViewModel @Inject constructor(
    private val repo: PreferencesRepository
) : ViewModel() {
    private val _uiState = MutableStateFlow(SettingsUiState())
    val uiState: StateFlow<SettingsUiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            repo.themeMode.collect { mode ->
                _uiState.update { it.copy(themeMode = mode) }
            }
        }
    }
}
```

### State Collection in Compose

```kotlin
@Composable
fun SettingsScreen(viewModel: SettingsViewModel = hiltViewModel()) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
}
```

`collectAsStateWithLifecycle()` pauses collection when the lifecycle is stopped. Prefer it over `collectAsState()`.

### SharingStarted Patterns

```kotlin
val flow = repo.observeData().stateIn(
    scope = viewModelScope,
    started = SharingStarted.WhileSubscribed(5_000),
    initialValue = emptyList()
)
```

`WhileSubscribed` with a timeout keeps the upstream active for a grace period, allowing rapid recomposition without re-subscribing.

---

## 2. UDF / MVI / MVVM Comparison

| Pattern | State Direction | Event Direction |
|---------|----------------|----------------|
| **MVVM** | ViewModel → UI (StateFlow) | UI → ViewModel (function call) |
| **MVI** | ViewModel → UI (single StateFlow) | UI → ViewModel (sealed Intent/Event) |
| **UDF** | Single source of truth, events flow up, state flows down (principle, not library) |

### MVVM — simplest, most common

```kotlin
fun onSearchQueryChanged(query: String) { _uiState.update { it.copy(query = query) } }
```

### MVI — explicit intents

```kotlin
sealed interface SettingsIntent {
    data class ToggleDarkMode(val enabled: Boolean) : SettingsIntent
}
class SettingsViewModel : ViewModel() {
    fun onIntent(intent: SettingsIntent) = when (intent) {
        is SettingsIntent.ToggleDarkMode -> handleDarkMode(intent.enabled)
    }
}
```

MVI adds ceremony but makes every user action explicit — useful for analytics, logging, or undo stacks.

---

## 3. Dependency Injection

### Hilt (Recommended)

```kotlin
@HiltViewModel
class ProfileViewModel @Inject constructor(
    private val userRepository: UserRepository
) : ViewModel() { ... }

@Composable
fun ProfileScreen(viewModel: ProfileViewModel = hiltViewModel()) { ... }
```

`hiltViewModel()` scopes the ViewModel to the NavBackStackEntry — correct for Navigation Compose.

### Koin (Lighter alternative)

```kotlin
val profileModule = module {
    viewModel { ProfileViewModel(get()) }
}
@Composable
fun ProfileScreen(viewModel: ProfileViewModel = koinViewModel()) { ... }
```

Koin has no annotation processing — faster builds but no compile-time validation.

---

## 4. Feature / Module Organization

### Feature-First Structure

```
app/src/main/java/com/example/app/
  core/
    theme/           # Material 3 theme, ColorScheme, Typography
    navigation/      # NavHost, route definitions
    ui/              # Shared composables (AppBar, BottomNav)
  features/
    auth/
      data/          # AuthRepository, AuthApiClient
      domain/        # User, AuthState
      presentation/  # LoginScreen, LoginViewModel, AuthUiState
    profile/
      data/
      domain/
      presentation/
```

### Multi-Module Dependency Rules

- `:feature:*` depends on `:core:*` only (never on another feature)
- `:feature:*` exposes a single `*Navigation` interface (route + NavGraphBuilder extension)
- `:app` assembles features and configures the navigation graph

---

## 5. Repository Pattern

```kotlin
interface UserRepository {
    fun getUser(id: String): Flow<User>
}

class UserRepositoryImpl @Inject constructor(
    private val remote: UserApi,
    private val local: UserDao,
    private val mapper: UserMapper
) : UserRepository {
    override fun getUser(id: String): Flow<User> =
        local.observeUser(id).map { mapper.entityToDomain(it) }
}
```

### DTO ↔ Domain Boundary

Transport DTOs model the API wire format. Domain models model business logic. UI code should never import a DTO directly.

---

## 6. Antipatterns

| Antipattern | ❌ Symptom / Bad Code | ✅ Correct Approach |
|-------------|------------------------|---------------------|
| **God Composable** — single `@Composable` with 400+ lines doing layout, logic, and state | `@Composable fun HomeScreen() { /* layout + network call + state + nav all inline */ }` | Split by responsibility: `HomeScreen` (layout), `HomeViewModel` (state), `HomeUiState` (data), `HomeRepository` (data layer) |
| **UI layer DTO leak** — passing raw API response to composables | `@Composable fun UserCard(dto: UserResponseDto)` | Map DTO → domain model in repository: `UserCard(user: User)`. UI never imports `*Dto` classes. |
| **Shared Mega ViewModel** — one ViewModel serving 5+ screens | `class AppViewModel : ViewModel()` shared across Login, Home, Profile, Settings, Detail | One ViewModel per screen or feature scope. Share data through a common **Repository**, not a common ViewModel. |
| **Business logic in composable** — `@Composable` calling `api.fetchPosts()` or `db.insert()` | `@Composable fun PostList() { val posts = api.fetchPosts() }` | Move data access to Repository → ViewModel. Composables observe `StateFlow` and call `viewModel.onAction(…)`. |
| **Bidirectional data flow** — parent passes mutable state down, child mutates it directly | `@Composable fun Child(state: MutableState<Int>)` | Pass **read-only** state down (`State<Int>` or `Int`), call **events** up (`onValueChanged: (Int) -> Unit`). Always UDF. |
| **Coroutine launched in composable without scope** | `LaunchedEffect(Unit) { GlobalScope.launch { … } }` or `rememberCoroutineScope().launch { … }` for side effects | `LaunchedEffect(key)` for composable-scoped coroutines; `viewModelScope` for ViewModel work. `rememberCoroutineScope()` only for user-triggered actions (click/motion). |
| **State stored in Activity** — `var user: User` in Activity, composable reads it | `(context as MainActivity).currentUser` inside a composable | Hoist state to a ViewModel scoped to the NavBackStackEntry. Composables receive state as parameters or `collectAsStateWithLifecycle()`. |
| **Navigation args pass large objects** — passing entire user model as nav argument | `navController.navigate("detail/$user")` with whole object serialized | Pass only **primitive IDs**: `navController.navigate("detail/${user.id}")`. Fetch data from Repository in the destination ViewModel. |
| **CompositionLocal for business data** — `LocalUser`, `LocalCart`, `LocalSession` | `CompositionLocalProvider(LocalUser provides user) { Content() }` | CompositionLocal is for **scaffold/theme values** (colors, density). Use ViewModel + explicit parameter passing for business data. |
| **Loading data in `init{}` instead of lazily** — ViewModel fires network request in `init{}` before anyone needs it | `init { viewModelScope.launch { _state.value = Loading; _state.value = Success(repo.fetch()) } }` | Defer until first subscriber with `stateIn(SharingStarted.WhileSubscribed(5000))` or `lazy` init. Prevents wasted work on config-change recreate. |
| **Event replay / one-shot events not consumed** — `SharedFlow`/`Channel` events re-delivered on recomposition or never consumed | `val events: SharedFlow<OneShotEvent> = _events` collected in composable — fires again on recomposition | Use `Channel` (consume exactly once) or `SnapshotFlow`-based approach. Consume events in a `LaunchedEffect` with a sentinel, not in the composition tree. |
| **ViewModel holding Context / resources** | `class MyViewModel(val context: Context) : ViewModel()` | Inject `Application` (not `Context`) via `AndroidViewModel`, or inject domain-level dependencies (Repository, DataStore). Resource strings belong in Compose. |
| **God UiState** — single data class with 20+ fields for an entire screen | `data class HomeUiState(val posts: List<Post>, val filter: Filter, val user: User, val cart: Cart, val loading: Boolean, …)` | Split by sub-screen or widget: `FeedSection`, `FilterSection`, `UserSection`. Nest sections within the screen state only when they share load/error transitions. |
| **Skipping domain layer — calling data source directly from ViewModel** | `class PostViewModel(repo: PostRepository) : ViewModel()` where `PostRepository` is actually `PostApiImpl` doing raw HTTP | Always have a `domain` package: `PostViewModel(domain: GetPostsUseCase)`. UseCase orchestrates Repository. Keeps data source swappable and ViewModel testable. |
| **ViewModel holding `TextField` values** | `_uiState.update { it.copy(email = newEmail) }` on every keystroke | Use Compose local state (`var email by remember { mutableStateOf("") }`) for pure UI state. Report to ViewModel only on submit / validation. |
| **Flow collection without lifecycle awareness** | `val state by viewModel.uiState.collectAsState()` | Use `collectAsStateWithLifecycle()` from `lifecycle-runtime-compose`. Pauses collection when lifecycle is stopped — saves resources. |
| **Giant `NavHost` single file (>300 lines)** | All route declarations, navigation logic, and argument parsing in one `NavHost { }` block | Split by feature: `fun NavGraphBuilder.authNavGraph()`, `NavGraphBuilder.profileNavGraph()`. Each feature owns its routes. |
| **Sharing ViewModel across screens** | Two screens both instantiate or share `SharedViewModel` directly | Share a **Repository** scoped to the parent NavBackStackEntry. Each screen gets its own ViewModel and reads from the shared data source. |
