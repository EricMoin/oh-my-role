---
name: research
description: Evidence-first research for Android/AOSP/Compose source investigation — triggered when encountering unfamiliar or version-sensitive behavior
priority: 15
---

# Research

You have encountered an unfamiliar Jetpack Compose API, AndroidX library, AOSP behavior, or version-sensitive Android API. Follow the research channels in priority order until the behavior is understood, then cite findings and proceed.

## (a) Research Channels in Priority Order

| Priority | Channel | Use When | Tool / Method |
|----------|---------|----------|---------------|
| 1 | Context7 | Known Jetpack/AndroidX libraries with documentation coverage | `resolve-library-id` → `query-docs` |
| 2 | developer.android.com | Compose API reference, Android API guides, codelabs, Kotlin documentation | WebFetch `https://developer.android.com/reference/{path}` or `https://developer.android.com/develop/ui/compose/{path}` |
| 3 | AOSP source browser (cs.android.com) | Android platform source, framework internals, AndroidX source implementation | WebFetch `https://cs.android.com/androidx/platform/frameworks/{path}` |
| 4 | AndroidX GitHub (androidx/androidx) | AndroidX library source, issue tracker, release notes | WebFetch `https://github.com/androidx/androidx` or specific library subdirectory |
| 5 | Local Gradle dependency source | Version-specific source of resolved dependencies, decompiled or downloaded sources | Grep in `~/.gradle/caches/modules-2/` or project `build/` directory |
| 6 | Issue trackers | Version-specific regressions, undocumented behavior, confirmed bugs | WebFetch `https://issuetracker.google.com/{id}` or GitHub issues on `androidx/androidx` |

Move to the next channel only when the current one produces no useful result.

### Channel usage notes

**Channel 3 — cs.android.com**: Use the Android Code Search URL format: `https://cs.android.com/androidx/platform/frameworks/support` for AndroidX or `https://cs.android.com/android/platform/superproject` for AOSP framework source. Append specific file paths for deep navigation.

**Channel 4 — AndroidX GitHub**: Individual AndroidX libraries live under `androidx/androidx/{library}` (e.g., `androidx/androidx/compose`). Release notes are published at `https://developer.android.com/jetpack/androidx/versions/all-channel`.

**Channel 5 — Local Gradle cache**: Resolve exact source JARs with:
```
./gradlew :app:dependencies --configuration debugRuntimeClasspath
```
Then locate source JARs in `~/.gradle/caches/modules-2/files-2.1/`. Decompile or read `.java/.kt` sources directly for version-specific implementation details.

**Channel 6 — Issue trackers**: Google Issue Tracker (`issuetracker.google.com`) hosts Android platform and Jetpack bugs. GitHub issues on `androidx/androidx` cover AndroidX libraries. Check both when encountering behavior that differs from documentation.

---

## (b) Context7 Workflow (Primary Research Channel)

Context7 is the first channel for researching known Jetpack/AndroidX libraries and Compose APIs. Follow these steps:

1. **Identify the target.** Determine the library or API name (e.g., "androidx.compose.material3", "androidx.hilt.navigation.compose", "androidx.room"). Be specific about what behavior you are investigating.

2. **Resolve the library ID.** Call `resolve-library-id` with the library name and the specific question. Use the official library name with proper punctuation (e.g., "androidx.compose.foundation" not "composefoundation").

3. **Select the best match.** From the results, choose by:
   - Exact name match (preferred over partial)
   - Code snippet count (higher is better)
   - Source reputation (High/Medium preferred)
   - Benchmark score (higher is better)
   - Version match when the user specified a version

4. **Query documentation.** Call `query-docs` with the selected library ID and a specific, focused question. Keep each query to one concept — if the question spans multiple topics, make separate calls.

5. **Parse and extract.** Extract the relevant API details, code examples, type signatures, or behavior documentation from the response.

6. **Record the citation.** Format: `[source: Context7/{libraryId} — "{query summary}"]`

**Common Android/Compose library search hints:**

| Library | Context7 Search Hint |
|---------|---------------------|
| Jetpack Compose UI | Search "androidx.compose.ui" or "compose" |
| Material 3 Compose | Search "material3" or "androidx.compose.material3" |
| Navigation Compose | Search "navigation compose" |
| Hilt | Search "hilt" or "dagger.hilt" |
| Room | Search "androidx.room" or "room database" |
| Retrofit | Search "retrofit" or "squareup.retrofit" |
| Kotlinx Serialization | Search "kotlinx.serialization" |
| OkHttp | Search "okhttp" or "squareup.okhttp" |
| Coil (image loading) | Search "coil" or "coil-kt" |
| DataStore | Search "datastore" or "androidx.datastore" |
| Macrobenchmark | Search "macrobenchmark" or "androidx.benchmark" |
| Kotlin Coroutines / Flow | Search "kotlinx.coroutines" |

