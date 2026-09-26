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
      2. Populate the Engineering brief per references/schemas.md — it is embedded in every node prompt, never fenced and never submitted as data
      3. Declare ONE v3 review batch with a single graph_declare call: one node per touched gate (max 5 per request) with agent dart-flutter--{gate}, declared outcomes pass/revise/escalate, completion explicit and budget.timeout_ms. The gates are independent ROOTS: edges stays empty unless a gate really reads another gate's accepted result, in which case the consumer declares inputs: [{from, outcome}] and join: {strategy: "all"}. Never author max_retries or loop_groups, and never use the task tool or the deprecated dispatch tool.
         - architecture-reviewer: feature structure, state, DI, data boundaries
         - ui-layout-reviewer: screens, widgets, layout, a11y
         - test-quality-reviewer: tests, regressions, coverage
         - performance-platform-reviewer: perf, platform APIs, plugins
         - release-engineer: flavors, signing, deployment, stores
      4. Inspect the graph_declare result: the persisted plan AND start.kind — started or resumed are real dispatch, saved/blocked/refused are not. After a confirmed start, END YOUR TURN and yield for GRAPH COMPLETE / GRAPH BLOCKED
      5. Collect accepted gate reports ONCE with graph_status({graph_id, scope: "all", format: "json", include_output: true, include_history: true}), reading attempts[].accepted and attempts[].result; integrate and resolve conflicts
      6. Implement changes
      7. Self-verify: dart analyze, flutter test, lsp_diagnostics
      8. Repair is parent-owned and bounded to two substantive rounds: revise, then declare a FRESH batch for the updated snapshot. A settled graph is not acceptance.

      If using an unfamiliar Flutter widget, Dart API, or pub.dev package, research via Context7 and load the dart-flutter-evidence-research skill BEFORE writing code. Cite sources per references/evidence-first-research.md.

      Reference schemas.md for the Engineering brief, the gate report payload and the outcome mapping.
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

Before any gate declaration or implementation, create the Engineering State — under the v3 outcome protocol it is the prompt-embedded **Engineering brief** defined in `references/schemas.md`. This is the shared context that grounds all reviewers in the same project facts, and it travels inside every node prompt of the declaration.

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

Use the Engineering brief schema from `references/schemas.md`. All required fields must be populated. Every field gets a value — use `"none"` or `"not applicable"` explicitly when a field has no content.

The brief is prompt-embedded context, not a graph payload: copy it into every node prompt of the review batch (and refresh it before any re-review batch). It is never fenced, never submitted as `data`, and never replaced by a `gate_status` field.

