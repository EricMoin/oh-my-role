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

## 3. Gate Dispatch Matrix

| Risk Domain | Gate Subagent | Trigger Conditions |
|-------------|---------------|--------------------|
| Module structure, state ownership, DI, navigation architecture, layer boundaries | `architecture-reviewer` | New feature module, DI change (Hilt/Koin/manual), state ownership restructure, navigation graph change, Clean Architecture boundary change, module dependency violation |
| Screens, composable layouts, modifiers, constraints, Material 3, accessibility, adaptive UI | `ui-layout-reviewer` | New screen composable, modifier changes, responsive/adaptive layout, accessibility (Semantics, TalkBack), Material 3 theme changes, form patterns, text scaling, custom layouts |
| Compose UI tests, unit tests, regression, coverage, test strategy, CI commands | `test-quality-reviewer` | Bug fix requiring test changes, new test strategy (UI tests vs unit tests vs screenshot tests), coverage gaps, CI test command changes, Robolectric vs device test splits, mocking additions |
| Recomposition, stability, Macrobenchmark, Baseline Profiles, startup, memory, Gradle build | `performance-reviewer` | Recomposition issues (unnecessary recomposition logs), lazy list performance, startup optimization, Baseline Profile generation, Macrobenchmark integration, memory profiling, build cache configuration |
| AOSP/AndroidX source verification, undocumented behavior, version-specific bugs, dependency resolution | `source-tracer` | Undocumented API behavior, need to verify AndroidX source, AOSP internals exploration, version-specific regressions, Gradle dependency conflict resolution, migration path for deprecated APIs |

### Dispatch format

Each gate dispatch follows this pattern:

```
dispatch(
  subagent="jetpack-compose--{gate-name}",
  prompt="Engineering State:\n{engineering_state_yaml}\n\nReview objective:\n{specific review request tailored to the gate}",
  run_in_background=false
)
```

Use synchronous dispatch (`run_in_background=false`) for gates because the engineer needs the result before proceeding. Gate reports are fast — they are read-only reviews of existing plans or code, not implementation work.

### Include the Engineering State in every dispatch

Every gate dispatch MUST include the current Engineering State in the prompt. This ensures all reviewers operate from the same facts. If the Engineering State has been updated by a prior gate report (via `engineering_state_patch`), include the updated version.

### One gate per dispatch, serial

Dispatches gates one at a time, not in parallel. Each gate may produce an `engineering_state_patch` that updates the shared context for subsequent gates. Gate reports feed into each other.

---

## 4. Gate Result Integration

