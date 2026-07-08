# Android Source Research — AOSP, AndroidX, and Third-Party Tracing

This reference defines the source-level investigation workflow for verifying Android platform, AndroidX library, and third-party dependency behavior. Use it when official docs are insufficient, ambiguous, or missing.

---

## 1. When to Invoke Source Research

Do NOT guess Android or Compose API behavior. Escalate to source research when:

| Trigger | Example |
|---------|---------|
| **API behavior uncertainty** | "Does `Modifier.semantics` merge with parent semantics by default?" |
| **Undocumented behavior** | "What happens if `LazyColumn` receives a `null` key?" |
| **Version-specific bugs** | "Compose BOM 2024.02 introduced a change in `rememberScrollState` — what changed?" |
| **Internal implementation needed** | "Does `SnackbarHostState.showSnackbar` cancel the previous snackbar?" |
| **Docs vs observed behavior conflict** | "Docs say X but Layout Inspector shows Y" |
| **Migration impact unclear** | "What concrete class changed between Compose 1.5 and 1.6 for `Modifier.weight`?" |

---

## 2. Evidence Hierarchy

Prefer higher tiers. Only descend when higher tiers are exhausted.

| Tier | Source | Authority |
|------|--------|-----------|
| **T1** | Local project source (version catalogs, build.gradle.kts) | Exact — pinned to project |
| **T2** | Official Android docs (developer.android.com) | High — maintained by Google |
| **T3** | AndroidX source on GitHub (github.com/androidx/androidx) | High — canonical implementation |
| **T4** | AOSP source (cs.android.com / android.googlesource.com) | High — platform canonical |
| **T5** | Issue tracker comments (issuetracker.google.com) | Medium — may include workarounds |
| **T6** | Release notes and migration guides | Medium — summary of changes |
| **T7** | Local Gradle dependency source (`~/.gradle/caches/`) | Exact — matches project version |
| **T8** | Reproducible minimal experiment | High (for this project) — definitive but expensive |

---

## 3. cs.android.com — AOSP Navigation Guide

cs.android.com is the primary portal for browsing AOSP source.

### Search Patterns

| What to Search | Query Format | Example |
|----------------|-------------|---------|
| Framework class | `class:ClassName` | `class:Activity` |
| Framework method | `class:Class methodName` | `class:WindowInsetsController show` |
| AndroidX class | Use GitHub (see next section) | — |
| API level guard | `Build.VERSION_CODES.` | `VERSION_CODES.TIRAMISU` |

### Reading AOSP Source

- Platform source lives under `frameworks/base/core/java/android/`
- Compose runtime is part of AndroidX, not AOSP — use GitHub
- API-level differences appear in `compat/` packages — trace version checks carefully
- Distinguish between framework API behavior and AndroidX compatibility wrappers

---

## 4. AndroidX Source on GitHub

The AndroidX monorepo lives at `github.com/androidx/androidx`.

### Repo Structure

```
androidx/
  compose/
    runtime/
    foundation/
    material3/
    ui/
  lifecycle/
  navigation/
  room/
```

### Branch Conventions

| Branch | Purpose |
|--------|---------|
| `main` | Active development — reflects unreleased changes |
| `androidx-main` | Primary development branch |
| `*-release` | Release branches (e.g., `compose-2024.06-release`) |

### Tag Convention

```
androidx.compose-1.6.0    # Compose 1.6.0 release
androidx.lifecycle-2.8.0  # Lifecycle 2.8.0 release
```

### Tracing the Implementation

```kotlin
// Starting from the app's imports:
import androidx.compose.foundation.lazy.LazyColumn

// GitHub path (match the version your app uses):
// github.com/androidx/androidx/tree/androidx.compose-1.6.0/compose/foundation/foundation/src/commonMain/kotlin/androidx/compose/foundation/lazy/LazyColumn.kt
```

---

## 5. Third-Party Library Source from Maven Coordinates

Given a dependency like `"com.squareup.retrofit2:retrofit:2.9.0"`:

1. Convert to GitHub: `github.com/square/retrofit`
2. Find the tag: `parent-pom-2.9.0` or similar
3. Navigate to the module: `retrofit/src/main/java/retrofit2/`

For libraries hosted on JitPack or custom registries, the pom file contains the SCM tag. Extract with:

```bash
./gradlew :app:dependencyInsight --dependency retrofit2
```

---

## 6. Local Gradle Dependency Source Inspection

```bash
# Show full dependency tree
./gradlew :app:dependencies --configuration debugRuntimeClasspath

# Inspect a specific dependency
./gradlew :app:dependencyInsight \
    --dependency androidx.compose.runtime \
    --configuration debugRuntimeClasspath

# Find local cached sources
find ~/.gradle/caches/ -name "compose-runtime-*.jar" | head -5
```

Gradle does NOT include sources by default. Add to `build.gradle.kts`:

```kotlin
android {
    buildFeatures { buildConfig = true }
}
// Or fetch sources explicitly
tasks.withType<DependencyInsightReportTask> { }
```

For IDE source attachment, open the module settings in Android Studio and attach `-sources.jar` files.

---

## 7. Citation Format

Every source finding must be recorded in traceable format:

```
source: <path/URL>[:<line>] — <what was verified>
```

### Examples

```
source: cs.android.com/platform/frameworks/base/core/java/android/view/WindowInsetsController.java:412 — confirmed that show() is a no-op when the app is not in immersive mode

source: github.com/androidx/androidx/blob/androidx.compose-1.6.0/compose/foundation/foundation/src/commonMain/kotlin/androidx/compose/foundation/lazy/LazyColumn.kt:285 — verified that LazyColumn defaults to defaultLazyListKeys for key generation

source: ~/.gradle/caches/modules-2/files-2.1/.../androidx-lifecycle-2.8.0-sources.jar/androidx/lifecycle/ViewModel.kt:177 — confirmed that viewModelScope is associated with the clear() callback

issue: issuetracker.google.com/123456789 — confirmed that Compose BOM 2024.02.00 regressed in HorizontalPager scroll behavior

source: github.com/square/retrofit/tree/parent-pom-2.9.0/retrofit/src/main/java/retrofit2/Retrofit.java:187 — verified that baseUrl must end with '/'
```

### Unconfirmed Finding

```
[assumption: not verified — could not locate the source for this internal Compose behavior in any public repository]
```

---

## 8. Research Workflow Summary

1. **Pin versions**: Identify exact AGP, Kotlin, Compose BOM, and library versions from project source.
2. **Define the question**: One specific behavioral question. Narrow until the answer is binary or parametric.
3. **Search T1-T2**: Check project source and official Android docs.
4. **Search T3-T4**: Trace AndroidX source on GitHub matching the project's exact version.
5. **Search T5-T7**: Check issue tracker, release notes, then local Gradle cache.
6. **Run experiment**: If source is still ambiguous, write a minimal test project.
7. **Report**: Include version scope, evidence chain, conclusion, and any remaining unknowns.
