---
name: role-creator-conventions
description: On-demand guidance for choosing among the 3 role templates (simple / director-gated / nested-statemachine) and authoring native-looking role content. Load when generating a role to pick the right structure.
---

# Role Conventions Guide

Quick-reference for choosing the right template and following naming, sizing, and structural conventions. For full detail on any pattern, see the linked reference docs.

## Choosing a Template

Three templates cover the spectrum from trivial to complex. Pick the simplest one that fits.

### Simple

One agent, one purpose, no subagents. Everything lives inline or in attached skills.

**Pick when:**
- Single-domain agent (React dev, accessibility reviewer, CLI builder)
- No multi-step orchestration needed
- You want a working role in under 30 lines

**Skip when:** the workflow needs specialist review gates or reactive lifecycle hooks.

> Full detail: `references/conventions/simple.md`

### Director + Gated

A central director dispatches to specialist subagents through a DAG. Each subagent passes a gate skill before the pipeline advances. The director never does specialist work itself.

**Pick when:**
- 3-8 distinct specialist concerns need validation gates
- Linear or branching review pipeline (architecture, UX, code review)
- Traceable, auditable decisions per stage

**Skip when:** single-domain (use simple) or you need reactive lifecycle hooks and auto-activation (use nested).

> Full detail: `references/conventions/director-gated.md`

### Nested + State-Machine

Deep subagent nesting with reactive functions that observe lifecycle events, auto-activate on conditions, and transition between states. The orchestrator reacts rather than following a fixed sequence.

**Pick when:**
- Complex adaptive system with 2-3 nesting levels
- Agent must observe and react (lifecycle hooks on messages, tool completions)
- Imperial/governing pattern where one agent manages multiple teams
- Fine-grained tool restrictions on the orchestrator

**Skip when:** a linear gate pipeline suffices (director-gated) or the task is single-domain (simple). This pattern carries significant complexity overhead.

> Full detail: `references/conventions/nested-statemachine.md`

---

## Naming Conventions

| Thing | Rule | Example |
|-------|------|---------|
| Role directory (= role ID) | lowercase, hyphens, **no `--`** | `software-architecture` |
| Subagent directory (= slug) | lowercased name, spaces to `-` | `intake-strategist` |
| Subagent dispatch ID | `{role}--{slug}` | `software-architecture--intake-strategist` |
| Nested sub-subagent ID | `{role}--{sub}--{subsub}` | `emperor--chancellor--drafter` |
| Director-level skill | `{role}-{domain}` (single dash) | `software-architecture-core` |
| Simple skill | un-prefixed, role-scoped by discovery | `react-patterns` |
| Gate skill directory | `{role}--{subagent}~{gate-name}` | `software-architecture--intake-strategist~architecture-intake-gate` |
| Prompt file | `PROMPT.md` at role root | `roles/ai-designer/PROMPT.md` |

The double-dash (`--`) is reserved exclusively for separating role from subagent in dispatch IDs. Never use it inside a role name or skill name.

---

## Gate Skill Structure

Gate skills validate a subagent's output before the director advances the pipeline. Each one lives at `subagents/{name}/skills/{role}--{subagent}~{gate-name}/SKILL.md`.

Standard sections:

```markdown
---
name: {gate-name}
description: [One sentence explaining what this gate validates]
---

## Mission
[One-sentence purpose of this gate]

## Inputs
[What context/data this gate receives from upstream]

## Required Checks
[Numbered checklist of validation criteria]

## Pass Criteria
[What PASS looks like, concretely]

## Output
[Gate report format: what's produced on pass]
```

Keep gate skills at 80-120 lines. They should be prescriptive enough that the subagent knows exactly what "done" means.

---

## Size Expectations

### Simple
| Component | Lines |
|-----------|-------|
| role.yaml | 20-50 |
| Inline prompt | 15-40 |
| Each SKILL.md | 50-150 |

### Director + Gated
| Component | Lines |
|-----------|-------|
| role.yaml (director) | 50-110 |
| PROMPT.md (director) | 300-500 |
| Subagent role.yaml | 8-15 |
| Gate SKILL.md | 80-120 |
| Total subagents | 3-9 |

### Nested + State-Machine
| Component | Lines |
|-----------|-------|
| Orchestrator role.yaml | 35-50 |
| Each function file | 50-120 |
| First-level subagent role.yaml | 15-30 |
| Second-level subagent role.yaml | 8-20 |
| Functions per agent | 2-5 |

If your role.yaml exceeds these ranges, you're probably stuffing too much into one component. Split into skills or references.

---

## Subagent and Collaboration Declaration

### File-Based Subagents

Place each subagent at `subagents/{slug}/role.yaml`. Rolebox discovers them automatically and registers them as `{role}--{slug}` dispatch targets.

```
subagents/
├── intake-strategist/
│   └── role.yaml
└── pattern-selector/
    └── role.yaml
```

No explicit registration needed. Directory presence is sufficient.

### Inline Subagents

Define subagents directly in the parent's role.yaml under the `subagents:` key. Inline definitions win over file-based if both exist with the same name.

```yaml
subagents:
  - name: Quick Reviewer
    description: Fast-pass code review for trivial changes.
    prompt: |
      You do a quick sanity check on small diffs...
```

Use inline for lightweight helpers. Use file-based for anything that needs its own skills or functions.

### Collaboration Flow

The `collaboration.flow` field defines directed edges between agents:

```yaml
collaboration:
  flow:
    - "parent -> intake-strategist: frame request"
    - "intake-strategist -> system-modeler: architecture state"
    - from: adr-writer
      to: parent
      label: final artifact
      exit: true
  max_iterations: 3
```

Rules:
- `parent` refers to the director itself
- Each edge carries a label describing what context passes between agents
- `exit: true` terminates the workflow and returns control to the user
- `to: parent` routes back to the director (for cycles or exit)
- `max_iterations` (default 3) caps retry loops to prevent infinite cycling

### Dispatch Configuration (Nested Pattern)

Control parallelism for the state-machine pattern:

```yaml
dispatch:
  maxActivePerParent: 2
  maxConcurrent: 5
```

This prevents resource exhaustion when many subagents can activate simultaneously.
