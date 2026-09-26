---
name: orchestrate
description: Check a Strategy and return its review recommendation to Emperor
priority: 10
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

Check the Strategy from the plan function against schemas.md: dependencies, write
conflicts, authorization and verification coverage. Do not draft it twice by default.
Record whether independent review is warranted and why in Strategy.notes. Emperor
owns review, drafter and finalizer dispatch; a graph worker cannot create child graphs.
Return strategy with the full Strategy as data through graph_submit_outcome. Follow
graph-protocol.md for handoff credentials, accepted receipts and failure handling.
A plan/final_strategy fence is an optional local copy, never graph completion.
