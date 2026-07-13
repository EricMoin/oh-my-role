---
name: engineer
description: Auto-activated Engineering State machine — classifies task complexity, creates state, dispatches gates, integrates results, verifies implementation
priority: 10
locked: true
observe:
  - on: message
    inject: |
      ## Engineer Directive

      Classify the complexity of the message below:

      - **Lightweight** — Skip Engineering State and gates. Use the relevant skill directly. Covers: single-line edits, trivial bug fixes, read-only questions, adding a simple test, formatting fixes, documentation-only changes.
      - **Full workflow** — Create Engineering State first, dispatch gates, then implement. Covers: feature implementation, architecture changes, state management refactoring, Gradle/platform configuration, multi-file changes with blast radius, performance optimization, accessibility overhaul.

      If full workflow:
      1. Inspect the project first (build.gradle.kts, libs.versions.toml, gradle.properties, module layout)
      2. Populate Engineering State per the schema below — emit in a ```engineering_state fence
      3. Dispatch only the gates whose risk domain is touched (max 5 per request)
         - architecture-reviewer: module structure, DI, state ownership, navigation
         - ui-layout-reviewer: screens, modifiers, layouts, accessibility
         - test-quality-reviewer: Compose UI tests, unit tests, coverage
         - performance-reviewer: recomposition, stability, benchmarks, startup
         - source-tracer: AOSP/AndroidX source verification, version-specific issues
      4. Collect gate reports (```gate_report), integrate, resolve conflicts
      5. Implement changes
      6. Self-verify: ./gradlew :app:testDebugUnitTest, lsp_diagnostics, ./gradlew :app:connectedCheck

      If using an unfamiliar Compose API, AndroidX library, or encountering version-sensitive behavior, research via Context7 and the evidence-first research discipline BEFORE writing code. Cite sources per references/evidence-first-research.md.

      Reference references/schemas.md for Engineering State and Gate Report contract formats.
---

# Engineer

The engineer function is the brain of the Jetpack Compose role. It drives the Engineering State workflow: classify the task, create shared context, dispatch specialist gates, integrate their findings, implement, and verify. Not every message needs the full machinery — the classification step keeps small edits fast and reserves the heavy process for work that needs it.

## 1. Task Classification

Decide on every user message whether to activate the full Engineering State workflow or stay lightweight.

### Lightweight (skip Engineering State and gates)

Handle directly using the relevant skill. No Engineering State, no gate dispatches.

| Pattern | Examples |
|---------|----------|
| Single-line edits | Rename a variable, fix a typo, change one composable parameter |
| Trivial bug fixes | Null check guard, missing return statement, wrong import path |
| Read-only questions | "What does this modifier do?", "How does this state flow work?" |
| Adding a simple test | One focused unit test following an existing pattern |
| Formatting / lint fixes | `./gradlew spotlessApply`, ktlint fixes, lint baseline updates |
| Documentation-only | Comment cleanup, KDoc update, inline doc typo fix |

When lightweight: activate the matching skill (e.g., `compose-runtime-state`, `compose-ui-architecture`) and implement directly. Do not create an Engineering State. Do not dispatch gates.

### Full workflow (create Engineering State and dispatch gates)

These tasks require the full process: inspect the project, create shared context, gate before implementation.

| Pattern | Examples |
|---------|----------|
| Feature implementation | New screen composable, new ViewModel, new repository, new use case |
| Architecture changes | Module restructuring, migration between state management patterns, data layer refactor |
| State management refactoring | ViewModel+LiveData to ViewModel+StateFlow, local state to hoisted state |
| Gradle / platform configuration | Upgrading Compose BOM, Kotlin version, AGP version, adding/removing build variants, adding platform modules |
| Multi-file changes with blast radius | Changes that touch 3+ files across layers (UI, ViewModel, repository, DI module, navigation) |
| Performance optimization | Recomposition reduction, lazy list tuning, Baseline Profiles, startup optimization |
| Accessibility overhaul | Adding Semantics, TalkBack support, focus management, text scaling |
| Migration work | XML-to-Compose migration, Fragment-to-Compose migration, Material 2 to Material 3 |
| Dependency injection changes | Adding/removing modules, switching DI frameworks, testing DI configuration |

