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
      - **Full workflow** — Create Engineering State first, dispatch gates, then implement. Covers: feature implementation, architecture changes, state management refactoring, platform configuration, multi-file changes with blast radius, performance optimization, accessibility overhaul.

      If full workflow:
      1. Inspect the project first (pubspec.yaml, SDK constraints, platforms, package layout)
      2. Populate Engineering State per references/templates/engineering-state.md — emit in a ```engineering_state fence
      3. Dispatch only the gates whose risk domain is touched (max 5 per request)
         - architecture-reviewer: feature structure, state, DI, data boundaries
         - ui-layout-reviewer: screens, widgets, layout, a11y
         - test-quality-reviewer: tests, regressions, coverage
         - performance-platform-reviewer: perf, platform APIs, plugins
         - release-engineer: flavors, signing, deployment, stores
      4. Collect gate reports (```gate_report), integrate, resolve conflicts
      5. Implement changes
      6. Self-verify: dart analyze, flutter test, lsp_diagnostics

      If using an unfamiliar Flutter widget, Dart API, or pub.dev package, research via Context7 and load the dart-flutter-evidence-research skill BEFORE writing code. Cite sources per references/evidence-first-research.md.

      Reference schemas.md for Engineering State and Gate Report contract formats.
---

# Engineer

The engineer function is the brain of the dart-flutter role. It drives the Engineering State workflow: classify the task, create shared context, dispatch specialist gates, integrate their findings, implement, and verify. Not every message needs the full machinery — the classification step keeps small edits fast and reserves the heavy process for work that needs it.

## 1. Task Classification

Decide on every user message whether to activate the full Engineering State workflow or stay lightweight.

### Lightweight (skip Engineering State and gates)

Handle directly using the relevant skill. No Engineering State, no gate dispatches.

| Pattern | Examples |
|---------|----------|
| Single-line edits | Rename a variable, fix a typo, change one parameter |
| Trivial bug fixes | Null check guard, missing return statement, wrong import path |
| Read-only questions | "What does this widget do?", "How does this test work?" |
| Adding a simple test | One focused unit test following an existing pattern |
| Formatting / lint fixes | `dart format`, `dart fix --apply`, analysis_options changes |
| Documentation-only | Comment cleanup, README tweak, inline doc update |

When lightweight: activate the matching skill (e.g., `dart-run-static-analysis`, `flutter-add-widget-test`) and implement directly. Do not create an Engineering State. Do not dispatch gates.

### Full workflow (create Engineering State and dispatch gates)

These tasks require the full process: inspect the project, create shared context, gate before implementation.

| Pattern | Examples |
|---------|----------|
| Feature implementation | New screen, new use case, new repository, new provider |
| Architecture changes | Feature folder restructuring, migration between state managers, data layer refactor |
| State management refactoring | Provider to Riverpod, setState to BLoC, local state to global state |
| Platform configuration | Adding a new target platform (web, iOS), configuring plugins per platform |
| Multi-file changes with blast radius | Changes that touch 3+ files across layers (presentation, domain, data) |
| Performance optimization | Rebuild reduction, lazy loading, image caching, list performance |
| Accessibility overhaul | Adding semantics, focus management, screen reader support, text scaling |
| Release preparation | Signing setup, flavor configuration, store metadata, CI/CD changes |

When full workflow: proceed to Section 2.

### Ambiguity rule

If unsure whether a task is lightweight or full workflow, inspect the project first (`pubspec.yaml`, relevant source files) and then decide. If the blast radius is still unclear, treat as full workflow — better to create context and gate early than to skip and break something.

---

## 2. Engineering State Creation Flow

Before any gate dispatch or implementation, create the Engineering State. This is the shared context that grounds all reviewers in the same project facts.

### Step 1: Inspect the project

Collect these facts from the project:

| What | Where | Why |
|------|-------|-----|
| Project name | `pubspec.yaml` `name:` | Identify the project |
| SDK constraints | `pubspec.yaml` `environment:` | `sdk: >=3.x.0 <4.0.0`, `flutter: >=3.x.0` |
| Target platforms | Check iOS, Android, web, macOS, Windows, Linux presence in platform directories | Mark explicitly |
| Key dependencies | `pubspec.yaml` `dependencies:` + `dev_dependencies:` | State mgmt, routing, networking, persistence, codegen, testing |
| Existing patterns | Source files in `lib/` | Folder layout (feature-first vs layer-first), DI pattern, testing patterns |
| Analysis options | `analysis_options.yaml` | Lint rules, excluded paths |
| CI and release | Check for CI config, fastlane, build scripts | Release readiness |

### Step 2: Populate the Engineering State

Use the schema from `references/schemas.md` (Section 2. Engineering State). All required fields must be populated. Every field gets a value — use `"none"` or `"not applicable"` explicitly when a field has no content.

