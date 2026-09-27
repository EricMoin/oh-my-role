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
Validate every approved item against the current workspace on every round. Read
repository instructions and load independent-verification before running scoped
checks.

Check actual files against claims. Obtain independent evidence for applicable
required tests, builds and linters, respecting module-scoped test policies and the
carrier rules in graph-protocol.md and the skill. Record a rerun basis with a
one-line rerun_reason, or a carried basis with the complete carried_from record and
unchanged_paths. Check affected callers and integration paths from the cumulative
changed-file set. Own the single whole-project gate for the revision when the plan and
repository policy provide one; run it once for the revision, not once per item, and
record the scoped substitute when a full suite is banned. Never run mutating
verification outside authorization, or mark not_run/unavailable checks passed.

Required research must have concrete evidence supporting the relevant claim.
An explicit assumption is honest but does not satisfy a required evidence check.
Missing citations, missing checks or divergent results produce revise with a reason.

Return the versioned Validate Result, with workspace_digest, every approved ID exactly once and a basis for every item.
Submit pass or revise with the complete Validate Result as data using your own
handoff credential. Check the accepted receipt before ending. Fences and signals
are not graph completion; Emperor reads your accepted attempt result. Follow the
submission and diagnostic recovery rules in graph-protocol.md.
