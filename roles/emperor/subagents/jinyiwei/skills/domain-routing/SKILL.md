---
name: domain-routing
description: Domain routing table and fallback heuristics for dispatching to department workers
---

# Domain Routing

Single source of truth for mapping a subtask's domain to the correct department worker. Loaded by the executor/router's `route` function to decide who executes what.

## Domain Routing Table

All seven departments are active and routable. Every row maps a domain to a live department worker.

| Domain | ID | Scope Description | Evidence Tags |
|--------|----|-------------------|---------------|
| ui | emperor--jinyiwei--ui | Frontend/UI: components, styling, responsive layout, interaction states | `[lsp_diagnostics, test]` |
| backend | emperor--jinyiwei--backend | Backend/API: server logic, routes, middleware, data processing | `[lsp_diagnostics, test]` |
| test | emperor--jinyiwei--test | Testing: unit tests, integration tests, test fixtures, coverage | `[test]` |
| data | emperor--jinyiwei--data | Data layer: schemas, migrations, queries, persistence | `[lsp_diagnostics, test]` |
| docs | emperor--jinyiwei--docs | Documentation: README, API docs, inline comments, guides | `[lsp_diagnostics]` |
| devops | emperor--jinyiwei--devops | DevOps/Infra: CI/CD, Docker, Kubernetes, Terraform, deployment | `[lsp_diagnostics]` |
| security | emperor--jinyiwei--security | Security: vulnerability scanning, auth audit, dependency security, hardening | `[lsp_diagnostics]` |

## Domain Detection Heuristics

When no domain is explicitly tagged in the subtask, infer from keywords in the task description. These are prompt heuristics, not code — match the strongest signal present.

### Keyword → Domain Mapping

| Keywords / Patterns | → Domain |
|---------------------|----------|
| `component`, `style`, `css`, `layout`, `responsive`, `interaction`, `animation`, `UI`, `UX`, `class`, `className`, `tailwind`, `flex`, `grid`, `padding`, `margin`, `color`, `font`, `button`, `modal`, `sidebar`, `navbar` | ui |
| `api`, `endpoint`, `route`, `middleware`, `server`, `handler`, `request`, `response` | backend |
| `test`, `spec`, `coverage`, `mock`, `fixture`, `assert`, `expect`, `it(` | test |
| `schema`, `migration`, `query`, `database`, `model`, `entity`, `repository`, `persist` | data |
| `readme`, `docs`, `comment`, `jsdoc`, `guide`, `tutorial`, `explanation` | docs |
| `lint`, `format`, `prettier`, `eslint`, `review`, `type-check`, `analyze` | quality |
| `ci`, `cd`, `pipeline`, `docker`, `kubernetes`, `k8s`, `helm`, `terraform`, `deploy`, `deployment`, `infrastructure`, `iac`, `container`, `compose`, `kubectl`, `ansible` | devops |
| `security`, `vulnerability`, `auth`, `authentication`, `authorization`, `owasp`, `cve`, `scan`, `penetration`, `pentest`, `secret`, `hardening`, `csrf`, `xss`, `injection` | security |

### Detection Priority

1. **Explicit tag in subtask** (if present, use it directly — no inference)
2. **Strong keyword match** (e.g., "add a component" → ui, "write tests" → test)
3. **Mixed signals: strongest wins** (e.g., "style the test page" → ui, because the task is about styling)
4. **No clear signal → unknown** (trigger fallback)

## Fallback Rules

These rules apply when routing cannot map a subtask to a valid department.

### Unknown / Unclear Domain

If domain detection produces no confident match:

- **Route falls back to direct execution.** The executor/router handles the task without dispatching to a department worker.
- This preserves forward progress — an unclear domain must not block execution.
- Report the unresolved domain in the result so the orchestrator can refine routing over time.

### Engine Rejection / Dispatch Failure

If `graph_add_node`/`graph_run` fails due to budget exhaustion, concurrency limits, or worker unavailability:

- **Route falls back to direct execution.** The executor/router handles the task inline rather than blocking.
- The task may take longer (synchronous execution), but it will not be dropped.
- Include the failure reason in the result output.

## Evidence Tag Selection

Evidence tags describe the verification artifacts a department worker is expected to produce. The `route` function selects tags based on the domain and passes them to the worker's evidence requirement.

| Domain | Evidence Tags | Rationale |
|--------|--------------|-----------|
| ui | `[lsp_diagnostics, test]` | Components must pass type-checking and widget tests |
| backend | `[lsp_diagnostics, test]` | Server logic must compile and pass integration tests |
| test | `[test]` | Test files are self-verifying — they are the evidence |
| data | `[lsp_diagnostics, test]` | Schema changes must be valid and queries must execute |
| docs | `[lsp_diagnostics]` | Documentation only needs to pass markdown/type checks |
| quality | `[lsp_diagnostics]` | Linting and analysis produce diagnostics as evidence |
| devops | `[lsp_diagnostics]` | Infrastructure configs must pass syntax validation and dry-run checks |
| security | `[lsp_diagnostics]` | Security changes must pass type-checking and security scans |

Tags are selected by the `route` function when dispatching. If falling back to direct execution, default to `[lsp_diagnostics, test]` unless the task is read-only (then `[lsp_diagnostics]` alone suffices).

## Concurrency

Concurrency is engine-managed. If the engine rejects a `graph_add_node`/`graph_run` for budget, capacity, or queue-full, fall back to direct execution (see route.md Fallback 2).
