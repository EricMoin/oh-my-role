---
name: compose-idiomatic-style
description: Kotlin and Jetpack Compose idiomatic style reference — ❌/✅ comparative examples for state, side effects, modifiers, lists, composable structure, naming, Slot API, CompositionLocal, remember, derivedStateOf, lifecycle-aware collection, and Previews. Use when reviewing Compose code for idiomatic correctness, refactoring composable functions for readability, designing Slot-based component APIs, or establishing project style conventions. Do NOT load for single-line edits, new feature implementation (use a domain-specific skill instead), or bug fixes where style is not the primary concern.
---
# Compose Idiomatic Style

Quick-reference for Jetpack Compose Kotlin idiomatic patterns. Each entry shows the naive or incorrect approach (❌) vs the idiomatic approach (✅) with explanation.

**When NOT to load this skill:**
- Single-line edits or trivial changes — the cost of loading reference content outweighs the benefit.
- New feature implementation — use the domain-specific skill (e.g., `compose-runtime-state`, `compose-layout-material-adaptive`) instead.
- Bug fixes where style is not the primary concern — fix the bug first; apply style guidance only in a follow-up refinement pass.
- Writing or modifying non-Compose Kotlin code (this skill is specific to `@Composable` patterns).

## Quick Routing — Symptom to Skill

When a symptom points to a different concern, route to the skill that owns it instead of forcing the fix here.

| Symptom / Signal | Load this skill |
| --- | --- |
| janky `LazyColumn` scrolling | `compose-performance` |
| state resets on rotation | `compose-runtime-state` |
| text overflows at large font scale | `compose-layout-material-adaptive` |
| hardcoded colors or ad-hoc styling | `compose-idiomatic-style` |
| preview missing or broken | `compose-testing-previews` |
| `AndroidView` leaks or disposal bugs | `compose-interop-migration` |
| unstable lambda causing recomposition | `compose-runtime-state` |
| stability warning in compiler report | `compose-performance` |
| god composable with too many responsibilities | `compose-idiomatic-style` |
| ViewModel collecting while backgrounded | `compose-runtime-state` |
| XML screen being migrated to Compose | `compose-interop-migration` |
| docs disagree with observed behavior | `android-source-research` |
| screen architecture or state ownership unclear | `compose-ui-architecture` |
| platform lifecycle, permissions, or background work | `android-platform-engineering` |
| broad feature work spanning multiple concerns | `jetpack-compose-engineering-gate` |

## State

### Immutable UI state over scattered var + mutableStateOf

```kotlin
// ❌ Mutable state scattered across the ViewModel as individual vars
class ProfileViewModel : ViewModel() {
    var name by mutableStateOf("")
    var email by mutableStateOf("")
    var isLoading by mutableStateOf(false)
    var errorMessage by mutableStateOf<String?>(null)
}

// ✅ Single immutable UiState data class exposed as StateFlow
data class ProfileUiState(
    val name: String = "",
    val email: String = "",
    val isLoading: Boolean = false,
    val errorMessage: String? = null,
)

class ProfileViewModel : ViewModel() {
    private val _uiState = MutableStateFlow(ProfileUiState())
    val uiState: StateFlow<ProfileUiState> = _uiState.asStateFlow()

    fun updateName(name: String) {
        _uiState.update { it.copy(name = name) }
    }
}
```

The ✅ approach groups all screen state into a single snapshot — one collector, one source of truth, and natural support for `copy()`-based atomic updates.

### State hoisting over composable-owned internal state

