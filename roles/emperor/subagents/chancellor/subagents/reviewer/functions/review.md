---
name: review
description: Audit a strategy draft and emit a pass/veto verdict
produces: review_verdict
continue_until:
  any:
    - signal_observed(answer)
    - signal_observed(revise_needed)
    - artifact_exists(result)
    - artifact_exists(review_verdict)
observe:
  - on: tool_after
    capture_artifact: review_verdict
---

Review the complete Strategy against references/schemas.md. Check required fields,
dependency validity, write conflicts, acceptance/verification coverage, research
needs and whether authorized_scope really comes from the user. Never grant permission.
Return the Review Verdict as identical JSON result fence and signal payload:
answer for pass, revise_needed for veto. Supply concrete corrections for a veto.
