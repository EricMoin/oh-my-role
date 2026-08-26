# Graph-Orchestrated Pattern

A thin orchestrator role whose coordination runs entirely on the rolebox Graph Engine v2. The role authors **ONE graph per request** at runtime — `graph_create` → `graph_add_node` / `graph_add_edge` / `graph_add_loop` → `graph_run` — yields its turn, and collects results when the engine wakes it. It never writes code itself; it orchestrates specialists, approves their high-risk operations, and assembles their outputs.

The live contract for the graph engine is `roles/role-creator/references/graph-engine-v2.md`. Model roles: emperor 2.9.0 (`roles/emperor/role.yaml` + `PROMPT.md`) and ai-designer 3.1.0 (`roles/ai-designer/role.yaml` + `PROMPT.md`). graph-engine-v2.md §9 lists the legacy vocabulary that MUST NOT appear as a live contract in role assets.

## When to Use

- Multi-stage workflows with specialist stages and review gates
- Pipelines that need bounded revise/review cycles (drafter ↔ reviewer, design ↔ review)
- Signal-driven control flow: forward `answer` edges, `revise_needed` back-edges, `needs_approval` gates
- You want the graph topology declared imperatively at runtime, per request
- The orchestrator must never do specialist work — it routes, approves, and assembles

**Don't use when:** the task is single-domain with no coordination (use simple), you want a fixed pipeline DAG declared statically in `collaboration.flow` without runtime graph authoring (use director-gated), or you need reactive lifecycle hooks and stateful auto-activation (use nested-statemachine).

## Directory Layout

```
roles/{role-name}/
├── role.yaml                    # Thin orchestrator definition (40-80 lines)
├── PROMPT.md                    # Orchestrator prompt with the graph-authoring recipe
├── references/                  # Shared state templates and contracts
│   └── {topic}.md
├── skills/                      # Orchestrator-level skills (delegation, recovery)
│   └── {role}-{domain}/
│       └── SKILL.md
└── subagents/                   # Specialist dispatch targets ({role}--{slug})
    ├── {subagent-slug}/
    │   ├── role.yaml            # Minimal subagent definition (8-15 lines)
    │   └── skills/
    │       └── {role}--{subagent-slug}~{skill-name}/
    │           └── SKILL.md
    └── {another-subagent}/
        └── role.yaml
```