```kotlin
// ❌ Composable owns the state internally and handles business logic inline
@Composable
fun SearchBar() {
    var query by rememberSaveable { mutableStateOf("") }

    OutlinedTextField(
        value = query,
        onValueChange = { query = it },
    )

    if (query.length >= 3) {
        // Business logic trapped inside UI
        viewModel.search(query)
    }
}

// ✅ State hoisted: state + event lambda lifted to caller
@Composable
fun SearchBar(
    query: String,
    onQueryChange: (String) -> Unit,
    modifier: Modifier = Modifier,
) {
    OutlinedTextField(
        value = query,
        onValueChange = onQueryChange,
        modifier = modifier,
    )
}

// Caller owns the state and decides when to search
@Composable
fun SearchScreen(viewModel: SearchViewModel = hiltViewModel()) {
    var query by rememberSaveable { mutableStateOf("") }

    SearchBar(
        query = query,
        onQueryChange = { query = it },
    )

    LaunchedEffect(query) {
        if (query.length >= 3) viewModel.search(query)
    }
}
```

Hoisting makes the composable stateless, reusable, testable, and previewable independently of the ViewModel.

## Side Effects

### Effects over direct side effects in composition

```kotlin
// ❌ Side effects executed directly in composable body
@Composable
fun Screen(viewModel: MyViewModel = hiltViewModel()) {
    // Runs on every recomposition — reloads, duplicates calls, may infinite-loop
    viewModel.loadData()

    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    // I/O inside composition body
    val prefs = LocalContext.current.getSharedPreferences("app", Context.MODE_PRIVATE)
    val theme = prefs.getString("theme", "light") ?: "light"

    // Unconditional coroutine launch
    val scope = rememberCoroutineScope()
    scope.launch { viewModel.trackScreenView() }

    Text(uiState.title)
}

// ✅ Use LaunchedEffect / DisposableEffect / derivedStateOf
@Composable
fun Screen(viewModel: MyViewModel = hiltViewModel()) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    val context = LocalContext.current

    // One-shot load keyed by lifecycle
    LaunchedEffect(Unit) {
        viewModel.loadData()
    }

    // Side-effect reads keyed property; restarts only when context changes
    val theme by remember {
        val prefs = context.getSharedPreferences("app", Context.MODE_PRIVATE)
        mutableStateOf(prefs.getString("theme", "light") ?: "light")
    }

    // Auto-cancelled when leaving composition
    LaunchedEffect(Unit) {
        viewModel.trackScreenView()
    }

    Text(uiState.title)
}
```

Effects own their lifecycle: `LaunchedEffect` starts when entering composition with the correct key, and cancels automatically. Never put impure calls in the composable body directly.

## Modifiers

### Modifier parameter convention

```kotlin
// ❌ No modifier parameter — callers cannot customize layout or behaviour
@Composable
fun MyCard(title: String, body: String) {
    Card(
        modifier = Modifier.fillMaxWidth().padding(16.dp),
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(title)
            Text(body)
        }
    }
}

// ✅ modifier as the first optional parameter passed to the root element
@Composable
fun MyCard(
    title: String,
    body: String,
    modifier: Modifier = Modifier,
) {
    Card(modifier = modifier.fillMaxWidth().padding(16.dp)) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(title)
            Text(body)
        }
    }
}
```

Every public composable **MUST** accept a `modifier: Modifier = Modifier` parameter and apply it to the root element so callers can control positioning, sizing, and click handling from the outside. A public composable **MUST NOT** be called from non-composable contexts — `@Composable` calls are only valid inside a composable (or composable lambda) scope; work that must run outside composition belongs in the effect APIs or a plain, non-composable function.

### Modifier ordering

```kotlin
// ❌ Order insensitive to layout vs draw semantics
Box(
    modifier = Modifier
        .background(Color.Red)
        .size(100.dp)
        .padding(16.dp)
        .clickable { onPress() }
)

// ✅ Layout modifiers first, then drawing modifiers, then interaction
Box(
    modifier = Modifier
        .size(100.dp)          // layout (size constraint)
        .padding(16.dp)        // layout (reduces available space)
        .background(Color.Red) // draw (fills padded area, not size area)
        .clickable { onPress() } // interaction (hit area is padded + background)
)
```

Modifiers apply left to right. `size` → `padding` shrinks the draw area inside the size. `padding` → `size` would pad first then size the outer box. `background` after `padding` fills only the padded inner area. `clickable` at the end makes the hit area match all preceding layout modifiers.

