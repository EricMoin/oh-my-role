# Inter-Agent Contract Schemas

**Purpose**: Canonical schemas for every inter-agent contract in the Dart-Flutter role. All producers conform exactly. All consumers reject field drift.

**Rule**: One schema per contract. No producer renames, adds, or removes fields without updating this document first (see [Field Drift Prevention](#field-drift-prevention)).

**The `result` fence is the universal return envelope.** Every dispatched subagent returns its payload inside a `` ```result `` fence. The PAYLOAD schema is determined by the producer — reviewers return `gate_report`, Engineering Lead returns `engineering_state`. The consumer knows which schema to expect from the dispatch it made.

---

## 1. Gate Report

**Fence**: `` ```gate_report `` (nested inside `` ```result ``)

**Producer**: All 5 reviewer subagents (architecture-reviewer, ui-layout-reviewer, test-quality-reviewer, performance-platform-reviewer, release-engineer)

**Consumer**: Engineering Lead

**Purpose**: Structured review verdict from one specialist gate.

### Fields

| Name | Type | Required | Constraints | Description |
|------|------|----------|-------------|-------------|
| `gate` | string | yes | `architecture` \| `ui-layout` \| `test-quality` \| `performance-platform` \| `release` | Which gate produced this report. |
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
| `next_gate` | Sequencing is the Engineering Lead's role, not the reviewer's. |
| `summary` | Use `advisory_notes` instead. |
| Flat list format | Must use structured YAML. |

### Examples

```yaml
gate: architecture
status: pass
evidence:
  - "lib/features/auth/auth_screen.dart:L45 — repo injected via constructor"
  - "dart analyze — zero errors"
  - "test/features/auth/auth_repository_test.dart — FakeAuthRepository used"
blocking_issues: []
required_revisions: []
verification: "dart analyze && flutter test test/features/auth/"
```

```yaml
gate: ui-layout
status: fail
evidence:
  - "lib/screens/profile_screen.dart:L88 — TextField without semantic label"
  - "Accessibility scanner: 'EditText has no contentDescription'"
blocking_issues:
  - "Two form inputs lack accessibility labels (name L88, email L102)"
  - "Profile screen overflows on 40+ char email"
required_revisions:
  - "Add Semantics or label property to both TextFields"
  - "Wrap email field row in Flexible"
verification: "dart analyze && flutter test test/screens/profile_screen_test.dart"
engineering_state_patch:
  risks:
    - "Accessibility gaps in form inputs — flagged by UI layout gate"
```

```yaml
gate: release
status: needs-user-input
evidence:
  - "pubspec.yaml — platforms not configured beyond defaults"
  - "android/app/build.gradle — signing config references missing keystore"
verification: ""
engineering_state_patch:
  open_questions:
    - "Target platforms: iOS, web, or both?"
    - "Keystore managed via CI secrets or local setup?"
```

---

## 2. Engineering State

**Fence**: `` ```engineering_state `` (nested inside `` ```result ``)

**Producer**: Engineering Lead

**Consumer**: All 5 reviewer subagents

**Purpose**: Shared context grounding all reviewers in the same project facts, conventions, and constraints. Created before any non-trivial gate dispatch.

### Fields

| Name | Type | Required | Constraints | Description |
|------|------|----------|-------------|-------------|
| `goal` | string | yes | 1-3 sentences | What the task achieves (end state). |
| `user_visible_behavior` | string | yes | 1-3 sentences | What the user observes after deployment. |
| `scope` | string | yes | — | Boundaries of what will change: file paths, components, areas. |
| `out_of_scope` | string | yes | — | What will NOT change. Prevents scope creep during review. |
| `project_facts` | string | yes | — | Package name, SDK, key dependencies, relevant facts. |
| `sdk_package_constraints` | string | yes | — | Flutter SDK, Dart SDK, pinned key packages. |
| `target_platforms` | string[] | yes | ≥1 entry | e.g. `["android"]`, `["android", "ios", "web"]` |
| `existing_architecture` | string | yes | — | State mgmt, DI, routing, data layers, folder layout. |
| `state_management` | string | yes | — | Riverpod, Bloc, Provider, ChangeNotifier, none. |
| `routing` | string | yes | — | go_router, Navigator 2.0/1.0, auto_route, none. |
| `data_persistence` | string | yes | — | drift, isar, hive, sqflite, firebase, shared_preferences, none. |
| `code_generation` | string | yes | — | freezed, json_serializable, build_runner, auto_route status. |
| `localization` | string | yes | — | gen_l10n, intl, flutter_localizations, third-party, none. |
| `testing_conventions` | string | yes | — | Test locations, CI commands, coverage tool, golden setup, mock/fake conventions. |
| `risks` | string[] | yes | ≥1 entry | Technical, complexity, platform risks. |
| `verification_plan` | string | yes | — | Commands, platforms, scenarios to verify correctness. |
| `open_questions` | string[] | no | — | Questions needing user input or research. Omit if none. |

### Forbidden Fields

| Field | Reason |
|-------|--------|
| `implementation_details` | Engineering State captures WHAT/WHY, not HOW. |
| `gate_status` | Gate status is a runtime artifact, not shared context. |
| Undefined field names | Consumers parse by field name. Unknown fields cause silent drift. |

### Example

```yaml
goal: "Add password reset flow accessible from the login screen"
user_visible_behavior: >
  Users tap 'Forgot password?' on login, enter email, see a confirmation
  message, and follow the reset link sent to their inbox.
scope:
  - "lib/features/auth/presentation/forgot_password_screen.dart — new screen"
  - "lib/features/auth/domain/use_cases/request_password_reset.dart — new use case"
  - "lib/features/auth/data/repositories/auth_repository.dart — add requestPasswordReset"
  - "lib/navigation/app_router.dart — add forgot-password route"
out_of_scope:
  - "Deep-link handling for reset link (server-side)"
  - "Password strength validation (unchanged)"
project_facts: "com.example.myapp / Flutter 3.24 / go_router 14.0 / riverpod 2.5 / dio 5.4"
sdk_package_constraints: "Flutter >=3.22.0 <4.0.0 / Dart >=3.4.0 <4.0.0 / go_router 14.0.x / riverpod 2.5.x"
target_platforms: ["android", "ios"]
existing_architecture: "Feature-first layout. Riverpod state. go_router navigation. Manual DI via Riverpod overrides. Repository pattern with Dio HTTP."
state_management: "Riverpod (flutter_riverpod, riverpod_annotation)"
routing: "go_router (declarative, redirect guards)"
data_persistence: "None for auth — ephemeral token. shared_preferences for settings."
code_generation: "freezed + json_serializable. build_runner pre-commit."
localization: "gen_l10n — ARB in lib/l10n/. English MVP."
testing_conventions: "Unit tests mirror lib/. Riverpod uses ProviderContainer. Widget tests use ProviderScope. CI: flutter test --coverage."
risks:
  - "No existing password reset pattern — first auth flow of its kind"
  - "Dio auth interceptor shared — reset must not trigger token refresh loop"
verification_plan: "flutter test test/features/auth/ && manual: tap 'Forgot password?', enter email, confirm message, verify back nav"
open_questions:
  - "Success message: snackbar or full-screen confirmation?"
```

---

## Revision Input (Re-Execution Contract)

**Direction**: Engineering Lead → subagent (closed-loop revise rounds)

When a gate returns `fail`, the Lead revises code and re-dispatches to the same subagent (`session_id`). If a new session is required, the prompt MUST carry:

| Field | Source | Purpose |
|-------|--------|---------|
| Gate identifier | Original `gate` field | Which gate is being re-run |
| Prior `blocking_issues` | Failed gate report | What was wrong |
| Prior `required_revisions` | Failed gate report | What was asked for |
| Fix description | Engineering Lead | What was changed |
| Revision flag | Engineering Lead | "This is a revision — re-evaluate against the same engineering state" |

One failed gate per dispatch. The subagent re-evaluates from the unchanged Engineering State and produces a fresh gate report.

---

## Producer Conformance Table

| Contract | Producer | Consumer | Fence |
|----------|----------|----------|-------|
| Gate Report | architecture-reviewer | Engineering Lead | `` ```gate_report `` |
| Gate Report | ui-layout-reviewer | Engineering Lead | `` ```gate_report `` |
| Gate Report | test-quality-reviewer | Engineering Lead | `` ```gate_report `` |
| Gate Report | performance-platform-reviewer | Engineering Lead | `` ```gate_report `` |
| Gate Report | release-engineer | Engineering Lead | `` ```gate_report `` |
| Engineering State | Engineering Lead | all 5 reviewers | `` ```engineering_state `` |

---

## Field Drift Prevention

**Principle**: This document is the single source of truth. No producer unilaterally changes a contract.

**Before changing any field**:

1. Propose the change here first (add or modify the field table).
2. Update all producers (subagent gate skills for gate_report, Engineering Lead workflow for engineering_state).
3. Update all consumers (Engineering Lead for gate_report, all 5 reviewers for engineering_state).
4. If backward-incompatible, version the contract or coordinate a simultaneous update.

**If a consumer receives a field not in this document**: reject it — producer error.

**If a producer needs a new field**: add it here first, then implement.

### Conformance Status

| Producer | Contract | Status |
|----------|----------|--------|
| architecture-reviewer | Gate Report | Conforms — structured YAML per Architecture Gate skill |
| ui-layout-reviewer | Gate Report | Conforms — structured YAML per UI/Layout Gate skill |
| test-quality-reviewer | Gate Report | Conforms — structured YAML per Test Quality Gate skill |
| performance-platform-reviewer | Gate Report | Conforms — structured YAML per Perf/Platform Gate skill |
| release-engineer | Gate Report | Conforms — structured YAML per Release Gate skill |
| Engineering Lead | Engineering State | Conforms — template enforced via `flutter-engineering-gate` skill |

### Deprecation Policy

1. Mark deprecated fields with `[DEPRECATED]` in the field table.
2. Producers stop emitting deprecated fields within one version cycle.
3. Consumers continue accepting them for one cycle after deprecation.
4. After one cycle, remove from this document. Producers still emitting are non-conformant.
