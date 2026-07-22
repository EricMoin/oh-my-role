---
name: departments
description: Department definitions, domain assignments, evidence tags, and extension guide
---

# Departments

All 8 departments are live and routable. Each runs as a dispatch subagent under Jinyiwei with a dedicated scope skill, internal skills, and evidence requirements.

## Department registry

| Department | Dispatch ID | Scope summary | Evidence tags | Domain keywords |
|---|---|---|---|---|
| UI | emperor--jinyiwei--ui | Components, styling, layouts, interactions, accessibility | lsp_diagnostics, test | ui, frontend, component, style, layout |
| Backend | emperor--jinyiwei--backend | API, services, server logic, integration | lsp_diagnostics, test | backend, api, service, middleware, route |
| Test | emperor--jinyiwei--test | Tests, fixtures, mocking, coverage, test infra | test | test, spec, mock, fixture, coverage |
| Data | emperor--jinyiwei--data | Schema, migrations, queries, persistence | lsp_diagnostics, test | schema, migration, query, persistence, database |
| Docs | emperor--jinyiwei--docs | README, API docs, guides, comments | lsp_diagnostics | doc, readme, guide, comment, changelog |
| Quality | emperor--jinyiwei--quality | Lint, format, static analysis, review | lsp_diagnostics | lint, format, static analysis, quality |
| DevOps | emperor--jinyiwei--devops | CI/CD, Docker, Kubernetes, IaC, deployment, observability | lsp_diagnostics | devops, ci, cd, pipeline, docker, kubernetes, deploy, infrastructure, iac, container |
| Security | emperor--jinyiwei--security | Vulnerability scanning, auth audit, dependency security, hardening | lsp_diagnostics | security, vulnerability, auth, owasp, cve, scan, hardening, secret |

All departments use model pool `tier-2-reasoning`.

## Evidence tags explained

- **lsp_diagnostics**: Run language-server diagnostics on changed files. Zero errors required.
- **test**: Run relevant tests. All must pass.

Departments that produce prose only (Docs) or whose output IS diagnostics (Quality) skip the test tag.


## Skills per department

Each department loads emperor-internal skills only. The emperor role is self-contained — it does not depend on skills from other roles being installed.

| Department | Internal skills |
|---|---|
| UI | ui-scope |
| Backend | backend-scope |
| Test | test-scope |
| Data | data-scope |
| Docs | docs-scope |
| Quality | quality-scope |
| DevOps | devops-scope, devops-practices |
| Security | security-scope, security-practices |

Each department has at minimum a `{name}-scope` skill defining boundaries, grey zones, and destructive-operation HALT rules. DevOps and Security additionally carry practitioner-knowledge skills (`devops-practices`, `security-practices`) with domain expertise for implementation guidance.

### Adding external skills (optional)

If the user has installed additional roles (e.g., `software-architecture`, `react-frontend`, `dart-flutter`), their skills can be added to a department's `opencode_skills` list for stack-specific enhancement. This is optional — the emperor works fully without any external role installed.

## How to add a new department

1. Create `subagents/jinyiwei/subagents/{name}/` with:
   - `role.yaml` (set name, description, model, prompt, skills reference)
   - `functions/execute.md` (scope, evidence tags, process)
   - `functions/report.md` (structured output format)
   - `skills/{name}-scope/SKILL.md` (boundary definition, grey zones, escalation triggers)
2. Register the new department in `jinyiwei/skills/domain-routing/SKILL.md` keyword table.
3. Add a row to the department registry table above.
4. Reference existing departments for scope-definition patterns (copy from `ui/` or `backend/` and adapt).

## Cost and capacity

See `references/model-pool-and-budget.md` for budget limits, concurrency caps, and model selection guidance.
