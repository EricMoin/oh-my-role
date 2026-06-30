# Six Departments Template

How to add a new domain department to Jinyiwei by copying the live `ui/` directory.

## 1. Overview

Jinyiwei operates through six domain departments, each named after a Ming Dynasty ministry:

| Department | Domain | Chinese Name | Status |
|------------|--------|--------------|--------|
| ui | Frontend/UI | 工部 (Engineering) | Live |
| backend | Backend/API | 兵部 (Military) | Live |
| test | Testing | 刑部 (Justice) | Live |
| data | Data layer | 户部 (Revenue) | TODO |
| docs | Documentation | 礼部 (Rites) | TODO |
| quality | Quality assurance | 吏部 (Personnel) | TODO |

Three departments are implemented: ui (工部), backend (兵部), and test (刑部). The remaining three (data, docs, quality) are placeholders in the domain-routing table.

**Single source of truth:** The live `ui/` directory at `rolebox/emperor/subagents/jinyiwei/subagents/ui/` serves as the canonical template. There is no separate template directory. Copy from `subagents/ui/`, adapt per this checklist.

## 2. Copy Checklist

Copy `subagents/ui/` to `subagents/{domain}/`, then change these five things:

### Step 1: role.yaml

Change:

- `name: UI` to your domain name (e.g., `name: Backend`)
- `description:` to match the new domain's scope
- `model:` if the domain needs different model characteristics (e.g., backend might want higher temperature for creative API design, test might keep 0.2 for precision)
- `prompt:` rewrite the domain responsibilities list
- `skills: [ui-scope]` to `skills: [{domain}-scope]`

The resulting subagent ID will be `emperor--jinyiwei--{domain}` (derived from `name` field, lowercased).

### Step 2: functions/execute.md

Change:

- `description:` in frontmatter to reflect the new domain
- `requires_evidence:` per the evidence table below
- Scope section: rewrite "In Scope" items for the new domain
- Scope section: rewrite "Do NOT touch" list (each domain excludes the others)

Keep unchanged:

- `continue_until: { all: [plan_todos_complete, evidence_met] }` (same for all departments)
- `observe:` block (todowrite sync is universal)
- Process sections (work step-by-step, verify, handle failures, finish clean)

### Step 3: functions/report.md

Typically unchanged. All departments report in the same structured format. Only modify if the domain has unique output artifacts (e.g., docs might include a "pages generated" field).

### Step 4: skills/{domain}-scope/SKILL.md

Create `skills/{domain}-scope/SKILL.md` with:

- Frontmatter: `name: {domain}-scope`, `description:` for the new domain boundary
- "In Scope" table listing what this department owns
- "Grey Zone" section for boundary cases
- "Stop & Escalate" table listing what triggers escalation to jinyiwei
- "Verification Discipline" section matching the evidence tags
- "Self-Check" questions adapted to the domain

### Step 5: domain-routing SKILL.md

Open `rolebox/emperor/subagents/jinyiwei/skills/domain-routing/SKILL.md` and uncomment the corresponding row in the routing table:

```
<!-- TODO: backend | emperor--jinyiwei--backend | Backend/API: ... -->
```

becomes:

```
| backend | emperor--jinyiwei--backend | Backend/API: server logic, routes, middleware, data processing | `[lsp_diagnostics, test]` |
```

## 3. Evidence Tags Per Domain

| Domain | Evidence Tags | Rationale |
|--------|--------------|-----------|
| ui | `[lsp_diagnostics, test]` | Components pass type-check + widget/component tests |
| backend | `[lsp_diagnostics, test]` | Server logic needs compilation + integration tests |
| test | `[test]` | Test files are self-verifying (they ARE the evidence) |
| data | `[lsp_diagnostics, test]` | Schema validity + query execution tests |
| docs | `[lsp_diagnostics]` | Markdown/type checks only; content is prose |
| quality | `[lsp_diagnostics]` | Linting/analysis tools produce diagnostics as output |

## 4. opencode_skills Recommendations

List these in `opencode_skills:` within each department's `role.yaml`. Always confirm a skill exists at `~/.config/opencode/skills/` before adding it.

| Domain | Recommended opencode_skills |
|--------|-----------------------------|
| ui | `react`, `tailwindcss`, `vercel-react-best-practices`, `frontend-ui-ux`, `zustand` |
| backend | `software-architecture-core`, `software-architecture-patterns`, `software-architecture-data`, `software-architecture-distributed`, `software-architecture-infrastructure` |
| test | `dart-add-unit-test`, `dart-generate-test-mocks`, `test-script-generation`, `dart-flutter-test-quality-gate` |
| data | `software-architecture-data`, `flutter-implement-persistence-offline`, `software-architecture-ddd` |
| docs | `humanizer`, `paper-writer` |
| quality | `software-architecture-antipatterns`, `dart-flutter-test-quality-gate`, `review-work`, `dart-run-static-analysis` |

Note: These are suggestions. Pick what fits the actual project stack. The `ui` department currently uses none (relying on its scope skill alone), so `opencode_skills:` is optional.

## 5. Cost Red Line Reminders

Lighting up departments has real cost implications:

- **Do NOT activate all six at once.** Each active department is a separate LLM session. Six parallel departments would blow through token budgets.
- **maxActivePerParent: 2** limits jinyiwei to 2 concurrent background department workers. Additional dispatches queue.
- **maxTotalSessionsPerRequest: 8** is the tree-level cap. Emperor + jinyiwei + 2 departments already consumes 4 of 8 slots.
- **Budget assessment first.** Before lighting a new department, estimate: how many subtasks will it handle per request? What model does it need? Sonnet for precision work, Haiku for mechanical tasks?
- **Recommended approach:** Light one domain at a time. Validate routing, evidence collection, and cost profile. Then proceed to the next.

## 6. Drift Prevention

**IMPORTANT**: This template references the LIVE `ui/` directory as its single source of truth. No standalone template directory exists. If you modify `ui/` structure (e.g., add a new function file or change file layout), update this checklist's "files that change per domain" list accordingly.

Specifically, if any of the following change in `ui/`:

- New function files added to `functions/`
- New skill directories added to `skills/`
- Changes to `role.yaml` field structure
- Changes to `execute.md` frontmatter schema

...then revisit steps 1-4 of this checklist and add/update the corresponding adaptation instructions.

## 7. TODO Departments

Three departments remain to be built:

1. **data** (户部) — Database schemas, migrations, queries, persistence layer
2. **docs** (礼部) — README files, API documentation, inline comments, guides
3. **quality** (吏部) — Linting, formatting, static analysis, code review automation

Each follows the 5-step checklist above. Light them as project needs demand, not preemptively.