No `functions/` directory is required (defaults apply). If present, it holds a small set of orchestrator-level functions (e.g. emperor's `triage` / `synthesize`); the coordination logic itself lives in PROMPT.md and runs on the graph engine — never as state-machine functions. The graph engine replaces the legacy `dispatch_*` / `loop_*` / `function_state` machinery entirely (see graph-engine-v2.md §9).

## role.yaml Shape

Typically 40-80 lines. The distinguishing feature is the `graph:` block that declares graph-native orchestration.

### Required Fields

| Field | Purpose |
|-------|---------|
| `name` | Human-readable role name |
| `description` | One-line summary for discovery and dispatch |
| `prompt_file` | Points to PROMPT.md |
| `graph` | `orchestration: graph_v2` — declares graph-native orchestration |

### Common Fields

| Field | Purpose |
|-------|---------|
| `version` | SemVer string |
| `mode` | `primary` |
| `functions` | Optional — defaults apply; the graph-authoring recipe lives in PROMPT.md |
| `skills` | Orchestrator-level skills (delegation heuristics, failure recovery) |
| `references` | Shared state templates and contracts passed to nodes |
| `tools` | Tool restrictions — orchestrators deny `Write`/`Edit`/`Bash` |
| `collaboration` | Legacy schema-compat block (see below) |

### The `graph` block

`graph.orchestration: graph_v2` declares the role is graph-orchestrated. There is no static graph the engine reads — the role authors the graph imperatively at runtime with the `graph_*` tools (see the PROMPT.md authoring recipe below).

### The `collaboration` block (schema-compat only)

The declarative `collaboration:` block (flow edges, `max_iterations`) is a legacy v1 declaration retained ONLY for schema compatibility. It feeds only the legacy `rolebox/src/graph/collaboration-bridge.ts` bridge and is NOT the execution mechanism. In particular, `collaboration.max_iterations` is NOT a live bound on imperative `graph_add_loop` cycles — the engine enforces loop bounds via the loop group's required `max_traversals` (graph-engine-v2.md §9).

### Example role.yaml

```yaml
name: Design Director
description: "Thin graph-native orchestrator. Routes requests through specialist gates, approves high-risk operations, assembles the final deliverable. Never writes code."
version: "3.1.0"
mode: primary
prompt_file: PROMPT.md
# Functions: optional — defaults apply. The graph-authoring recipe lives in
# PROMPT.md; coordination runs on the graph engine, not in state-machine functions.
functions:
  - orchestrate
references:
  templates/design-state:
    path: references/templates/design-state.md
    description: Shared Design State structure passed between graph nodes
skills:
  - design-director-core
# Legacy v1 declarative config: kept ONLY for schema compatibility. It does NOT
# bound imperative graph_add_loop cycles — the engine enforces loop bounds via
# the loop group's required max_traversals (see PROMPT.md).
collaboration:
  flow:
    - "parent -> intake: classify tier"
    - "intake -> design: framed state"
    - "design -> review: design pass"
  max_iterations: 2
# Graph orchestration configuration. The gate pipeline runs on the graph engine
# (graph_create / graph_add_node / graph_add_edge / graph_add_loop / graph_run /
# graph_status / graph_cancel / graph_approve). signal stays available.
graph:
  orchestration: graph_v2
# The orchestrator never writes code or edits files — implementation is
# delegated to specialist nodes, so Write/Edit/Bash are denied.
tools:
  Write: false
  Edit: false
  Bash: false
permission: allow
```

## Orchestrator Prompt (PROMPT.md)

The PROMPT.md is the heart of the pattern. It typically runs 150-350 lines and holds the graph-authoring recipe. Structure:

1. **Identity statement.** "You are the orchestrator. You author ONE graph per request; you never do the specialist work."
2. **Subagent roster.** Each dispatch target (`{role}--{slug}`) with its purpose and gate criteria.
3. **Graph-authoring recipe.** Step-by-step imperative graph construction (below).
4. **Approval handling.** How `needs_approval` gates are presented and resolved via `graph_approve`.
5. **Result collection and cleanup.** Read outputs ONCE via `graph_status(include_output=true)`; cancel stale nodes with `graph_cancel`.

The orchestrator contains no domain expertise. It knows *who* to ask, *when*, and *how to wire the graph*.

## Graph-Authoring Recipe

Author ONE graph per request. The steps below are the canonical recipe (mirrored in graph-engine-v2.md §7):

1. **Create the graph.** `graph_create(name="<request>")` → returns `graph_id`. Every subsequent call targets this id.
2. **Add one node per specialist stage.** `graph_add_node({graph_id, id, agent: "<role>--<slug>", prompt: "..."})`. ALL cross-session input is embedded in the node prompt — a node cannot read another node's session artifacts. Declare `needs_approval: true` on destructive or high-risk nodes.
3. **Wire the edges.** `graph_add_edge` with `type: "on_signal"`: forward edges carry `signal_filter: ["answer"]`; the revise back-edge carries `signal_filter: ["revise_needed"]`.
4. **Bound the revise/review cycle.** `graph_add_loop({graph_id, id, nodes, max_traversals})`. `max_traversals` is REQUIRED and engine-enforced — no unbounded cycles, no round-count prose.
5. **Run and yield.** `graph_run(graph_id)` is NON-BLOCKING: it launches the ready nodes and returns immediately. After `graph_run`, END YOUR TURN (the yield-and-wake protocol). The engine emits a `[GRAPH COMPLETE]` system-reminder when the whole graph finishes, or `[GRAPH BLOCKED]` when a `needs_approval` node pauses.
6. **Collect outputs ONCE.** On the reminder, read each node's output via `graph_status(graph_id, include_output=true)`. Polling `graph_status` is fallback-only.
7. **Resolve approval gates.** `graph_approve(graph_id, node_id, action="approve"|"reject", reason=…)` for blocked `needs_approval` nodes — no re-run needed on approval; the engine resumes the forward `answer` flow from the resolved gate.
8. **Clean up.** `graph_cancel(graph_id, node_id?)` for stale or abandoned nodes — never leave orphaned graph nodes running after the final result.

```js
// Canonical authoring: create → nodes → edges → loop → run
graph_id = graph_create(name="design-request").graph_id

graph_add_node({ graph_id, id: "intake", agent: "design-director--intake",
                 prompt: "Run the Intake gate. Current Design State: {state}" })
graph_add_node({ graph_id, id: "design", agent: "design-director--design",
                 prompt: "Run the Design gate. Current Design State: {state}" })
graph_add_node({ graph_id, id: "review", agent: "design-director--review",
                 prompt: "Run the Review gate. Current Design State: {state}" })

// Forward flow: intake → design → review
graph_add_edge({ graph_id, from: "intake", to: "design", type: "on_signal", signal_filter: ["answer"] })
graph_add_edge({ graph_id, from: "design", to: "review", type: "on_signal", signal_filter: ["answer"] })

// Review revise back-edge: review emits revise_needed → design re-enters
graph_add_edge({ graph_id, from: "review", to: "design", type: "on_signal", signal_filter: ["revise_needed"] })

// Bound the Design↔Review cycle. max_traversals is required and engine-enforced.
graph_add_loop({ graph_id, id: "design-review", nodes: ["design", "review"], max_traversals: 2 })

graph_run(graph_id)
// END YOUR TURN — await [GRAPH COMPLETE] / [GRAPH BLOCKED]
```

## PROMPT.md Excerpt (Graph-Authoring Style)

Model the PROMPT.md pipeline section on ai-designer 3.1.0's Graph-Driven Gate Pipeline:

```markdown
## Graph-Driven Pipeline

Author **ONE graph per design request** and run the pipeline through the rolebox
graph engine. Do NOT use the legacy dispatch tools — the pipeline is a graph, not
a sequence of background dispatches.

Available specialist node agents:

- `design-director--intake`
- `design-director--design`
- `design-director--review`

### 1. Author the graph

Call `graph_create(name="<design request>")`, then add one `graph_add_node` per
stage, wire the flow with `graph_add_edge`, add the Review `revise_needed`
back-edge, and bound the review cycle with `graph_add_loop`. Each node's prompt
carries the full current Design State and the specific stage objective. The
Review revise back-edge is an `on_signal` edge filtered on `revise_needed`: when
Review emits `revise_needed`, the engine re-enters the Design stage for another
pass. Wrap the `design` and `review` nodes in `graph_add_loop(..., nodes:
["design", "review"], max_traversals: 2)` — the parameter is required and
engine-enforced.

### 2. Run and yield

`graph_run(graph_id)`. `graph_run` is NON-blocking: it dispatches the ready nodes
and returns. After `graph_run`, END YOUR TURN. The engine emits a `[GRAPH
COMPLETE]` system-reminder when the whole graph finishes, or `[GRAPH BLOCKED]`
when a `needs_approval` node pauses it.

### 3. Collect outputs

On the `[GRAPH COMPLETE]` reminder, read each node's output ONCE via
`graph_status(graph_id, include_output=true)`. Polling `graph_status` is
fallback-only — the reminder is the primary completion trigger.

### 4. Resolve approval gates

If `[GRAPH BLOCKED]` arrives, a `needs_approval` node is awaiting a decision.
Read the paused state and the `approval_payload` from
`graph_status(graph_id, node_id=..., include_output=true)`, present the flagged
operation to the user, then resolve with `graph_approve(graph_id, node_id,
action="approve")` on approval or `graph_approve(graph_id, node_id,
action="reject", reason=...)` on rejection.

### 5. Clean up and assemble

Cancel stale or abandoned nodes with `graph_cancel(graph_id, node_id?)` — never
leave orphaned graph nodes running after the final result. Then integrate the
node outputs, resolve conflicts, and assemble the final deliverable.
```

## Subagent Roster Convention

Subagents are declared as `{role}--{slug}` dispatch targets referenced by the `agent:` field in `graph_add_node`. Each subagent role.yaml is minimal (8-15 lines): name, description, `mode: subagent`, an inline `prompt:` (or `prompt_file`), and optional skills/references.

```yaml
name: Review Gate
description: "Runs the Review gate for the Design Director pipeline. Emits pass via signal(answer) or revise_needed via signal(revise_needed)."
mode: subagent
prompt: |
  You run the Review gate. Inspect the Design State for
  accessibility, clarity, and completeness. If it passes,
  terminate via signal(type="answer"). If it needs revision,
  emit signal(type="revise_needed", payload={items: [...]}).
skills:
  - design-director--review~review-gate
```

**Signal-emitting subagents** are useful as leaf nodes: a subagent whose only job is to emit a specific terminating signal (`answer`, `revise_needed`, `need_approval`, `escalate`) so `on_signal` edges can route on it. Their prompt contract: read the input, then terminate via exactly one `signal` call of the assigned type and payload — no prose outside the signal, no further delegation (graph-engine-v2.md §8.4).

## Naming Conventions

| Thing | Convention | Example |
|-------|-----------|---------|
| Role directory | lowercase, hyphens | `design-director` |
| Subagent directory | lowercase, hyphens (slug) | `subagents/review/` |
| Subagent ID (dispatch target) | `{role}--{slug}` | `design-director--review` |
| Node `id` in graph | short stage name | `intake`, `design`, `review` |
| Subagent skill dir | `{role}--{slug}~{skill-name}` | `design-director--review~review-gate` |
| PROMPT file | Always `PROMPT.md` at role root | `roles/design-director/PROMPT.md` |

## Typical Size Ranges

| Component | Lines |
|-----------|-------|
| role.yaml (orchestrator) | 40-80 |
| PROMPT.md (orchestrator) | 150-350 |
| Subagent role.yaml | 8-15 |
| Subagent PROMPT.md / SKILL.md | 50-150 |
| Reference templates | 50-150 |
| Total subagents | 2-8 |

## Key Characteristics

1. **Thin orchestrator.** Never writes code, never does specialist work. It authors graphs, approves, and assembles.
2. **One graph per request.** The whole workflow is authored at runtime: `graph_create` → `graph_add_node` / `graph_add_edge` / `graph_add_loop` → `graph_run`.
3. **Imperative, not declared.** No static graph the engine reads — the topology is built per request with the `graph_*` tools.
4. **Yield-and-wake rhythm.** `graph_run` is non-blocking; the orchestrator ends its turn and is re-awakened by `[GRAPH COMPLETE]` / `[GRAPH BLOCKED]`.
5. **Engine-enforced loop bounds.** Every revise/review cycle is wrapped in `graph_add_loop` with required `max_traversals` — no unbounded cycles, no round-count prose.
6. **Signal-driven control flow.** Forward `answer` edges, `revise_needed` back-edges, and `needs_approval` gates route the graph.
7. **Graph-native approvals.** Destructive/high-risk nodes are declared `needs_approval: true` and resolved via `graph_approve` — never "flag in report, re-run a fresh session".
8. **No orphaned nodes.** Stale or abandoned nodes are cancelled with `graph_cancel` before the final result is emitted.
9. **Tool-restricted orchestrator.** `Write`/`Edit`/`Bash` denied — implementation is delegated to specialist nodes.

## Comparison with Director-Gated

| Aspect | Graph-Orchestrated | Director-Gated |
|--------|--------------------|----------------|
| Execution mechanism | Imperative graph engine at runtime (`graph_create` → `graph_add_node` / `graph_add_edge` / `graph_add_loop` → `graph_run`) | Declarative `collaboration.flow` DAG executed for the role |
| Graph/collaboration declaration | `graph.orchestration: graph_v2` (live) + `collaboration:` block kept ONLY for schema compatibility | `collaboration:` block with `flow` / `max_iterations` as live config |
| Loop bounding | `graph_add_loop` `max_traversals` — required, engine-enforced | Declarative `max_iterations` |
| Result collection | `graph_status(include_output=true)` — materialized node outputs, read once after `[GRAPH COMPLETE]` | Report text from subagent sessions |
| Approval path | `graph_approve` on `needs_approval` nodes — blocked → completed, engine resumes forward flow | Flag-in-report, re-dispatch a fresh session |
| Node lifecycle cleanup | `graph_cancel(graph_id, node_id?)` for stale/orphaned nodes | N/A |
| role.yaml size | 40-80 lines | 50-110 lines |
| PROMPT.md size | 150-350 lines | 300-500 lines |
| Best for | Runtime-shaped pipelines, bounded revise loops, graph-native approvals | Fixed review pipelines declared statically |
