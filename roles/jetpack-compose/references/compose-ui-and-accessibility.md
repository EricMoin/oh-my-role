# Compose UI and Accessibility Reference

Comprehensive reference for Material 3 theming, modifier composition, adaptive layouts, and accessibility (Semantics, focus, TalkBack) in Jetpack Compose.

---

## 1. Material 3 Theming

### ColorScheme

```kotlin
@Composable
fun AppTheme(darkTheme: Boolean = isSystemInDarkTheme(), content: @Composable () -> Unit) {
    val colorScheme = if (darkTheme) darkColorScheme(
        primary = Color(0xFF90CAF9), secondary = Color(0xFFCE93D8)
    ) else lightColorScheme(
        primary = Color(0xFF1565C0), secondary = Color(0xFF7B1FA2)
    )
    MaterialTheme(colorScheme = colorScheme, content = content)
}
```

### Dynamic Color (Android 12+)

```kotlin
val colorScheme = when {
    Build.VERSION.SDK_INT >= 31 -> dynamicColorScheme(LocalContext.current)
    darkTheme -> darkColorScheme(...)
    else -> lightColorScheme(...)
}
```

### Typography & Shapes

```kotlin
val AppTypography = Typography(
    displayLarge = TextStyle(fontSize = 36.sp, fontWeight = FontWeight.Bold),
    bodyLarge = TextStyle(fontSize = 16.sp)
)
val AppShapes = Shapes(medium = RoundedCornerShape(8.dp))
```

---

## 2. Modifier Ordering

Modifiers execute left to right, outside to inside. Different orders produce different results.

```kotlin
Modifier.clickable { }.padding(16.dp)       // padded area is clickable
Modifier.padding(16.dp).clickable { }       // only content is clickable
Modifier.size(48.dp).clip(CircleShape)       // clip to sized bounds
```

### Common Chain

```kotlin
Modifier.fillMaxWidth().padding(16.dp)
    .clickable(enabled = isEnabled) { onClick() }
    .semantics { contentDescription = "Button: $label" }
```

---

## 3. Lazy Layouts

```kotlin
LazyColumn(contentPadding = PaddingValues(16.dp)) {
    items(users, key = { it.id }) { user -> UserItem(user) }
}
LazyVerticalGrid(columns = GridCells.Adaptive(minSize = 128.dp)) {
    items(photos, key = { it.id }) { photo -> PhotoThumbnail(photo) }
}
```

### Keys: When and Why

| Key Strategy | Behavior |
|-------------|----------|
| Stable ID (`user.id`) | Correct — items keep state across reordering |
| Index / None | State leaks when items are inserted, removed, or reordered |

---

## 4. Adaptive Layouts

### WindowSizeClass

```kotlin
@Composable
fun AdaptiveScreen() {
    val wsc = currentWindowAdaptiveInfo().windowSizeClass
    when (wsc.windowWidthSizeClass) {
        WindowWidthSizeClass.Compact -> CompactLayout()
        WindowWidthSizeClass.Medium -> MediumLayout()
        WindowWidthSizeClass.Expanded -> ExpandedLayout()
    }
}
```

### Breakpoints

| Width | Class | Typical Device |
|-------|-------|----------------|
| 0–599dp | Compact | Phone portrait |
| 600–839dp | Medium | Tablet portrait |
| 840dp+ | Expanded | Tablet landscape, desktop |

---

## 5. Semantics API

### Basic Semantics

```kotlin
Icon(Icons.Default.Add, contentDescription = "Add item") // essential for TalkBack

Box(Modifier.size(48.dp).semantics {
    contentDescription = "Temperature: ${temperature}°C"
    role = Role.Button
    onClick { onToggleUnit(); true }
})
```

### Live Regions — Announce dynamic changes

```kotlin
Text("Error: Connection lost", color = MaterialTheme.colorScheme.error,
    modifier = Modifier.semantics { liveRegion = LiveRegionMode.Polite })
```