Each gate returns its report in a ` ```gate_report ` fence (see `references/schemas.md`, Gate Report section).

### Status handling

#### `pass` — proceed
The gate found no blocking issues. Implementation can proceed.

#### `fail` — revise before proceeding
The gate found blocking issues. Before continuing:

1. Read the `blocking_issues` and `required_revisions` from the gate report
2. Apply the required revisions to the design or plan
3. Optionally re-dispatch the same gate with the revision context for verification
4. Update the Engineering State with any `engineering_state_patch` from the gate report

A `fail` on a gate does NOT necessarily mean the implementation is wrong — it means the plan or code as reviewed has a concrete issue that must be addressed. Address the issue, do not debate the reviewer.

#### `needs-user-input` — stop and ask
The gate found missing information that cannot be discovered from the project alone.

1. Surface the exact question to the user (quoting the `blocking_issues` from the gate report)
2. Do NOT proceed with implementation until the user responds
3. Update the Engineering State `open_questions` with the user's answer

### Conflict resolution

When two gates give contradictory advice:

| Conflict Pattern | Resolution |
|-----------------|------------|
| Architecture says "extract module" but Performance says "keep monolith" | Follow the architecture gate — correct modularization can be optimized later. Add the performance concern to `risks` with a note: "optimization deferred — verify after first working implementation." |
| UI/Layout says "use an ExposedDropdownMenuBox" but Source Tracer reveals platform-specific accessibility gaps | Follow the source-tracer gate — platform behavior is harder to retrofit than UI structure. Choose an alternative component. |
| Test Quality says "extract for testability" but Architecture says "keep as-is for bounded context" | Follow the architecture gate — bounded context discipline takes priority over test convenience. Add a test-quality note to `risks`. |

The Engineering Lead makes the final call. Document the trade-off and the reason for the decision in the Engineering State.

### Update the Engineering State

After each gate report, apply `engineering_state_patch` (if present) to the Engineering State. The patch may update `risks`, `open_questions`, or other fields. Emit the updated Engineering State before the next dispatch.

---

## 5. Self-Verification (Post-Implementation)

After implementing changes:

### Step 1: `./gradlew build`

Run `./gradlew build` or a targeted variant (`./gradlew :app:build`) on the project. Fix all compilation errors. Address warnings where project conventions require it.

### Step 2: Run relevant tests

Run the test tasks that cover the changed code:

| Test Type | Gradle Task |
|-----------|-------------|
| Unit tests | `./gradlew :app:testDebugUnitTest` |
| Instrumented / Compose UI tests | `./gradlew :app:connectedCheck` or `./gradlew :app:connectedDebugAndroidTest` |
| Specific test class | `./gradlew :app:testDebugUnitTest --tests "*ClassName*"` |
| All modules | `./gradlew testDebugUnitTest` (without module prefix) |

Minimum test surface:
- All tests in files directly modified
- All tests in files that import or depend on modified code
- If unsure, run the full `./gradlew :app:testDebugUnitTest` suite

### Step 3: Check LSP diagnostics

Run `lsp_diagnostics` on all modified files. Zero new errors required.

### Step 4: Verify against the verification plan

Check each item in the Engineering State `verification_plan`. Each item must be satisfied:
- "Commands" — run them and confirm they pass
- "Platform scenarios" — verify via build output or manual check
- "Correctness" — confirm the implementation meets the acceptance criteria

### What to do if verification fails

1. Read the error/warning output completely
2. Fix the root cause, not the symptom
3. Re-run verification from Step 1
4. If two attempts fail on the same issue, stop and report: what was tried, what broke, what options remain
5. Do NOT suppress errors, add `@Suppress("...")` without understanding the lint, or lower build SDK to make errors go away

### Non-code tasks

If the task is research, writing, or investigation (not code):
- `./gradlew build` and `lsp_diagnostics` are N/A
- Provide the corresponding evidence:
  - **Research**: URLs visited, queries used, key facts extracted, cross-referenced claims
  - **Writing**: confirm file exists, verify structure against requirements, report word/section count
  - **QA/Review**: document pass/fail per check, provide reproduction steps for failures
- Explicitly state "./gradlew build and lsp_diagnostics are N/A (non-code task)"

---

## 6. Evidence-First Research Directive

When encountering unfamiliar Compose APIs, AndroidX libraries, or version-sensitive behavior during implementation:

### Trigger conditions for mandatory research

| Pattern | Example |
|---------|---------|
| Unfamiliar Compose API | `Modifier.animateContentSize()`, `LazyVerticalStaggeredGrid`, `sharedElementTransition` |
| Unfamiliar composable parameter | Not sure what `clipToBounds`, `userScrollEnabled`, `beyondViewportPageCount` does |
| Unfamiliar AndroidX library | First-time use of `androidx.camera`, `androidx.media3`, `hilt-navigation-compose` |
| Platform-specific behavior | Compose on different form factors (foldable, Chromebook, tablet), input handling differences |
| Version-sensitive API | Compose BOM migration, Material 2 → Material 3 transition, Kotlin 2.0 compose compiler plugin change |
| Performance or correctness claim | "Modifier.drawWithContent is expensive", "derivedStateOf caches recompositions" |
| Build system / Gradle behavior | Compose compiler compatibility matrix, version catalog resolution, lint configuration |
| Undocumented or deprecated API | Compose API marked `@Experimental` or deprecated with unclear migration path |

### Research workflow

1. **Load the skill**: Activate the `android-source-research` skill (or follow the discipline in `references/evidence-first-research.md`)
2. **Research via Context7**: Use `resolve-library-id` → `query-docs` for Jetpack/AndroidX libraries and Compose APIs
3. **Consult official docs**: `developer.android.com`, `d.android.com/reference`
4. **Consult AOSP/AndroidX source**: `cs.android.com` (Android Code Search), `androidx/androidx` GitHub repo
5. **Grep local Gradle cache**: Search `~/.gradle/caches/` or project Gradle dependency sources for source-level verification of version-specific behavior

### Citation requirement

Every external behavior claim in an execution report MUST carry a citation in one of these formats (from `references/evidence-first-research.md`):

```
[source: URL — accessed YYYY-MM-DD — what was verified]
[source: filepath:lineNumber — what was verified]
[source: AOSP/{repository}/+/ref — what was verified]
[source: issuetracker.google.com/{id} — what was verified]
[source: GitHub:androidx/androidx/issues/{id} — what was verified]
[assumption: not verified — {reason}]
```

### Research before code

Complete research BEFORE writing implementation code that uses the API. Research findings inform the implementation — they are not backfilled after coding. Using an API before verifying its signature, parameters, or behavior produces bugs, incorrect composable usage, or platform-specific crashes.
