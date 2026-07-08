# Testing and Quality Reference

Comprehensive reference for Flutter/Dart testing strategy, static analysis, and CI integration. Covers the test pyramid, WidgetTester patterns, mocking strategies, golden tests, coverage collection, and quality tooling.

---

## 1. Test Pyramid for Flutter

```
        ╱╲
       ╱  ╲          Integration (few)
      ╱    ╲         Full app flows on device
     ╱──────╲
    ╱        ╲       Golden (moderate)
   ╱          ╲      Visual regression snapshots
  ╱────────────╲
 ╱              ╲    Widget (more)
 ╱                ╲  Component rendering + interaction
╱──────────────────╲
╱                    ╲ Unit (many, fast)
╱                      ╲ Pure logic, isolated services
```

### Unit tests — fast, isolated logic
- Pure Dart tests using `package:test` (`test()`), no Flutter dependency
- Cover: data transformation, validation, JSON serialization, business rules, repository logic
- Run on CI without a device or emulator
- Target: 60-70% of total test count

### Widget tests — component rendering + interaction
- Use `testWidgets()` from `flutter_test`, run on the test runner (no device needed with headless mode)
- Cover: widget rendering with given props, user interaction (tap, drag, type), state transitions
- Use scoped providers/service overrides to control dependencies
- Target: 20-30% of total test count

### Golden tests — visual regression snapshots
- Render widgets to a `RenderRepaintBoundary` and compare against a golden file
- Require deterministic conditions: fixed theme, fixed device size, Ahem font, `textScaleFactor: 1.0`
- Best suited for design system components, themed widgets, and layout-critical screens
- Update workflow: run with `--update-goldens` flag, inspect diff before committing
- Target: 5-10% of total test count

### Integration tests — full app flows on device
- Use `integration_test` package, run on a real device or emulator
- Cover: end-to-end flows, navigation, database writes, API calls
- Use `IntegrationTestWidgetsFlutterBinding.ensureInitialized()` — differs from `TestWidgetsFlutterBinding`
- Slower and more brittle — limit to critical paths (auth, checkout, data sync)
- Target: 5-10% of total test count

---

## 2. WidgetTester Deep Patterns

`WidgetTester` is the core test driver provided by `flutter_test`. It is available inside `testWidgets()` callbacks.

### Pump methods

| Method | When to use |
|--------|------------|
| `pumpWidget(widget)` | Build the initial widget tree. Call once per test for `StatelessWidget` tests. |
| `pump()` | Schedule a new frame. Optionally pass a `Duration` to advance the clock (e.g., `pump(Duration(seconds: 1))`). Use when animations exist but you do not want to wait for them to finish. |
| `pump(Duration)` | Advances the clock by the given duration and rebuilds. Useful for testing timed transitions without calling `pumpAndSettle`. |
| `pumpAndSettle()` | Repeatedly calls `pump()` until all animations and transitions complete. Use at the end of interaction sequences. **Caveat**: can hang if animations loop indefinitely (`Duration.zero` or never-settling controllers). |

**Rule of thumb**: Use `pumpAndSettle()` by default for state changes. Use bounded `pump(Duration)` when testing intermediate animation states or when `pumpAndSettle` would loop forever.

### Finder patterns

| Finder | When to use |
|--------|------------|
| `find.byType(MyWidget)` | Match any widget of a specific type. Use for custom widgets. |
| `find.byKey(const ValueKey('key'))` | Match by `Key`. Preferred for testability — decouples finder from text or type. |
| `find.text('Submit')` | Match `Text` or `EditableText` by exact string. Use `find.textContaining('Sub')` for substring. |
| `find.bySemanticsLabel('Add item')` | Match by accessibility label. Essential for accessibility testing. |
| `find.descendant(of: find.byType(Scaffold), matching: find.text('OK'))` | Narrow search within a specific parent subtree. |
| `find.ancestor(of: find.text('Title'), matching: find.byType(ListTile))` | Find ancestor of a matched widget. |
| `find.widgetWithText(MyButton, 'Press')` | Shorthand for finding a widget of a given type that contains given text. |

### Actions

```dart
await tester.tap(finder);           // Tap a widget
await tester.enterText(finder, text); // Enter text into EditableText/TextField
await tester.drag(finder, offset);  // Drag by a given Offset
await tester.longPress(finder);     // Long press
await tester.scrollUntilVisible(finder, scrollable, offset); // Scroll until target visible
await tester.ensureVisible(finder); // Scroll automatically to make widget visible
```

### Assertions

```dart
expect(finder, findsOneWidget);     // Exactly one occurrence
expect(finder, findsNothing);       // No occurrence
expect(finder, findsWidgets);       // One or more occurrences
expect(finder, findsNWidgets(n));   // Exactly n occurrences
```

### TestWidgetsFlutterBinding vs IntegrationTestWidgetsFlutterBinding

