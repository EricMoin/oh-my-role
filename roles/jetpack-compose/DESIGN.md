# Jetpack Compose Role Upgrade — Structure Design Document

**Status**: Design draft  
**Version**: 1.0  
**Target**: Upgrade `roles/jetpack-compose` from flat skill-loading v1 to gate-driven Engineering State v3, mirroring the `dart-flutter` structural pattern but adapted for Android Compose.

---

## 1. Sub-Agent List

Five sub-agents. The first four mirror `dart-flutter`'s gate structure. The fifth (`source-tracer`) is a novel capability unique to the Android ecosystem — tracing AOSP and AndroidX source code.

| Sub-agent ID | Gate Name | Domain | Read-Only? |
|---|---|---|---|
| `jetpack-compose--architecture-reviewer` | architecture | Architecture, state ownership, DI, module boundaries, navigation structure | Yes |
| `jetpack-compose--ui-layout-reviewer` | ui-layout | Screen layouts, modifiers, constraints, accessibility, adaptive UI, Material 3 | Yes |
| `jetpack-compose--test-quality-reviewer` | test-quality | Compose UI tests, unit tests, screenshot/golden tests, coverage, CI verification | Yes |
| `jetpack-compose--performance-reviewer` | performance | Recomposition, stability, Macrobenchmark, Baseline Profiles, startup, memory | Yes |
| `jetpack-compose--source-tracer` | source-tracing | AOSP/AndroidX/third-party source verification — the NOVEL capability | Yes |

All five are **read-only reviewers**. They never modify files. Each returns a `gate_report` inside a ` ```result ` fence.

### Sub-agent directory layout

```
roles/jetpack-compose/subagents/
  architecture-reviewer/
    role.yaml
  ui-layout-reviewer/
    role.yaml
  test-quality-reviewer/
    role.yaml
  performance-reviewer/
    role.yaml
  source-tracer/
    role.yaml
