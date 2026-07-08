# Flutter Architecture Reference

This document is the domain knowledge base for Flutter app architecture. It replaces thin checklist guides with substantive patterns, trade-off analyses, and code conventions.

---

## 1. Widget Tree Fundamentals

### Three Trees

Flutter maintains three parallel trees. Understanding their relationship is essential for debugging layout, state, and performance issues.

| Tree | Object Type | Identity | Purpose |
|------|-------------|----------|---------|
| Widget Tree | `Widget` (immutable config) | Short-lived. Recreated on every rebuild | Describes the configuration of the UI |
| Element Tree | `Element` (mutable, lifecycle-managed) | Long-lived. `BuildContext` lives here | Links Widget to RenderObject, manages state via `StatefulElement` |
| Render Tree | `RenderObject` (mutable layout/paint) | Long-lived, parent-owned | Performs layout, painting, and hit-testing |

### Rebuild Semantics

When `setState` or a state-management provider triggers a rebuild:
1. Flutter calls `build()` on the `State` object, returning a new `Widget` tree.
2. Flutter walks the `Element` tree, comparing each new `Widget` with the existing `Element`'s configuration.
3. If the new `Widget`'s `runtimeType` and `key` match, the `Element` is **updated** (mutated in place). The `RenderObject` is reconfigured — not rebuilt.
4. If they differ, the old `Element` (and its `RenderObject` subtree) is **unmounted** and a new one is **inflated**.

This means: returning the same widget type from `build()` is cheap. Changing types or keys is expensive (teardown + re-creation).

### Keys: When and Why

| Key Type | Equality Basis | Use Case |
|----------|---------------|----------|
| `ValueKey(someValue)` | `==` on the value | List items with a unique stable ID (e.g., a `userId`) |
| `ObjectKey(someObject)` | Identity (`identical`) | List items whose identity matters but do not have a natural `==` |
| `UniqueKey()` | Always unique | Force a widget to rebuild by guaranteeing no match; use sparingly |
| `PageStorageKey(value)` | `==` on the value | Preserve scroll position across page transitions (`PageStorage`) |
| `GlobalKey` | Unique across the entire app | Access a child state from a parent (`GlobalKey<FormState>`), reparent widgets, or preserve state across tree moves |

**Key rule**: If a list's order or content can change, each item needs a stable key. Using the index is wrong when items are inserted, removed, or reordered — it causes state to leak across items.

---

## 2. Project Structure Patterns

### Feature-First

Best for: apps with clearly bounded features, 5+ screens, multiple developers.

```
lib/
  core/
    theme/
    routing/
    widgets/         # app-level shared widgets
    utils/
  features/
    auth/
      data/
        auth_repository.dart
        auth_api_client.dart
      domain/
        user.dart
        auth_state.dart
      presentation/
        login_screen.dart
        login_view_model.dart
        widgets/       # auth-specific widgets
    profile/
      data/
      domain/
      presentation/
  main.dart
```

### Layer-First

Best for: smaller apps, quick prototypes, or apps with a single domain layer.

```
lib/
  data/
    api_client.dart
    repositories/
  domain/
    models/
    services/
  ui/
    screens/
    widgets/
    theme/
  main.dart
```

### Trade-off Table

| Criterion | Feature-First | Layer-First |
|-----------|---------------|-------------|
| **Discoverability** | Easy to find all files for one feature | Need to jump across layers to understand a feature |
| **Reuse** | Cross-feature sharing needs `core/` discipline | Natural reuse within each layer |
| **Encapsulation** | Each feature owns its data/domain/presentation | No boundary — any screen can access any repository |
| **Team scaling** | Each team owns features, fewer merge conflicts | Merge conflicts across features in shared directories |
| **Refactoring** | Can rewrite one feature without touching others | Changing a data model affects all screens simultaneously |

### Hybrid (Recommended Default)

```
lib/
  core/              # theme, routing, shared widgets
  data/              # shared API client, DTOs
  domain/            # shared domain models, services
  features/
    auth/
      presentation/  # screen, view model
      domain/        # feature-specific domain logic
    profile/
      presentation/
      domain/
  main.dart
```

This keeps shared infrastructure in layers while letting each feature encapsulate its specific logic.

---

## 3. Dependency Injection

### Constructor Injection (Preferred)

Simplest and most testable. Pass dependencies through constructors — no framework required.

```dart
class AuthRepository {
  final ApiClient _apiClient;
  AuthRepository(this._apiClient);
}
```

### Provider / InheritedWidget (Scope Management)

Use `Provider` (the `provider` package) or direct `InheritedWidget` when a dependency must be available to a subtree without manual threading.

```dart
Provider<AuthRepository>(
  create: (_) => AuthRepository(apiClient),
  child: MaterialApp(...),
)
```

### Riverpod Override Patterns

Riverpod makes override-based DI first-class:

```dart
final authRepoProvider = Provider<AuthRepository>((ref) {
  return AuthRepository(ref.watch(apiClientProvider));
});

// Test override
ProviderScope(
  overrides: [
    authRepoProvider.overrideWith((ref) => FakeAuthRepository()),
  ],
)
```

### get_it Service Locator — When It Is Acceptable

`get_it` is the most convenient but the least explicit (no way to know from a constructor what a class depends on).

- **Acceptable**: Flutter `BuildContext`-less access in platform channels, native callbacks, top-level singleton utilities.
- **Avoid**: Using `get_it` as the primary DI mechanism in app code. It hides dependencies and makes testing harder (mock registrations must happen before each test).

**Guidance**: Use constructor injection or Riverpod by default. Reach for `get_it` only when you genuinely cannot inject (legacy code, platform plugin singletons).

---