---

## 6. Focus Management

```kotlin
val emailFocusRequester = remember { FocusRequester() }
OutlinedTextField(value = email, onValueChange = { email = it },
    modifier = Modifier.fillMaxWidth().focusRequester(emailFocusRequester))
LaunchedEffect(Unit) { emailFocusRequester.requestFocus() }
```

### Focus Traversal

```kotlin
Column(Modifier.focusGroup()) {
    OutlinedTextField(/* ... */, Modifier.focusOrder(1))
    OutlinedTextField(/* ... */, Modifier.focusOrder(2))
    Button(/* ... */, Modifier.focusOrder(3))
}
```

---

## 7. Text Scaling and Touch Targets

```kotlin
Text("Hello", style = TextStyle(fontSize = 16.sp)) // respects system scaling
Text("Big Header", style = TextStyle(fontSize = 28.sp),
    maxLines = 1, overflow = TextOverflow.Ellipsis)
```

### Minimum Touch Targets (48dp)

```kotlin
IconButton(onClick = { }, modifier = Modifier.size(48.dp)) {
    Icon(Icons.Default.Edit, contentDescription = "Edit")
}
```

---

## 8. Forms and Error Recovery

```kotlin
OutlinedTextField(value = email, onValueChange = { email = it },
    isError = hasEmailError,
    supportingText = { if (hasEmailError) Text("Enter a valid email") },
    label = { Text("Email") }, singleLine = true)
```

Move focus to the first error field after validation:

```kotlin
when {
    emailError -> emailFocusRequester.requestFocus()
    passwordError -> passwordFocusRequester.requestFocus()
    else -> viewModel.submit()
}
```

---

## 9. Anti-Patterns

### 9.1 Clickable Without Semantics / Role

❌ TalkBack reads "button" but there is no button — or a button is announced as plain text.

```kotlin
// Bad: no semantics, no role
Box(Modifier.clickable { navigate() }) {
    Text("Go to Profile")
}

// Bad: Icon with no contentDescription
Icon(Icons.Default.Settings, contentDescription = null, Modifier.clickable { openSettings() })
```

✅ Add `semantics` with `role` and `contentDescription`:

```kotlin
Box(Modifier
    .clickable(role = Role.Button, onClickLabel = "Go to Profile") { navigate() }
    .semantics { role = Role.Button; contentDescription = "Go to Profile" }
) { Text("Go to Profile") }

Icon(Icons.Default.Settings, contentDescription = "Settings",
    Modifier.clickable(role = Role.Button, onClickLabel = "Settings") { openSettings() })
```

### 9.2 Touch Target < 48dp

❌ Tapping a small icon or text reliably fails — violates WCAG 2.2 SC 2.5.5 (Target Size).

```kotlin
// Bad: 24dp icon is too small to hit
Icon(Icons.Default.Close, contentDescription = "Close", Modifier.clickable { dismiss() })
```

✅ Ensure minimum 48dp × 48dp interactive area with `.size(48.dp)` or `IconButton`:

```kotlin
IconButton(onClick = { dismiss() }, modifier = Modifier.size(48.dp)) {
    Icon(Icons.Default.Close, contentDescription = "Close")
}
```

### 9.3 Color Alone Conveys State

❌ A user with color-vision deficiency cannot distinguish an error field from a normal one.

```kotlin
// Bad: border turns red — that's the only error signal
OutlinedTextField(value = email, onValueChange = { email = it },
    modifier = Modifier.border(1.dp, if (isError) Color.Red else Color.Gray))
```

✅ Add a text label or icon alongside color. Wire `isError` + `supportingText` or `label`:

```kotlin
OutlinedTextField(value = email, onValueChange = { email = it },
    isError = hasEmailError,
    supportingText = { if (hasEmailError) Text("Enter a valid email") },
    label = { Text("Email") },
    modifier = Modifier.focusRequester(emailFocusRequester))
```

