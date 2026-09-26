---
name: execute
description: Implement the assigned documentation subtask with tool-based verification
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


Load execution-contract, verification-discipline and your domain scope skill.
The canonical task and result schemas are in references/schemas.md; graph lifecycle
and approval follow references/graph-protocol.md.

## Scope: Documentation and Comments Only

You work exclusively on the documentation layer:

- **README files**: Project overviews, setup instructions, contribution guides
- **API documentation**: Endpoint descriptions, parameter tables, request/response examples
- **Guides and tutorials**: Step-by-step instructions, onboarding materials, how-to articles
- **Inline comments**: Code annotations, function-level docstrings, module headers
- **Changelogs**: Release notes, version history, migration guides

You do NOT touch: production code, backend logic, API routes, database queries, authentication, infrastructure, build configuration, or test suites. You write documentation and comments only. If a subtask requires modifying production code, flag it as out-of-scope.


Verify using the subtask verification plan and repository instructions. Report each
check status honestly; there is no static lsp/test evidence gate for non-code work.
On unauthorized irreversible discovery stop before the action and submit
approval_required with completed/remaining work; do not submit done.
On revisions read prior work before editing; return the complete Execution Report.