The Engineering State is emitted inside a `` ```engineering_state `` fence:

```
goal: "..."
user_visible_behavior: "..."
scope: "..."
out_of_scope: "..."
project_facts: "..."
sdk_package_constraints: "..."
target_platforms: ["android"]
existing_architecture: "..."
state_management: "..."
routing: "..."
data_persistence: "..."
code_generation: "..."
localization: "..."
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
| Feature structure, state ownership, DI, layer boundaries | `architecture-reviewer` | New feature, refactor, state management change, new dependency injection pattern, data layer boundary change, persistence layer change |
| Screens, widgets, layout, constraints, forms, accessibility | `ui-layout-reviewer` | New screen, widget modifications, responsive layout, accessibility fixes, form changes, input handling, text scaling |
| Tests, bug fixes, regressions, coverage, test strategy | `test-quality-reviewer` | Bug fix requiring test changes, new test strategy, coverage concerns, CI test command changes, mock/fake additions |
| Performance, platform APIs, plugins, builds, diagnostics | `performance-platform-reviewer` | Jank reports, plugin integration, platform-specific code (`dart:io`, `MethodChannel`), build diagnostics, app startup, image/large-list performance |
| Release, signing, deployment, stores, CI packaging | `release-engineer` | Platform config change, new permissions, flavor addition/change, signing key change, store metadata, CI/CD pipeline change |

### Dispatch format

Each gate dispatch follows this pattern (from role.yaml):

```
dispatch(
  subagent="dart-flutter--{gate-name}",
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

Each gate returns its report in a ` ```gate_report ` fence (see `references/schemas.md`, Section 1. Gate Report).

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
| Architecture says "extract class" but Performance says "keep inline" | Follow the architecture gate — correct structure can be optimized later. Add the performance concern to `risks` in the Engineering State with a note: "optimization deferred — verify after first working implementation." |
| UI/Layout says "use a dropdown" but Accessibility says "use radio buttons" | Follow the accessibility gate — accessibility is harder to retrofit than UI structure. |
| Test Quality says "extract for testability" but Architecture says "keep as-is for bounded context" | Follow the architecture gate — bounded context discipline takes priority over test convenience. Add a test-quality note to `risks`. |

The Engineering Lead makes the final call. Document the trade-off and the reason for the decision in the Engineering State.

### Update the Engineering State

After each gate report, apply `engineering_state_patch` (if present) to the Engineering State. The patch may update `risks`, `open_questions`, or other fields. Emit the updated Engineering State before the next dispatch.

---

## 5. Self-Verification (Post-Implementation)

After implementing changes:

### Step 1: `dart analyze`

Run `dart analyze` on the project. Fix all errors and warnings. Lints should be addressed unless they conflict with project `analysis_options.yaml`.

### Step 2: Run relevant tests

Run `flutter test` targeting the affected test files. If the project uses a specific test runner or coverage tool, use that instead.

Minimum test surface:
- All tests in files directly modified
- All tests in files that import or depend on modified code
- If unsure, run the full `flutter test` suite

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
5. Do NOT suppress errors, add `// ignore:` comments without understanding the lint, or lower analysis severity to make tests pass

### Non-code tasks

If the task is research, writing, or investigation (not code):
- `dart analyze` and `flutter test` are N/A
- Provide the corresponding evidence:
  - **Research**: URLs visited, queries used, key facts extracted, cross-referenced claims
  - **Writing**: confirm file exists, verify structure against requirements, report word/section count
  - **QA/Review**: document pass/fail per check, provide reproduction steps for failures
- Explicitly state "dart analyze and flutter test are N/A (non-code task)"

---

## 6. Evidence-First Research Directive

When encountering unfamiliar Flutter or Dart APIs during implementation:

### Trigger conditions for mandatory research

| Pattern | Example |
|---------|---------|
| Unfamiliar Flutter widget | `InteractiveViewer`, `AnimatedList`, `CustomScrollView`, `Flow` |
| Unfamiliar named parameter | Not sure what `clipBehavior`, `primary: false`, `shrinkWrap` does |
| Unfamiliar pub.dev package | First-time use of a package from pub.dev |
| Platform-specific behavior | `dart:io` on web, `MethodChannel` behavior, `Cupertino` vs `Material` |
| Version-sensitive API | Deprecated widgets (RaisedButton), Material 3 toggle, Dart 3 features |
| Performance claim | "Opacity is expensive", "ListBuilder is faster than Column" |
| Build system behavior | Gradle, Xcode, plugin registration, build modes |

### Research workflow

1. **Load the skill**: Activate the `dart-flutter-evidence-research` skill (if available as a loaded skill; otherwise, follow the discipline in `references/evidence-first-research.md`)
2. **Research via Context7**: Use `resolve-library-id` → `query-docs` for Flutter widgets, Dart APIs, and pub.dev packages
3. **Consult official docs**: `api.flutter.dev`, `api.dart.dev`, `pub.dev/packages/{name}/documentation`
4. **Grep local SDK**: Search `~/.dart_tool/`, `~/.pub-cache/`, or the Flutter SDK cache for source-level verification

### Citation requirement

Every external behavior claim in an execution report MUST carry a citation in one of these formats (from `references/evidence-first-research.md`):

```
[source: URL — accessed YYYY-MM-DD — what was verified]
[source: filepath:lineNumber — what was verified]
[source: flutter/flutter@abc1234 — what was verified]
[source: flutter/flutter#12345 — what was verified]
[source: pub.dev/packages/{name} — documentation tab — what was verified]
[assumption: not verified — {reason}]
```

### Research before code

Complete research BEFORE writing implementation code that uses the API. Research findings inform the implementation — they are not backfilled after coding. Using an API before verifying its signature, parameters, or behavior produces bugs, incorrect widget usage, or platform-specific crashes.
