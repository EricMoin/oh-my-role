# Director + Gated-Subagents Pattern

A central director orchestrates specialist subagents through a gate-based workflow. Each subagent performs focused work and must pass its gate before the pipeline advances. The director never does specialist work itself; it authors ONE graph per request, evaluates gate results, and controls flow through signal-driven edges.

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
├── role.yaml                    # Director definition with graph orchestration
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

Typically 50-110 lines. The distinguishing feature is the `graph:` block declaring `orchestration: graph_v2`; flow is authored imperatively at runtime with the `graph_*` tools, one graph per request.

### Required Fields

| Field | Purpose |
|-------|---------|
| `name` | Human-readable role name |
| `description` | One-line summary |
| `prompt_file` | Points to PROMPT.md (too long for inline) |
| `graph` | Declares `orchestration: graph_v2` (flow is authored at runtime) |

### Common Fields

| Field | Purpose |
|-------|---------|
| `version` | SemVer string |
| `mode` | `primary` |
| `skills` | Director-level foundational skills |
| `functions` | Typically `[plan, execute]` |
| `references` | Shared templates and state docs |
| `permission` | Tool access restrictions (graph tools are implicit; no `Dispatch` grant) |
| `collaboration` | Legacy declarative mirror — schema-compat only, NOT the execution path |

> **Legacy note:** the declarative `collaboration:` block (flow edges,
> `max_iterations`) is kept for schema compatibility only. It feeds the legacy
> collaboration bridge and does NOT bound runtime flow. Live orchestration runs on
> the graph engine: `graph_create` → `graph_add_node` → `graph_add_edge` /
> `graph_add_loop` → `graph_run`. `collaboration.max_iterations` is NOT a live loop
> bound — the engine enforces `graph_add_loop`'s required `max_traversals`.

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
    - Grep
    - Glob
graph:
  orchestration: graph_v2
  # Flow is authored per request: graph_create -> graph_add_node per gate ->
  # graph_add_edge (on_signal) / graph_add_loop -> graph_run -> graph_status.
# Legacy declarative mirror — schema-compat only, not the execution path.
collaboration:
  max_iterations: 3
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
```

## Director Prompt (PROMPT.md)

The director prompt lives in a separate file because it's typically 300-500 lines. Its structure:

1. **Identity statement.** "You are the X director. You coordinate specialists. You never act as a lone Y."
2. **Subagent roster.** Lists each subagent with its purpose and gate criteria.
3. **Graph authoring.** When to add which gate node, how to wire the `on_signal` edges, how to route on gate failure.
4. **State management.** How to pass context between subagents (shared state documents embedded in node prompts).
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

Gate skills are the core mechanism. Each one validates a subagent's output before the pipeline advances. The gate SKILL.md defines what "pass" means for the node's output; the graph edges define what happens on that verdict.

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

## Graph Engine Orchestration

The runtime graph is the live execution path (the declarative `collaboration:` block is a schema-compat mirror only). The director authors **ONE graph per request**:

1. **Create** — `graph_create(name="<request>")`.
2. **Add one node per gate/specialist** — `graph_add_node({ graph_id, id: "<gate-slug>", agent: "<role>--<subagent-slug>", prompt: "..." })`. The node prompt embeds the current state and gate objective; the gate SKILL.md supplies the gate logic. Destructive or high-risk gates are declared `needs_approval: true` so the engine pauses them in `blocked` state (`[GRAPH BLOCKED]`) until a human resolves via `graph_approve`.
3. **Wire forward flow** — `graph_add_edge({ graph_id, from, to, type: "on_signal", signal_filter: ["answer"] })` for each pass edge. A gate that passes emits `signal(answer)`, which fires the forward edge.
4. **Wire the revise back-edge** — `graph_add_edge({ graph_id, from: "<review-gate>", to: "<source-gate>", type: "on_signal", signal_filter: ["revise_needed"] })`. A gate that emits `revise_needed` re-enters its source stage with the structured revision items merged into the re-execution prompt.
5. **Bound the review cycle** — `graph_add_loop({ graph_id, id: "<review-cycle>", nodes: [...], max_traversals: <small task-appropriate bound> })`. `max_traversals` is required and engine-enforced — pick the smallest bound that gives the cycle a fair chance to converge.
6. **Run and yield** — `graph_run(graph_id)`. NON-blocking: it dispatches ready nodes and returns. **END YOUR TURN** and await the `[GRAPH COMPLETE]` (or `[GRAPH BLOCKED]`) system-reminder.
7. **Collect outputs ONCE** — on the reminder, `graph_status(graph_id, include_output=true)`. Polling `graph_status` is fallback-only.

### Edge Conditions

Gates remain **gate SKILL.md + `on_signal` edge conditions**:

- The SKILL.md defines what a passing (or failing) gate output looks like.
- The edges define what happens on each verdict: `signal_observed(answer)` advances the pipeline; `signal_observed(revise_needed)` re-enters the source stage with the reviewer's revision items.
- Gate failure is not free-form rerouting prose — the reviewer's structured revision items flow through the back-edge into the source stage's re-execution prompt automatically.

### Example Graph

```js
graph_id = graph_create(name="architecture-request").graph_id

// One node per gate/specialist, agent = <role>--<subagent-slug>
graph_add_node({ graph_id, id: "intake", agent: "software-architecture--intake-strategist",
                 prompt: "Run the intake gate. Current state: {state}" })
graph_add_node({ graph_id, id: "model", agent: "software-architecture--system-modeler",
                 prompt: "Run the modeling gate. Current state: {state}" })
graph_add_node({ graph_id, id: "review", agent: "software-architecture--trade-off-analyst",
                 prompt: "Run the review gate. Current state: {state}",
                 needs_approval: true })  // destructive gate: pause for human approval

// Forward flow: pass (answer) advances
graph_add_edge({ graph_id, from: "intake", to: "model", type: "on_signal", signal_filter: ["answer"] })
graph_add_edge({ graph_id, from: "model", to: "review", type: "on_signal", signal_filter: ["answer"] })

// Revise back-edge: review emits revise_needed -> model re-enters
graph_add_edge({ graph_id, from: "review", to: "model", type: "on_signal", signal_filter: ["revise_needed"] })

// Bound the model<->review cycle; max_traversals is required and engine-enforced
graph_add_loop({ graph_id, id: "review-cycle", nodes: ["model", "review"], max_traversals: 3 })

graph_run(graph_id)
// END YOUR TURN — await [GRAPH COMPLETE], then graph_status(graph_id, include_output=true)
```

### Flow Rules

- `agent` is always `<role>--<subagent-slug>` (e.g. `software-architecture--intake-strategist`)
- Each edge carries the `signal_filter` that defines which verdict activates it
- `signal_observed(answer)` advances; `signal_observed(revise_needed)` re-enters the source gate
- `needs_approval: true` pauses destructive gates; a human resolves via `graph_approve` — the destructive operation is never executed on rejection
- `max_traversals` caps the review loop to prevent infinite cycling
- When the bound is reached with an unresolved gate failure, proceed best-effort with the limitation surfaced honestly (e.g. deliver with noted limitations)

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

1. **Director never does specialist work.** It authors graph nodes and evaluates gate results.
2. **Gates enforce quality.** Each subagent must pass before flow advances.
3. **DAG structure.** Flow is directed and acyclic (with a bounded review loop).
4. **Shared state.** Subagents communicate through state documents, not direct messages.
5. **Bounded review cycles.** `graph_add_loop`'s engine-enforced `max_traversals` prevents infinite loops on repeated gate failures.
6. **Traceable decisions.** Each gate produces auditable output explaining pass/fail.
