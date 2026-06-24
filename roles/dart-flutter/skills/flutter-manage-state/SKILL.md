---
name: flutter-manage-state
description: Choose, implement, or refactor Flutter state management using local state, controllers, ChangeNotifier, ValueNotifier, Riverpod, Bloc/Cubit, streams, or existing project patterns. Use when adding screen/app state, fixing rebuild/side-effect bugs, or deciding state ownership.
---
# Managing Flutter State

## Core Rule

Inspect the existing project first and continue its state pattern unless the task is explicitly about migration or the current pattern causes the bug.

## State Ownership

- Widget-local state: transient UI input, animation, focus, tab selection, controller lifecycle.
- Screen state: loading, content, empty, error, commands, and user actions for one screen.
- Feature/app state: session, preferences, cross-screen selections, caches, and permissions.
- Data state: repositories or data sources own remote/local cache details.

## Workflow

- [ ] Identify the state owner and lifetime.
- [ ] Choose the existing project primitive or the smallest sufficient primitive.
- [ ] Keep side effects out of `build`.
- [ ] Expose immutable state snapshots or stable streams.
- [ ] Dispose controllers, subscriptions, and clients.
- [ ] Add tests for state transitions and error paths.
- [ ] Run analyzer and relevant tests.

## Selection Guide

- Use `setState` for local, short-lived widget state.
- Use `ValueNotifier` / `Listenable` for simple observable state with narrow rebuild scope.
- Use `ChangeNotifier` only when the project already uses it or the screen state is small.
- Use Riverpod or Bloc/Cubit when the project already uses them, state is shared, or testing side effects requires explicit dependencies.
- Use streams for event/data sources that are naturally streaming.

## Example Shape

```dart
sealed class LoginState {
  const LoginState();
}

class LoginIdle extends LoginState {
  const LoginIdle();
}

class LoginSubmitting extends LoginState {
  const LoginSubmitting();
}

class LoginSucceeded extends LoginState {
  const LoginSucceeded();
}

class LoginFailed extends LoginState {
  const LoginFailed(this.message);

  final String message;
}
```
