---
name: route
description: Identify a scope mismatch and return a department suggestion to Emperor
priority: 15
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

Load domain-routing and identify the department from the complete subtask contract.
Execute unknown-domain work inline when it fits your scope and available tools.
If another specialist is necessary, return failed with category: scope_mismatch,
suggested_domain, completed/remaining work and the partial report (null only before
work starts). Emperor dispatches the replacement and preserves dependencies.
Never declare a child graph, query another worker, or duplicate an existing attempt.
Submit your own outcome through graph_submit_outcome as described in graph-protocol.md.
