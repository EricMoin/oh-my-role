# Engineering handoffs

These are communication contracts, not an engine-enforced shared state machine. Use one
`result` fence containing YAML for node output; do not nest Markdown fences. Engineering
briefs stay in node prompts. The parent merges evidence explicitly.

## Engineering brief (Engineering State)

Include only project facts relevant to the decision. Unknown facts remain unknown.

| Field | Content |
|---|---|
| goal | User-visible behavior and acceptance criteria |
| scope | Affected files/modules, callers, and explicit non-goals |
| snapshot | Commit plus local diff/artifact identifier; include uncommitted changes |
| project_facts | Relevant versions, established architecture, build/test conventions |
| invariants | Properties that must survive the change |
| ownership | State, decisions, identity, resource lifetimes and dependency direction |
| design_decision | Chosen boundary, alternatives/trade-offs, and why this is sufficient |
| api_surface | Visibility changes and their production justification; otherwise none |
| risks | Concrete possible failures; empty is allowed |
| verification_plan | Scenario → observable assertion → appropriate test/check |
| verification_results | Actual commands/outcomes and checks not run, with reasons |
| open_questions | Optional unresolved intent, environment, or API questions |

Each review request adds `review_phase` (consultation or implementation), `review_objective`,
and the exact diff/artifacts to inspect. A consultation reports design uncertainty; it
cannot certify compilation, implementation, or tests that do not yet exist.

## Gate report

| Field | Content |
|---|---|
| gate | architecture, ui-layout, test-quality, performance, or source-tracing |
| status | pass, fail, or needs-user-input |
| reviewed_snapshot | The revision/diff actually inspected |
| evidence | File:line, command output, or source citation; distinguish inspected from executed |
| blocking_issues | Concrete failure mechanisms with stable issue IDs; required for fail |
| required_revisions | Changes needed to address each blocker without prescribing incidental implementation |
| advisory_notes | Optional preferences and non-blocking improvements |
| verification | Checks actually performed and missing evidence; proposed checks labeled as proposed |
| engineering_state_patch | Optional proposed corrections to brief facts, merged only by the parent |

`pass` means no supported blocking issue in the assigned scope, not proof of the entire
feature. Advice with no blocker is pass with advisory notes; there is no conditional-pass
status. Missing required evidence must be explicit; do not turn inability to assess into
pass. Use needs-user-input for unavailable essential evidence/intent and state who can
resolve it; the parent asks the user only when local investigation cannot resolve it.

For the read-only review topology, write this report, then emit
`signal({type: "answer", payload: {assessment: "pass" | "fail" | "partial", observations: [...]}})`.
An answer indicates a completed assessment, not acceptance. Fail reports remain blockers
for the parent. Use `escalate` when unable to perform the assigned assessment. See
`references/graph-protocol.md` for recovery and signal semantics.
