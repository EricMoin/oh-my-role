---
name: execute
description: Implement the assigned testing/QA subtask with tool-based verification
priority: 20
requires_evidence: [outcome_accepted]
observe:
  - on: tool_after
    tool: graph_submit_outcome
    when_output:
      contains: '"decision": "accepted"'
    set_evidence: outcome_accepted
  - on: tool_after
    tool: graph_submit_outcome
    when_output:
      contains: '"decision":"accepted"'
    set_evidence: outcome_accepted
continue_until: evidence_met()
---


Load execution-contract, verification-discipline, test-scope and test-design.
Read schemas.md for task/report fields and graph-protocol.md for lifecycle/recovery.

Read the changed implementation, acceptance criteria, existing tests and direct
consumers. Identify behavior at risk and missing coverage before editing. Use the
repository's test conventions and existing fixtures; give each new test an observable
expected result that would fail for the relevant defect or a plausible wrong change.
For a fix, run the regression against the pre-fix behavior when feasible, then against
the corrected state. Work in an isolated copy or equivalent; preserve shared work and
never revert another worker's changes. If reproduction is unsafe or unavailable,
explain the limitation and still establish meaningful fixed-state assertions.

Run the smallest supported selection covering the changed behavior and affected
interactions. Reuse current recorded checks; widen only with a concrete reason under
graph-protocol.md. Diagnose a failed assertion, fixture, command or environment before
retrying. A production defect outside write_scope becomes a failed report with the
regression and correction direction for Emperor, not weakened expectations or a
silent production edit. Never submit done while a required test/check remains unmet.

Report the behaviors covered, test locations, selection rationale, actual check
results and remaining gaps. On revisions, read prior work and rerun affected checks
after corrections. On unauthorized irreversible discovery stop before the action
and submit approval_required with completed/remaining work.