| Binding | Package | Use case |
|---------|---------|----------|
| `TestWidgetsFlutterBinding` | `flutter_test` (default) | Widget tests — runs in a headless or simulated environment |
| `IntegrationTestWidgetsFlutterBinding` | `integration_test` | Integration tests — requires `ensureInitialized()` call. Provides real frame scheduling, real async events, and device interaction. |

```dart
// Integration test setup
void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();
  testWidgets('full flow', (tester) async { ... });
}
```

---

## 3. Mocking Strategies

### Mockito — `@GenerateNiceMocks`

Use `@GenerateNiceMocks` (or `@GenerateMocks`) to generate mock classes at build time. Nice mocks return default values for unstubbed methods (no `UnimplementedError`).

```dart
// File: fetch_album_test.dart
import 'package:mockito/annotations.dart';
import 'package:http/http.dart' as http;

@GenerateNiceMocks([MockSpec<http.Client>()])
void main() { /* tests */ }
```

Run `dart run build_runner build` to generate `fetch_album_test.mocks.dart`.

```dart
import 'fetch_album_test.mocks.dart';

final client = MockHttpClient();
when(client.get(Uri.parse(url))).thenAnswer(
  (_) async => http.Response('{"key": "value"}', 200),
);
verify(client.get(Uri.parse(url))).called(1);
```

**Key APIs**:
- `when().thenReturn(value)` — for sync stubs
- `when().thenAnswer((_) => future)` — for async stubs (use `thenAnswer` for futures/streams)
- `verify(mock).method(args)` — assert the mock was called
- `verifyNever(mock).method(args)` — assert no call
- `verify(mock).method(args).called(n)` — assert exactly n calls
- `captureAny` / `captureThat(any)` — capture arguments for later inspection

### Fakes — manual implementations

Prefer fakes over mocks when:
- The dependency has complex interactions (multiple methods, state, callbacks)
- The same fake is reused across many tests (reduces duplication)
- The fake's behavior is part of the test contract (not implementation detail)

```dart
class FakeHttpClient implements http.Client {
  final Map<String, http.Response> responses = {};

  @override
  Future<http.Response> get(Uri url, {Map<String, String>? headers}) async {
    final response = responses[url.toString()];
    if (response == null) throw ClientException('No stub for $url');
    return response;
  }
  // ... other overrides
}
```

### Riverpod overrides

```dart
await tester.pumpWidget(
  ProviderScope(
    overrides: [
      apiClientProvider.overrideWith((ref) => fakeClient),
      userRepositoryProvider.overrideWith((ref) => fakeUserRepo),
    ],
    child: const MyApp(),
  ),
);
```

### HTTP mocking with `http.MockClient`

```dart
import 'package:http/testing.dart';

final mockClient = MockClient((request) async {
  if (request.url.toString().contains('/albums/1')) {
    return http.Response('{"id": 1, "title": "mock"}', 200);
  }
  return http.Response('Not Found', 404);
});
```

---

## 4. Golden Test Determinism

Golden tests compare rendered pixels. Non-determinism causes flaky failures.

### Required conditions for deterministic goldens

1. **Font**: Use the Ahem font (bundled in `flutter_test`) or explicitly bundle the font in `pubspec.yaml`. Never rely on system fonts.
   ```dart
   await tester.binding.setSurfaceSize(const Size(400, 800));
   ```
2. **Theme**: Wrap in a fixed `Theme(data: ThemeData(...))` — avoid `Theme.of(context)` resolving to a system-dependent default.
3. **Device size**: Override before pumping:
   ```dart
   tester.binding.window.physicalSizeTestValue = const Size(1080, 1920);
   tester.binding.window.devicePixelRatioTestValue = 3.0;
   ```
   Restore in `tearDown`:
   ```dart
   addTearDown(tester.binding.window.clearPhysicalSizeTestValue);
   ```
4. **Text scale factor**: Fix to 1.0:
   ```dart
   tester.binding.window.textScaleFactorTestValue = 1.0;
   ```
5. **Platform**: Use `debugDefaultTargetPlatformOverride` to fix the platform (e.g., `TargetPlatform.iOS`) to avoid platform-dependent rendering.

### Test structure

```dart
testWidgets('MyWidget golden', (tester) async {
  tester.binding.window.physicalSizeTestValue = const Size(400, 800);
  tester.binding.window.devicePixelRatioTestValue = 2.0;
  tester.binding.window.textScaleFactorTestValue = 1.0;
  debugDefaultTargetPlatformOverride = TargetPlatform.iOS;
  addTearDown(() {
    tester.binding.window.clearPhysicalSizeTestValue();
    tester.binding.window.clearTextScaleFactorTestValue();
    debugDefaultTargetPlatformOverride = null;
  });

  await tester.pumpWidget(const MaterialApp(home: MyWidget()));
  await expectLater(
    find.byType(MyWidget),
    matchesGoldenFile('goldens/my_widget.png'),
  );
});
```