## Lists

### LazyColumn over Column + verticalScroll

```kotlin
// ❌ Column with verticalScroll composes all items immediately — O(n) memory and jank
@Composable
fun ItemList(items: List<Item>) {
    Column(modifier = Modifier.verticalScroll(rememberScrollState())) {
        items.forEach { item ->
            ItemCard(item)
        }
    }
}

// ✅ LazyColumn composes only visible items — O(1) memory, smooth scrolling
@Composable
fun ItemList(items: List<Item>) {
    LazyColumn {
        items(
            items = items,
            key = { it.id }, // stable key avoids recomposition on reorder
        ) { item ->
            ItemCard(item)
        }
    }
}
```

`LazyColumn` is mandatory for lists longer than a handful of items. Always provide a stable `key` so the runtime can reuse nodes across item moves.

## Decomposition

### Small stateless composables over god composables

```kotlin
// ❌ 200-line monolithic composable with local state, effects, and UI mixed together
@Composable
fun ProfileScreen(viewModel: ProfileViewModel = hiltViewModel()) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    var editing by rememberSaveable { mutableStateOf(false) }
    var name by rememberSaveable { mutableStateOf("") }

    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        // 80 lines of header
        Row { /* avatar, name, stats */ }
        Divider()
        // 60 lines of content
        if (editing) {
            OutlinedTextField(name, { name = it })
            Button(onClick = {
                viewModel.save(name)
                editing = false
            }) { Text("Save") }
        } else {
            Text(uiState.bio)
            Button(onClick = { editing = true }) { Text("Edit") }
        }
        Divider()
        // 40 lines of footer
        LazyColumn { /* recent activity */ }
    }
}

// ✅ Decompose: extract small, single-purpose, stateless composables
@Composable
fun ProfileScreen(viewModel: ProfileViewModel = hiltViewModel()) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    ProfileContent(
        uiState = uiState,
        onSave = { viewModel.save(it) },
        modifier = Modifier.fillMaxSize(),
    )
}

@Composable
private fun ProfileContent(
    uiState: ProfileUiState,
    onSave: (String) -> Unit,
    modifier: Modifier = Modifier,
) {
    var editing by rememberSaveable { mutableStateOf(false) }
    var name by rememberSaveable { mutableStateOf(uiState.name) }

    Column(modifier = modifier.padding(16.dp)) {
        ProfileHeader(uiState)
        Divider()
        ProfileBody(editing, name, uiState.bio) { editing = it }
        Divider()
        ActivityFeed(uiState.recentActivity)
    }

    LaunchedEffect(editing) {
        if (!editing && name != uiState.name) onSave(name)
    }
}

@Composable
private fun ProfileHeader(uiState: ProfileUiState) { /* ... */ }
@Composable
private fun ProfileBody(editing: Boolean, name: String, bio: String, onEditingChange: (Boolean) -> Unit) { /* ... */ }
@Composable
private fun ActivityFeed(items: List<Activity>) { /* ... */ }
```

Split at natural seams. Stateless children are previewable, testable, and skip recomposition more reliably.

## Naming

### Compose naming conventions

```kotlin
// ❌ Violates Compose naming conventions
@Composable
fun getProfileView(group: UserGroup): Unit { // get prefix, "View" suffix, Unit return
    // ...
}

@Composable
fun avatar(userId: String) { // lowerCase start
    // ...
}

// ✅ PascalCase noun phrase, no get, omit Unit return type
@Composable
fun Profile(group: UserGroup) {
    // ...
}

@Composable
fun UserAvatar(userId: String) {
    // ...
}
```

Composable functions are PascalCase nouns or noun phrases. They return `Unit` implicitly — do not write `: Unit`. Never prefix with `get`.

## Composable API Design Contract

### 1. Full parameter ordering rule

