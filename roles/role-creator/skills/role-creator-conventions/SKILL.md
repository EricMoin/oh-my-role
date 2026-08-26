---
name: role-creator-conventions
description: On-demand guidance for choosing among the 4 role templates (simple / director-gated / graph-orchestrated / nested-statemachine) and authoring native-looking role content. Load when generating a role to pick the right structure.
---

# Role Conventions Guide

Quick-reference for choosing the right template and following naming, sizing, and structural conventions. For full detail on any pattern, see the linked reference docs.

## Choosing a Template

Four templates cover the spectrum from trivial to complex. Pick the simplest one that fits.

| Template | Best for | Complexity |
|----------|----------|------------|
| Simple | Single-domain agent, no orchestration | Minimal |
| Director + Gated | Fixed pipeline of 3-8 specialist stages with validation gates | Medium |
| Graph-Orchestrated | Runtime-authored multi-specialist pipeline with graph-native scheduling, review loops, approval gates | Medium |
| Nested + State-Machine | Reactive, stateful orchestration with deep nesting | High |

### Simple

One agent, one purpose, no subagents. Everything lives inline or in attached skills.

**Pick when:**
- Single-domain agent (React dev, accessibility reviewer, CLI builder)
- No multi-step orchestration needed
- You want a working role in under 30 lines

**Skip when:** the workflow needs specialist review gates, graph-native coordination, or reactive lifecycle hooks.

> Full detail: `references/conventions/simple.md`

### Director + Gated

A central director dispatches to specialist subagents through a DAG. Each subagent passes a gate skill before the pipeline advances. The director never does specialist work itself.

**Pick when:**
- 3-8 distinct specialist concerns need validation gates
- Linear or branching review pipeline (architecture, UX, code review)
- Traceable, auditable decisions per stage

**Skip when:** single-domain (use simple), reactive lifecycle hooks and auto-activation (use nested), or a runtime-shaped pipeline with bounded revise loops and approval gates (use graph-orchestrated).

> Full detail: `references/conventions/director-gated.md`

### Graph-Orchestrated

A thin orchestrator authors **ONE graph per request** on the rolebox Graph Engine v2 — `graph_create` → `graph_add_node` / `graph_add_edge` / `graph_add_loop` → `graph_run` — yields its turn, and collects results when the engine wakes it. The orchestrator never does specialist work; it routes, approves, and assembles.

**Pick when:**
- Multi-specialist pipeline needing graph-native scheduling (per-node retry/validation, engine-managed concurrency)
- Bounded review loops (drafter ↔ reviewer, design ↔ review) via `graph_add_loop` + `max_traversals`
- Human-in-the-loop approval gates — `needs_approval: true` nodes resolved via `graph_approve`
- Signal-driven flow: `answer` forward edges, `revise_needed` back-edges

**Model roles:** emperor, ai-designer.

**Skip when:** single-domain (use simple), a fixed declarative pipeline suffices (director-gated), or you need reactive lifecycle hooks and auto-activation (use nested-statemachine).

> Full detail: `references/conventions/graph-orchestrated.md`

### Nested + State-Machine

Deep subagent nesting with reactive functions that observe lifecycle events, auto-activate on conditions, and transition between states. The orchestrator reacts rather than following a fixed sequence.

**Pick when:**
- Complex adaptive system with 2-3 nesting levels
- Agent must observe and react (lifecycle hooks on messages, tool completions)
- Imperial/governing pattern where one agent manages multiple teams
- Fine-grained tool restrictions on the orchestrator

**Skip when:** a linear gate pipeline suffices (director-gated), a thin graph-native orchestrator suffices (graph-orchestrated), or the task is single-domain (simple). This pattern carries significant complexity overhead.

> Full detail: `references/conventions/nested-statemachine.md`

---

## Graph Engine v2 Vocabulary

