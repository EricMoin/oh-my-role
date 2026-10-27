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
owns review, drafter and finalizer dispatch. Return strategy with the full Strategy.
