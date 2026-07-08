# Compose Performance and Platform Reference

Diagnostics, optimization patterns, stability tooling, Macrobenchmark, Baseline Profiles, and Android platform integration for Jetpack Compose.

---

## 1. Recomposition Diagnosis

### Layout Inspector

Attach from Android Studio while running on device. Shows component tree, rebuild counts per node, and frame timing.

### Recomposition Counter (debug)

```kotlin
@Composable
fun DebugCounter(name: String) {
    var count by remember { mutableIntStateOf(0) }
    SideEffect { count++ }
    Text("$name recomposed $count times")
}
```

### Key Signals

| Signal | Likely Cause |
|--------|-------------|
| Entire tree recomposes on scroll | State read too high, missing `key` in lazy list |
| One composable recomposes with stable inputs | Lambda instability — wrap in `remember` |
| Animation causes whole-screen recompose | State read inside overly broad composable scope |

---

## 2. Stability and Immutability

```kotlin
@Immutable
data class UserUiState(val name: String, val isOnline: Boolean)

@Stable
class ObservableName(private val name: MutableStateFlow<String>) {
    val value: String by name.collectAsState()
}
```

Compose compiler checks stability: a class is stable only if all properties are stable. Collections (`List`, `Map`, `Set`) are NOT stable by default — annotate with `@Immutable`.

### Compiler Reports

```bash
./gradlew :app:assembleDebug -PcomposeCompilerReports=true
```

Reports in `build/compose_compiler/` show composable stability (restartable, skippable) and class stability (stable, unstable) with reasons.

---

## 3. Lazy Layout Optimization

### Keys and Content Type

```kotlin
LazyColumn {
    items(users, key = { it.id }) { user -> UserRow(user) }
    items(mixedItems, key = { it.id }, contentType = { it.type }) { item ->
        when (item.type) { "header" -> HeaderRow(item) else -> ContentRow(item) }
    }
}
```

### derivedStateOf

```kotlin
val visibleCount by remember {
    derivedStateOf { items.count { it.isVisible } }
}
```

Prevents recomposition when the list changes but the derived value does not.

---

## 4. Macrobenchmark

### Setup

```kotlin
// :macrobenchmark/build.gradle.kts
dependencies {
    implementation("androidx.benchmark:benchmark-macro-junit4:1.2.0")
}

@RunWith(AndroidJUnit4::class)
class StartupBenchmark {
    @get:Rule val benchmarkRule = MacrobenchmarkRule()

    @Test
    fun startupCold() {
        benchmarkRule.measureRepeated(
            packageName = "com.example.app",
            metrics = listOf(StartupTimingMetric()),
            iterations = 10, startupMode = StartupMode.COLD
        ) { startActivityAndWait() }
    }
}
```

### Metrics

| Metric | What It Measures |
|--------|-----------------|
| `StartupTimingMetric` | Time to first frame (cold/warm/hot) |
| `FrameTimingMetric` | Frame rendering time, jank percentage |
| `MemoryUsageMetric` | Peak heap, retained memory |

Run: `./gradlew :macrobenchmark:connectedBenchmarkAndroidTest`

---

## 5. Baseline Profiles

### Generation

```kotlin
@RunWith(AndroidJUnit4::class)
class BaselineProfileGenerator {
    @get:Rule val rule = BaselineProfileRule()

    @Test
    fun generate() {
        rule.collectBaselineProfile(packageName = "com.example.app", maxIterations = 10) {
            pressHome(); startActivityAndWait()
        }
    }
}
```

`./gradlew :baselineprofile:generateBaselineProfile` saves to `src/main/baseline-prof.txt`. Expect 15-30% cold start improvement.

---

## 6. Android Platform Integration

### Lifecycle

```kotlin
@Composable
fun LifecycleAwareScreen() {
    val lifecycleOwner = LocalLifecycleOwner.current
    DisposableEffect(lifecycleOwner) {
        val observer = LifecycleEventObserver { _, event ->
            when (event) {
                Lifecycle.Event.ON_RESUME -> { /* track view */ }
                Lifecycle.Event.ON_PAUSE -> { /* pause work */ }
                else -> {}
            }
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose { lifecycleOwner.lifecycle.removeObserver(observer) }
    }
}
```

### WorkManager

```kotlin
@Composable
fun SyncStatusCard() {
    val workInfos by WorkManager.getInstance(LocalContext.current)
        .getWorkInfersByTagFlow("sync").collectAsState(initial = emptyList())
    val isSyncing = workInfos.any { it.state == WorkInfo.State.RUNNING }
    Text(if (isSyncing) "Syncing..." else "Synced")
}
```

### Gradle Build Variants

```kotlin
android {
    buildFeatures { compose = true }
    composeOptions { kotlinCompilerExtensionVersion = "1.5.8" }
    buildTypes {
        debug { isMinifyEnabled = false; applicationIdSuffix = ".debug" }
        release { isMinifyEnabled = true; isShrinkResources = true }
    }
    flavorDimensions += "environment"
    productFlavors {
        create("staging") { dimension = "environment" }
        create("production") { dimension = "environment" }
    }
}
```
