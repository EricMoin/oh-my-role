# Director + Gated-Subagents Pattern

A central director orchestrates specialist subagents through a gate-based workflow. Each subagent performs focused work and must pass its gate before the pipeline advances. The director never does specialist work itself; it dispatches, evaluates gate results, and controls flow.

## When to Use

- Multi-step workflows where each step needs specialist validation
- Architecture design, UX design, code review pipelines
- Work that must pass quality gates before progressing
- You need traceable decisions with clear accountability per stage
- The domain has 3-8 distinct specialist concerns

**Don't use when:** the task is single-domain (use simple pattern), or you need reactive lifecycle hooks and stateful auto-activation (use nested-statemachine pattern).

## Directory Layout

```
roles/{role-name}/
├── role.yaml                    # Director definition with collaboration graph
├── PROMPT.md                    # Director orchestration prompt
├── references/                  # Shared knowledge for the director
│   ├── templates/
│   │   └── {template-name}.md
│   └── {topic}.md
├── skills/                      # Director-level skills (foundational)
│   └── {role}-{domain}/
│       └── SKILL.md
└── subagents/                   # Specialist subagents
    ├── {subagent-slug}/
    │   ├── role.yaml            # Minimal subagent definition
    │   ├── skills/
    │   │   └── {role}--{subagent-slug}~{skill-name}/
    │   │       └── SKILL.md
    │   └── functions/           # Optional subagent-specific functions
    │       └── {fn}.md
    └── {another-subagent}/
        ├── role.yaml
        └── skills/
            └── {skill}/
                └── SKILL.md
```

## role.yaml Shape

Typically 50-110 lines. The distinguishing feature is the `collaboration:` block with directed flow edges.

### Required Fields

| Field | Purpose |
|-------|---------|
| `name` | Human-readable role name |
| `description` | One-line summary |
| `prompt_file` | Points to PROMPT.md (too long for inline) |
| `collaboration` | Directed flow graph of subagent interactions |

### Common Fields

| Field | Purpose |
|-------|---------|
| `version` | SemVer string |
| `mode` | `primary` |
| `skills` | Director-level foundational skills |
| `functions` | Typically `[plan, execute]` |
| `references` | Shared templates and state docs |
| `permission` | Tool access restrictions |
| `collaboration.flow` | List of directed edges |
| `collaboration.max_iterations` | Loop cap (typically 3) |

### Example role.yaml

```yaml
name: Software Architecture
description: Software architecture orchestrator coordinating specialist reviewers through quality gates.
version: "2.1.1"
mode: primary
references:
  templates/architecture-state:
    path: references/templates/architecture-state.md
    description: Shared Architecture State template passed between subagents
  templates/adr:
    path: references/templates/adr.md
    description: Architecture Decision Record template
prompt_file: PROMPT.md
skills:
  - software-architecture-core
functions:
  - plan
  - execute
permission:
  allow:
    - Read
    - Dispatch
    - Grep
    - Glob
collaboration:
  flow:
    - "parent -> intake-strategist: frame request"
    - "intake-strategist -> system-modeler: architecture state"
    - "system-modeler -> pattern-selector: model complete"
    - "pattern-selector -> trade-off-analyst: patterns chosen"
    - "trade-off-analyst -> adr-writer: trade-offs evaluated"
    - from: adr-writer
      to: parent
      label: final artifact
      exit: true
  max_iterations: 3
```

## Director Prompt (PROMPT.md)

The director prompt lives in a separate file because it's typically 300-500 lines. Its structure:

1. **Identity statement.** "You are the X director. You coordinate specialists. You never act as a lone Y."
2. **Subagent roster.** Lists each subagent with its purpose and gate criteria.
3. **Dispatch rules.** When to invoke which subagent, how to route on gate failure.
4. **State management.** How to pass context between subagents (shared state documents).
5. **Exit conditions.** When the overall workflow is complete.

The director doesn't contain domain expertise. It knows *who* to ask and *when*.

## Subagent role.yaml

Subagent definitions are minimal (8-15 lines). They reference a gate skill and defer to it for their logic.

```yaml
name: Intake Strategist
description: Frames the architecture request, identifies constraints, and produces initial Architecture State.
mode: subagent
prompt: |
  You frame architecture requests. Identify stakeholders,
  constraints, quality attributes, and scope boundaries.
  Produce an Architecture State document for downstream agents.
skills:
  - software-architecture--intake-strategist~architecture-intake-gate
```

## Gate Skill Structure

Gate skills are the core mechanism. Each one validates a subagent's output before the pipeline advances.

```
skills/{role}--{subagent}~{gate-name}/
└── SKILL.md
```

### SKILL.md Format

```markdown
---
name: architecture-intake-gate
description: Validates that the architecture request is properly framed with constraints and scope.
---

## Mission
Frame the incoming architecture request into a structured Architecture State.

## Inputs
- User's architecture question or requirement
- Any existing system context

## Required Checks
1. Stakeholders identified
2. Quality attributes ranked
3. Constraints documented (budget, timeline, team size)
4. Scope boundaries clear (what's in, what's out)

## Pass Criteria
- All four required checks satisfied
- No ambiguous requirements left unresolved
- Architecture State template filled

## Output
Populated Architecture State document ready for system-modeler.
```

Gate skills run 80-120 lines.

## Collaboration Graph

The `collaboration.flow` field defines a directed acyclic graph (DAG) of subagent interactions.

### Edge Formats

Simple string format:
```yaml
flow:
  - "parent -> intake-strategist: frame request"
  - "intake-strategist -> system-modeler: state ready"
```

Structured format (for exit edges or complex routing):
```yaml
flow:
  - from: adr-writer
    to: parent
    label: final artifact
    exit: true
```

### Flow Rules

- `parent` refers to the director itself
- Each edge carries a label describing what's passed
- `exit: true` terminates the workflow
- On gate failure, the director can reroute (back to previous subagent, or to a different one)
- `max_iterations` caps loops to prevent infinite cycling

## Naming Conventions

| Thing | Convention | Example |
|-------|-----------|---------|
| Role directory | lowercase, hyphens | `software-architecture` |
| Subagent directory | lowercase, hyphens (slug) | `intake-strategist` |
| Subagent ID | `{role}--{subagent-slug}` | `software-architecture--intake-strategist` |
| Director skill | `{role}-{domain}` | `software-architecture-core` |
| Gate skill dir | `{role}--{subagent}~{skill-name}` | `software-architecture--intake-strategist~architecture-intake-gate` |
| PROMPT file | Always `PROMPT.md` at role root | `roles/software-architecture/PROMPT.md` |

## Typical Size Ranges

| Component | Lines |
|-----------|-------|
| role.yaml (director) | 50-110 |
| PROMPT.md (director) | 300-500 |
| Subagent role.yaml | 8-15 |
| Gate SKILL.md | 80-120 |
| Director skill | 100-200 |
| Reference templates | 50-150 |
| Total subagents | 3-9 |

## Key Characteristics

1. **Director never does specialist work.** It dispatches and evaluates.
2. **Gates enforce quality.** Each subagent must pass before flow advances.
3. **DAG structure.** Flow is directed and acyclic (with bounded retry loops).
4. **Shared state.** Subagents communicate through state documents, not direct messages.
5. **Bounded iterations.** `max_iterations` prevents infinite loops on repeated gate failures.
6. **Traceable decisions.** Each gate produces auditable output explaining pass/fail.