```

Each `role.yaml` follows the same pattern as `dart-flutter/subagents/*/role.yaml`:

- `temperature: 0.2`
- `tools: { Write: false, Edit: false }`
- Loads one gate skill + the evidence-first-research skill
- References `references/schemas.md` for the gate report contract

---

## 2. Engineering State Contract Schema

**Fence**: ` ```engineering_state ` (nested inside ` ```result `)

**Producer**: Engineering Lead (the upgraded jetpack-compose role)

**Consumer**: All 5 sub-agents

**Purpose**: Shared context grounding all reviewers in the same project facts — Gradle setup, Compose BOM versions, architecture choices, testing conventions, and Kotlin/Android constraints.

### Fields

| Name | Type | Required | Description |
|---|---|---|---|
| `goal` | string | yes | What the task achieves (1-3 sentences). |
| `user_visible_behavior` | string | yes | What the user observes after deployment. |
| `scope` | string | yes | Files, packages, modules that will change. |
| `out_of_scope` | string | yes | What will NOT change. |
| `project_facts` | string | yes | Application ID, Gradle setup, module layout, key dependencies (Hilt, Room, Navigation, etc.), minSdk/targetSdk. |
| `kotlin_version` | string | yes | Kotlin compiler version. |
| `compose_bom_version` | string | yes | Compose BOM version or per-artifact version if no BOM. |
| `agp_version` | string | yes | Android Gradle Plugin version. |
| `compile_sdk` | integer | yes | `compileSdk` value. |
| `min_sdk` | integer | yes | `minSdk` value. |
| `target_sdk` | integer | yes | `targetSdk` value. |
| `existing_architecture` | string | yes | MVVM, MVI, UDF, Clean Architecture — patterns in use. |
| `state_management` | string | yes | ViewModel + StateFlow, MVI, Redux, or other. |
| `dependency_injection` | string | yes | Hilt, Koin, Dagger, manual DI, or none. |
| `navigation` | string | yes | Navigation Compose, NavRail, single-activity, Jetpack Navigation. |
| `data_persistence` | string | yes | Room, DataStore, SharedPreferences, file storage. |
| `networking` | string | yes | Retrofit, Ktor, OkHttp, GraphQL, or none. |
| `serialization` | string | yes | Kotlinx Serialization, Moshi, Gson. |
| `code_generation` | string | yes | KSP, KAPT, Hilt annotation processing, Compose compiler. |
| `testing_conventions` | string | yes | Compose UI tests, unit tests, Robolectric, screenshot tests, CI test commands. |
| `risks` | string[] | yes | ≥1 entry. Technical, version, migration, or platform risks. |
| `verification_plan` | string | yes | Commands, platforms, scenarios to verify correctness. |
| `open_questions` | string[] | no | Questions needing user input or research. Omit if none. |

### Forbidden Fields

| Field | Reason |
|---|---|
| `implementation_details` | Engineering State captures WHAT/WHY, not HOW. |
| `gate_status` | Gate status is runtime, not shared context. |
| Undefined field names | Unknown fields cause silent drift. |

### Example

```yaml
goal: "Add a settings screen with dark mode toggle"
user_visible_behavior: >
  Users navigate to Settings from the app drawer, toggle dark mode on/off,
  and see the change applied immediately with a smooth theme transition.
scope:
  - "app/src/main/java/com/example/app/settings/SettingsScreen.kt — new screen"
  - "app/src/main/java/com/example/app/settings/SettingsViewModel.kt — new ViewModel"
  - "app/src/main/java/com/example/app/navigation/NavGraph.kt — add settings route"
out_of_scope:
  - "Dynamic theme (Amoled, system) — follow-up PR"
  - "Personalization beyond dark mode"
project_facts: "com.example.myapp / AGP 8.5 / Kotlin 2.0 / Compose BOM 2024.06 / Hilt 2.51 / Navigation Compose 2.7"
kotlin_version: "2.0.21"
compose_bom_version: "2024.06.00"
agp_version: "8.5.2"
compile_sdk: 35
min_sdk: 26
target_sdk: 35
existing_architecture: "MVVM + UDF. Single-activity, Navigation Compose. Hilt for DI. Repository pattern."
state_management: "ViewModel + StateFlow (stateIn with SharingStarted.WhileSubscribed)"
dependency_injection: "Hilt (hiltViewModel)"
navigation: "Navigation Compose (NavHost, sealed class routes)"
data_persistence: "Room for local DB, DataStore for preferences"
networking: "Retrofit + OkHttp + Kotlinx Serialization"
serialization: "Kotlinx Serialization (kotlinx.serialization)"
code_generation: "KSP for Room. Hilt annotation processing. Compose compiler plugin."
testing_conventions: "Compose UI tests with createComposeRule. Unit tests with Turbine for Flow assertions. Robolectric for ViewModel tests."
risks:
  - "Theme transition animation — may cause recomposition frame drops"
  - "DataStore preference write vs collect race on first launch"
verification_plan: >
  ./gradlew :app:testDebugUnitTest :app:connectedCheck
  && manual: toggle dark mode, verify no frame drops in Layout Inspector
```

---

## 3. Gate Report Contract

**Fence**: ` ```gate_report ` (nested inside ` ```result `)

**Producer**: All 5 sub-agents

**Consumer**: Engineering Lead

**Purpose**: Structured review verdict from one specialist gate.

### Fields

| Name | Type | Required | Constraints | Description |
|---|---|---|---|---|
| `gate` | string | yes | `architecture` \| `ui-layout` \| `test-quality` \| `performance` \| `source-tracing` | Which gate produced this report. |
| `status` | string | yes | `pass` \| `fail` \| `needs-user-input` | Gate verdict. |
| `evidence` | string[] | yes | ≥1 entry | File paths with line numbers, test output, commands, doc citations — each traceable to a concrete source. |
| `blocking_issues` | string[] | conditional | present when `fail` | One concrete violation per entry. |
| `required_revisions` | string[] | conditional | present when `fail` | One actionable revision per entry. |
| `advisory_notes` | string[] | no | — | Non-blocking observations, out-of-scope concerns. |
| `verification` | string | yes | — | Command or procedure to verify the gate passes after revisions. |
| `engineering_state_patch` | object | no | — | Fields to update in the Engineering State. Keys must match Engineering State field names. |

### Forbidden Fields

| Field | Reason |
|---|---|
| `next_gate` | Sequencing is the Engineering Lead's role. |
| `summary` | Use `advisory_notes` instead. |
| Flat list format | Must use structured YAML. |

### Example (pass)

```yaml
gate: architecture
status: pass
evidence:
  - "app/src/main/java/com/example/app/settings/SettingsViewModel.kt:42 — ViewModel injected via Hilt"
  - "./gradlew :app:testDebugUnitTest — zero errors"
  - "settings module uses existing Repository pattern"
blocking_issues: []
required_revisions: []
verification: "./gradlew :app:testDebugUnitTest"
```

### Example (fail)

```yaml
gate: ui-layout
status: fail
evidence:
  - "app/src/main/java/com/example/app/settings/SettingsScreen.kt:88 — Switch without accessibility label"
  - "Accessibility Scanner: 'Switch has no contentDescription'"
blocking_issues:
  - "Dark mode toggle lacks Semantics content description"
  - "Settings list overflows on 320dp width screens"
required_revisions:
  - "Add semantics { contentDescription = ... } to the Switch"
  - "Wrap list items in horizontalScroll or use weight-based sizing"
verification: >
  ./gradlew :app:testDebugUnitTest
  && Accessibility Scanner scan on 320dp device
```

---

## 4. Reference Files Plan

Seven reference files live under `roles/jetpack-compose/references/`. Each is a focused knowledge base loaded on demand by the relevant sub-agent or by the engineer function.

| # | Title | Filename | Description |
|---|---|---|---|
| 1 | Inter-Agent Contract Schemas | `schemas.md` | Canonical schemas for Engineering State, Gate Report, and revision input contracts. Single source of truth for all inter-agent payloads. |
| 2 | Compose Architecture Patterns | `compose-architecture.md` | MVVM, MVI, UDF patterns, ViewModel state ownership, Hilt/Koin DI, Navigation Compose, module organization, and antipatterns for Compose. |
| 3 | Compose UI and Accessibility | `compose-ui-and-accessibility.md` | Modifier composition, layout constraints, Material 3, adaptive/responsive layouts, accessibility (Semantics, focus, TalkBack), and form patterns. |
| 4 | Compose Testing and Quality | `compose-testing-and-quality.md` | Test pyramid for Compose, composeTestRule, Compose UI test matchers, screenshot/golden tests, Robolectric vs device tests, ViewModel testing, coverage. |
| 5 | Compose Performance and Platform | `compose-performance-and-platform.md` | Recomposition diagnosis, stability tooling, compiler reports, Macrobenchmark, Baseline Profiles, startup optimization, memory profiling, Gradle build optimization. |
| 6 | Android Source Research | `source-research.md` | Evidence hierarchy, source tracing workflow, AndroidX/AOSP navigation tips, dependency resolution commands, and reporting format for source-level verification. |
| 7 | Evidence-First Research Discipline | `evidence-first-research.md` | Citation tier system, research triggers, Context7 workflow, evidence quality gates, escalation rules, and citation format (shared with dart-flutter). |

### Reference directory layout

```
roles/jetpack-compose/references/
  schemas.md
  compose-architecture.md
  compose-ui-and-accessibility.md
  compose-testing-and-quality.md
  compose-performance-and-platform.md
  source-research.md
  evidence-first-research.md
```

---

## 5. Function List

Two functions drive the role. Both are direct adaptations of the `dart-flutter` pattern.

### 5.1 `engineer` — Auto-activated Engineering State machine

| Property | Value |
|---|---|
| **Name** | `engineer` |
| **Description** | Auto-activated Engineering State machine — classifies task complexity, creates state, dispatches gates, integrates results, verifies implementation |
| **Priority** | 10 |
| **Locked** | `true` |
| **Activation** | `auto_activate` on role startup — fires on every message |
| **Observe trigger** | `on: message` |

**Behavior**:

1. **Classify complexity** — lightweight (skip gates, use skill directly) vs full workflow (create Engineering State, dispatch gates).
2. **Full workflow path**:
   - Inspect project: `build.gradle.kts`, `libs.versions.toml`, `gradle.properties`, module layout
   - Populate Engineering State per `references/schemas.md`
   - Dispatch gates max 5 per request, one at a time, serial
   - Integrate gate reports ( ` ```gate_report `), resolve conflicts
   - Implement changes
   - Self-verify: `./gradlew :app:testDebugUnitTest`, `lsp_diagnostics`, `./gradlew :app:connectedCheck`
3. **Lightweight path**: Apply the matching skill directly. No state, no gates.

### 5.2 `research` — Documentation lookup discipline for Android/Compose

| Property | Value |
|---|---|
| **Name** | `research` |
| **Description** | Documentation lookup discipline for Android APIs, Compose libraries, and Gradle — triggered when encountering unfamiliar or version-sensitive behavior |
| **Priority** | 15 |
| **Activation** | Explicit call from `engineer` when research is needed |

**Behavior**:

1. Follow research channels in priority order (from `references/source-research.md`):
   - Context7 for Jetpack/AndroidX libraries
   - Official Android docs (`developer.android.com`)
   - AndroidX/AOSP source code
   - Release notes and migration guides
   - Gradle dependency insight commands
   - Reproducible minimal experiment
2. Record citations in `[source: ...]` format per `references/evidence-first-research.md`.
3. Escalate with `⚠️ Research inconclusive` if no authoritative source found.

### Function directory layout

```
roles/jetpack-compose/functions/
  engineer.md
  research.md
```

---

## 6. role.yaml Field Plan

Complete field specification for the upgraded `role.yaml`.

```yaml
name: Jetpack Compose Android Engineer
description: >-
  Expert Jetpack Compose and Android engineering lead with evidence-first
  research, Engineering State machines, and specialist gate reviews. Covers
  modern Android UI, Kotlin, Compose architecture, state, side effects,
  testing, performance, platform APIs, migration, and source-level
  verification.
version: "3.0.0"
# No model ID — the registry entry omits the model ID to avoid coupling to
# provider-specific identifiers.

mode: primary
functions:
  - engineer
  - research
auto_activate: [engineer]

references:
  schemas:
    path: references/schemas.md
    description: >-
      Inter-agent contract schemas — gate report and engineering state field
      definitions (single source of truth)
  compose-architecture:
    path: references/compose-architecture.md
    description: >-
      MVVM, MVI, UDF patterns, ViewModel state ownership, Hilt/Koin DI,
      Navigation Compose, module organization, and Compose antipatterns
  compose-ui-and-accessibility:
    path: references/compose-ui-and-accessibility.md
    description: >-
      Modifier composition, layout constraints, Material 3, adaptive layouts,
      accessibility (Semantics, focus, TalkBack), and form patterns
  compose-testing-and-quality:
    path: references/compose-testing-and-quality.md
    description: >-
      Test pyramid, composeTestRule, Compose UI test matchers, screenshot
      tests, Robolectric, ViewModel testing, coverage
  compose-performance-and-platform:
    path: references/compose-performance-and-platform.md
    description: >-
      Recomposition diagnosis, stability, compiler reports, Macrobenchmark,
      Baseline Profiles, startup optimization, Gradle build optimization
  source-research:
    path: references/source-research.md
    description: >-
      Evidence hierarchy, AndroidX/AOSP source tracing workflow, dependency
      resolution commands, and reporting format
  evidence-first-research:
    path: references/evidence-first-research.md
    description: >-
      Citation tier system, research triggers, Context7 workflow, evidence
      quality gates, escalation rules

prompt: |
  # Jetpack Compose Engineering Lead

  You are a Jetpack Compose and Android Engineering Lead with deep domain
  expertise, evidence-first research discipline, and specialist gate review
  capabilities. You build modern Android applications with idiomatic Kotlin,
  Compose, coroutines, Flow, and the Android Jetpack ecosystem.

  ## Operating Principles

  1. **Inspect first**: Before non-trivial changes, inspect build.gradle.kts,
     version catalogs, module boundaries, Compose BOM versions, architecture,
     navigation, DI, testing conventions, and CI setup. Prefer established
     project patterns.

  2. **Engineering State machine**: The `engineer` function auto-activates on
     every message. It classifies task complexity and drives the Engineering
     State workflow for non-trivial work. Small focused edits stay lightweight.

  3. **Evidence-first research**: When encountering unfamiliar Compose APIs,
     AndroidX libraries, or version-sensitive behavior, use the `research`
     function and Context7 to look up documentation BEFORE writing code. Never
     assert API behavior from training data alone.

  4. **Conditional gate dispatch**: For non-trivial work, dispatch specialist
     reviewers as needed:
     - Architecture (structure, state, DI, module boundaries):
       `dispatch(subagent="jetpack-compose--architecture-reviewer", ...)`
     - UI/Layout/Accessibility (screens, modifiers, semantics, adaptive):
       `dispatch(subagent="jetpack-compose--ui-layout-reviewer", ...)`
     - Test Quality (UI tests, regression, coverage, CI):
       `dispatch(subagent="jetpack-compose--test-quality-reviewer", ...)`
     - Performance (recomposition, stability, benchmarks, startup):
       `dispatch(subagent="jetpack-compose--performance-reviewer", ...)`
     - Source Tracing (AOSP/AndroidX source verification):
       `dispatch(subagent="jetpack-compose--source-tracer", ...)`

  5. **Contract adherence**: Subagents return gate reports in ```gate_report
     fences per references/schemas.md. You produce Engineering State in
     ```engineering_state fences. These contracts are the single source of
     truth.

  6. **Self-verification**: After implementing changes, run
     `./gradlew :app:testDebugUnitTest` and `lsp_diagnostics`. Do not report
     completion with unresolved analysis or build errors.

  7. **Budget awareness**: At most 5 gate dispatches per request. Dispatch
     only the gates whose risk domain is actually touched by the change.

  ## Dispatch Contract

  - Use the rolebox `dispatch` tool for all subagent delegation.
  - Synchronous: `dispatch(subagent="...", prompt="...", run_in_background=false)`
  - Background: `dispatch(subagent="...", prompt="...", run_in_background=true)`
  - Always include the current Engineering State and exact review objective in
    every dispatch prompt.

  Load specialized skills and references on demand. Keep changes scoped,
  testable, maintainable, and aligned with Android platform conventions.

skills:
  - compose-runtime-state
  - compose-ui-architecture
  - compose-layout-material-adaptive
  - compose-performance
  - compose-testing-previews
  - compose-interop-migration
  - android-platform-engineering
  - android-source-research
  - jetpack-compose-engineering-gate
```

### Key changes from v1 to v3 `role.yaml`

| Aspect | v1 (current) | v3 (upgraded) |
|---|---|---|
| Mode | Plain prompt + skill list | Functions (`engineer`, `research`), `auto_activate`, references |
| Skills | 8 compose skills | Same 8 skills + 1 new `jetpack-compose-engineering-gate` skill |
| References | None | 7 reference files in `references/` |
| Sub-agents | None | 5 gate sub-agents in `subagents/` |
| Version | `1.0.0` | `3.0.0` (match dart-flutter pattern) |

---

## 7. Skill-to-Subagent Mapping

### Existing skills (reused from v1)

These 8 skills already exist under `roles/jetpack-compose/skills/`. They are loaded by the engineer function and selectively referenced by sub-agents.

| Skill | Sub-agents That Load It | Sub-agent Purpose |
|---|---|---|
| `compose-runtime-state` | architecture-reviewer, engineer | State hoisting, remember, side effects, snapshot system, stability |
| `compose-ui-architecture` | architecture-reviewer, engineer | MVVM, MVI, UDF, ViewModel, DI, module boundaries |
| `compose-layout-material-adaptive` | ui-layout-reviewer, engineer | Modifiers, constraints, Material 3, adaptive layouts, window classes |
| `compose-performance` | performance-reviewer, engineer | Recomposition tools, stability, compiler reports, Macrobenchmark |
| `compose-testing-previews` | test-quality-reviewer, engineer | composeTestRule, UI tests, semantics assertions, previews |
| `compose-interop-migration` | architecture-reviewer, engineer | AndroidView, ComposeView, Fragment interop, incremental migration |
| `android-platform-engineering` | performance-reviewer, engineer | Lifecycle, permissions, Gradle, resources, background work, notifications |
| `android-source-research` | source-tracer, engineer | AOSP/AndroidX source tracing, evidence hierarchy, dependency insight |

### New gate skills (to be created)

These 5 new gate skills live under `roles/jetpack-compose/skills/` and implement the gate-level review checklists. Each is loaded by one sub-agent.

| New Skill | Sub-agent That Loads It | Purpose |
|---|---|---|
| `jetpack-compose-architecture-gate` | architecture-reviewer | Architecture gate review checklist — state ownership, DI, module boundaries, navigation structure |
| `jetpack-compose-ui-layout-gate` | ui-layout-reviewer | UI/Layout gate review checklist — modifiers, constraints, accessibility, Material 3, adaptive |
| `jetpack-compose-test-quality-gate` | test-quality-reviewer | Test quality gate review checklist — composeTestRule, test correctness, coverage, CI commands |
| `jetpack-compose-performance-gate` | performance-reviewer | Performance gate review checklist — recomposition analysis, stability, benchmarks, startup |
| `jetpack-compose-source-tracing-gate` | source-tracer | Source tracing gate review checklist — AOSP/AndroidX trace verification, evidence quality, experiment design |

### Shared skills

| Skill | Who Loads It | Purpose |
|---|---|---|
| `android-source-research` | engineer, source-tracer, all reviewers | Evidence hierarchy and research workflow for claims about Compose/Android behavior |
| `jetpack-compose-engineering-gate` | engineer (only) | Engineering State creation flow, task classification, gate dispatch matrix, verification discipline |

### Skill-to-subagent loading table (per sub-agent `role.yaml`)

| Sub-agent `role.yaml` | `skills:` list |
|---|---|
| `architecture-reviewer` | `[jetpack-compose-architecture-gate, android-source-research]` |
| `ui-layout-reviewer` | `[jetpack-compose-ui-layout-gate, android-source-research]` |
| `test-quality-reviewer` | `[jetpack-compose-test-quality-gate, android-source-research]` |
| `performance-reviewer` | `[jetpack-compose-performance-gate, android-source-research]` |
| `source-tracer` | `[jetpack-compose-source-tracing-gate, android-source-research]` |

### Full file tree (after upgrade)

```
roles/jetpack-compose/
  DESIGN.md                           ← this file
  role.yaml                           ← upgraded v3 role definition
  functions/
    engineer.md                       ← Engineering State machine
    research.md                       ← Documentation lookup discipline
  references/
    schemas.md                         ← Contract schemas
    compose-architecture.md           ← Architecture patterns
    compose-ui-and-accessibility.md   ← UI/accessibility deep dive
    compose-testing-and-quality.md    ← Testing strategies
    compose-performance-and-platform.md ← Performance/platform reference
    source-research.md                ← AOSP/AndroidX tracing
    evidence-first-research.md        ← Evidence discipline
  skills/
    compose-runtime-state/            ← existing (unchanged)
    compose-ui-architecture/          ← existing (unchanged)
    compose-layout-material-adaptive/ ← existing (unchanged)
    compose-performance/              ← existing (unchanged)
    compose-testing-previews/         ← existing (unchanged)
    compose-interop-migration/        ← existing (unchanged)
    android-platform-engineering/     ← existing (unchanged)
    android-source-research/          ← existing (unchanged)
    jetpack-compose-engineering-gate/ ← NEW — engineer function skill
    jetpack-compose-architecture-gate/ ← NEW — architecture reviewer skill
    jetpack-compose-ui-layout-gate/   ← NEW — UI/layout reviewer skill
    jetpack-compose-test-quality-gate/ ← NEW — test quality reviewer skill
    jetpack-compose-performance-gate/ ← NEW — performance reviewer skill
    jetpack-compose-source-tracing-gate/ ← NEW — source tracer reviewer skill
  subagents/
    architecture-reviewer/
      role.yaml                       ← NEW
    ui-layout-reviewer/
      role.yaml                       ← NEW
    test-quality-reviewer/
      role.yaml                       ← NEW
    performance-reviewer/
      role.yaml                       ← NEW
    source-tracer/
      role.yaml                       ← NEW
```
