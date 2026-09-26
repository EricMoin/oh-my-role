---
name: report
description: Emit the canonical structured execution report after verification
priority: 30
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

Build the complete Execution Report from schemas.md using actual check results.
Submit done only when acceptance is supported, incomplete_items is empty and every
required check is satisfied. Otherwise submit failed with category, attempts and a
nested partial report. Never release done-only consumers with unfinished work.

For missing authorization, prerequisites or user choices, use approval_required,
blocked or clarification_required with the corresponding contract, preserving
completed and remaining work. Do not submit done after one of these settles.

Call graph_submit_outcome using the host handoff's graph_id, node_id and credential,
the declared outcome_id and the full object as data. Check decision: accepted,
verdict: committed/replayed and empty refusals before finishing. A rejected/refused
proposal needs diagnostic recovery; a tool call, signal or result fence alone is
not completion. Optional result JSON mirrors data and never includes credentials.
