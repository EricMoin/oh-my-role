---
name: flutter-add-golden-screenshot-test
description: Add Flutter golden or screenshot tests for visual regression coverage. Use when validating component appearance, responsive layouts, themes, localized text, text scaling, or design-system changes that need stable visual snapshots.
---
# Adding Flutter Golden and Screenshot Tests

## When to Use

Use golden/screenshot tests for UI that must remain visually stable. Prefer widget tests for pure behavior and integration tests for full flows.

## Workflow

- [ ] Check existing golden tooling and update commands.
- [ ] Fix deterministic inputs: theme, fonts, locale, platform, device size, text scale, and clock/data.
- [ ] Render the smallest useful widget surface.
- [ ] Cover meaningful variants: light/dark, compact/wide, text scale, error/empty/loading, and localization when relevant.
- [ ] Generate or update goldens with the project's approved command.
- [ ] Run the golden test command in verification.

## Default Flutter Golden Pattern

```dart
testWidgets('profile card golden', (tester) async {
  await tester.pumpWidget(
    const MaterialApp(
      home: Scaffold(
        body: ProfileCard(name: 'Sam Lee'),
      ),
    ),
  );

  await expectLater(
    find.byType(ProfileCard),
    matchesGoldenFile('goldens/profile_card.png'),
  );
});
```

## Commands

```bash
flutter test --update-goldens
flutter test
```

Use project-specific screenshot packages or CI comparison tools when already configured.
