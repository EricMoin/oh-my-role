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

| Antipattern | Fix |
|-------------|-----|
| ViewModel holding `TextField` values | Use Compose local state (`remember`) for pure UI state |
| Flow collection without lifecycle awareness | Use `collectAsStateWithLifecycle()` |
| Giant NavHost single file (>300 lines) | Split by feature with `NavGraphBuilder` extension functions |
| Sharing ViewModel across screens | Use shared Repository, not shared ViewModel |
