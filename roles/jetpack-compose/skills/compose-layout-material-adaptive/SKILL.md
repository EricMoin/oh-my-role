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

## Common Mistakes (❌/✅)

### 1. Unnecessary `IntrinsicSize` measurement

❌ **Wrong** — applying `IntrinsicSize` when a standard layout naturally sizes to its tallest child:
```kotlin
Row(Modifier.height(IntrinsicSize.Min)) {
    Image(modifier = Modifier.fillMaxHeight(), ...)
    Column { Text("Title"); Text("Subtitle") }
}
// Forces a double measurement pass on the entire Row subtree
```
✅ **Correct** — structure the layout so the Row defaults to the maximum child height without intrinsics:
```kotlin
Row {
    Image(...) // sized by its own content
    Column { Text("Title"); Text("Subtitle") }
}
// Row height defaults to tallest child — no intrinsics needed
```
`IntrinsicSize` forces two measurement passes: the framework measures each child's intrinsic size first, then performs the real measurement. For long lists or deeply nested trees this is expensive. Reshape the layout hierarchy or pass explicit constraints before reaching for intrinsics.

---

### 2. Nesting same-direction scroll containers

❌ **Wrong** — placing a vertically scrolling child inside a vertically scrolling parent:
```kotlin
LazyColumn {
    items(sections) { section ->
        LazyColumn {  // illegal: inner child receives unbounded vertical constraints
            items(section.items) { item -> SectionItem(item) }
        }
    }
}
```
✅ **Correct** — flatten the hierarchy so a single scroll container manages all content:
```kotlin
LazyColumn {
    sections.forEach { section ->
        stickyHeader { SectionHeader(section.title) }
        items(section.items) { item -> SectionItem(item) }
    }
}
```
Two nested same-direction scrollers give the inner child unbounded constraints — it wants to be infinitely tall. The framework either throws `IllegalStateException` or clips content. Flatten into one list, use `stickyHeader`, or give the inner container a fixed height.

---

### 3. Fixed `dp` sizes where `weight` or adaptive constraints belong

❌ **Wrong** — hard-coded dimensions that ignore the available viewport width:
```kotlin
Row {
    Card(Modifier.width(300.dp)) { /* sidebar */ }
    LazyColumn(Modifier.fillMaxWidth()) { /* content */ }
}
// On a 320dp-wide phone, content gets 20dp — unusable
```
✅ **Correct** — use `weight` to distribute space proportionally, or `widthIn` with max bounds:
```kotlin
Row {
    Card(Modifier.weight(0.3f)) { /* sidebar */ }
    LazyColumn(Modifier.weight(0.7f)) { /* content */ }
}
```
Fixed `dp` dimensions are blind to the actual viewport. A 300 dp sidebar on a compact phone starves content. Use `Modifier.weight`, `fillMaxWidth(fraction)`, or `widthIn(max = ...)` so the layout responds to real available space.

---

### 4. Hard-coded colors bypassing `MaterialTheme`

❌ **Wrong** — raw hex color literals scattered through composable code:
```kotlin
Text("Error", color = Color(0xFFB00020))
Card(colors = CardDefaults.cardColors(containerColor = Color(0xFFFFFBFE)))
```
✅ **Correct** — route all colors through `MaterialTheme.colorScheme` so dark mode and dynamic color apply automatically:
```kotlin
Text("Error", color = MaterialTheme.colorScheme.error)
Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant))
```
Hard-coded colors ignore the active `ColorScheme`, breaking dark mode, Material You dynamic color, and any project-level theme customization. If a custom color is genuinely outside the token set, define it in the theme as a semantic extension — never as a literal in screen code.

---

### 5. `BoxWithConstraints` for simple responsive branching

❌ **Wrong** — using `BoxWithConstraints` when the only need is adaptive layout switching:
```kotlin
BoxWithConstraints {
    if (maxWidth < 600.dp) PhoneLayout() else TabletLayout()
    // subtree re-creates on every constraint change (IME open/close, split-screen, fold)
}
```
✅ **Correct** — compute the layout strategy once at the screen level and branch outside measurement:
```kotlin
val windowSizeClass = currentWindowSizeClass()
val useCompactLayout = windowSizeClass.widthSizeClass == WindowWidthSizeClass.Compact
Scaffold {
    if (useCompactLayout) PhoneLayout() else TabletLayout()
    // layout direction decided once; composables survive IME and resize events
}
```
`BoxWithConstraints` adds a subcomposition boundary and recomposes its subtree on *every* constraint change — including IME appearance, split-screen resize, and fold/unfold transitions. This resets internal state. Prefer `WindowSizeClass` or a computed size-class flag at the top of the screen where the branch is stable.

---

### 6. `WindowSizeClass` branching in leaf composables

❌ **Wrong** — a low-level component queries the window size class internally, coupling it to the composition environment:
```kotlin
@Composable
fun ProfileAvatar(photoUrl: String) {
    val widthClass = currentWindowSizeClass().widthSizeClass
    val size = if (widthClass == WindowWidthSizeClass.Compact) 48.dp else 80.dp
    AsyncImage(modifier = Modifier.size(size), model = photoUrl, ...)
}
// Untestable without a WindowSizeClass provider in the composition
```
✅ **Correct** — pass adaptive values down as parameters; decide size at the screen/route level:
```kotlin
@Composable
fun ProfileAvatar(photoUrl: String, modifier: Modifier = Modifier) {
    AsyncImage(modifier = modifier, model = photoUrl, ...)
}

// At screen level:
val avatarSize = if (compact) 48.dp else 80.dp
ProfileAvatar(photoUrl, modifier = Modifier.size(avatarSize))
```
Leaf composables that call `currentWindowSizeClass()` become coupled to the composition environment, making previews and unit tests fragile. Push adaptive decisions to the route/screen composable and pass resolved values down. This keeps shared components reusable and testable in isolation.