```kotlin
// ❌ modifier buried mid-signature, callbacks before data, content slot not last
@Composable
fun UserCard(
    onEditClick: () -> Unit,
    modifier: Modifier,
    user: User,
    contentPadding: PaddingValues = PaddingValues(0.dp),
    onDeleteClick: () -> Unit,
    header: @Composable () -> Unit,
) { /* ... */ }

// ✅ modifier first, then required data, optional styling, callbacks, content slot last
@Composable
fun UserCard(
    modifier: Modifier = Modifier,
    user: User,
    contentPadding: PaddingValues = PaddingValues(0.dp),
    onEditClick: () -> Unit,
    onDeleteClick: () -> Unit,
    header: @Composable () -> Unit,
) { /* ... */ }
```

Parameters follow a fixed order: `modifier: Modifier = Modifier` first, required data, optional styling, callback lambdas, trailing `@Composable` content slots last.

### 2. Emit UI or return a value, never both

```kotlin
// ❌ Renders UI and returns the computed string
@Composable
fun FormatPrice(amount: Double): String {
    val text = "$" + amount.toInt()
    Text(text)
    return text
}

// ✅ Pure function computes; composable only renders
fun formatPrice(amount: Double): String = "$" + amount.toInt()

@Composable
fun PriceLabel(amount: Double) {
    Text(formatPrice(amount))
}
```

A composable either emits UI or computes/returns a value, never both. Hoist value computation into a plain function.

### 3. Emit 0 or 1 layout node

```kotlin
// ❌ Multiple sibling root nodes
@Composable
fun UserRow(user: User) {
    Text(user.name)
    Text(user.email)
}

// ✅ Single root node wraps the children
@Composable
fun UserRow(user: User) {
    Column {
        Text(user.name)
        Text(user.email)
    }
}
```

A composable emits 0 or 1 layout node. Multiple sibling roots break reuse and parent layout; wrap them in a `Column` or `Box`.

### 4. Do not reuse Modifier instances across children

```kotlin
// ❌ One Modifier instance shared by every child
@Composable
fun LabelList(items: List<String>) {
    val sharedModifier = Modifier.padding(8.dp)
    Column {
        items.forEach { item ->
            Text(item, modifier = sharedModifier)
        }
    }
}

// ✅ Fresh Modifier chain per child
@Composable
fun LabelList(items: List<String>) {
    Column {
        items.forEach { item ->
            Text(item, modifier = Modifier.padding(8.dp))
        }
    }
}
```

Do not reuse Modifier instances across children — each child gets its own Modifier chain so per-child state and ordering stay independent.

### 5. Caller owns layout modifiers

```kotlin
// ❌ Component hard-codes layout on its own root
@Composable
fun ErrorBanner(message: String) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp),
    ) {
        Text(message)
    }
}

// ✅ Root takes caller's modifier; layout stays with the caller
@Composable
fun ErrorBanner(message: String, modifier: Modifier = Modifier) {
    Column(modifier = modifier) {
        Text(message)
    }
}

// Caller applies its own layout
ErrorBanner(
    message = "Something went wrong",
    modifier = Modifier.fillMaxWidth().padding(16.dp),
)
```

The caller owns layout modifiers — a component must not apply size/padding/fillMaxWidth to its root internally; those belong to the caller through the `modifier` parameter.

## Slot API

### Content slots over boolean/parameter switches

```kotlin
// ❌ Boolean flags and parameter proliferation for every variant
@Composable
fun Dialog(
    title: String,
    message: String,
    showPositiveButton: Boolean = true,
    positiveLabel: String = "OK",
    onPositiveClick: (() -> Unit)? = null,
    showNegativeButton: Boolean = false,
    negativeLabel: String = "Cancel",
    onNegativeClick: (() -> Unit)? = null,
    showIcon: Boolean = false,
    icon: ImageVector? = null,
) {
    // Fragile: every new variant adds another flag/param
}

// ✅ Slot API — callers compose their own content
@Composable
fun Dialog(
    onDismiss: () -> Unit,
    modifier: Modifier = Modifier,
    title: @Composable () -> Unit,
    content: @Composable () -> Unit,
    buttons: @Composable RowScope.() -> Unit,
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        modifier = modifier,
        title = title,
        text = content,
        confirmButton = { Row { buttons() } },
    )
}

// Caller controls the entire layout
Dialog(
    onDismiss = { show = false },
    title = { Text("Delete item?") },
    content = { Text("This cannot be undone.") },
    buttons = {
        TextButton(onClick = { show = false }) { Text("Cancel") }
        Button(onClick = { delete() }) { Text("Delete") }
    },
)
```

