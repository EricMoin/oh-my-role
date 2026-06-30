---
name: domain-routing
description: Domain routing table and fallback heuristics for dispatching to department workers
---

# Domain Routing

Single source of truth for mapping a subtask's domain to the correct department worker. Loaded by jinyiwei's `route` function to decide who executes what.

## Domain Routing Table

| Domain | ID | Scope Description | Evidence Tags |
|--------|----|-------------------|---------------|
| ui | emperor--jinyiwei--ui | Frontend/UI: components, styling, responsive layout, interaction states | `[lsp_diagnostics, test]` |
| backend | emperor--jinyiwei--backend | Backend/API: server logic, routes, middleware, data processing | `[lsp_diagnostics, test]` |
| test | emperor--jinyiwei--test | Testing: unit tests, integration tests, test fixtures, coverage | `[test]` |
<!-- TODO: data | emperor--jinyiwei--data | Data layer: schemas, migrations, queries, persistence | `[lsp_diagnostics, test]` -->
<!-- TODO: docs | emperor--jinyiwei--docs | Documentation: README, API docs, inline comments, guides | `[lsp_diagnostics]` -->
<!-- TODO: quality | emperor--jinyiwei--quality | Quality assurance: linting, formatting, static analysis, review | `[lsp_diagnostics]` -->

Three departments are implemented: ui (工部), backend (兵部), and test (刑部). The remaining three (data, docs, quality) are TODO placeholders — attempting to route to them will fail until their workers exist.

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

### Detection Priority

1. **Explicit tag in subtask** (if present, use it directly — no inference)
2. **Strong keyword match** (e.g., "add a component" → ui, "write tests" → test)
3. **Mixed signals: strongest wins** (e.g., "style the test page" → ui, because the task is about styling)
4. **No clear signal → unknown** (trigger fallback)

## Fallback Rules

These rules apply when routing cannot map a subtask to a valid department.

### Unknown / Unclear Domain

If domain detection produces no confident match (or matches a department that does not yet exist):

- **Route will fall back to execute function directly.** Jinyiwei handles the task without dispatching to a department worker.
- This preserves forward progress — an unclear domain should not block execution.
- Report the unresolved domain in the result so the Emperor can refine routing over time.

### Budget Exhaustion / Dispatch Failure

If `dispatch` fails due to budget exhaustion, concurrency limits, or worker unavailability:

- **Route will fall back to execute function directly.** Jinyiwei handles the task inline rather than blocking.
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

Tags are selected by the `route` function when dispatching. If falling back to execute directly, default to `[lsp_diagnostics, test]` unless the task is read-only (then `[lsp_diagnostics]` alone suffices).

## Parallel Dispatch Limits

Jinyiwei's dispatch configuration enforces concurrency gates:

```
maxActivePerParent: 2      — max 2 background tasks running per jinyiwei session
maxTotalSessionsPerRequest: 8  — tree-level cap on total sessions spawned from one user request
```

**Implication for routing:** When routing splits a task into multiple subtasks, jinyiwei can dispatch at most 2 workers in parallel. Any additional workers must wait in the queue. The tree-level cap of 8 applies across all dispatches from the originating user request, not per-subtask.
