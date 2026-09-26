# Inter-agent contracts (schema_version: 1)

Every role-authored business payload is a JSON object with `schema_version: 1`.
Submit it as the `data` argument of
`graph_submit_outcome({graph_id, node_id, outcome_id, credential, data})` for the
outcome id the node declares. Accepted attempt results are the transport authority:
the lead reads them from `attempts[].result` with `graph_status`. A prose message, a
chat update or an inferred completion is not transport and releases no consumer.
Never put the attempt credential, the graph id or host state into business data.
Reject unknown schema versions, missing required fields and unknown ids.

The Strategy `plan_revision` is the coordinator's business identifier; the engine's
compiled `plan_revision` is a content digest of the declaration. Track both and
never substitute one for the other.

## Engineering brief (prompt-embedded contract)

The Engineering brief replaces the former Engineering State fence. It is embedded in
every node prompt of a review batch; it is not a graph payload and it is never
submitted as `data`. The lead creates it before declaring the batch, and each gate
node reads it from its own dispatch.

**Producer**: Engineering Lead. **Consumers**: all five gate nodes.

| Field | Type | Required | Constraints | Description |
|------|------|----------|-------------|-------------|
| `goal` | string | yes | 1-3 sentences | What the task achieves (end state). |
| `user_visible_behavior` | string | yes | 1-3 sentences | What the user observes after deployment. |
| `scope` | string | yes | — | Boundaries of what will change: file paths, components, areas. |
| `out_of_scope` | string | yes | — | What will NOT change. Prevents scope creep during review. |
| `project_facts` | string | yes | — | Package name, SDK, key dependencies, relevant facts. |
| `sdk_package_constraints` | string | yes | — | Flutter SDK, Dart SDK, pinned key packages. |
| `target_platforms` | string[] | yes | ≥1 entry | e.g. `["android"]`, `["android", "ios", "web"]`. |
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

### Forbidden fields

| Field | Reason |
|-------|--------|
| `implementation_details` | The brief captures WHAT and WHY, not HOW. |
| `gate_status` | Gate status is an accepted-outcome artifact, not shared context. |
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
out_of_scope:
  - "Deep-link handling for reset link (server-side)"
project_facts: "com.example.myapp / Flutter 3.24 / go_router 14.0 / riverpod 2.5 / dio 5.4"
sdk_package_constraints: "Flutter >=3.22.0 <4.0.0 / Dart >=3.4.0 <4.0.0 / go_router 14.0.x"
target_platforms: ["android", "ios"]
existing_architecture: "Feature-first layout. Riverpod state. go_router navigation. Manual DI via Riverpod overrides."
state_management: "Riverpod (flutter_riverpod, riverpod_annotation)"
routing: "go_router (declarative, redirect guards)"
data_persistence: "None for auth — ephemeral token. shared_preferences for settings."
code_generation: "freezed + json_serializable. build_runner pre-commit."
localization: "gen_l10n — ARB in lib/l10n/. English MVP."
testing_conventions: "Unit tests mirror lib/. Widget tests use ProviderScope. CI: flutter test --coverage."
risks:
  - "No existing password reset pattern — first auth flow of its kind"
verification_plan: "flutter test test/features/auth/ && manual: tap 'Forgot password?', confirm message"
open_questions:
  - "Success message: snackbar or full-screen confirmation?"
