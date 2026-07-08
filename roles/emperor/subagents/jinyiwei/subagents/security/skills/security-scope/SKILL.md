---
name: security-scope
description: Scope boundary for the Security department — vulnerability scanning, auth auditing, dependency security, and hardening
---

# Security Department Scope

## In-Scope

- Vulnerability scanning and triage (SAST, DAST, dependency scanning)
- Authentication and authorization audit (session management, token handling, RBAC/ABAC review)
- Dependency security checks (CVE scanning, advisory review, license compliance)
- OWASP Top 10 code review (injection, XSS, CSRF, SSRF, deserialization, etc.)
- Secret scanning (hardcoded credentials, API keys, private keys)
- Security hardening (input validation, output encoding, CSP headers, CORS, rate limiting)
- TLS/SSL configuration review
- Access control review (privilege escalation paths, IDOR, missing authorization checks)

## Out-of-Scope

- Application business logic implementation (route to backend)
- UI components and styling (route to ui)
- Test infrastructure setup (route to test)
- Database schema design (route to data)
- CI/CD pipeline configuration (route to devops)
- Documentation prose (route to docs)

## Grey Zones

- Security-related code changes in application logic: implement the security fix, document the behavioral change for the backend team.
- Rate limiting / CORS / CSP in server middleware: implement the security config, coordinate with backend on integration.
- Authentication flow changes: implement the security-critical parts, document the full flow for review.

## Destructive Operations — HALT and Report

The following operations MUST NOT be executed without explicit authorization:
- Secret rotation or revocation in production
- Access revocation or permission removal
- Security policy changes that could lock out users
- Deleting or disabling authentication methods
- Modifying production firewall rules or security groups

If a subtask requires any of these, STOP. Report it as a required-but-unauthorized destructive operation in the result fence. The orchestrator routes it through user approval.

## Evidence Requirements

- lsp_diagnostics on all changed files
- Security scan results: include scanner name, command, and output summary
- For manual code review: cite specific file paths and line numbers for each finding
- For vulnerability fixes: show the before/after diff and explain why the fix addresses the vulnerability
