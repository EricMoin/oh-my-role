---
name: draft
description: Research the codebase and produce a structured strategy draft
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


Read the initial Strategy, repository context and reviewer findings. Revise the
Strategy from references/schemas.md, preserving accepted requirements. Investigate
uncertain facts with read-only tools. Include domain, write_scope, authorized_scope
and verification per item. Increment plan_revision when scope changes. Explain
unresolved uncertainty in notes; never silently discard veto findings.

Submit strategy through graph_submit_outcome with the complete contract as data.
Use your own handoff credential and check the accepted receipt. Follow the worker
result rules in graph-protocol.md; a signal or artifact does not settle the node.
