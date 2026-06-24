---
name: flutter-add-integration-test
description: Add modern Flutter integration tests with `integration_test` and `WidgetTester`. Use when automating full app flows, verifying routing/forms/persistence on devices or web, or converting explored UI interactions into permanent tests. Use `flutter_driver` only for legacy suites or existing performance-driver workflows.
---
# Implementing Flutter Integration Tests

## Contents
- [Project Setup](#project-setup)
- [Exploration and Targeting](#exploration-and-targeting)
- [Authoring Guidelines](#authoring-guidelines)
- [Execution](#execution)
- [Legacy Driver Notes](#legacy-driver-notes)
- [Examples](#examples)

## Project Setup

Use `integration_test` as the default path for new Flutter integration tests.

```bash
flutter pub add 'dev:integration_test:{"sdk":"flutter"}'
flutter pub add 'dev:flutter_test:{"sdk":"flutter"}'
```

- Create `integration_test/` at the project root.
- Name files with the `_test.dart` suffix.
- Add stable `ValueKey`s to interactive widgets that are hard to find by text or semantics.
- Do not add the legacy Flutter Driver extension to `main.dart` for new `integration_test` suites.
- Prefer a dedicated app bootstrap only when tests need fake services, temporary storage, or injected configuration.

## Exploration and Targeting

Use the tools available in the environment. If Flutter automation or inspection tools are available, use them to launch, inspect, tap, enter text, scroll, and verify widget state. Otherwise use debug logs, Flutter Inspector, DevTools, screenshots, and local manual exploration before writing the permanent test.

- Prefer user-facing finders (`find.text`, `find.bySemanticsLabel`) when labels are stable.
- Use `find.byKey` for controls whose labels change or repeat.
- Scroll lazy lists with `tester.scrollUntilVisible`.
- Avoid brittle finders based on private widget structure unless no stable surface exists.

## Authoring Guidelines

- Initialize the binding with `IntegrationTestWidgetsFlutterBinding.ensureInitialized();`.
- Build the app with the same entrypoint users run, or with a test bootstrap that injects deterministic fakes.
- Use `await tester.pumpAndSettle()` only when animations are expected to settle. For infinite animations, pump bounded durations.
- Assert meaningful user outcomes: visible content, route changes, persisted state, validation messages, or network/error states.
- Keep each test flow focused. Split unrelated flows so failures identify the broken user path.

## Execution

Use the target that matches the app's platform support:

```bash
flutter test integration_test
flutter test integration_test/app_test.dart -d chrome
flutter test integration_test/app_test.dart -d <device-id>
```

For performance traces or legacy CI setups that already rely on a host driver script, `flutter drive` remains acceptable:

```bash
flutter drive --driver=test_driver/integration_test.dart --target=integration_test/app_test.dart -d <device-id>
```

Feedback loop: run the test, review failures, fix targeting or app behavior, and rerun until the same command passes.

## Legacy Driver Notes

Use `flutter_driver` only when maintaining an existing legacy suite or a performance-driver script. In that case, keep the driver extension in a dedicated test entrypoint such as `lib/main_test.dart`, not in the production `main.dart`.

## Examples

### Standard Integration Test

```dart
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:my_app/main.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('creates an item and shows it in the list', (tester) async {
    await tester.pumpWidget(const MyApp());
    await tester.pumpAndSettle();

    await tester.tap(find.byKey(const ValueKey('new-item')));
    await tester.pumpAndSettle();

    await tester.enterText(
      find.byKey(const ValueKey('item-title-field')),
      'Buy milk',
    );
    await tester.tap(find.byKey(const ValueKey('save-item')));
    await tester.pumpAndSettle();

    expect(find.text('Buy milk'), findsOneWidget);
  });
}
```

### Optional Host Driver for Existing `flutter drive` Workflows

```dart
import 'package:integration_test/integration_test_driver.dart';

Future<void> main() => integrationDriver();
```
