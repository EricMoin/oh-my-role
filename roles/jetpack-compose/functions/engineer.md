---
name: engineer
description: Auto-activated Engineering State machine — classifies task complexity, creates state, authors gate nodes, integrates results, verifies implementation
priority: 10
locked: true
observe:
  - on: message
    inject: |
      ## Engineer Directive

      Classify the complexity of the message below:

      - **Lightweight** — Skip Engineering State and gates. Match the user intent to a skill using the Skill Routing Matrix in PROMPT.md (§6). Load that skill, then implement directly. Covers: single-line edits, trivial bug fixes, read-only questions, adding a simple test, formatting fixes, documentation-only changes.
      - **Full workflow** — Create Engineering State first, author gate nodes, then implement. Covers: feature implementation, architecture changes, state management refactoring, Gradle/platform configuration, multi-file changes with blast radius, performance optimization, accessibility overhaul.

      If full workflow:
      1. Inspect the project first (build.gradle.kts, libs.versions.toml, gradle.properties, module layout)
      2. Build the Engineering State silently per the schema below — embed it in every gate node prompt; do NOT emit it as a visible fenced block
      3. Author one graph node per required gate (max 5 per request) on the graph engine per PROMPT.md §4 — graph_create(name=...) then one graph_add_node({graph_id, id, agent: "jetpack-compose--{name}", prompt}) per gate
         - architecture-reviewer: module structure, DI, state ownership, navigation
         - ui-layout-reviewer: screens, modifiers, layouts, accessibility
         - test-quality-reviewer: Compose UI tests, unit tests, coverage
         - performance-reviewer: recomposition, stability, benchmarks, startup
         - source-tracer: AOSP/AndroidX source verification, version-specific issues
      4. graph_run(graph_id) — NON-BLOCKING: END YOUR TURN, await the [GRAPH COMPLETE] system-reminder, read gate reports once via graph_status(graph_id, include_output=true), integrate, resolve conflicts
      5. Load the skill(s) matched via the Skill Routing Matrix (PROMPT.md §6) — multi-file / large-scope / context-heavy work MUST load matching skills before writing code — then implement changes
      6. Self-verify: ./gradlew :app:testDebugUnitTest, lsp_diagnostics, ./gradlew :app:connectedCheck

      If using an unfamiliar Compose API, AndroidX library, or encountering version-sensitive behavior, research via Context7 and the evidence-first research discipline BEFORE writing code. Cite sources per references/evidence-first-research.md.

      Reference references/schemas.md for Engineering State and Gate Report contract formats.
---

# Engineer

The engineer function is the brain of the Jetpack Compose role. It drives the Engineering State workflow: classify the task, create shared context, author specialist gate nodes, integrate their findings, implement, and verify. Not every message needs the full machinery — the classification step keeps small edits fast and reserves the heavy process for work that needs it.

## Dispatch Silence

MUST NOT output the Engineering State as a visible fenced block. Build it silently and embed it in gate node prompts. The user sees only the final ```result fence — never intermediate state, handoff payloads, or routing narration.

## 1. Task Classification

Decide on every user message whether to activate the full Engineering State workflow or stay lightweight.

### Lightweight (skip Engineering State and gates)

Handle directly using the relevant skill. No Engineering State, no gate nodes.

| Pattern | Examples |
|---------|----------|
| Single-line edits | Rename a variable, fix a typo, change one composable parameter |
| Trivial bug fixes | Null check guard, missing return statement, wrong import path |
| Read-only questions | "What does this modifier do?", "How does this state flow work?" |
| Adding a simple test | One focused unit test following an existing pattern |
| Formatting / lint fixes | `./gradlew spotlessApply`, ktlint fixes, lint baseline updates |
| Documentation-only | Comment cleanup, KDoc update, inline doc typo fix |

When lightweight: use the Skill Routing Matrix in PROMPT.md (§6) to match the user's intent to the right skill. Load that skill BEFORE writing any code, then implement directly. Do not create an Engineering State. Do not author gate nodes.

The Skill Routing Matrix is the primary decision aid for lightweight tasks. If no skill in the matrix matches the user's intent, the task is probably not lightweight — use the full workflow / gate path instead.

### Full workflow (create Engineering State and author gate nodes)

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

When full workflow: proceed to Section 2. The full workflow does NOT skip skill loading — before the implementation step, consult the Skill Routing Matrix in PROMPT.md (§6) and load every matching skill. Multi-file and context-heavy changes are exactly where skills matter most for code quality; gates review the plan, but skills govern how the code is written.

### Ambiguity rule

If unsure whether a task is lightweight or full workflow, inspect the project first (`build.gradle.kts`, relevant source files) and then decide. If the blast radius is still unclear, treat as full workflow — better to create context and gate early than to skip and break something.

### Rejection escalation rule

A design rejection re-classifies the task. If a change went through as lightweight and the user rejects the approach (not a typo-level fix-up — the *approach*), the second attempt is no longer lightweight: the rejection is evidence that the design space is nontrivial. Before implementing attempt two, produce the analysis that was skipped — the invariant being maintained, the candidate mechanisms with their coupling structure, and why the chosen one survives the objection (see PROMPT.md §2.1a and §2.8). Two rejections on the same requirement mean stop coding entirely: present the option space and let the user pick the model before another line is written. Implementing mechanism N+1 at the same analysis depth that produced mechanisms 1..N is the failure mode this rule exists to prevent.

---

## 2. Engineering State Creation Flow

Before authoring any gate node or implementing, create the Engineering State. This is the shared context that grounds all reviewers in the same project facts.

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

### Step 2: Build the Engineering State (silent — internal only)

Use the schema from `references/schemas.md` (Engineering State section). All required fields must be populated. Every field gets a value — use `"none"` or `"not applicable"` explicitly when a field has no content.

Build the Engineering State silently in working memory. Format it as YAML per the schema, then embed the full YAML in every gate node prompt. Do NOT output the Engineering State as a visible fenced block — the user must never see intermediate handoff payloads.

For reference, the internal format is:

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

### Step 3: Identify which gates are needed

Map the task's risk domains to gates. Only author gate nodes whose domain is actually touched. The mapping is defined in Section 3.

### Step 4: Gate selection rule

At most **5 gate nodes per request**. If more than 5 risk domains are touched, prioritize by risk to the project, not by convenience. The Engineering Lead decides priority.

---

## 3. Gate Authoring, Integration, Verification, and Research

These protocols are inherited from the role's system prompt (PROMPT.md). Follow them as defined there — the engineer function-specific behavior lives in Sections 1 and 2 above.

| Protocol | PROMPT.md Section |
|----------|-------------------|
| **Gate Dispatch Matrix** — risk domain → gate mapping, trigger conditions, gate budget | §5 |
| **Graph Node Authoring & Gate Result Integration** — graph engine authoring (graph_create / graph_add_node / graph_add_edge / graph_add_loop / graph_run / graph_status / graph_approve / graph_cancel), return contract, conflict resolution, status handling (pass/fail/needs-user-input) | §4 |
| **Post-Implementation Verification** — LSP diagnostics → build → test → verification plan sequence, failure handling, non-code task protocol | §7 |
| **Evidence-First Research** — trigger conditions, research channels (Context7 → official docs → AOSP source → Gradle cache → experiments), citation format, escalation rules, scope boundaries | §8 |

Do not deviate from these protocols without documenting why in the Engineering State.