Slots (`content: @Composable () -> Unit`) make a composable infinitely flexible without adding parameters. Prefer slots over boolean flags.

## CompositionLocal

### Appropriate vs abusive CompositionLocal

```kotlin
// ❌ CompositionLocal for domain data, ViewModels, or replaceable dependencies
val LocalUserId = compositionLocalOf { "" }
val LocalUserRepository = staticCompositionLocalOf<UserRepository> { error("No repository!") }
val LocalHomeViewModel = staticCompositionLocalOf<HomeViewModel> { error("No ViewModel!") }

// ❌ Reading a CompositionLocal deep in a non-UI layer
class MyRepository {
    @Composable
    fun fetch(): Data {
        val userId = LocalUserId.current // ties repository to composition
        return api.get(userId)
    }
}

// ✅ CompositionLocal for truly implicit, tree-scoped UI concerns
val LocalContentColor = compositionLocalOf { Color.Black }
val LocalTextStyle = compositionLocalOf { TextStyle.Default }
val LocalLayoutDirection = staticCompositionLocalOf { LayoutDirection.Ltr }

// ✅ Explicit parameter passing for domain data — not CompositionLocal
@Composable
fun HomeScreen(userId: String, viewModel: HomeViewModel = hiltViewModel()) {
    // userId is explicit; ViewModel comes from DI, not CompositionLocal
}
```

`CompositionLocal` is for scoped UI configuration (theme, colors, typography, layout direction). It is not a dependency injection mechanism. For domain data and ViewModels, use explicit parameters or Hilt/Koin.

## remember

### remember pitfalls

```kotlin
// ❌ Forgetting remember — object recreated on every recomposition
@Composable
fun CanvasEditor() {
    val path = Path() // new Path every recomposition — resets drawing
    Canvas(Modifier.fillMaxSize()) {
        drawPath(path, Color.Black)
    }
}

// ❌ remember caches a mutable object whose mutations don't trigger recomposition
@Composable
fun ItemList(viewModel: MyViewModel = hiltViewModel()) {
    val items = remember { mutableListOf<Item>() } // mutations won't trigger recomposition

    LaunchedEffect(Unit) {
        viewModel.items.collect {
            items.clear()
            items.addAll(it) // UI won't update — not a Compose State
        }
    }
    items.forEach { Text(it.name) }
}

// ✅ remember + mutableStateOf, or state derived from a key
@Composable
fun CanvasEditor() {
    val path = remember { Path() } // retained across recompositions
    Canvas(Modifier.fillMaxSize()) {
        drawPath(path, Color.Black)
    }
}

// ✅ remember(key) to reinitialize when the key changes
@Composable
fun TransformImage(imageUrl: String) {
    val decoder = remember(imageUrl) { ImageDecoder(imageUrl) }
    // Decoder is retained until imageUrl changes, then recreated
}
```

`remember` retains an object across recompositions. Without it, the object re-creates on every call. With a key, `remember(key)` reinitializes only when the key changes — essential for parameter-dependent objects.

## derivedStateOf

### When to use (and not use) derivedStateOf

