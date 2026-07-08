# Inter-Agent Contract Schemas — Jetpack Compose

**Purpose**: Canonical schemas for every inter-agent contract in the Jetpack Compose role. All producers conform exactly. All consumers reject field drift.

**Rule**: One schema per contract. No producer renames, adds, or removes fields without updating this document first (see Field Drift Prevention).

**The `result` fence is the universal return envelope.** Every dispatched subagent returns its payload inside a `` ```result `` fence. The payload schema is determined by the producer — reviewers return `gate_report`, Engineering Lead returns `engineering_state`. The consumer knows which schema to expect from the dispatch it made.

---

## 1. Engineering State

**Fence**: `` ```engineering_state `` (nested inside `` ```result ``)

**Producer**: Engineering Lead (the upgraded jetpack-compose role)

**Consumer**: All 5 reviewer subagents (architecture-reviewer, ui-layout-reviewer, test-quality-reviewer, performance-reviewer, source-tracer)

**Purpose**: Shared context grounding all reviewers in the same project facts — Gradle setup, Compose BOM versions, architecture choices, testing conventions, and Kotlin/Android constraints.

### Fields

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `goal` | string | yes | What the task achieves (1-3 sentences). |
| `user_visible_behavior` | string | yes | What the user observes after deployment. |
| `scope` | string | yes | Files, packages, modules that will change. |
| `out_of_scope` | string | yes | What will NOT change. |
| `project_facts` | string | yes | App ID, Gradle setup, module layout, key dependencies (Hilt, Room, Navigation), min/max SDK. |
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
|-------|--------|
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
project_facts: "com.example.myapp / AGP 8.5 / Kotlin 2.0 / Compose BOM 2024.06 / Hilt 2.51"
kotlin_version: "2.0.21"
compose_bom_version: "2024.06.00"
agp_version: "8.5.2"
compile_sdk: 35
min_sdk: 26
target_sdk: 35
existing_architecture: "MVVM + UDF. Single-activity, Navigation Compose. Hilt for DI."
state_management: "ViewModel + StateFlow (stateIn with WhileSubscribed)"
dependency_injection: "Hilt (hiltViewModel)"
navigation: "Navigation Compose (NavHost, sealed class routes)"
data_persistence: "Room + DataStore"
networking: "Retrofit + OkHttp + Kotlinx Serialization"
serialization: "Kotlinx Serialization"
code_generation: "KSP for Room, Hilt annotation processing, Compose compiler plugin"
testing_conventions: "Compose UI tests with createComposeRule. Unit tests with Turbine."
risks:
  - "Theme transition animation may cause recomposition frame drops"
  - "DataStore preference write vs collect race on first launch"
verification_plan: "./gradlew :app:testDebugUnitTest :app:connectedCheck"
```

---

## 2. Gate Report

**Fence**: `` ```gate_report `` (nested inside `` ```result ``)

**Producer**: All 5 reviewer subagents (architecture-reviewer, ui-layout-reviewer, test-quality-reviewer, performance-reviewer, source-tracer)

**Consumer**: Engineering Lead

**Purpose**: Structured review verdict from one specialist gate.

### Fields

| Name | Type | Required | Constraints | Description |
|------|------|----------|-------------|-------------|
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
|-------|--------|
| `next_gate` | Sequencing is the Engineering Lead's role. |
| `summary` | Use `advisory_notes` instead. |
| Flat list format | Must use structured YAML. |

### Examples

```yaml
gate: ui-layout
status: fail
evidence:
  - "app/.../SettingsScreen.kt:88 — Switch without accessibility label"
  - "Accessibility Scanner: 'Switch has no contentDescription'"
blocking_issues:
  - "Dark mode toggle lacks Semantics content description"
  - "Settings list overflows on 320dp width screens"
required_revisions:
  - "Add semantics { contentDescription = ... } to the Switch"
  - "Wrap list items in weight-based sizing"
verification: "./gradlew :app:testDebugUnitTest && Accessibility Scanner on 320dp"
```

---

## 3. Revision Input Contract (Re-Execution)

**Direction**: Engineering Lead → subagent (closed-loop revise rounds)

When a gate returns `fail`, the Lead revises code and re-dispatches to the same subagent. If a new session is required, the prompt MUST carry:

| Field | Source | Purpose |
|-------|--------|---------|
| Gate identifier | Original `gate` field | Which gate is being re-run |
| Prior `blocking_issues` | Failed gate report | What was wrong |
| Prior `required_revisions` | Failed gate report | What was asked for |
| Fix description | Engineering Lead | What was changed |
| Revision flag | Engineering Lead | "This is a revision — re-evaluate against the same engineering state" |

---

## 4. Gate-to-Subagent Mapping

| Gate Name | Subagent | Skill Loaded | Fence Produced |
|-----------|----------|-------------|----------------|
| `architecture` | `jetpack-compose--architecture-reviewer` | `jetpack-compose-architecture-gate` | `` ```gate_report `` |
| `ui-layout` | `jetpack-compose--ui-layout-reviewer` | `jetpack-compose-ui-layout-gate` | `` ```gate_report `` |
| `test-quality` | `jetpack-compose--test-quality-reviewer` | `jetpack-compose-test-quality-gate` | `` ```gate_report `` |
| `performance` | `jetpack-compose--performance-reviewer` | `jetpack-compose-performance-gate` | `` ```gate_report `` |
| `source-tracing` | `jetpack-compose--source-tracer` | `jetpack-compose-source-tracing-gate` | `` ```gate_report `` |
| Engineering State | Engineering Lead | `jetpack-compose-engineering-gate` | `` ```engineering_state `` |

---

## 5. Field Drift Prevention

**Principle**: This document is the single source of truth. No producer unilaterally changes a contract.

**Before changing any field**:
1. Propose the change here first (add or modify the field table).
2. Update all producers (subagent gate skills for gate_report, engineering function for engineering_state).
3. Update all consumers (Engineering Lead for gate_report, all 5 reviewers for engineering_state).
4. If backward-incompatible, version the contract or coordinate a simultaneous update.

**Deprecation policy**: Mark deprecated fields with `[DEPRECATED]` in the field table. Producers stop emitting within one version cycle. Consumers continue accepting for one cycle. After one cycle, remove from this document.
