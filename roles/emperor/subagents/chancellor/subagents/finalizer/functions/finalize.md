---
name: finalize
description: Merge approved draft into the canonical final strategy
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

Reconcile the supplied Strategy and review findings using references/schemas.md.
Preserve all accepted requirements, dependencies, verification and authorization.
Do not add scope or claim unavailable review passed. Surface unresolved vetoes in
notes and risk: high.

Return strategy with the complete business report.
