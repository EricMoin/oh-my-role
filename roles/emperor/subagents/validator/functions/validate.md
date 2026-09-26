---
name: validate
description: Compare execution reports against the original strategy and emit a per-item pass/revise verdict
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


Read references/schemas.md for the Validate Result and Execution Report contracts.
Validate the WHOLE approved strategy against the current workspace on every round,
including previously passing items. Read repository instructions and load
independent-verification before running scoped checks.

Check actual files against claims. Obtain independent evidence for applicable
required tests, builds and linters, respecting module-scoped test policies and the
skill's narrow rules for reusing prior Validator checks. Check affected callers
and integration paths from the cumulative changed-file set. Never run mutating
verification outside authorization, or mark not_run/unavailable checks passed.

Required research must have concrete evidence supporting the relevant claim.
An explicit assumption is honest but does not satisfy a required evidence check.
Missing citations, missing checks or divergent results produce revise with a reason.

Return the versioned Validate Result, with every approved ID exactly once.
Submit pass or revise with the complete Validate Result as data using your own
handoff credential. Check the accepted receipt before ending. Fences and signals
are not graph completion; Emperor reads your accepted attempt result. Follow the
submission and diagnostic recovery rules in graph-protocol.md.