```kotlin
// ❌ derivedStateOf for values that change as often as the input — no recomposition savings
@Composable
fun UserList(users: List<User>) {
    val filtered by remember {
        derivedStateOf { users.filter { it.isActive } }
    }
    // `filtered` recalculates every time `users` changes (same frequency, zero benefit)
    LazyColumn {
        items(filtered) { user -> Text(user.name) }
    }
}

// ❌ derivedStateOf wrapping a simple read — adds overhead
@Composable
fun Counter(count: Int) {
    val doubled by remember { derivedStateOf { count * 2 } }
    Text("$doubled")
}

// ✅ derivedStateOf when derived value changes less often than inputs
@Composable
fun UserList(users: List<User>) {
    val activeCount by remember {
        derivedStateOf { users.count { it.isActive } }
    }
    // `activeCount` only changes when active/inactive status flips — actual saving

    Text("Active: $activeCount")

    LazyColumn {
        items(users, key = { it.id }) { user ->
            Row {
                Text(user.name)
                Checkbox(checked = user.isActive, onCheckedChange = { /* toggle */ })
            }
        }
    }
}
```

Use `derivedStateOf` only when the derived value changes substantially less often than the input state it reads — it is an optimization, not a general-purpose memo.

## Lifecycle-Aware Collection

### collectAsStateWithLifecycle over collectAsState

```kotlin
// ❌ collectAsState collects even when the lifecycle is stopped — wastes resources
@Composable
fun HomeScreen(viewModel: HomeViewModel = hiltViewModel()) {
    val uiState by viewModel.uiState.collectAsState()
    // Flow keeps collecting and recomposing even when the app is in the background
}

// ✅ collectAsStateWithLifecycle respects lifecycle — stops in background
@Composable
fun HomeScreen(viewModel: HomeViewModel = hiltViewModel()) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    // Automatically stops collection at onStop, resumes at onStart
}
```

`collectAsStateWithLifecycle` from `lifecycle-runtime-compose` is the default for collecting Flows in production Compose UI. `collectAsState` has no lifecycle awareness — use it only when the composable is not tied to a lifecycle (e.g. previews, tests, or components inside a non-lifecycle host).

## Preview

### @Preview on every public composable

```kotlin
// ❌ Public composable without @Preview — hard to iterate on visually
@Composable
fun ProfileCard(user: User, onFollow: () -> Unit) {
    Card {
        Column {
            AsyncImage(model = user.avatarUrl, contentDescription = null)
            Text(user.displayName)
            Button(onClick = onFollow) { Text("Follow") }
        }
    }
}

// ✅ Every public composable has at least one @Preview with fake data
@Composable
fun ProfileCard(
    user: User,
    onFollow: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Card(modifier) {
        Column {
            AsyncImage(model = user.avatarUrl, contentDescription = null)
            Text(user.displayName)
            Button(onClick = onFollow) { Text("Follow") }
        }
    }
}

@Preview(showBackground = true)
@Composable
private fun ProfileCardPreview() {
    val sampleUser = User(
        id = "1",
        displayName = "Jane Doe",
        avatarUrl = "https://example.com/avatar.png",
    )
    ProfileCard(user = sampleUser, onFollow = {})
}

@Preview(showBackground = true, uiMode = UI_MODE_NIGHT_YES)
@Composable
private fun ProfileCardDarkPreview() {
    ProfileCard(user = sampleUser(), onFollow = {})
}

private fun sampleUser() = User(id = "1", displayName = "Jane Doe", avatarUrl = "")
```

Previews are the fastest Compose iteration loop. Each public composable should have at least one `@Preview` using fake data — never inject a ViewModel into a Preview. Provide dark-mode and multi-locale previews for critical screens.

## Cite the Source

When this skill asserts an idiomatic contract or API behavior, back the claim with the androidx source: `[source: GitHub — androidx/androidx/{path}:L{line} — {what was verified}]`. For platform or framework source, cite cs.android.com instead.

When behavior is uncertain or version-sensitive, do not guess. Route through the `android-source-research` skill workflow, which traces behavior to source before the claim is written. For deep source navigation, use the `jetpack-compose--source-tracer` subagent.

NEVER assert API behavior from training data alone.
