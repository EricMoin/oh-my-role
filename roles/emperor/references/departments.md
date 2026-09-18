---
name: departments
description: Generated department registry and dispatch contract
---
# Departments

Generated from departments.json by scripts/sync_emperor.py; edit the JSON source.
Known domains dispatch directly to these agents. Unknown domains use emperor--jinyiwei.

| Domain | Agent | Scope | Keywords |
|---|---|---|---|
| ui | emperor--jinyiwei--ui | Components, styling, accessibility and interaction | ui, frontend, component, css, layout |
| backend | emperor--jinyiwei--backend | API, services and middleware | backend, api, endpoint, middleware, service |
| test | emperor--jinyiwei--test | Tests, fixtures and test infrastructure | test, spec, mock, coverage, fixture |
| data | emperor--jinyiwei--data | Schemas, migrations, queries and persistence | schema, migration, query, database, persistence |
| docs | emperor--jinyiwei--docs | Documentation, guides and comments | docs, readme, guide, comment, changelog |
| quality | emperor--jinyiwei--quality | Lint, formatting and static analysis without behavior changes | lint, format, prettier, eslint, type-check |
| devops | emperor--jinyiwei--devops | CI/CD, infrastructure and deployment | ci, pipeline, docker, kubernetes, deploy, infrastructure |
| security | emperor--jinyiwei--security | Security audits, authentication and hardening | security, vulnerability, auth, cve, scan, hardening |

All eight departments explicitly load execution-contract, evidence-first-research
and verification-discipline, plus their domain skill. Skills do not inherit from
parents. Portable copies are generated from Jinyiwei's canonical shared skills.
Verification is selected per task; no unconditional LSP/test requirement for prose.

To add a department, create subagents/jinyiwei/subagents/{domain}/role.yaml with
execute/report functions and scope skill, add departments.json entry, then run
scripts/sync_emperor.py and scripts/validate.py. Use explicit execution tool flags.
Stack-specific installed skills may be declared via opencode_skills when available;
the portable base role does not assume any external role is installed.
