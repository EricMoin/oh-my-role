---
name: security-practices
description: Security practitioner knowledge — OWASP Top 10, auth patterns, dependency security, secret scanning, and hardening
---

# Security Practices

Practitioner-level domain knowledge for the Security department. Load this skill for implementation guidance on security tasks.

## OWASP Top 10 — Detection and Remediation

### Injection (SQL, NoSQL, OS Command)
- **Detect**: grep for string concatenation in queries/commands, dynamic eval, shell=True
- **Remediate**: parameterized queries / prepared statements, allowlist input validation, ORMs with parameterization
- **Language patterns**:
  - SQL: never `f"SELECT ... WHERE id = {user_input}"` — use parameterized cursor
  - Shell: never `os.system(user_input)` — use `subprocess.run(args_list)`

### Cross-Site Scripting (XSS)
- **Detect**: unescaped user input rendered in HTML, dangerouslySetInnerHTML, innerHTML
- **Remediate**: context-aware output encoding, Content-Security-Policy headers, escape on output not input
- **Framework defaults**: React escapes by default ({} notation). Watch for dangerouslySetInnerHTML.

### Broken Authentication
- **Detect**: weak password hashing (MD5, SHA1, plain text), no session expiration, predictable tokens
- **Remediate**: bcrypt/argon2 for passwords, secure random tokens, session timeout, MFA support

### Insecure Direct Object References (IDOR)
- **Detect**: object access without authorization checks (e.g., /api/users/123 without checking the caller owns 123)
- **Remediate**: authorize every object access, use indirect references, implement ownership checks in middleware

### Cross-Site Request Forgery (CSRF)
- **Detect**: state-changing operations without anti-CSRF tokens
- **Remediate**: anti-CSRF tokens, SameSite cookie attribute, verify Origin/Referer headers

### Security Misconfiguration
- **Detect**: debug mode enabled in production, default credentials, verbose error messages, unnecessary features enabled
- **Remediate**: security headers (HSTS, X-Frame-Options, X-Content-Type-Options), disable debug, custom error pages, least-privilege configs

### Sensitive Data Exposure
- **Detect**: HTTP (not HTTPS) for sensitive routes, weak TLS configurations, sensitive data in logs/URLs
- **Remediate**: TLS 1.2+, HSTS, encrypt data at rest and in transit, no secrets in URLs or logs

### Missing Access Control
- **Detect**: no role checks on admin endpoints, client-side only authorization
- **Remediate**: server-side authorization on every request, role-based access control (RBAC), deny by default

### Insecure Deserialization
- **Detect**: deserialize untrusted data without validation (pickle, JSON, XML)
- **Remediate**: input validation, use safe deserialization, avoid deserializing objects from untrusted sources

### Known Vulnerable Components
- **Detect**: outdated dependencies with known CVEs, no dependency scanning
- **Remediate**: regular dependency updates, automated vulnerability scanning (npm audit, pip-audit, cargo audit, Snyk, Dependabot)

## Authentication Patterns

### Session-Based
- Server-side session store, session ID in secure cookie
- Regenerate session ID after login (prevent session fixation)
- Set HttpOnly, Secure, SameSite on session cookie

### Token-Based (JWT)
- Short-lived access tokens (15 min), long-lived refresh tokens
- Verify signature, expiration, issuer, audience on every request
- Never store tokens in localStorage for web apps (XSS risk) — use HttpOnly cookies
- Implement token revocation list for logout

### OAuth 2.0 / OpenID Connect
- Use authorization code flow with PKCE for web/mobile apps
- Never use implicit flow for sensitive scopes
- Validate id_token signature and claims
- Use state parameter for CSRF protection

## Authorization Patterns

### RBAC (Role-Based Access Control)
- Define roles with permissions, assign roles to users
- Check role permission on every protected resource
- Deny by default, allow explicitly

### ABAC (Attribute-Based Access Control)
- Fine-grained: evaluate user attributes, resource attributes, environment conditions
- Use when RBAC is too coarse

### Common Pitfalls
- Client-side only authorization (always enforce on server)
- Missing authorization on API endpoints (check every route, not just login)
- Over-privileged service accounts (least privilege principle)

## Dependency Security

### Scanning
- Run dependency scanners in CI: `npm audit`, `pip-audit`, `cargo audit`, `mvn dependency-check`, `trivy`, `snyk`
- Fail builds on high/critical CVEs, not on info/low
- Set up automated dependency update PRs (Dependabot, Renovate)

### Assessment
- Check if the vulnerable code path is actually reachable (not all CVEs are exploitable)
- Check if the fix is available — if not, apply mitigating controls and document
- Prioritize by CVSS score, reachability, and exposure (internet-facing vs internal)

## Secret Scanning

### What to Scan For
- API keys (AWS, GCP, Azure, Stripe, GitHub, etc.)
- Private keys (SSH, TLS, PGP)
- Database connection strings with credentials
- Hardcoded passwords and tokens
- .env files committed to version control

### Tools
- `trufflehog`, `git-secrets`, `gitleaks`, GitHub secret scanning
- Pre-commit hooks to prevent secrets from being committed
- Scan git history, not just current state (secrets may be in old commits)

### Remediation
- If a secret is found in git history: rotate it immediately, then clean history
- Never just delete the file — the secret is still in git history
- Move secrets to environment variables or secret managers

## Input Validation and Output Encoding

### Input Validation
- Validate on the server, never trust client-side validation
- Use allowlist validation (define what IS allowed), not denylist (what is NOT)
- Validate type, length, format, range for every input
- Sanitize file uploads: check extension, MIME type, scan for malicious content

### Output Encoding
- Encode based on output context: HTML, JavaScript, URL, CSS
- Use framework-provided encoding functions, not manual string replacement
- Parameterized queries are the "encoding" for SQL context

## TLS/SSL Configuration
- Minimum TLS 1.2, disable TLS 1.0/1.1 and SSLv2/v3
- Use strong cipher suites, prefer AEAD (AES-GCM, ChaCha20-Poly1305)
- Enable HSTS with adequate max-age and includeSubDomains
- Use Let's Encrypt or equivalent for automated certificate renewal
- Test configuration with SSL Labs (ssllabs.com) or `testssl.sh`

## Security Hardening Checklist

- [ ] All inputs validated on server side
- [ ] All outputs context-encoded
- [ ] SQL queries parameterized
- [ ] Authentication uses strong hashing (bcrypt/argon2)
- [ ] Session tokens are secure random and expire
- [ ] CSRF protection on state-changing operations
- [ ] Security headers set (HSTS, X-Frame-Options, X-Content-Type-Options, CSP)
- [ ] HTTPS enforced, HTTP redirected
- [ ] Error messages do not leak implementation details
- [ ] Dependencies scanned for known vulnerabilities
- [ ] Secrets not in version control
- [ ] Least-privilege access on all resources
