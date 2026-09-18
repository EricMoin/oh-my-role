---
name: validate
description: Compare execution reports against the original strategy and emit a per-item pass/revise verdict
priority: 20
produces: result
observe:
  - on: tool_after
    capture_artifact: result
  - on: tool_after
    tool: signal
    when_args:
      match:
        type: answer
    set_evidence: signal_answer
  - on: tool_after
    tool: signal
    when_args:
      match:
        type: revise_needed
    capture_payload_as: revise_items
    set_evidence: signal_revise
continue_until:
  any:
    - signal_observed(answer)
    - signal_observed(revise_needed)
    - artifact_exists(result)
---

Read references/schemas.md for the Validate Result and Execution Report contracts.
Validate the WHOLE approved strategy against the current workspace on every round,
including previously passing items. Read repository instructions and load
independent-verification before running scoped checks.

Check actual files against claims. Independently run applicable required tests,
builds and linters, respecting module-scoped test policies. Check affected callers
and integration paths from the cumulative changed-file set. Never run mutating
verification outside authorization, or mark not_run/unavailable checks passed.

Required research must have concrete evidence supporting the relevant claim.
An explicit assumption is honest but does not satisfy a required evidence check.
Missing citations, missing checks or divergent results produce revise with a reason.

Return the versioned Validate Result, with every approved ID exactly once.
Emit identical JSON in result fence and signal payload (answer for pass,
revise_needed for revise). Local revise_items capture is session-local; the parent
reads this node's output/signal stream rather than observing your tools directly.
