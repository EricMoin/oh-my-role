---
name: compose-layout-material-adaptive
description: Builds and reviews Compose layouts with modifiers, constraints, Lazy layouts, Material 3, theming, adaptive layouts, window size classes, and accessibility.
---
# Compose Layout, Material, and Adaptive UI

Compose layout work is constraint-driven. Build from stable primitives, use modifiers deliberately, and make adaptive behavior explicit rather than relying on accidental screen sizes.

## Layout Principles

- Modifiers are ordered. Changing order changes measurement, drawing, input, semantics, and placement.
- Constraints flow down and sizes flow up. If a layout is surprising, inspect constraints first.
- Prefer standard layouts (`Column`, `Row`, `Box`, `LazyColumn`, `LazyVerticalGrid`, `Scaffold`) before custom layout.
- Use custom `Layout`, `SubcomposeLayout`, or `LookaheadScope` only when standard primitives cannot express the behavior cleanly.
- Avoid hard-coded dimensions for complete screens. Use spacing tokens, adaptive constraints, and content-driven sizing.

## Modifier Order

Common order:

```kotlin
Modifier
    .fillMaxWidth()
    .padding(horizontal = 16.dp)
    .clip(shape)
    .background(color)
    .clickable(onClick = onClick)
    .padding(16.dp)
```

This creates outer spacing, clips/backgrounds the visual surface, makes that surface clickable, then adds inner content padding. Reorder intentionally when the hit target, background, or clipping should differ.

## Lazy Layouts

- Provide stable keys for reorderable or changing data.
- Use `contentType` when rows have different layout types and the list is large.
- Avoid nested same-direction scroll containers unless one has a bounded size.
- Keep item lambdas light; move expensive mapping outside or memoize where appropriate.
- Use paging/lazy APIs according to the project's data layer, not ad hoc manual pagination in item content.

```kotlin
LazyColumn {
    items(
        items = messages,
        key = { it.id },
        contentType = { it.type },
    ) { message ->
        MessageRow(message = message)
    }
}
```

## Material 3 and Design Systems

- Use Material 3 components and tokens unless the app has a custom design system.
- Centralize colors, typography, shapes, elevation, spacing, and iconography.
- Prefer semantic tokens (`colorScheme.primary`, app design tokens) over one-off colors.
- Keep screen code focused on composition, not raw styling decisions.
- Use `Scaffold` for top bars, bottom bars, FABs, snackbars, and content insets when it matches the screen.

## Insets

- Handle system bars, IME, and display cutouts explicitly.
- Prefer Compose insets APIs and `Scaffold` padding over manual status-bar constants.
- Test IME behavior with text fields on real devices or emulator.
- Be careful with nested padding from `Scaffold`, navigation hosts, and child screens.

## Adaptive Layouts

Use adaptive UI when the screen appears on phones, foldables, tablets, ChromeOS, or desktop-class windows.

- Use window size classes or explicit constraints from `BoxWithConstraints`.
- Switch navigation patterns intentionally: bottom navigation, navigation rail, permanent drawer, two-pane layouts.
- Keep state and navigation consistent when layout changes.
- Avoid separate codepaths that duplicate business logic.

## Accessibility

- Preserve minimum touch targets, usually 48 dp.
- Provide meaningful semantics for icons, custom controls, and image content.
- Use `contentDescription = null` for purely decorative images/icons.
- Respect font scale and dynamic type. Check long labels, error text, and high font scale.
- Ensure color is not the only signal for state.
- Prefer real Material controls over custom clickable boxes when semantics matter.

## Workflow

1. Inspect the existing theme/design system and screen structure.
2. Define the layout behavior for compact, medium, and expanded widths when relevant.
3. Build with standard layouts and design tokens first.
4. Add stable keys/content types for lazy content.
5. Verify insets, IME, font scale, orientation, and accessibility semantics.
6. Reach for custom layout only after a standard-layout attempt is clearly insufficient.

## Validation Checklist

- [ ] Modifier order matches visual, input, and semantics intent.
- [ ] Lazy layouts use stable keys where data can change order or identity.
- [ ] The screen uses theme/design-system tokens.
- [ ] Insets and IME behavior are handled intentionally.
- [ ] Adaptive breakpoints preserve state and navigation.
- [ ] Touch targets, semantics, and font scaling are acceptable.
