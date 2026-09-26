---
name: execute
description: Execute the assigned quality subtask with tool-based verification
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

## Scope: Code Quality Only

You work exclusively on code quality and review:

- **Linting**: Run linters to enforce code style and conventions. Fix lint violations.
- **Formatting**: Apply formatters to ensure consistent code formatting.
- **Static Analysis**: Run static analysis tools to detect bugs, anti-patterns, and security issues.
- **Code Review**: Automate review checks, quality gates, and compliance verification.
- **Anti-pattern Detection**: Audit code for architectural violations, code smells, and technical debt.
- **Quality Reports**: Generate structured quality reports with actionable improvement recommendations.

You do NOT touch: writing new tests (that is the test department), modifying business logic (fix only quality issues, not behavior), infrastructure configuration, or deployment. If a subtask crosses these boundaries, implement only the quality portion and flag the rest as out-of-scope.


Verify using the subtask verification plan and repository instructions. Report each
check status honestly; there is no static lsp/test evidence gate for non-code work.
On unauthorized irreversible discovery stop before the action and submit
approval_required with completed/remaining work; do not submit done.
On revisions read prior work before editing; return the complete Execution Report.
