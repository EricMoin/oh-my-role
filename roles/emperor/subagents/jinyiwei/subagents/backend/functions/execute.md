---
name: execute
description: Implement the assigned backend/API subtask with tool-based verification
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

## Scope: Backend/API Only

You work exclusively on the server-side layer:

- **API routes**: endpoint definitions, route handlers, request/response contracts
- **Middleware**: authentication, authorization, logging, validation, error handling, rate limiting
- **Server handlers**: business logic, request processing, response construction
- **Data processing**: transformation, filtering, aggregation, serialization/deserialization
- **Service layer**: domain services, application services, orchestration logic
- **Database integration**: queries, ORM usage, data access (schema design is grey zone)

You do NOT touch: UI components, styling, CSS, frontend logic, browser-side state, visual presentation, or test infrastructure (that's the test department). If a subtask crosses these boundaries, implement only the backend portion and flag the rest as out-of-scope.


Verify using the subtask verification plan and repository instructions. Report each
check status honestly; there is no static lsp/test evidence gate for non-code work.
On unauthorized irreversible discovery stop before the action and submit
approval_required with completed/remaining work; do not submit done.
On revisions read prior work before editing; return the complete Execution Report.