## 4. Repository Pattern

### Structure

```dart
// Abstract repository (domain layer)
abstract class UserRepository {
  Future<User> getUser(String id);
  Future<List<User>> searchUsers(String query);
}

// Concrete implementation (data layer)
class UserRepositoryImpl implements UserRepository {
  final UserApiClient _apiClient;
  final UserCache _cache;

  UserRepositoryImpl({required UserApiClient apiClient, required UserCache cache})
      : _apiClient = apiClient, _cache = cache;

  Future<User> getUser(String id) async {
    // Read-through cache pattern
    final cached = _cache.getUser(id);
    if (cached != null) return cached;

    final user = await _apiClient.fetchUser(id);
    _cache.setUser(user);
    return user;
  }
}
```

### DTO ↔ Domain Boundary

Transport DTOs (Data Transfer Objects) model the API wire format. Domain models model the business logic. Mapping between them belongs in the repository or a dedicated mapper class.

```dart
class UserDTO {
  final String id;
  final String display_name;  // snake_case from API

  factory UserDTO.fromJson(Map<String, dynamic> json) => ...;
}

class User {
  final String id;
  final String displayName;  // camelCase in domain
}
```

Mapping SHOULD happen at the repository boundary. Domain + UI code should never import a DTO class directly.

### Retry and Error Handling

```dart
Future<User> getUserWithRetry(String id) async {
  for (int attempt = 0; attempt < 3; attempt++) {
    try {
      return await _apiClient.fetchUser(id);
    } on SocketException {
      if (attempt == 2) rethrow;
      await Future.delayed(Duration(seconds: 1 << attempt)); // exponential backoff
    }
  }
  throw Exception('unreachable');
}
```

---

## 5. Code Generation Integration

| Tool | When to Use |
|------|-------------|
| `freezed` | Immutable data classes with union/sealed types, copyWith, equality, JSON serialization |
| `json_serializable` | Plain JSON serialization when you do not need union types |
| `build_runner` | Runs all code generators; configure via `build.yaml` |
| `mockito` | Generate mock implementations for tests |
| `injectable` | Generate DI wiring (for get_it-based projects) |

### Immutable vs Mutable

- **Prefer immutable** (`freezed` or `@immutable` classes) for state objects passed across boundaries. Immutability guarantees referential transparency and simplifies `==` checks for rebuild optimization.
- **Prefer mutable** only for short-lived, widget-local state that does not cross scope boundaries (e.g., a `TextEditingController` or `AnimationController` within a single `State`).

```yaml
# build.yaml example
targets:
  $default:
    builders:
      json_serializable:
        options:
          explicit_to_json: true
          include_if_null: false
```

---

## 6. Module Boundaries

### Barrel Files: `export` vs `part/part of`

| Mechanism | Purpose | When to Use |
|-----------|---------|-------------|
| `export` | Re-export symbols from another library | Barrel files for public API surfaces |
| `part` / `part of` | Split a single library across files | Rare — only for code generation (freezed, json_serializable) |

**Prefer `export` for public API management**:

```
lib/
  features/
    auth/
      auth.dart            # barrel: exports public symbols
      auth_repository.dart # internal
      auth_api_client.dart # internal
```

`auth.dart` barrel:
```dart
export 'auth_repository.dart';
// Do NOT export auth_api_client.dart — it is an implementation detail
```

### Package-Internal Visibility

Use Dart's library privacy: prefix a file with `_` does NOT make it private. Instead:
- Use `@protected` annotations on methods you do not want external callers to use.
- Keep implementation details in `src/` directories and export only public API through top-level barrel files.
- Use Dart 3 `library` / `package` privacy via `_` prefix on identifiers.

### Circular Import Avoidance

Extract shared types to a separate, minimal file. If feature A needs a class from feature B and feature B needs a class from feature A, the shared type belongs in `core/domain/` or a `shared.dart` file.

---

## 7. Antipattern Catalog

### God Widget

**Symptom**: A single `build()` method over 200 lines, mixing layout, business logic, event handlers, and data formatting.

**Fix**: Extract widget subtrees as separate widgets (composition). Move business logic to controllers or providers. Move formatting to domain or utility classes.

### Service Locator Abuse

**Symptom**: `GetIt.instance<Foo>()` called inside widget constructors, inside `build()`, or sprinkled across the codebase without injection discipline.

**Fix**: Inject dependencies at the boundary (widget constructor or provider definition). The widget should not know where its dependencies come from.

### Repository-in-Widget

**Symptom**: `final user = await widget.repository.getUser(id)` called inside a `StatefulWidget`'s `initState`.

**Fix**: Keep widgets presentation-only. Repository calls belong in controllers, view models, or providers. The widget calls a method on a controller/notifier and observes state.

### Business Logic in UI Callbacks

**Symptom**:
```dart
onTap: () {
  final updated = counter + 1;
  apiClient.postCount(updated);
  setState(() => counter = updated);
}
```

**Fix**: `onTap` should call a single method on the controller, not orchestrate multiple concerns.

### Shared Mutable State Without Lifecycle Management

**Symptom**: A global or singleton `ChangeNotifier` that is created once and never disposed. Widgets subscribe but never unsubscribe. Memory grows unbounded.

**Fix**: Tie state to the widget that owns it. Use `AutoDispose` in Riverpod, or `ChangeNotifierProvider` (from `provider`), which automatically disposes when the provider is no longer listened to.

---

## References

- Flutter API docs: Widget / Element / RenderObject — `/websites/api_flutter_dev_flutter`
- Riverpod documentation — `/websites/pub_dev_flutter_riverpod_3_3_0`
- Flutter team: "Understanding the Widget Tree" — `/flutter/website`
