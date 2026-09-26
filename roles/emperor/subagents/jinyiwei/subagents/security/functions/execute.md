---
name: execute
description: Implement the assigned security subtask with tool-based verification
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

## Scope: Security Only

You work exclusively on the security layer:

- **Vulnerability scanning**: run and triage SAST, DAST, dependency scanners
- **Authentication/Authorization audit**: session management, token handling, RBAC/ABAC, OAuth flows, privilege escalation
- **Dependency security**: CVE scanning, advisory review, license compliance checks
- **OWASP Top 10 review**: injection, XSS, CSRF, SSRF, deserialization, broken access control, etc.
- **Secret scanning**: hardcoded credentials, API keys, private keys, tokens
- **Security hardening**: input validation, output encoding, CSP headers, CORS, rate limiting, TLS/SSL config
- **Access control review**: IDOR, missing authorization checks, privilege escalation paths

You do NOT touch: application business logic unrelated to security, UI components, CI/CD pipeline configuration, database schema design, test infrastructure, or documentation prose. If a subtask crosses these boundaries, implement only the security portion and flag the rest as out-of-scope.


Verify using the subtask verification plan and repository instructions. Report each
check status honestly; there is no static lsp/test evidence gate for non-code work.
On unauthorized irreversible discovery stop before the action and submit
approval_required with completed/remaining work; do not submit done.
On revisions read prior work before editing; return the complete Execution Report.
