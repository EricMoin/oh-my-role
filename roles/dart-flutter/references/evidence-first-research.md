# Evidence-First Research — Flutter/Dart

This reference defines the evidence-first research discipline adapted specifically for Flutter and Dart development in the dart-flutter role. Every executor, department worker, and subagent in the dart-flutter tree MUST follow this discipline when making claims about the Flutter framework, the Dart SDK, pub.dev packages, platform APIs, or SDK-internal behavior.

This reference cascades to all dart-flutter sub-agents (architecture-reviewer, ui-layout-reviewer, test-quality-reviewer, performance-platform-reviewer, release-engineer).


## 1. Evidence Tiers

Classify evidence by reliability. Use the highest tier available.

### Primary Evidence (direct source)

These are the strongest forms of evidence. Always prefer them when they exist.

| Source | Examples |
|--------|----------|
| **Context7 documentation lookups** | `resolve-library-id` → `query-docs` for Flutter, Dart, or any pub.dev package |
| **api.flutter.dev official API reference** | Class documentation for `flutter/widgets`, `flutter/material`, `flutter/rendering`, etc. |
| **Dart SDK API reference (api.dart.dev)** | `dart:core`, `dart:async`, `dart:io`, `dart:convert`, `dart:ui` class APIs |
| **pub.dev documentation tabs** | Package README, library docs, and example tabs on `pub.dev/packages/{name}` |
| **Flutter/Dart SDK source code** | Local grep in `.dart_tool/`, Flutter SDK cache (`~/fvm/`, `~/flutter/`), or GitHub source tree (`github.com/flutter/flutter`) with file path and line number |
| **Dart specification** | The Dart language specification for language-level semantics (type system, null safety, records, patterns) |
| **Commit hash to SDK or framework** | Merged PRs or commits in `flutter/flutter` or `dart-lang/sdk` that introduced or changed behavior |

### Secondary Evidence (authoritative derivative)

Acceptable when primary evidence is not available. Prefer official sources over unofficial summaries.

| Source | Examples |
|--------|----------|
| **Flutter release notes** | `docs.flutter.dev/release/release-notes` for version-specific changes |
| **Flutter breaking changes** | `docs.flutter.dev/release/breaking-changes` for migration guidance |
| **Dart changelogs** | `dart.dev/guides/language/evolution` for language feature history |
| **Migration guides** | Null safety migration guide, Material 3 migration guide, platform-specific migration docs |
| **Flutter cookbook** | `docs.flutter.dev/cookbook` — official, maintained code patterns |
| **Official Flutter blog** | `flutter.dev/blog` — engineering blog posts, feature announcements |
| **Dart package changelogs** | `CHANGELOG.md` on pub.dev or the package repository |

### Insufficient Evidence (do not rely on alone)

These sources MUST NOT be cited as fact. If they are the only source available, flag the claim as an unverified assumption.

| Source | Reason |
|--------|--------|
| **Stack Overflow answers** | Community-contributed, no version guarantee, may be outdated |
| **Medium / dev.to articles** | No editorial review, often written against older SDK versions |
| **Random blog posts** | No authority, no maintenance commitment |
| **Training data memory** | Inherently stale — SDK versions, deprecations, and best practices change rapidly |
| **AI-generated content** | Large language models hallucinate API names, parameter signatures, and version numbers |
| **Outdated tutorials (>2 major versions old)** | Flutter's API surface changes significantly; Material 2 vs 3, null safety pre/post migration |
| **YouTube videos / courses** | Rarely version-pinned; cannot cite specific line numbers or source |


## 2. Citation Formats

Every evidence citation follows one of these formats. Use the format that matches the evidence type.

### Web source

```
[source: URL — accessed YYYY-MM-DD — what was verified]
```

Example:
```
[source: https://api.flutter.dev/flutter/widgets/MediaQuery-class.html — accessed 2026-07-08 — MediaQuery.of(context) throws if no MediaQuery ancestor is found — use MediaQuery.maybeOf for nullable access]
```

### Source code (SDK or package source)