Graph-orchestrated and director-gated roles run coordination on the rolebox Graph Engine v2. Everything below is live; the legacy dispatch / loop / function-state machinery is not.

| Tool | Purpose |
|------|---------|
| `graph_create` | Start ONE graph per request; returns `graph_id` |
| `graph_add_node` | One node per specialist stage — `agent: "{role}--{slug}"`, prompt embeds all cross-session input; per-node `timeout_ms` / `max_retries` ride here |
| `graph_add_edge` | Wire flow — `type: "on_signal"` with `signal_filter` (forward: `["answer"]`; revise back-edge: `["revise_needed"]`) |
| `graph_add_loop` | Bound a revise/review cycle — `max_traversals` is required and engine-enforced |
| `graph_run` | Non-blocking dispatch — END YOUR TURN after calling; the engine emits `[GRAPH COMPLETE]` / `[GRAPH BLOCKED]` |
| `graph_status` | Read materialized node outputs ONCE (`include_output=true`); polling is fallback-only |
| `graph_approve` | Resolve `needs_approval` gates — `action="approve"` resumes the forward flow; `action="reject"` re-enters or escalates |
| `graph_cancel` | Cancel stale or orphaned nodes — never leave them running |

**Signal types:** `answer` (pass / advance), `revise_needed` (re-enter the source stage with revision items), `need_approval` (pause for a human decision), `escalate` (retry-then-report), plus control-plane `blocked` / `handoff` / `progress`.

**needs_approval gates:** nodes declared `needs_approval: true` pause in `blocked` state (`[GRAPH BLOCKED]`) until a human resolves them via `graph_approve` — the flagged operation is never executed on rejection.

**Loop groups:** the node set wrapped by `graph_add_loop`, hard-capped by the required `max_traversals` — no unbounded cycles, no round-count prose.

**on_signal edges:** `graph_add_edge` with `type: "on_signal"` routes on a node's terminating signal — `signal_observed(answer)` advances the pipeline; `signal_observed(revise_needed)` re-enters the source stage.

**Engine-managed concurrency:** the engine schedules ready nodes and enforces per-node budgets and loop bounds — resource ceilings are owned by the engine, not by declarative config.

Gate skills still apply: a gate SKILL.md defines what "pass" looks like, and the graph's `on_signal` edges define what happens on each verdict.

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

In graph-orchestrated and director-gated roles, the gate verdict routes through the graph: a passing node terminates via `signal(answer)` (firing the forward `on_signal` edge), and a failing review terminates via `signal(revise_needed)` (re-entering the source stage through the back-edge). The gate skill stays the source of what "pass" means; the edges carry the consequence.

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

### Graph-Orchestrated
| Component | Lines |
|-----------|-------|
| role.yaml (orchestrator) | 40-80 |
| PROMPT.md (orchestrator) | 150-350 |
| Subagent role.yaml | 8-15 |
| Subagent PROMPT.md / SKILL.md | 50-150 |
| Reference templates | 50-150 |
| Total subagents | 2-8 |

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

The `collaboration.flow` field declares directed edges between agents. **Legacy note:** this declarative block is a schema-compat mirror only — it is NOT the execution path. Live coordination runs on the graph engine (`graph_add_node` / `graph_add_edge` with `on_signal` edges / `graph_add_loop` / `graph_run`), authored per request.

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
- `max_iterations` is schema-compat only — it does NOT bound runtime cycles; live loops are bounded by `graph_add_loop`'s required, engine-enforced `max_traversals`

### Concurrency (Engine-Managed)

Concurrency and resource ceilings are owned and enforced by the graph engine — there is no concurrency config to tune. Per-node limits ride on `graph_add_node` (`timeout_ms`, `max_retries`), and review cycles are bounded by `graph_add_loop`'s required `max_traversals`. The engine schedules ready nodes and enforces budgets; the orchestrator authors the graph, yields its turn, and collects outputs on the `[GRAPH COMPLETE]` reminder.
