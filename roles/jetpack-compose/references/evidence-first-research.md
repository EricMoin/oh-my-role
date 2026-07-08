# Evidence-First Research — Jetpack Compose / Android

This reference defines the evidence-first research discipline for the Jetpack Compose role. Every subagent and the engineer function MUST follow this discipline when making claims about Android framework behavior, Compose APIs, AndroidX libraries, Gradle, Kotlin, or third-party dependencies.

---

## 1. Evidence Tiers

Classify evidence by reliability. Use the highest tier available.

### Tier 1 — Primary Evidence (Direct Source)

| Source | Examples |
|--------|----------|
| **Context7 documentation lookups** | `resolve-library-id` → `query-docs` for any AndroidX or third-party library |
| **Official Android developer docs** | `developer.android.com` for Compose, Lifecycle, Navigation, Room, Hilt |
| **AndroidX source on GitHub** | `github.com/androidx/androidx` — exact version tag matches |
| **AOSP source on cs.android.com** | Platform framework behavior (WindowInsets, Configuration, Activity lifecycle) |
| **Kotlin language docs** | `kotlinlang.org/docs` for language features, coroutines |
| **Local project source** | `build.gradle.kts`, version catalogs, convention plugins — single source of truth for version pinning |

### Tier 2 — Secondary Evidence (Authoritative Derivative)

| Source | Examples |
|--------|----------|
| **Release notes** | Compose BOM release notes, AGP changelog, Kotlin release notes |
| **Migration guides** | Compose 1.5→1.6 migration, AGP 8.x migration, Kotlin 2.0 compiler changes |
| **Google issue tracker** | `issuetracker.google.com` — includes Google-assigned priority and fix versions |
| **Gradle dependency insight** | Output from `dependencyInsight` and `dependencies` tasks |
| **Official blog posts** | `medium.com/androiddevelopers` — Android Developer Relations Engineering blog |

### Tier 3 — Insufficient Evidence (Do Not Rely On Alone)

| Source | Reason |
|--------|--------|
| **Stack Overflow** | Community-contributed, no version guarantee, may reference outdated APIs |
| **Medium / dev.to articles** | No editorial review, often against older library versions |
| **Training data memory** | Inherently stale — Compose evolves rapidly (BOM releases every quarter) |
| **AI-generated content** | Models hallucinate API names, parameter signatures, and version numbers |
| **YouTube tutorials** | Rarely version-pinned; cannot cite specific line numbers or source |
| **Outdated documentation (>2 major versions old)** | Compose 1.4 vs 1.6 APIs may differ significantly |

---

## 2. Citation Formats

### Official Documentation

```
docs: <URL> — accessed YYYY-MM-DD — <what was verified>
```

Example:
```
docs: https://developer.android.com/develop/ui/compose/modifiers-list — accessed 2026-07-08 — verified that Modifier.semantics merges with parent semantic node by default
```

### Source Code (AndroidX, AOSP, GitHub)

```
source: <path/URL>:<line> — <what was verified>
```

Example:
```
source: github.com/androidx/androidx/blob/androidx.compose-1.6.0/compose/foundation/foundation/src/commonMain/kotlin/.../LazyColumn.kt:285 — verified that default key is position index
```

### Issue Tracker

```
issue: <URL> — <what was verified>
```

Example:
```
issue: issuetracker.google.com/123456789 — confirmed that Compose BOM 2024.02.00 introduced regression in input field focus handling
```

### Release Notes

```
release: <URL> — <what was verified>
```

Example:
```
release: https://developer.android.com/jetpack/androidx/releases/compose-bom#2024.06.00 — verified that material3 1.2.0 changed Slider default colors
```

### Assumption Flag (No Citation — Must Use When No T1/T2 Evidence Exists)

```
[assumption: not verified — <reason>]
```

Example:
```
[assumption: not verified — could not find official docs for rememberSaveable behavior with custom Parcelable objects across process death]
```

---

## 3. Research Triggers

Research is **REQUIRED** before writing code in any of these situations:

| Trigger | Example |
|---------|---------|
| **Unfamiliar Compose API** | Using `Modifier.draggable` for the first time |
| **Version-sensitive behavior** | Compose 1.5 vs 1.6 changed `Modifier.weight` semantics |
| **Platform-specific behavior** | WindowInsets on Android 15 (API 35) differ from API 30 |
| **Undocumented edge case** | "What happens when LazyColumn receives empty list with keys?" |
| **Performance claim** | "derivedStateOf is cheaper than remember + snapshotFlow" |
| **Internal API access** | Accessing `_`-prefixed members of an AndroidX library |
| **Migration impact** | "Does the AGP 8.5 change affect Compose compiler configuration?" |

Research is **NOT required** for: reading local project files, standard Kotlin syntax (`?.`, `?:`, `suspend`, `flow`), applying project-established patterns, or conceptual architecture trade-offs.

---

## 4. Workflow

```
1. TRIGGER: Identify the question (see triggers above)
   └──→ Is this covered by T1 docs (Context7 / official docs)?
       ├── YES → Retrieve docs → Record citation → Implement
       └── NO  → Go to 2
2. SOURCE INVESTIGATION:
   ├── Search AndroidX GitHub (exact version tag)
   ├── Search AOSP cs.android.com (platform behavior)
   ├── Check issue tracker and release notes
   └── Run local dependency insight commands
3. EVIDENCE RECORDING: Record findings in citation format
4. VALIDATION: Cross-check with a minimal experiment when ambiguous
   └──→ If still uncertain → flag as [assumption]
5. CONCLUSION: Produce version-scoped, evidence-backed answer
```

---

## 5. Core Principles

### No training-data claims without verification

Every claim about Compose behavior, AndroidX API, or platform behavior MUST carry a citation or an explicit `[assumption]` flag. Unverified training-data recall is insufficient evidence.

### Prefer Context7 and official docs over memory

When Context7 or `developer.android.com` contradicts training-data memory, prefer the documentation and report the discrepancy.

### One retrieval per claim

Each Context7 call targets one specific concept: one composable, one modifier, one API behavior. Do not batch unrelated lookups.

### Version-aware citation

Including the library version in every citation. Compose BOM changes every quarter. An API in `compose-foundation-1.5` may differ from `1.6`.

### Cite or flag — never bare claims

Every external behavior claim in a report MUST carry a citation or `[assumption]` flag. A bare claim with neither is a violation of this discipline.

### No fake citations

Do not fabricate URLs, file paths, line numbers, or commit hashes. If you do not have a real citation, use `[assumption]`. A fake citation is worse than none — it actively misleads the reviewer.