```
[source: filepath:lineNumber — what was verified]
```

Example:
```
[source: packages/flutter/lib/src/widgets/framework.dart:142 — State.setState enqueues a rebuild but does not immediately re-render]
```

### Git commit

```
[source: flutter/flutter@abc1234 — what was verified]
```

Example:
```
[source: flutter/flutter@a3f2e9c1 — changed setState behavior to batch across microtask boundaries]
```

### Issue tracker

```
[source: flutter/flutter#12345 — what was verified]
```

Example:
```
[source: flutter/flutter#12345 — confirmed that ListView.builder does not call itemBuilder for items outside the viewport after the initial build]
```

### pub.dev package

```
[source: pub.dev/packages/{name} — documentation tab — what was verified]
```

Example:
```
[source: pub.dev/packages/provider — documentation tab — confirmed that ChangeNotifierProvider disposes its value when removed from the widget tree]
```

### Assumption flag (no citation — MUST use when no primary or secondary evidence exists)

```
[assumption: not verified — {reason}]
```

Example:
```
[assumption: not verified — could not find documentation for ScrollController.dispose behavior when controller is null]
```

### SDK grep local cache

```
[source: ~/flutter/packages/flutter/lib/src/rendering/sliver_multi_box_adaptor.dart:312 — verified that performLayout calls layout on all visible children]
```


## 3. When Research Is REQUIRED

Research is REQUIRED before any of the following. Complete it BEFORE writing implementation code.

### Unfamiliar Flutter widgets or APIs

Do not guess constructor parameters, named arguments, builder signatures, or return types. Look up the class on api.flutter.dev or via Context7 first.

Triggering patterns:
- Using a widget you have not used before (e.g., `InteractiveViewer`, `AnimatedList`, `CustomScrollView`)
- Using a named parameter you are unsure about (e.g., `clipBehavior`, `primary: false`)
- Composing multiple widgets in an unfamiliar way

### Platform-specific behavior

Flutter code runs on Android, iOS, web, macOS, Windows, and Linux. Many APIs behave differently per platform.

Triggering patterns:
- `dart:io` APIs (`File`, `Process`, `Socket`) — behavior varies on web (unsupported) vs native
- Platform channels / `MethodChannel` — method names and serialization behavior are platform-implementation-specific
- `Platform.is*` checks — what is available per platform
- Keyboard handling, text input, focus — platform input method differences
- `CupertinoNavigationBar` vs `MaterialApp` — platform-adaptive patterns

### Version-sensitive decisions

Flutter and Dart evolve fast. Behavior that was true in Flutter 2.x may be false in Flutter 3.x.

Triggering patterns:
- Deprecated APIs (e.g., `RaisedButton` → `ElevatedButton`, `ThemeData` constructor changes)
- New features gated behind SDK version constraints (e.g., `switch` expressions in Dart 3, `records`, `patterns`, `sealed class`)
- Material 2 vs Material 3 differences (`useMaterial3`)
- Breaking changes between Flutter stable releases (check `docs.flutter.dev/release/breaking-changes`)
- Null safety migration artifacts (pre/post 3.0)

### Package internals beyond the public interface

Triggering patterns:
- Accessing private (`_`-prefixed) members of a package
- Relying on behavior not documented in the package README or API docs
- Hooking into internal callbacks or streams that are not part of the package's advertised contract
- Forking or monkey-patching library behavior

### Asserting "standard practice" or "convention"

Triggering patterns:
- Saying "the standard way to do state management in Flutter is X"
- Claiming "most Flutter projects structure their code as Y"
- Citing "Flutter best practices" without linking to official guidance

If the convention is actually documented (Flutter cookbook, Flutter engineering guide, package README), cite it. Otherwise, flag as an assumption.

### Performance claims without measurement

Triggering patterns:
- "X widget is more performant than Y"
- "Using Opacity is expensive, use a custom painter instead"
- "ListBuilder is faster than Column in this scenario"

