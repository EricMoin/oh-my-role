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

## Validation Checklist

- [ ] UI state flows down and events flow up.
- [ ] Composables render state and delegate business work.
- [ ] ViewModel exposes immutable state and hides mutable implementation.
- [ ] One-off effects are not stored as permanent UI state.
- [ ] Navigation uses stable arguments and handles recreation.
- [ ] The implementation follows existing project architecture and DI conventions.