### Update workflow

```bash
flutter test --update-goldens
git diff           # review the changes visually
```

Always review golden diffs before committing. Use `flutter test --reporter expanded` to see which golden files changed.

---

## 5. Coverage Collection

```bash
# Generate lcov.info
flutter test --coverage

# Generate HTML report
genhtml coverage/lcov.info -o coverage/html
open coverage/html/index.html
```

### Coverage configuration

- **Threshold enforcement** — use a tool like `check_coverage` or a custom script in CI to enforce minimum line/branch coverage:
  ```yaml
  # .github/workflows/test.yml
  - run: flutter test --coverage
  - run: |
      lcov --summary coverage/lcov.info | grep "lines......" | \
        awk '{if ($2 < 80) exit 1}'
  ```

- **Coverage ignore directives** — exclude generated files and specific lines:
  ```dart
  // coverage:ignore-start
  // coverage:ignore-end
  ```
  Add these around `@override` getters in `freezed`/`json_serializable` generated parts.

- **What to exclude**: generated `.g.dart` files, `.freezed.dart` files, `.mocks.dart` files, build variants, main entry point (simple delegator).

---

## 6. CI Integration

### Common commands

```bash
flutter analyze              # Static analysis (must pass)
flutter test                 # All tests
flutter test --coverage      # Tests with coverage
flutter test integration_test/  # Integration tests only
flutter build appbundle      # Android release (verify build)
flutter build ios --no-codesign  # iOS build (verify compilation)
flutter build web            # Web build
```

### GitHub Actions example

```yaml
name: Flutter CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: subosito/flutter-action@v2
        with:
          flutter-version: 'stable'
      - run: flutter pub get
      - run: flutter analyze
      - run: flutter test --coverage
      - uses: codecov/codecov-action@v3
        with:
          file: coverage/lcov.info
```

### Test sharding

For large test suites, split tests across CI runners:

```bash
# Shard 1
flutter test --shard-index=0 --total-shards=4 test/

# Shard 2
flutter test --shard-index=1 --total-shards=4 test/
```

### Codemagic / Bitrise considerations
- Both support workflow-level test splitting
- Use `cache` steps to avoid re-downloading Flutter SDK and `pub get` dependencies
- Set `--dart-define` for flavor-specific test configuration

---

## 7. Static Analysis Configuration

### `analysis_options.yaml` structure

```yaml
# Core: include a recommended lint set
include: package:flutter_lints/flutter.yaml

# Recommended alternative: stricter rules
# include: package:very_good_analysis/analysis_options.yaml

analyzer:
  errors:
    invalid_annotation_target: ignore  # freezed compatibility
    missing_return: error
    unused_import: warning

  exclude:
    - "**/*.g.dart"
    - "**/*.freezed.dart"
    - "**/*.mocks.dart"

linter:
  rules:
    prefer_const_constructors: true
    prefer_const_literals_to_create_immutables: true
    avoid_print: true
    unawaited_futures: true
    prefer_single_quotes: true
    sort_child_properties_last: true
    use_key_in_widget_constructors: true
```

### `// ignore:` directives

```dart
// ignore_for_file: prefer_const_constructors  (file-level)
// ignore: use_key_in_widget_constructors     (line-level)
```

Use sparingly. Every `ignore` is a debt — prefer fixing the lint.

---

## 8. Test Isolation Rules

### No shared mutable state

```dart
// BAD — shared state leaks between tests
final sharedList = <String>[];
test('test 1', () => sharedList.add('a'));
test('test 2', () => expect(sharedList, isEmpty)); // Fails!

// GOOD — fresh state per test
test('test 1', () {
  final list = <String>[];
  list.add('a');
});
```

### setUp / tearDown

```dart
late MyRepository repository;
late http.Client client;

setUp(() {
  client = MockHttpClient();
  repository = MyRepository(client: client);
});

tearDown(() {
  client.close();
});
```

### Temp directories for file tests

```dart
test('writes file', () async {
  final dir = Directory.systemTemp.createTempSync('test_');
  addTearDown(() => dir.delete(recursive: true));

  final file = File('${dir.path}/data.txt');
  await file.writeAsString('hello');
  expect(await file.readAsString(), 'hello');
});
```

### FakeAsync for time-dependent code

```dart
import 'package:fake_async/fake_async.dart';

test('debounce waits 300ms', () {
  fakeAsync((async) {
    var called = false;
    someDebouncedOperation(() => called = true);
    async.elapse(const Duration(milliseconds: 200));
    expect(called, false); // Not yet
    async.elapse(const Duration(milliseconds: 100));
    expect(called, true);  // Fired
  });
});
```

### Linting enforcement

- `flutter analyze` must pass on CI
- Consider `custom_lint` package for custom analyzer plugins (riverpod_lint, freezed_lint)
- Use `dart fix --apply` to auto-resolve mechanical lints before committing
