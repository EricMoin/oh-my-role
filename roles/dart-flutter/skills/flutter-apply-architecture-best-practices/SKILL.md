---
name: flutter-apply-architecture-best-practices
description: Structure or refactor Flutter applications using project-appropriate architecture, state ownership, UI/data boundaries, dependency injection, and testable feature organization. Use when adding features, reshaping modules, or reviewing scalability.
---
# Architecting Flutter Applications

## Contents
- [Project-First Rule](#project-first-rule)
- [Architecture Baseline](#architecture-baseline)
- [Feature Workflow](#feature-workflow)
- [Examples](#examples)

## Project-First Rule

Before changing architecture, inspect the existing project:

- package/module layout
- state management (`ChangeNotifier`, Riverpod, Bloc, ValueNotifier, Redux, custom)
- routing (`Navigator`, `go_router`, auto_route, custom)
- dependency injection/service location
- DTO/domain/model conventions
- code generation and immutable model conventions
- test organization and fake/mock strategy

Follow established local patterns unless they are the source of the bug or the user explicitly asks for a redesign.

## Architecture Baseline

For new or unstructured projects, use this default baseline. Adapt names to local conventions.

- UI layer: widgets render state and forward user intents. Keep data fetching and business rules out of `build`.
- Presentation state: a ViewModel/controller/notifier/Bloc owns screen state, commands, loading, errors, and lifecycle-safe cancellation.
- Domain layer: add use cases only when business logic is reused or would clutter presentation state.
- Data layer: repositories expose domain-friendly APIs and hide API clients, databases, caches, retries, and synchronization.
- Models: keep API DTOs separate from domain models when transport nullability, naming, or shape should not leak into UI.
- Dependencies: inject clients, repositories, clocks, storage, and platform services so tests can replace them.

Acceptable state primitives include `ChangeNotifier`, `ValueNotifier`, Riverpod notifiers/providers, Bloc/Cubit, streams, or a local pattern already used by the app. Do not introduce a new framework just to satisfy the baseline.

## Feature Workflow

- [ ] Capture project conventions and target platforms.
- [ ] Define the user-facing state and commands for the feature.
- [ ] Add or update DTO/domain models only as needed.
- [ ] Implement service/repository boundaries with injectable dependencies.
- [ ] Add presentation state using the project's existing state approach.
- [ ] Build widgets as thin renderers of state.
- [ ] Add unit tests for business/data logic and widget tests for user-visible behavior.
- [ ] Run analyzer and relevant tests.

## Examples

### Repository Boundary

```dart
class UserRepository {
  UserRepository({required UsersApi api}) : _api = api;

  final UsersApi _api;

  Future<User> getUser(String id) async {
    final dto = await _api.fetchUser(id);
    return User(id: dto.id, displayName: dto.fullName);
  }
}
```

### Presentation State with `ChangeNotifier`

Use this shape only when it matches the project, or for small new apps that do not already have a state framework.

```dart
class ProfileViewModel extends ChangeNotifier {
  ProfileViewModel({required UserRepository userRepository})
      : _userRepository = userRepository;

  final UserRepository _userRepository;

  ProfileState _state = const ProfileState.idle();
  ProfileState get state => _state;

  Future<void> loadProfile(String id) async {
    _state = const ProfileState.loading();
    notifyListeners();

    try {
      final user = await _userRepository.getUser(id);
      _state = ProfileState.loaded(user);
    } catch (error, stackTrace) {
      _state = ProfileState.failed(error, stackTrace);
    }

    notifyListeners();
  }
}
```

### Thin Widget

```dart
class ProfileView extends StatelessWidget {
  const ProfileView({super.key, required this.viewModel});

  final ProfileViewModel viewModel;

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: viewModel,
      builder: (context, _) {
        return switch (viewModel.state) {
          ProfileIdle() || ProfileLoading() => const Center(
              child: CircularProgressIndicator(),
            ),
          ProfileLoaded(:final user) => Text(user.displayName),
          ProfileFailed() => const Text('Unable to load profile'),
        };
      },
    );
  }
}
```
