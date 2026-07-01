# Departments

All 6 departments are live and routable. Each runs as a dispatch subagent under Jinyiwei with a dedicated scope, evidence requirements, and optional opencode skills.

## Department registry

| Department | Dispatch ID | Scope summary | Evidence tags | Domain keywords |
|---|---|---|---|---|
| UI | emperor--jinyiwei--ui | Components, styling, layouts, interactions, accessibility | lsp_diagnostics, test | ui, frontend, component, style, layout |
| Backend | emperor--jinyiwei--backend | API, services, server logic, integration | lsp_diagnostics, test | backend, api, service, middleware, route |
| Test | emperor--jinyiwei--test | Tests, fixtures, mocking, coverage, test infra | test | test, spec, mock, fixture, coverage |
| Data | emperor--jinyiwei--data | Schema, migrations, queries, persistence | lsp_diagnostics, test | schema, migration, query, persistence, database |
| Docs | emperor--jinyiwei--docs | README, API docs, guides, comments | lsp_diagnostics | doc, readme, guide, comment, changelog |
| Quality | emperor--jinyiwei--quality | Lint, format, static analysis, review | lsp_diagnostics | lint, format, static analysis, quality |

All departments use model pool `deepseek-v4-pro-max`.

## Evidence tags explained

- **lsp_diagnostics**: Run language-server diagnostics on changed files. Zero errors required.
- **test**: Run relevant tests. All must pass.

Departments that produce prose only (Docs) or whose output IS diagnostics (Quality) skip the test tag.

## opencode_skills per department

The `opencode_skills` field in each department's `role.yaml` is optional. The table
below lists what each department loads by default — a stack-agnostic set that ships
with the role. Skill names must be bare (e.g. `software-architecture-data`), never
namespace-prefixed.

| Department | Default (loaded) skills |
|---|---|
| UI | react, tailwindcss, vercel-react-best-practices, frontend-ui-ux, zustand |
| Backend | software-architecture-core, software-architecture-patterns, software-architecture-data, software-architecture-distributed, software-architecture-infrastructure |
| Test | test-script-generation |
| Data | software-architecture-data, flutter-implement-persistence-offline, software-architecture-ddd |
| Docs | humanizer, paper-writer |
| Quality | software-architecture-antipatterns, review-work |

### Optional stack-specific additions

The default set is intentionally stack-agnostic. For projects on a specific stack,
add matching skills to the department's `opencode_skills` list. Examples:

| Department | Add for Dart/Flutter projects |
|---|---|
| Test | dart-add-unit-test, dart-generate-test-mocks, dart-flutter-test-quality-gate |
| Quality | dart-flutter-test-quality-gate, dart-run-static-analysis |

Keep this table and the actual `role.yaml` `opencode_skills` lists in sync. If you
add a skill to a department, add it here; if you remove one, remove it here.

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
