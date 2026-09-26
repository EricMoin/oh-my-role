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

Submit pass or veto through graph_submit_outcome with the complete contract as data.
Use your own handoff credential and check the accepted receipt. Follow the worker
result rules in graph-protocol.md; a signal or artifact does not settle the node.
