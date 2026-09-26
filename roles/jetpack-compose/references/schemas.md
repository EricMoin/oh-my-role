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

The brief is embedded in the node prompt; it is not a graph payload. Include only
project facts relevant to the decision, and leave unknown facts explicitly unknown.

| Field | Content |
| --- | --- |
| goal | User-visible behavior and acceptance criteria |
| scope | Affected files/modules, callers, and explicit non-goals |
| snapshot | Commit plus local diff/artifact identifier; include uncommitted changes |
| project_facts | Relevant versions, established architecture, build/test conventions |
| invariants | Properties that must survive the change |
| ownership | State, decisions, identity, resource lifetimes and dependency direction |
| design_decision | Chosen boundary, alternatives/trade-offs, and why this is sufficient |
| api_surface | Visibility changes and their production justification; otherwise none |
| risks | Concrete possible failures; empty is allowed |
| verification_plan | Scenario to observable assertion to appropriate test/check |
| verification_results | Actual commands/outcomes and checks not run, with reasons |
| open_questions | Optional unresolved intent, environment, or API questions |

A source-tracing or review request adds the concrete question, the reviewed object
(the snapshot/diff and artifact paths to inspect) and the read-only scope. A
consultation reports design uncertainty; it cannot certify compilation,
implementation or tests that do not yet exist.

## Gate report (submitted as accepted outcome data)

Each read-only gate writes this report and submits it as the `data` payload of the
outcome it settles. The report carries `schema_version: 1` and the settled outcome
id, so the accepted result is self-identifying.

| Field | Content |
| --- | --- |
| schema_version | 1 |
| outcome_id | The outcome id this report settles: report, pass, revise or escalate |
| gate | architecture, ui-layout, test-quality, performance, or source-tracing |
| status | pass, fail, or needs-user-input |
| reviewed_snapshot | The revision/diff actually inspected |
| evidence | File:line, command output, or source citation; distinguish inspected from executed |
| blocking_issues | Concrete failure mechanisms with stable issue IDs; required for fail |
| required_revisions | Changes needed to address each blocker without prescribing incidental implementation |
| advisory_notes | Optional preferences and non-blocking improvements |
| verification | Checks actually performed and missing evidence; proposed checks labeled as proposed |
| engineering_state_patch | Optional proposed corrections to brief facts, merged only by the lead |

`status: pass` means no supported blocking issue exists in the assigned scope, not
proof of the entire feature. Advice with no blocker is a pass with advisory notes;
there is no conditional-pass status. Missing required evidence must be explicit:
never turn inability to assess into a pass. Use `status: needs-user-input` for
unavailable essential evidence or user intent and name who can resolve it; the lead
asks the user only when local investigation cannot resolve it.

The report status maps to the settled outcome as follows:

| Gate report status | Settled outcome |
| --- | --- |
| pass | pass |
| fail with concrete blockers | revise, carrying stable required_revisions |
| needs-user-input | escalate, with the smallest missing question or recovery action |
| source-tracing assessment, any finding | report, including negative findings |

## Outcome vocabulary

| Domain | Declared outcomes | Meaning |
| --- | --- | --- |
| Execution | done, failed, blocked, clarification_required, approval_required | Change applied and its local checks recorded; work incomplete; a concrete prerequisite unavailable; a user decision required; an approval request prepared. None of these is a passing report on its own. |
| Review and validation | pass, revise | Required criteria supported in the assigned scope, or concrete correctable defects with stable `required_revisions` |
| Review escalation | escalate | Essential evidence or user intent is unavailable |
| Evidence | report | The assigned assessment completed, including negative findings; not a product verdict |

This role's mapping:

- `source-behavior` and `source-versions` are source-tracing evidence nodes; each
  settles `report`. A failing check or a negative finding is still `report`: the
  assessment completed, and it is neither a product verdict nor an acceptance.
- `architecture`, `ui-layout`, `test-quality` and `performance` are review gates;
  each settles `pass` when no supported blocking issue exists in its assigned
  scope, `revise` for concrete blocking issues with stable `required_revisions`,
  and `escalate` when essential evidence or user intent is unavailable.
- This role declares no execution node, no validation node and no approval node,
  because the lead owns production writes, acceptance and any user approval.
  `done`, `failed`, `blocked`, `clarification_required` and `approval_required`
  are therefore documented for completeness of the engine vocabulary and are never
  submitted by these five read-only specialists.
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
