---
name: execute
description: Implement the assigned data subtask with tool-based verification
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
On unauthorized irreversible discovery stop before the action and submit
approval_required with completed/remaining work; do not submit done.
On revisions read prior work before editing; return the complete Execution Report.
