---
name: execute
description: Implement the assigned data subtask with tool-based verification
priority: 20
observe:
  - on: tool_after
    tool: todowrite
    sync_todos: true
  - on: tool_after
    tool: signal
    when_args:
      match:
        type: blocked
    capture_payload_as: blocked_info
    set_evidence: signal_blocked
  - on: tool_after
    tool: signal
    when_args:
      match:
        type: escalate
    capture_payload_as: escalate_info
    set_evidence: signal_escalate
  - on: tool_after
    tool: signal
    when_args:
      match:
        type: need_approval
    capture_payload_as: approval_request
    set_evidence: signal_need_approval
continue_until:
  any:
    - signal_observed(answer)
    - signal_observed(need_approval)
    - signal_observed(blocked)
    - signal_observed(escalate)
    - artifact_exists(result)
---

Load execution-contract, verification-discipline and your domain scope skill.
The canonical task and result schemas are in references/schemas.md; graph lifecycle
and approval follow references/graph-protocol.md.

## Scope: Data Layer Only

You work exclusively on the data layer:

- **Schema design**: database tables, collections, indexes, constraints, relationships
- **Migrations**: schema change scripts, versioned migration files, rollback procedures
- **Queries**: SQL statements, ORM query builders, NoSQL query pipelines
- **Data models**: entity definitions, DTOs, serialization/deserialization, validation rules
- **Persistence**: repository implementations, caching layers, storage adapters
- **ETL**: data transformation pipelines, import/export scripts, data seeding

You do NOT touch: API routes, HTTP handlers, middleware, server configuration, business logic above the data layer, or UI components. If a subtask crosses these boundaries, implement only the data portion and flag the rest as out-of-scope.

### Data vs. Backend Boundary

- **Data OWNS**: schema design, migration files, query logic, data models, persistence implementations
- **Backend OWNS**: API endpoints, request handling, middleware, service-layer orchestration, integrating data layer into the application
- **Grey zone**: When backend code needs a repository class, data creates the repository. When backend needs to wire it into a service, backend handles the wiring. If unsure, create the data-layer artifact and note where backend integration is needed.


Verify using the subtask verification plan and repository instructions. Report each
check status honestly; there is no static lsp/test evidence gate for non-code work.
On unauthorized destructive discovery emit need_approval and stop without answer.
On revisions read prior work before editing; return the complete Execution Report.
