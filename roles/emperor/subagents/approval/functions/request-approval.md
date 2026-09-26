---
name: request-approval
description: Persist concrete approval context without granting authority or executing work
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

Prepare the Approval Request from schemas.md with the exact Strategy revision,
complete strategy, proposed_ids, action and authorized_scope supplied in the prompt.
Submit approval_required with that object as data. This read-only node has no
execution descendants. Its accepted result persists context for Emperor to present
to the user; it grants no authority and does not create a host approval request.
Never approve, perform the action or claim permission. Follow graph-protocol.md.