```

## Gate report (submitted as accepted outcome data)

Each read-only gate writes this report and submits it as the `data` payload of the
outcome it settles. The report carries `schema_version: 1` and the settled outcome
id, so the accepted result is self-identifying.

**Producer**: all five gate subagents. **Consumer**: Engineering Lead.

### Fields

| Name | Type | Required | Constraints | Description |
|------|------|----------|-------------|-------------|
| `schema_version` | integer | yes | exactly `1` | Payload contract version. |
| `outcome_id` | string | yes | `pass` \| `revise` \| `escalate` | The declared outcome id this submission settles. |
| `gate` | string | yes | `architecture` \| `ui-layout` \| `test-quality` \| `performance-platform` \| `release` | Which gate produced this report; identical to the node id and to the gate dispatch matrix in `role.yaml`. |
| `status` | string | yes | `pass` \| `fail` \| `needs-user-input` | Gate verdict. Closed set; there is no conditional-pass status. |
| `reviewed_snapshot` | string | yes | — | The revision, diff or artifact identifier actually inspected, including uncommitted changes. |
| `evidence` | string[] | yes | ≥1 entry | File paths with line numbers, test output, commands or doc citations; distinguish inspected from executed. Each entry traceable to a concrete source. |
| `blocking_issues` | object[] | conditional | required when `status: fail`; `[]` otherwise | One concrete violation per entry with a stable issue id, the failure mechanism and its evidence. |
| `required_revisions` | string[] | conditional | required when `status: fail`; `[]` otherwise | One actionable revision per entry, addressing the blocker without prescribing incidental implementation. |
| `advisory_notes` | string[] | no | — | Non-blocking observations and out-of-scope concerns. |
| `verification` | string[] | yes | ≥1 entry | Checks actually performed and missing evidence; proposed checks are labelled as proposed. |
| `engineering_state_patch` | object | no | keys must match Engineering brief field names | Proposed corrections to brief facts, merged only by the lead. |

### Forbidden fields

| Field | Reason |
|-------|--------|
| `next_gate` | Sequencing is the Engineering Lead's role, not the reviewer's. |
| `summary` | Use `advisory_notes` instead. |
| `credential`, graph or host identity | Host state never enters business data. |
| Any fence envelope (`result`, `gate_report`, or similar) | The payload is the `data` argument itself, not text inside a fence. |
| Undefined top-level field names | Consumers reject field drift; propose the field here first. |

### Status semantics

- `pass` means no supported blocking issue exists in the assigned scope. It is not
  proof of the entire feature. Advice with no blocker is a pass with advisory notes.
- `fail` requires at least one blocking issue with a concrete failure mechanism and
  one required revision per blocker.
- `needs-user-input` names the smallest missing question or recovery action and who
  can resolve it. Never turn inability to assess into a pass.

### Status to settled outcome

| Gate report status | Settled outcome | Carries |
| --- | --- | --- |
| `pass` | `pass` | — |
| `fail` with concrete blockers | `revise` | Stable `required_revisions` |
| `needs-user-input` | `escalate` | The smallest missing question or recovery action |

The settled outcome id is a separate field of the submission; the report status is
never renamed to the outcome id and the outcome id never replaces the status.

### Examples

```json
{
  "schema_version": 1,
  "outcome_id": "pass",
  "gate": "architecture",
  "status": "pass",
  "reviewed_snapshot": "com.example.myapp@abc1234 + uncommitted working tree",
  "evidence": [
    "lib/features/auth/auth_screen.dart:L45 — repository injected via constructor",
    "dart analyze — zero errors"
  ],
  "blocking_issues": [],
  "required_revisions": [],
  "advisory_notes": [],
  "verification": ["dart analyze && flutter test test/features/auth/"],
  "engineering_state_patch": {}
}
```

```json
{
  "schema_version": 1,
  "outcome_id": "revise",
  "gate": "ui-layout",
  "status": "fail",
  "reviewed_snapshot": "com.example.myapp@abc1234 + uncommitted working tree",
  "evidence": [
    "lib/screens/profile_screen.dart:L88 — TextField without a semantic label",
    "lib/screens/profile_screen.dart:L102 — email row overflows at 40+ characters"
  ],
  "blocking_issues": [
    {
      "id": "UI-1",
      "issue": "Two form inputs lack accessibility labels, so screen readers cannot name them",
      "evidence": "lib/screens/profile_screen.dart:L88, L102"
    }
  ],
  "required_revisions": ["Give both TextFields an accessible label"],
  "advisory_notes": ["Consider grouping the form fields for faster keyboard traversal"],
  "verification": ["flutter test test/screens/profile_screen_test.dart"],
  "engineering_state_patch": {
    "risks": ["Accessibility gaps in form inputs — flagged by the UI layout gate"]
  }
}
```

## Outcome vocabulary

| Domain | Declared outcomes | Meaning |
| --- | --- | --- |
| Execution | `done`, `failed`, `blocked`, `clarification_required`, `approval_required` | Change applied and its local checks recorded; work incomplete; a concrete prerequisite unavailable; a user decision required; an approval request prepared. None of these is a passing report on its own. |
| Review | `pass`, `revise` | Required criteria supported in the assigned scope, or concrete correctable defects with stable `required_revisions`. |
| Escalation | `escalate` | Essential evidence or user intent is unavailable; carries the smallest missing question or recovery action. |
| Evidence | `report` | The assigned assessment completed, including negative findings; not a product verdict. |

This role's mapping:

- All five gate nodes — `architecture`, `ui-layout`, `test-quality`,
  `performance-platform` and `release` — are review gates. Each settles `pass` when
  no supported blocking issue exists in its assigned scope, `revise` for concrete
  blocking issues with stable `required_revisions`, and `escalate` when essential
  evidence or user intent is unavailable.
- The batch declares no execution node, no evidence node, no validation node and no
  approval node, because the lead owns production writes, synthesis, repair,
  acceptance and any user approval. `done`, `failed`, `blocked`,
  `clarification_required`, `approval_required` and `report` are therefore
  documented for completeness of the engine vocabulary and are never submitted by
  these five read-only specialists.
- `revise` and `escalate` return findings to the lead. The lead owns the repair and
  any fresh review batch for a changed snapshot, and a settled graph is not
  acceptance of the reviewed design.

## Submission and acceptance

Submitting is the only way an attempt settles, and only the decision `accepted`
with verdict `committed` or `replayed` and no refusals settles it. A rejection or a
refusal writes nothing and leaves the attempt open: repair the payload or the
missing evidence and resubmit. An identical retry after an uncertain delivery is
idempotent; a conflicting submission cannot overwrite a settled attempt. Once
accepted, stop work on that attempt. Never fabricate an outcome, never print the
credential, and never rely on a prose verdict or an inferred completion.

A settled graph is not acceptance of the reviewed design: a run can complete while
carrying a `revise` or `escalate` gate report, and the accepted result stays
readable through `graph_status` so the lead can synthesize it.

## Parent-owned repair and fresh re-review batch

When a gate settles `revise` or `escalate`, the lead repairs the work; a worker
never does.

1. Read the accepted `blocking_issues`, `required_revisions` and
   `engineering_state_patch` from `attempts[].result`; merge patch entries only
   after checking them against the project.
2. Apply the justified revisions to the code, then rerun the affected checks.
3. For independent re-review, declare a FRESH review batch for the updated snapshot:
   a new graph name, the updated Engineering brief in every node prompt, the stable
   issue ids and the prior findings for the gates being re-reviewed. There is no
   retry flag, no in-place prompt modification and no engine-managed repair cycle in
   this topology.
4. Limit substantive repair and re-review rounds to two per design. If the same
   blocker persists after the second round, diagnose the cause and report it with
   its evidence rather than resetting budgets, re-submitting the same payload or
   declaring an identical batch for an unchanged snapshot.

A re-review batch carries one gate per affected risk domain; it never re-opens a
settled attempt, and it never asks a reviewer to edit the code under review.
Reviewers never revise each other.

## Producer conformance

| Contract | Producer | Consumer | Transport |
|----------|----------|----------|-----------|
| Gate report | architecture-reviewer | Engineering Lead | `data` argument of `graph_submit_outcome` |
| Gate report | ui-layout-reviewer | Engineering Lead | `data` argument of `graph_submit_outcome` |
| Gate report | test-quality-reviewer | Engineering Lead | `data` argument of `graph_submit_outcome` |
| Gate report | performance-platform-reviewer | Engineering Lead | `data` argument of `graph_submit_outcome` |
| Gate report | release-engineer | Engineering Lead | `data` argument of `graph_submit_outcome` |
| Engineering brief | Engineering Lead | all 5 gate nodes | embedded in the node prompt of the declaration |

## Field drift prevention

**Principle**: This document is the single source of truth. No producer unilaterally changes a contract.

**Before changing any field**:

1. Propose the change here first (add or modify the field table).
2. Update all producers (subagent gate skills and role prompts for the gate report, the Engineering Lead workflow for the Engineering brief).
3. Update all consumers (Engineering Lead for the gate report, all 5 reviewers for the Engineering brief).
4. If backward-incompatible, version the contract or coordinate a simultaneous update.

**If a consumer receives a field not in this document**: reject it — producer error.

**If a producer needs a new field**: add it here first, then implement.

### Conformance status

| Producer | Contract | Status |
|----------|----------|--------|
| architecture-reviewer | Gate report | Conforms — schema_version 1 data per the Architecture Gate skill |
| ui-layout-reviewer | Gate report | Conforms — schema_version 1 data per the UI/Layout Gate skill |
| test-quality-reviewer | Gate report | Conforms — schema_version 1 data per the Test Quality Gate skill |
| performance-platform-reviewer | Gate report | Conforms — schema_version 1 data per the Perf/Platform Gate skill |
| release-engineer | Gate report | Conforms — schema_version 1 data per the Release Gate skill |
| Engineering Lead | Engineering brief | Conforms — embedded in every node prompt of the declaration |

### Deprecation policy

1. Mark deprecated fields with `[DEPRECATED]` in the field table.
2. Producers stop emitting deprecated fields within one version cycle.
3. Consumers continue accepting them for one cycle after deprecation.
4. After one cycle, remove from this document. Producers still emitting are non-conformant. Late or malformed fields for required data are rejected at submission time: repair the payload and resubmit.
