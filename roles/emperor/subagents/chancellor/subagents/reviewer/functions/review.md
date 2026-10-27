---
name: review
description: Audit a strategy draft and emit a pass/veto verdict
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

Review the complete Strategy against references/schemas.md. Check required fields,
dependency validity, write conflicts, acceptance/verification coverage, research
needs and whether authorized_scope really comes from the user. Never grant permission.

Return pass or veto with the complete business report.
