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

Submit strategy through graph_submit_outcome with the complete contract as data.
Use your own handoff credential and check the accepted receipt. Follow the worker
result rules in graph-protocol.md; a signal or artifact does not settle the node.