```yaml
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

The gate report each reviewer submits as `data` is a different contract: `schema_version: 1`, `outcome_id`, `gate`, `status`, `reviewed_snapshot`, `evidence`, `blocking_issues`, `required_revisions`, `advisory_notes`, `verification` and `engineering_state_patch`.

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

### Gate execution format (graph v3 outcome protocol)

Gates run as read-only nodes of the rolebox graph v3 outcome protocol — never via the task tool or the deprecated `dispatch` tool. Author all selected gates into ONE complete v3 declaration and submit it with a single call:

```
graph_declare({declaration: {
  version: 3,
  name: "dart-flutter-review-<request>-r0-c0",
  budget: {max_executions: 7},
  nodes: [
    {id: "architecture", agent: "dart-flutter--architecture-reviewer",
     prompt: "Engineering brief: ... | Reviewed snapshot: ... | Read-only scope: ... | Declared outcomes: pass, revise, escalate | Gate report: schema_version 1 per references/schemas.md | Submission: graph_submit_outcome with the attempt credential this dispatch carries",
     completion: {mode: "explicit"},
     budget: {timeout_ms: 300000},
     outcomes: [{id: "pass"}, {id: "revise"}, {id: "escalate"}]}
    // one node per selected gate, same shape
  ],
  edges: []
}})
```

`graph_declare` is the ONLY start path: there is no separate run tool and no dry run. Inspect the result — the persisted plan AND `start.kind`. `started` and `resumed` are real dispatch; `saved`, `blocked` and `refused` are not, and a saved plan is not proof of dispatch. Diagnose a refusal instead of declaring a duplicate graph. After a confirmed start, END YOUR TURN and yield for the real GRAPH COMPLETE / GRAPH BLOCKED notification. Never busy-poll `graph_status`.

The canonical complete declaration, with the pinned node ids and agents, is in `references/graph-protocol.md`. Replace the sample `name` and every prompt placeholder with the real brief.

### Include the Engineering brief in every node prompt

Every gate node prompt MUST carry the current Engineering brief (`references/schemas.md`), the reviewed snapshot with uncommitted changes, the read-only scope, the declared outcome ids, the gate-report shape and the credential/submission discipline. Node sessions do not share your conversation, so a node that lacks context cannot review.

### Parallel roots by default, inputs only for a real evidence dependency

Gates are read-only reviewers — they never contend on files. The five gate nodes are independent ROOTS: no node declares `inputs`, no node declares `join`, and the declaration's `edges` array is empty. The engine may arm them all concurrently in one start, and each settles `pass`, `revise` or `escalate` on its own evidence.

Declare `inputs: [{from, outcome}]` and `join: {strategy: "all"}` only when one gate genuinely cannot be reviewed before another gate's ACCEPTED result exists. Edges only schedule work; declared inputs deliver the payload, so every read prerequisite must appear in both, and a consumer whose input is missing or incomplete settles `escalate` instead of inventing the predecessor result. Never add a serial edge or a manufactured join consumer merely to impose a checklist order.

### Re-review after revise or escalate (parent-owned, bounded)

When a gate settles `revise` or `escalate`, YOU repair the work — a reviewer never edits the code under review and reviewers never revise each other. Apply the justified `required_revisions`, rerun the affected checks, then declare a FRESH batch for the updated snapshot with a new graph name. The fresh declaration carries the updated Engineering brief, the stable issue ids and the prior findings for the gates being re-reviewed; a changed snapshot is never an in-place edit of an immutable declaration.

Limit substantive repair and re-review rounds to TWO per design. If the same blocker persists, diagnose the cause and report it with its evidence — do not reset budgets, re-submit an unchanged payload, or declare an identical batch for an unchanged snapshot. A new batch is not a fresh budget.

---

## 4. Gate Result Integration

Each gate settles one declared outcome — `pass`, `revise` or `escalate` — and its accepted result carries the gate report as `schema_version: 1` data (see `references/schemas.md`). Read accepted results from `attempts[].accepted` for the outcome identity and `attempts[].result` for the report, via `graph_status`. A settled node is not a passing review, and the report `status` (`pass` | `fail` | `needs-user-input`) is a separate field from the settled outcome id.

### Status handling

#### `pass` — proceed
The gate found no blocking issues in its assigned scope. Implementation can proceed.

#### `revise` (report status `fail`) — revise before proceeding
The gate found blocking issues. Before continuing:

1. Read the `blocking_issues` and `required_revisions` from the accepted report
2. Apply the required revisions to the design, plan or code
3. When independent re-review is needed, declare a FRESH batch for the updated snapshot — a new graph name, the updated Engineering brief, the stable issue ids and the prior findings — instead of reopening a settled attempt
4. Merge the checked `engineering_state_patch` entries into the Engineering brief

A `fail` on a gate does NOT necessarily mean the implementation is wrong — it means the plan or code as reviewed has a concrete issue that must be addressed. Address the issue, do not debate the reviewer.

#### `escalate` (report status `needs-user-input`) — stop and ask
The gate found missing information that cannot be discovered from the project alone.

1. Surface the smallest missing question to the user (quoting the gate's evidence)
2. Do NOT proceed with implementation until the user responds
3. Record the user's answer in the Engineering brief `open_questions`


### Conflict resolution

When two gates give contradictory advice:

| Conflict Pattern | Resolution |
|-----------------|------------|
| Architecture says "extract class" but Performance says "keep inline" | Follow the architecture gate — correct structure can be optimized later. Add the performance concern to `risks` in the Engineering State with a note: "optimization deferred — verify after first working implementation." |
| UI/Layout says "use a dropdown" but Accessibility says "use radio buttons" | Follow the accessibility gate — accessibility is harder to retrofit than UI structure. |
| Test Quality says "extract for testability" but Architecture says "keep as-is for bounded context" | Follow the architecture gate — bounded context discipline takes priority over test convenience. Add a test-quality note to `risks`. |

The Engineering Lead makes the final call. Document the trade-off and the reason for the decision in the Engineering State.

### Update the Engineering State

After collecting all gate reports, apply each `engineering_state_patch` (if present) to the Engineering State — reconcile patches from parallel gates together, resolving conflicts per the table above. Embed the updated Engineering brief in the declaration (and refresh it in every node prompt of a re-review batch).

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
