# Flutter State Management Guide

Use this guide when choosing or reviewing state ownership.

## Selection Rules

- Local ephemeral state: `StatefulWidget`, `ValueNotifier`, or controller owned and disposed by the widget.
- Screen state: existing project primitive, such as ChangeNotifier, Riverpod, Bloc/Cubit, stream, or custom controller.
- App/session state: provider container, repository cache, app-level controller, or existing dependency scope.
- Server/cache state: repository or data source, not widgets.

## Review Checks

- State has one clear owner.
- Widgets do not start repeated side effects from `build`.
- Async commands expose loading, success, empty, and error states.
- Controllers, subscriptions, and clients are disposed or lifecycle-bound.
- Derived state is computed from source state or memoized intentionally.
- Tests can inject fake repositories and services.
