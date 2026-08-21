---
name: structure-analysis
description: Phase 3 — understand a decompiled app's architecture. Read AndroidManifest.xml (launcher, components, permissions, application class), survey packages (api/network/data/repository), mine every BuildConfig.java (base URLs, keys, flags), identify the architecture pattern (MVP/MVVM/Clean), and recover Kotlin class names from @Metadata on obfuscated apps. 中文触发词：结构分析、清单文件、Manifest分析、包结构、架构识别、BuildConfig、Kotlin名称恢复、混淆恢复
trigger: analyze structure|androidmanifest|manifest|package structure|architecture pattern|buildconfig|kotlin name recovery|deobfuscate names|mvvm|clean architecture|结构分析|清单文件|包结构|架构识别|BuildConfig|名称恢复|混淆恢复
---

# Phase 3: Analyze Structure

Map the app before chasing details. The manifest, package layout, and BuildConfig
tell you what the app is, what it can do, and where the interesting code lives.

## 1. Read AndroidManifest.xml

Location: `<output>/resources/AndroidManifest.xml` (jadx) or `app-apktool/AndroidManifest.xml`.

- **Launcher Activity** — the entry point (`<intent-filter>` with `MAIN` + `LAUNCHER`).
- **Components** — enumerate `<activity>`, `<service>`, `<receiver>`, `<provider>`.
- **Permissions** — note `INTERNET`, `ACCESS_NETWORK_STATE`, and any sensitive ones
  (location, SMS, contacts, accessibility, `QUERY_ALL_PACKAGES`).
- **Application class** — `android:name` on `<application>`; its `onCreate()` usually
  wires up the HTTP client, base URL, and DI — read it early in Phase 4.
- **Exported components** — `android:exported="true"` (or an implicit intent-filter)
  marks an attack surface; carry these into the security audit (Phase 6).
- **Network security config** — `android:networkSecurityConfig` points at an XML that
  may pin certs or allow cleartext.

## 2. Survey the package structure

Under `<output>/sources/`:

- Identify the **main app package** vs. bundled third-party libraries.
- Prioritize packages named `api`, `network`, `data`, `repository`, `service`,
  `retrofit`, `http`, `remote`, `datasource` — API calls concentrate here.
- Note DI packages (`di`, `inject`, `module`) and model packages (`model`, `dto`, `entity`).

## 3. Mine every BuildConfig.java (highest signal-to-effort)

`BuildConfig` fields are almost never obfuscated and frequently leak base URLs,
flavor/build-type, feature flags, and even third-party API keys.

```bash
# Every Gradle module emits its own BuildConfig — read all of them
find <output>/sources -name BuildConfig.java -exec grep -H '=' {} \;
```

## 4. Identify the architecture pattern

| Pattern | Tell-tale |
|---|---|
| MVP | `*Presenter` classes, `*View` interfaces |
| MVVM | `*ViewModel` classes, `LiveData` / `StateFlow` / `MutableStateFlow` |
| Clean Architecture | `domain` / `data` / `presentation` packages, `*UseCase` / `*Interactor` |
| Repository pattern | `*Repository` classes mediating data sources |

Knowing the pattern tells you where network calls sit (usually Repository / data
layer) — this drives Phase 4 tracing.

## 5. Recover Kotlin class names (obfuscated Kotlin apps only)

> **Deep dive:** the full technique, `@Metadata`/`@DebugMetadata` field layout, the
> recovery-map workflow, and limitations are in `references/kotlin-name-recovery.md`.

R8 obfuscates JVM symbols but **cannot strip Kotlin metadata strings**. Original
fully-qualified names leak through `@Metadata` (the `d2` array) and `@DebugMetadata`
(on suspend functions). On a moderately/heavily obfuscated Kotlin app, recover names
before tracing:

```bash
# Kotlin metadata carries original names even when the class is renamed to 'a'
grep -rl '@Metadata' <output>/sources | head
grep -rn '@DebugMetadata' <output>/sources   # suspend fns: leaks real class + method
```

Look for the `c` (class name) and `d2`/`d1` fields inside `@Metadata`, and the
`c` (className) / `m` (methodName) inside `@DebugMetadata`. These let you map
obfuscated `a.b.c` back to `com.example.data.UserRepository`. In practice this
recovers ~100% of `*Repository` / `*ViewModel` / `*UseCase` / `*Impl` names and
most DTOs — dramatically speeding up call-flow tracing.

## Output of this phase

An architecture summary: entry point, component inventory, permissions, exported
surface, key packages, BuildConfig constants, the architecture pattern, and (if
obfuscated Kotlin) a name-recovery map.