### 9.4 Missing or Redundant `contentDescription`

❌ Unlabeled images are invisible to TalkBack. On the other extreme, describing every decorative shape is noise.

```kotlin
// Bad: image with no description
Image(painter = painterResource(R.drawable.avatar), contentDescription = null)
// Bad: decorative background described as "blue circle"
Divider(Modifier.semantics { contentDescription = "horizontal divider" })
```

✅ Every informative image gets a meaningful description. Purely decorative content uses `null`:

```kotlin
Image(painter = painterResource(R.drawable.avatar),
    contentDescription = "User avatar — ${user.displayName}")
Divider() // no semantics needed for decorative separators
```

### 9.5 `mergeDescendants` Misuse

❌ Grouping children but never `mergeDescendants` causes TalkBack to read every child separately — or hiding children removes them from the tree entirely.

```kotlin
// Bad: group that should read as one
Surface(Modifier.semantics(mergeDescendants = true) {}) {
    Text("Name"); Icon(Icons.Default.Person, null)
}
```

✅ Use `mergeDescendants` when a group should be announced as one unit, and `clickable` semaphores appropriately:

```kotlin
Surface(Modifier
    .clickable(onClick = { openProfile() })
    .semantics(mergeDescendants = true) {
        contentDescription = "${user.name}, open profile" // single announcement
    }
) {
    Row { Text(user.name); Icon(Icons.Default.Person, null) }
}
```

### 9.6 Custom Controls Without Semantics

❌ A custom slider, switch, or rating bar is invisible to accessibility services.

```kotlin
// Bad: custom progress bar with no semantics
Canvas(Modifier.fillMaxWidth().height(4.dp)) {
    drawRect(Color.Green, size = Size(progress * size.width, size.height))
}
```

✅ Override `semantics` to set `progressBarRangeInfo` or `role`:

```kotlin
Canvas(Modifier.fillMaxWidth().height(4.dp)
    .semantics {
        progressBarRangeInfo = ProgressBarRangeInfo(progress, 0f..1f)
        role = Role.ProgressBar
    }
) {
    drawRect(Color.Green, size = Size(progress * size.width, size.height))
}
```

### 9.7 Fixed `sp` That Disables Font Scaling

❌ `16.sp` in a `Layout()` or `drawText()` bypasses the system's font-scale multiplier — ignores the user's accessibility preference.

```kotlin
// Bad: fixed sp in canvas drawing
drawContext.canvas.nativeCanvas.drawText("Hello", x, y, Paint().apply { textSize = 16.sp.toPx() })
```

✅ Use `Density.run { … }` or pass `TextUnit` through to `TextMeasurer`:

```kotlin
val textMeasurer = rememberTextMeasurer()
val layout = textMeasurer.measure(AnnotatedString("Hello"),
    style = MaterialTheme.typography.bodyLarge)
drawText(layout, topLeft = Offset(x, y))
```

### 9.8 Focus Order Chaos

❌ Tab/arrow key navigation jumps between UI elements in an illogical order — fields before labels, or submit button first.

```kotlin
// Bad: visual order right-to-left but focus order left-to-right
Row {
    IconButton(onClick = next, Modifier.focusOrder(1)) { Icon(…, "Next") }
    Spacer(Modifier.focusOrder(3))
    IconButton(onClick = prev, Modifier.focusOrder(2)) { Icon(…, "Prev") }
}
```

✅ Align focus order with visual reading order. Use `focusOrder` sparingly — prefer natural layout ordering:

```kotlin
Row {
    IconButton(onClick = prev, Modifier.focusOrder(1)) { Icon(Icons.Default.ArrowBack, "Previous") }
    Spacer(Modifier.weight(1f))
    IconButton(onClick = next, Modifier.focusOrder(2)) { Icon(Icons.Default.ArrowForward, "Next") }
}
```