**When Context7 returns no match:** If `resolve-library-id` returns poor or irrelevant results, try alternate names (e.g., "material3" → "material 3", "androidx.room" → "room database"). If still no match after 3 attempts, move to channel 2.

---

## (c) Citation Format

Per the evidence-first research discipline (`references/evidence-first-research.md`), all research findings must be cited using these formats:

| Source Type | Format | Example |
|-------------|--------|---------|
| Context7 | `[source: Context7/{libraryId} — "{query}"]` | `[source: Context7/androidx.compose.material3 — "ExposedDropdownMenuBox accessibility behavior"]` |
| Web (developer.android.com) | `[source: {url}]` | `[source: https://developer.android.com/reference/kotlin/androidx/compose/foundation/lazy/LazyColumn]` |
| Web (AOSP source) | `[source: AOSP/{path}]` | `[source: AOSP/androidx/platform/frameworks/support/compose/foundation]` |
| Web (GitHub) | `[source: GitHub:{org}/{repo}/{path}]` | `[source: GitHub:androidx/androidx/compose/material3/src/commonMain/Menu.kt]` |
| Web (issuetracker) | `[source: issuetracker.google.com/{id}]` | `[source: issuetracker.google.com/265419188]` |
| Source code (local) | `[source: {filepath}:L{line}]` | `[source: ~/.gradle/caches/modules-2/files-2.1/.../Material3.kt:L142]` |
| Gradle dependency insight | `[source: ./gradlew :app:dependencies — {configuration}]` | `[source: ./gradlew :app:dependencies --configuration debugRuntimeClasspath — resolved compose-bom 2024.06.00 → material3 1.2.1]` |
| Assumption | `[assumption: not verified — {reason}]` | `[assumption: not verified — could not find official docs for this specific @ExperimentalComposeApi]` |

**Usage rules:**
- Cite inline when the source directly supports a specific claim: `The Modifier.pointerInput block (source: https://developer.android.com/reference/kotlin/androidx/compose/ui/input/pointer/Modifier) receives coroutine scope...`
- For broader research, collect citations in a `Research Evidence` block at the end of the investigation.
- Never omit a citation — unsubstantiated claims about API behavior are forbidden.
- When citing a channel that returned nothing useful, note the negative result: `[channel: Context7 — no results for "ExperimentalComposeApi annotation behavior"]`

---

## (d) Escalation Rules

**When to stop and escalate to the user** instead of proceeding with uncertain findings:

1. **No documentation exists.** Context7 has no entry AND WebFetch returns no relevant docs across all six channels.

2. **Contradictory documentation.** Two official sources say different things for the same API (e.g., developer.android.com and cs.android.com source disagree on parameter behavior).

3. **Undocumented new API.** The API appears to be released but not yet documented — no release notes, no changelog entries, no migration guide.

4. **Deprecated with no migration path.** The API is marked `@Deprecated` but the deprecation notice and release notes do not specify the replacement.

5. **Observed behavior contradicts docs.** Platform-specific behavior (different device form factors, API level differences, manufacturer customizations) differs from what the official documentation claims.

**Escalation format:**

```
⚠️ Research inconclusive: {description of what was searched}
Channels tried: {list of channels attempted and results}
Finding: {what was found or not found}
Recommendation: {suggested next step for the user — e.g., file an issue, check a specific GitHub discussion, test on a physical device, file a bug on issuetracker.google.com}
```

When you escalate, do NOT proceed with the task. Present the findings and wait for user guidance.

---

## (e) Research Scope Boundaries

**This function covers:**
- Jetpack Compose APIs — foundation, material3, animations, layout, semantics, accessibility, input, focus, window insets
- Android Jetpack libraries — ViewModel, Navigation, Room, DataStore, Hilt, WorkManager, Lifecycle, SavedState
- Kotlin language features for Android — coroutines, Flow, state flow, shared flow, kotlinx.serialization
- Third-party Android libraries — Retrofit, OkHttp, Coil, Glide, Moshi, LeakCanary, Timber
- AOSP/AOSP behavior — Activity/Window lifecycle, configuration changes, input method, surface management
- Gradle build system — Compose compiler plugin, AGP version compatibility, version catalog resolution, lint configuration
- Version-specific behavior and migration paths between Compose BOM versions, Kotlin/AGP versions

**This function does NOT cover (defer to the relevant discipline):**
- Business logic design decisions — defer to domain knowledge
- UI/UX design choices — defer to the UI/accessibility reference (`references/compose-ui-and-accessibility.md`)
- Architecture pattern selection (MVVM vs MVI, Clean Architecture vs simplified UDF) — defer to the architecture reference (`references/compose-architecture.md`)
- Test strategy selection (Compose UI tests vs unit tests vs screenshot tests) — defer to the testing reference (`references/compose-testing-and-quality.md`)
- Performance profiling methodology — defer to the performance reference (`references/compose-performance-and-platform.md`)
