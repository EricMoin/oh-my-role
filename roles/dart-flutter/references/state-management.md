# Flutter State Management Reference

This document is the domain knowledge base for Flutter/Dart state management patterns. It covers state categorization, pattern comparison, selection decisions, hoisting rules, async handling, lifecycle, and testing.

---

## 1. State Categorization

Different state types have different lifecycle, scope, and persistence requirements. Choose the category first, then the pattern.

| Category | Scope | Lifecycle | Examples |
|----------|-------|-----------|----------|
| **Ephemeral / Local** | Single widget subtree | Widget mount → unmount | `TextEditingController`, scroll offset, animation value, checkbox toggled |
| **Screen State** | One screen | Route push → pop | Form fields before submit, selected tab index, search query text |
| **App State** | Cross-screen, survives navigation | App launch → terminate | Auth token, theme preference, locale, user profile |
| **Server State** | Remote data, cached locally | Per request + cache TTL | Feed items, notification list, product catalog |

### Rule of thumb

Ask: "If this widget is removed and re-added, should it restore its old state?" If yes, it is NOT ephemeral — hoist it.

---

## 2. Pattern Comparison Table

| Pattern | Learning Curve | Testability | Boilerplate | Rebuild Granularity | Async Support |
|---------|---------------|-------------|-------------|---------------------|---------------|
| `setState` | 0 (trivial) | Hard (couples test to widget) | Minimal | Whole widget subtree | Manual |
| `ValueNotifier` + `ValueListenableBuilder` | 1 (easy) | Medium | Low | Per-notifier | Manual |
| `ChangeNotifier` + `ListenableBuilder`/`AnimatedBuilder` | 2 (easy) | Medium | Low | Per-notifier (with `notifyListeners`) | Manual |
| `Provider` + `ChangeNotifier` | 2.5 | Medium | Low-Medium | Per-notifier | Manual |
| **Riverpod** (`StateNotifier`/`Notifier`/`AsyncNotifier`) | 3.5 | High | Low (with codegen) | Per-selector via `.select()` | Built-in (`AsyncValue`) |
| **Bloc** / `Cubit` | 4 | High | High | Per-state class (with `BlocBuilder`/`BlocSelector`) | Built-in (streams) |
| Raw `Stream` / `StreamController` | 3 | High | Medium | Per-stream | Native |

### Notes

- **Testability** measures how easy it is to verify logic without widget tests. Riverpod and Bloc win because providers/cubits are plain Dart objects.
- **Rebuild granularity**: Coarser granularity means more widgets rebuild than necessary. Riverpod's `.select()` and Bloc's `BlocSelector` let you narrow rebuilds to specific fields.
- **Async Support**: Built-in means the framework handles loading/error/data tri-states. Manual means you must model these yourself.

---

## 3. Selection Decision Tree

```
Is the state only relevant within a single widget's subtree?
├── YES → Does it need to survive the widget being rebuilt?
│   ├── NO  → Use local `_foo` field or `StatefulWidget` + `setState`
│   ├── YES → Use `ValueNotifier` owned and disposed by the `State` object
│   └── Controller-like (TextEditingController, AnimationController)?
│       → Use the framework controller, dispose in `dispose()`
└── NO  → Is it shared across widgets?
    ├── YES → Is it remote/server data?
    │   ├── YES → Use Riverpod `FutureProvider` / `StreamProvider` or `Bloc`
    │   │         with explicit loading/error/data states
    │   └── NO  → Is it complex async flow (cancellation, retry, debounce)?
    │       ├── YES → Riverpod `AsyncNotifierProvider` (preferred) or `Bloc`
    │       └── NO  → Riverpod `NotifierProvider` or `ChangeNotifierProvider`
    └── NO  → Is the state ephemeral but shared between siblings?
        → Lift state to the shared parent in a `StatefulWidget`
```

### Additional criteria

- **Need undo/replay?** → Bloc (event sourcing model makes replay natural).
- **Need offline sync + conflict resolution?** → Riverpod `AsyncNotifier` with repository, or Bloc.
- **Single developer, simple app?** → `setState` + `ValueNotifier` is fine. Do not over-architect.
- **Large team, many features?** → Riverpod or Bloc — standardized patterns reduce decision overhead.

---

## 4. State Hoisting Rules

### The Lowest Common Ancestor Principle

State should live in the closest widget that is an ancestor of ALL widgets that need it. Not higher, not lower.

```
        App (no state here)
        └── Screen
            ├── TabBar        (needs selectedTab) ← state lives HERE
            ├── Tab0
            │   └── ListView  (needs selectedTab? no)
            └── Tab1
                └── Detail    (needs selectedTab? no)
```

### When to Hoist Higher

- The state is needed by two sibling subtrees.
- The state must survive navigation (lives above the `Navigator`).
- The state must be testable independently (extract to controller/provider).

### When to Keep Local

- The state is meaningless outside the widget.
- It is an animation value, scroll offset, or text editing controller.
- Extracting it would force the parent to pass callbacks and value down (prop drilling).

### State Ownership vs Consumption

The **owner** creates the state and controls its mutations. **Consumers** read it. Do not let consumers mutate state directly — they should notify the owner through callbacks.

---

## 5. Async State Patterns

### The Tri-State Pattern

Every async operation should expose three visual states: loading, error, and data.

