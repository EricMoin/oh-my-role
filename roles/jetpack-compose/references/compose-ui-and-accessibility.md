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