Flutter performance claims MUST be backed by evidence: Flutter documentation, official guidance, or measurements from the Flutter benchmark suite or the project's own profiling.

### Build system behavior

Triggering patterns:
- Gradle configuration for Android builds
- Xcode build settings for iOS/macOS
- Plugin registration in Android `settings.gradle` or iOS `Podfile`
- Flutter build modes (`debug`, `profile`, `release`) and their differences
- Tree-shaking, code obfuscation, app size behavior


## 4. When Research Is NOT Required

Research is NOT required in these cases. Use the project's own files and standard language knowledge instead.

### Reading or writing local project files

- Reading `pubspec.yaml`, analysis_options.yaml, test files
- Grepping project source for existing patterns and conventions
- Examining widget trees, test files, and route definitions within the project

### Standard Dart language syntax

- Null-aware operators (`?.`, `??`, `??=`)
- Async/await, Futures, Streams, isolates (language-level concepts)
- Generics, collections (`List`, `Map`, `Set`), records, patterns (Dart 3+)
- Class and mixin declarations, constructors, factory constructors
- Import, export, and part directives

These are part of the Dart language specification and are not external systems.

### Applying project-established patterns

- If the project already follows Riverpod and you are adding a new provider, follow the same pattern
- If the project uses `go_router` with a specific route structure, add routes the same way
- If the project has a custom theme or design system, use it directly

The project's own code is the best reference for local conventions.

### Conceptual architecture questions

- Trade-off analysis between BLoC vs Riverpod vs Provider
- Folder structure arguments (feature-first vs layer-first)
- Design pattern questions (Repository pattern, Service Locator vs DI)

These are reasoning tasks, not research tasks. Use the loaded reference guides.

### Running tools and interpreting output

- `dart analyze` — reading lint results is not research
- `flutter test` — test failures are local evidence, not external claims
- `flutter build` — build output is project-specific, not an external API

When in doubt, research. A 30-second Context7 lookup costs less than a bug introduced by an incorrect assumption.


## 5. Core Principles

### No training-data claims without verification

When a claim involves Flutter widget behavior, Dart language semantics, pub.dev package behavior, or platform-specific behavior, the claim MUST be backed by a citation to primary evidence or an explicit `[assumption]` tag. Unverified training-data recall is insufficient evidence.

Flutter's API surface changes rapidly. A widget that existed in 2024 may have been deprecated in 2025. A parameter default may have changed. Training data is inherently stale.

### Prefer Context7 and official docs over memory

When Context7 documentation, api.flutter.dev, or Dart API docs contradict training-data memory, prefer the documentation and report the discrepancy.

Research channels in priority order:
1. **Context7** (resolve-library-id → query-docs) — best for complex usage questions
2. **api.flutter.dev** / **api.dart.dev** — best for class/method parameter confirmation
3. **pub.dev documentation tab** — best for third-party package behavior
4. **SDK source grep** (local cache or GitHub) — best for internal behavior not in API docs
5. **WebFetch release notes** — best for migration and breaking change detection

### Cite or flag

Every external behavior claim in an execution report MUST carry a citation in the format above or be explicitly flagged as `[assumption: not verified — ...]`. A bare claim with no citation and no flag is a violation of this discipline.

### Research before code

When research is required, complete it BEFORE writing implementation code. Do not code first and backfill citations later. Research findings inform the implementation. The reverse order produces bugs, incorrect widget usage, or platform-specific crashes.

### No fake citations

Do not fabricate URLs, file paths, line numbers, or commit hashes. Do not generate plausible-looking Flutter SDK source paths that do not exist. If you do not have a real citation, use the `[assumption]` flag format. A fake citation is worse than no citation — it is actively misleading.

### One retrieval per claim

Do not batch multiple unrelated API lookups into a single Context7 call. Each call should target one specific concept: one widget class, one method, one behavior. This keeps citations precise and results focused.

### Version-aware citation

When citing documentation for a version-sensitive claim (e.g., "ListView.builder in Flutter 3.22"), include the SDK version in the citation. Flutter's stable channel releases new versions roughly every quarter.
