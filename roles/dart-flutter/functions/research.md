---
name: research
description: Documentation lookup discipline for Flutter/Dart APIs and packages — triggered when encountering unfamiliar or version-sensitive behavior
priority: 15
---

# Research

You have encountered an unfamiliar Flutter or Dart API, package, or version-sensitive behavior. Follow the research channels in priority order until the behavior is understood, then cite findings and proceed.

## (a) Research Channels in Priority Order

| Priority | Channel | Use When | Tool |
|----------|---------|----------|------|
| 1 | Context7 | Known packages/frameworks with documentation coverage | `resolve-library-id` → `query-docs` |
| 2 | api.flutter.dev | Flutter SDK class/method documentation | WebFetch `https://api.flutter.dev/flutter/{library}/{class}-class.html` |
| 3 | pub.dev documentation | Package-specific docs not in Context7 | WebFetch `https://pub.dev/packages/{name}` |
| 4 | SDK source grep | Internal platform behavior, undocumented interactions | Grep in project's `.dart_tool/` or Flutter SDK cache |
| 5 | Release notes | Breaking changes, migration paths | WebFetch `https://docs.flutter.dev/release/breaking-changes` |
| 6 | Dart API docs | Dart core library specifics | WebFetch `https://api.dart.dev/stable/dart-{library}/{class}-class.html` |

Move to the next channel only when the current one produces no useful result.

## (b) Context7 Workflow (Primary Research Channel)

Context7 is the first channel for researching known packages and frameworks. Follow these steps:

1. **Identify the target.** Determine the package or framework name (e.g., "flutter", "riverpod", "go_router", "drift", "dio", "bloc"). Be specific about what behavior you are investigating.

2. **Resolve the library ID.** Call `resolve-library-id` with the package name and the specific question. Use the official library name with proper punctuation (e.g., "go_router" not "gorouter", "riverpod" not "river pod").

3. **Select the best match.** From the results, choose by:
   - Exact name match (preferred over partial)
   - Code snippet count (higher is better)
   - Source reputation (High/Medium preferred)
   - Benchmark score (higher is better)
   - Version match when the user specified a version

4. **Query documentation.** Call `query-docs` with the selected library ID and a specific, focused question. Keep each query to one concept — if the question spans multiple topics, make separate calls.

5. **Parse and extract.** Extract the relevant API details, code examples, type signatures, or behavior documentation from the response.

6. **Record the citation.** Format: `[source: Context7/{libraryId} — "{query summary}"]`

**Common Flutter/Dart library IDs to know:**

| Package | Context7 Search Hint |
|---------|---------------------|
| Flutter framework | Search "Flutter" or "api.flutter.dev" |
| Riverpod | Search "riverpod" |
| go_router | Search "go_router" |
| Bloc | Search "bloc" |
| Drift | Search "drift" |
| Dio | Search "dio" |
| Freezed | Search "freezed" |
| JsonSerializable | Search "json_serializable" |
| SharedPreferences | Search "shared_preferences" |

**When Context7 returns no match:** If `resolve-library-id` returns poor or irrelevant results, try alternate names (e.g., "dart_package" → "dart package", "flutter_plugin" → "flutter plugin"). If still no match after 3 attempts, move to channel 2.

## (c) Citation Format

Per the evidence-first research discipline (`references/evidence-first-research.md`), all research findings must be cited using these formats:

| Source Type | Format | Example |
|-------------|--------|---------|
| Context7 | `[source: Context7/{libraryId} — "{query}"]` | `[source: Context7/riverpod — "Provider family syntax with arguments"]` |
| Web (api.flutter.dev) | `[source: {url}]` | `[source: https://api.flutter.dev/flutter/widgets/Flexible-class.html]` |
| Web (pub.dev) | `[source: {url}]` | `[source: https://pub.dev/packages/drift/example]` |
| Web (docs.flutter.dev) | `[source: {url}]` | `[source: https://docs.flutter.dev/release/breaking-changes]` |
| Web (api.dart.dev) | `[source: {url}]` | `[source: https://api.dart.dev/stable/dart-collection/Iterable-class.html]` |
| Source code | `[source: {package}:{file}:L{line}]` | `[source: flutter:packages/flutter/lib/src/widgets/framework.dart:L1420]` |
| Local dependency | `[source: .dart_tool/package_config.json:{package}]` | `[source: .dart_tool/package_config.json:riverpod]` |
| Assumption | `[assumption: not verified — {reason}]` | `[assumption: not verified — could not find official docs for this specific API surface]` |

**Usage rules:**
- Cite inline when the source directly supports a specific claim: `The ScrollPosition class (source: https://api.flutter.dev/flutter/widgets/ScrollPosition-class.html) has a pixels field...`
- For broader research, collect citations in a `Research Evidence` block at the end of the investigation.
- Never omit a citation — unsubstantiated claims about API behavior are forbidden.
- When citing a channel that returned nothing useful, note the negative result: `[channel: Context7 — no results for "deprecated_provider"]`

## (d) Escalation Rules

**When to stop and escalate to the user** instead of proceeding with uncertain findings:

1. **No documentation exists.** Context7 has no entry AND WebFetch returns no relevant docs across all six channels.

2. **Contradictory documentation.** Two official sources say different things for the same API (e.g., api.flutter.dev and docs.flutter.dev disagree on parameter behavior).

3. **Undocumented new API.** The API appears to be post-release but not yet documented — no release notes, no changelog entries.

4. **Deprecated with no migration path.** The API is deprecated but the deprecation notice and release notes do not specify the replacement.

5. **Observed behavior contradicts docs.** Platform-specific behavior (iOS vs Android, web vs native) differs from what the official documentation claims.

**Escalation format:**

```
⚠️ Research inconclusive: {description of what was searched}
Channels tried: {list of channels attempted and results}
Finding: {what was found or not found}
Recommendation: {suggested next step for the user — e.g., file an issue, check a specific GitHub discussion, test on a physical device}
```

When you escalate, do NOT proceed with the task. Present the findings and wait for user guidance.

## (e) Research Scope Boundaries

**This function covers:**
- Flutter SDK APIs — widgets, rendering, gestures, animation, painting, semantics, accessibility
- Dart language features and core libraries — collections, async, isolates, FFI, mirrors
- pub.dev packages used in the project — state management, routing, networking, serialization, storage
- Platform-specific APIs accessed via Flutter — permissions, camera, sensors, file system, biometrics, local auth
- Build system behavior — Gradle configuration, CocoaPods resolution, web build configuration
- Version-specific behavior and migration paths between Flutter/Dart versions

**This function does NOT cover (defer to the relevant discipline):**
- Business logic design decisions — defer to domain knowledge
- UI/UX design choices — defer to the UI/accessibility reference (`references/ui-and-accessibility.md`)
- Architecture pattern selection (Riverpod vs Bloc, clean architecture vs MVVM) — defer to the architecture reference (`references/flutter-architecture.md`)
- Test strategy selection (unit vs widget vs integration, mocking strategy) — defer to the testing reference (`references/testing-and-quality.md`)
- Performance profiling methodology — defer to the platform/performance reference (`references/platform-and-performance.md`)