**Riverpod** (built-in via `AsyncValue`):
```dart
final userProvider = FutureProvider<User>((ref) => ref.read(repoProvider).getUser());

// In widget:
ref.watch(userProvider).when(
  loading: () => CircularProgressIndicator(),
  error: (err, stack) => ErrorWidget(err.toString()),
  data: (user) => UserProfile(user: user),
);
```

**Bloc / Cubit** (manual):
```dart
sealed class UserState { const UserState(); }
class UserLoading extends UserState { const UserLoading(); }
class UserError extends UserState { final String message; ... }
class UserLoaded extends UserState { final User user; ... }
```

### Debouncing

```dart
// Riverpod with autoDispose handles debounce via ref.invalidate
final searchQueryProvider = StateProvider<String>((ref) => '');

FutureProvider.autoDispose<List<Result>>((ref) {
  final query = ref.watch(searchQueryProvider);
  if (query.isEmpty) return [];
  return ref.read(searchRepoProvider).search(query);
});
```

### Cancellation

Riverpod cancels pending async operations automatically when the provider is disposed or its dependencies change. Bloc cancels the current event handler when a new event is added.

### Refresh / Pull-to-Refresh

```dart
// Riverpod: call ref.invalidate(provider) or ref.refresh(provider)
// Bloc: add(RefreshEvent) — state machine handles loading → loaded transition
```

---

## 6. Derived State

Derived state is computed from source state. The key decision: cache or recompute?

### When to Cache

- Computation is expensive (O(n²) or involves IO/lookup).
- The derivation is listened to by many widgets.
- The underlying data changes infrequently.

### When to Recompute

- Computation is cheap (O(1) or simple field access).
- The derived value is needed by only one consumer.
- Memory is constrained (cache invalidation complexity is worse than recomputation).

### Riverpod: `.select()`

```dart
// Only rebuilds when userName changes, not the entire User
final userNameProvider = Provider<String>((ref) {
  return ref.watch(userProvider).select((user) => user.name);
});
// Or inline:
ref.watch(userProvider.select((user) => user.name));
```

### Bloc: `distinct()` / `BlocSelector`

Bloc's streams deduplicate consecutive equal states. `BlocSelector` narrows rebuilds:

```dart
BlocSelector<CartBloc, CartState, int>(
  selector: (state) => state.itemCount,
  builder: (context, count) => Text('$count items'),
)
```

---

## 7. State Disposal and Lifecycle

### AutoDispose (Riverpod)

```dart
final myProvider = FutureProvider.autoDispose<User>((ref) async {
  // This callback is called when the provider is first listened to.
  ref.onDispose(() {
    // Cleanup when all listeners are gone.
    print('provider disposed');
  });
  return await fetchUser();
});
```

Riverpod's `autoDispose` disposes the provider when the last listener is removed. Non-`autoDispose` providers live forever (app scope).

### Tying State to Route Lifecycle

```dart
class _MyScreenState extends State<MyScreen> {
  @override
  void initState() {
    super.initState();
    // Start a listener tied to this route
    _subscription = myBloc.stream.listen(_handleState);
  }

  @override
  void dispose() {
    _subscription.cancel();
    super.dispose();
  }
}
```

### Bloc Lifecycle

Blocs are closed when explicitly `close()`d. Tie to route lifecycle:

```dart
BlocProvider<MyBloc>(
  create: (context) => MyBloc(),
  // BlocProvider automatically closes the bloc when this widget is removed.
)
```

### Avoiding Memory Leaks

- Every `StreamSubscription` must have a matching `cancel()` in `dispose()`.
- Every `AnimationController` must be `dispose()`d.
- Riverpod `autoDispose` takes care of provider cleanup automatically.
- `ChangeNotifier` listeners must be removed: `addListener`/`removeListener` pairs.

---

## 8. Testing Patterns Per Approach

### ChangeNotifier

```dart
final notifier = MyChangeNotifier();
expect(notifier.counter, 0);
notifier.increment();
expect(notifier.counter, 1);
```

### Riverpod Provider

```dart
final container = ProviderContainer();
addTearDown(container.dispose);

final result = container.read(myProvider);
expect(result, isA<AsyncLoading>());

await container.read(myProvider.future);
final data = container.read(myProvider).value;
expect(data.name, 'Alice');
```

Override dependencies in tests:
```dart
final container = ProviderContainer(overrides: [
  apiClientProvider.overrideWithValue(FakeApiClient()),
]);
```

### Bloc / Cubit

```dart
final bloc = MyBloc(repository: FakeRepository());
expect(bloc.state, isA<MyInitial>());

bloc.add(LoadEvent());
await expectLater(
  bloc.stream,
  emitsInOrder([isA<LoadingState>(), isA<LoadedState>(emitsDone)]),
);
bloc.close();
```

### Raw Streams

```dart
final controller = StreamController<int>();
controller.add(1);
controller.add(2);
await expectLater(
  controller.stream,
  emitsInOrder([1, 2, emitsDone]),
);
await controller.close();
```

---

## References

- Riverpod documentation: `/websites/pub_dev_flutter_riverpod_3_3_0` — StateNotifierProvider, AsyncNotifierProvider, select, autoDispose
- Flutter state management docs: `/flutter/website` — state management overview
- Bloc library docs: `/websites/bloclibrary_dev` — Bloc vs Cubit, event-driven state