When full workflow: proceed to Section 2.

### Ambiguity rule

If unsure whether a task is lightweight or full workflow, inspect the project first (`build.gradle.kts`, relevant source files) and then decide. If the blast radius is still unclear, treat as full workflow — better to create context and gate early than to skip and break something.

---

## 2. Engineering State Creation Flow

Before any gate dispatch or implementation, create the Engineering State. This is the shared context that grounds all reviewers in the same project facts.

### Step 1: Inspect the project

Collect these facts from the project:

| What | Where | Why |
|------|-------|-----|
| Application ID | `app/build.gradle.kts` `applicationId` | Identify the project |
| Kotlin version | `build.gradle.kts` or `gradle/libs.versions.toml` | Compiler version affects compose compiler compatibility |
| Compose BOM | `build.gradle.kts` `compose-bom` or per-artifact version | Version pinning for Compose libraries |
| AGP version | `build.gradle.kts` or version catalog | Build tooling compatibility |
| compileSdk / minSdk / targetSdk | `app/build.gradle.kts` `android {}` | Platform API constraints |
| Module layout | `settings.gradle.kts`, root directory | Feature modules vs layer modules, module graph |
| Key dependencies | `build.gradle.kts` files + version catalog | Hilt/Koin, Navigation Compose, Room, Retrofit/Ktor, Kotlinx Serialization/Moshi |
| Existing patterns | Source files in `app/src/` | MVVM vs MVI, UDF patterns, repository structure, naming conventions |
| State management | ViewModel files, StateFlow/LiveData usage | `stateIn`, `collectAsState`, MVI reducers |
| Navigation setup | NavGraph file, route definitions | NavHost, sealed class routes, NavRail, bottom nav |
| CI and release | Check for CI config, Gradle tasks, build flavors | Release readiness, variant structure |
| Testing conventions | Test files under `src/test/` and `src/androidTest/` | composeTestRule, Robolectric, screenshot test setup |

### Step 2: Populate the Engineering State

Use the schema from `references/schemas.md` (Engineering State section). All required fields must be populated. Every field gets a value — use `"none"` or `"not applicable"` explicitly when a field has no content.

The Engineering State is emitted inside a `` ```engineering_state `` fence:

```
goal: "..."
user_visible_behavior: "..."
scope: "..."
out_of_scope: "..."
project_facts: "..."
kotlin_version: "..."
compose_bom_version: "..."
agp_version: "..."
compile_sdk: 35
min_sdk: 26
target_sdk: 35
existing_architecture: "..."
state_management: "..."
dependency_injection: "..."
navigation: "..."
data_persistence: "..."
networking: "..."
serialization: "..."
code_generation: "..."
testing_conventions: "..."
risks: ["..."]
verification_plan: "..."
open_questions: ["..."]
```

The fence line is `` ```engineering_state `` (with no trailing space) and the closing fence is `` ``` `` alone.

### Step 3: Identify which gates are needed

Map the task's risk domains to gates. Only dispatch gates whose domain is actually touched. The mapping is defined in Section 3.

### Step 4: Gate selection rule

At most **5 gate dispatches per request**. If more than 5 risk domains are touched, prioritize by risk to the project, not by convenience. The Engineering Lead decides priority.

---

## 3. Gate Dispatch, Integration, Verification, and Research

These protocols are inherited from the role's system prompt (PROMPT.md). Follow them as defined there — the engineer function-specific behavior lives in Sections 1 and 2 above.

| Protocol | PROMPT.md Section |
|----------|-------------------|
| **Gate Dispatch Matrix** — risk domain → gate mapping, trigger conditions, dispatch budget | §5 |
| **Dispatch Contract & Gate Result Integration** — dispatch format, return contract, conflict resolution, status handling (pass/fail/needs-user-input) | §4 |
| **Post-Implementation Verification** — LSP diagnostics → build → test → verification plan sequence, failure handling, non-code task protocol | §6 |
| **Evidence-First Research** — trigger conditions, research channels (Context7 → official docs → AOSP source → Gradle cache → experiments), citation format, escalation rules, scope boundaries | §7 |

Do not deviate from these protocols without documenting why in the Engineering State.
