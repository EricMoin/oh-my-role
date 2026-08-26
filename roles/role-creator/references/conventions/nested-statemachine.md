# Nested + State-Machine-Functions Pattern

The most complex pattern. A top-level orchestrator uses stateful functions that observe lifecycle events, auto-activate on conditions, and transition between states. Subagents nest multiple levels deep, each with their own functions and skills. The orchestrator reacts to what's happening rather than following a fixed pipeline.

## When to Use

- Complex multi-agent systems with stateful orchestration
- The agent needs to observe and react, not just respond to commands
- Auto-activation on lifecycle events (messages arrive, graph nodes complete, signals fire)
- Deep hierarchies where sub-subagents handle specialized domains
- Imperial/governing patterns where one agent manages many teams
- You need fine-grained control over what tools the orchestrator can access

**Don't use when:** a linear gate pipeline suffices (use director-gated), or the task is single-domain (use simple). This pattern carries significant complexity overhead.

## Directory Layout

```
roles/{role-name}/
├── role.yaml                          # Orchestrator with locked tools
├── PROMPT.md                          # Orchestration strategy
├── functions/                         # State-machine functions
│   ├── {function-name}.md
│   └── {another-function}.md
├── references/                        # Shared knowledge
│   └── {topic}.md
└── subagents/                         # First level
    ├── {subagent-a}/
    │   ├── role.yaml
    │   ├── PROMPT.md
    │   ├── functions/
    │   │   └── {fn}.md
    │   ├── skills/
    │   │   └── {skill}/
    │   │       └── SKILL.md
    │   └── subagents/                 # Second level (sub-subagents)
    │       ├── {sub-sub-a}/
    │       │   ├── role.yaml
    │       │   └── skills/
    │       └── {sub-sub-b}/
    │           ├── role.yaml
    │           └── functions/
    │               └── {fn}.md
    └── {subagent-b}/
        ├── role.yaml
        ├── functions/
        │   └── {fn}.md
        └── subagents/                 # Second level
            ├── {sub-sub-c}/
            │   └── role.yaml
            └── {sub-sub-d}/
                └── role.yaml
```

Nesting goes up to 3 levels deep. Each level can have its own functions, skills, and subagents.

## role.yaml Shape

The orchestrator role.yaml is typically 35-50 lines. It's distinguished by `locked`, `auto_activate`, tool restrictions, and graph/signal-driven orchestration.

### Required Fields

| Field | Purpose |
|-------|---------|
| `name` | Human-readable role name |
| `description` | Identity and boundaries |
| `prompt_file` | Points to PROMPT.md |
| `functions` | List of state-machine function names |
| `auto_activate` | Functions that activate automatically |

### Distinctive Fields

| Field | Purpose |
|-------|---------|
| `locked` | `true` prevents function deactivation by the agent |
| `tools` | Explicit tool restrictions (e.g., `Write: false`) |
| `graph` | Declares `orchestration: graph_v2` — concurrency is engine-managed |
| `auto_activate` | Functions active from the start of every conversation |

### Example role.yaml

```yaml
name: Emperor
description: "Supreme orchestrator. Triages requests, routes to specialist teams via graph nodes, synthesizes results. Never writes code directly."
mode: primary
prompt_file: PROMPT.md
functions:
  - triage
  - synthesize
  - effort
auto_activate:
  - triage
  - synthesize
locked: true
tools:
  Write: false
  Edit: false
  Bash: false
graph:
  orchestration: graph_v2
  # Concurrency is engine-managed: per-node timeout_ms / max_retries ride on
  # graph_add_node; review cycles are bounded by graph_add_loop max_traversals.
```

> **Legacy note:** the declarative `dispatch:` block (`maxActivePerParent`,
> `maxConcurrent`, …) is replaced by the graph engine — resource ceilings are owned
> and enforced by the engine, and concurrency is engine-managed. Likewise
> `collaboration.max_iterations` is schema-compat only and does NOT bound runtime
> cycles; `graph_add_loop`'s required, engine-enforced `max_traversals` is the real
> bound. Do not re-introduce the legacy `dispatch:` config.

## State-Machine Functions

Functions are the core differentiator of this pattern. They aren't simple action handlers; they're reactive state machines that observe lifecycle events and trigger behavior.

### Function File Structure

Each function lives in `functions/{name}.md` with YAML frontmatter defining its behavior.

```markdown
---
name: triage
description: Classifies incoming requests and routes to appropriate subagent teams.
phase: intake
priority: 100
auto_activate: true
locked: true
observe:
  - on: message
    inject: |
      TRIAGE DIRECTIVE: Classify this message. Determine which team handles it.
      Categories: architecture, implementation, review, research.
      Route it to the appropriate team via a graph node. Do not attempt the work yourself.
  - on: signal
    filter: signal_observed(answer)
    inject: |
      A graph node answered. Check whether the workflow can advance.
transitions:
  - when: "signal_observed(answer) from all dispatched nodes"
    activate:
      - synthesize
    deactivate:
      - effort
  - when: "signal_observed(revise_needed)"
    activate:
      - triage
    deactivate:
      - synthesize
  - when: "signal_observed(need_approval)"
    activate:
      - triage
    deactivate:
      - effort
continue_until:
  any:
    - "signal_observed(answer) from the final node"
    - "artifact_exists(<final-artifact>)"
gate:
  pass: "Request routed to at least one graph node"
  fail: "Ask user for clarification"
---

## Triage Function

You classify incoming work and route it to the right team.

### Routing Rules

- Architecture questions -> chancellor team
- Implementation tasks -> jinyiwei team
- Code review -> jinyiwei/reviewer
- Research -> graph node with research brief

### Node Prompt Format

When authoring a node, provide:
1. Clear task description
2. Relevant context from the user's message
3. Success criteria for the subagent
```

### Key Frontmatter Fields

| Field | Purpose |
|-------|---------|
| `observe` | Lifecycle hooks that inject directives |
| `transitions` | State changes triggered by signal/condition observations |
| `continue_until` | Loop termination conditions (dual-channel) |
| `gate` | Pass/fail criteria for the function |
| `phase` | Logical grouping (intake, execution, synthesis) |
| `priority` | Ordering when multiple functions active (higher = first) |
| `auto_activate` | Starts active without explicit activation |
| `locked` | Cannot be deactivated by the agent |

### Observe Pattern

Functions inject directives on graph/signal lifecycle events. The agent sees these directives automatically.

```yaml
observe:
  - on: message
    inject: |
      SYNTHESIS CHECK: Have all graph nodes completed?
      If yes, compile results into a unified response.
  - on: signal
    filter: signal_observed(answer)
    inject: |
      A gate node answered. Check whether more nodes are needed.
  - on: graph_complete
    inject: |
      [GRAPH COMPLETE] received. Collect outputs via
      graph_status(graph_id, include_output=true) and synthesize.
```

Supported events: `message`, `signal` (filtered by `signal_observed(…)`), `graph_complete` (the `[GRAPH COMPLETE]` reminder), `activate`, `deactivate`.

### Transition Pattern

Transitions change the active function set based on signal-driven conditions.

```yaml
transitions:
  - when: "signal_observed(answer) from all dispatched nodes"
    activate:
      - synthesize
    deactivate:
      - effort
  - when: "signal_observed(revise_needed)"
    activate:
      - triage
    deactivate:
      - synthesize
  - when: "signal_observed(need_approval)"
    activate:
      - triage
    deactivate:
      - effort
```

### Continue-Until Pattern

Defines when a function's loop terminates. The dual-channel form stops when the terminating `answer` signal is observed **OR** the final artifact exists — whichever arrives first.

```yaml
continue_until:
  any:
    - "signal_observed(answer) from the final node"
    - "artifact_exists(<final-artifact>)"
  all:
    - "at least one node dispatched"
    - "no pending clarifications"
```

`any` means stop when any single condition is met. `all` means every condition must be true.

## Graph Authoring

Stateful orchestration still runs on the graph engine. The orchestrator authors ONE graph per request, with state transitions reacting to the signals it produces:

```js
graph_id = graph_create(name="<request>").graph_id

graph_add_node({ graph_id, id: "plan", agent: "emperor--chancellor",
                 prompt: "Produce a strategy for: {request}" })
graph_add_node({ graph_id, id: "execute", agent: "emperor--jinyiwei",
                 prompt: "Execute this strategy: {strategy}",
                 needs_approval: true })  // destructive work: pause for human approval
graph_add_node({ graph_id, id: "check", agent: "emperor--validator",
                 prompt: "Validate this result: {result}" })

// Forward flow: answer advances
graph_add_edge({ graph_id, from: "plan", to: "execute", type: "on_signal", signal_filter: ["answer"] })
graph_add_edge({ graph_id, from: "execute", to: "check", type: "on_signal", signal_filter: ["answer"] })

// Revise back-edge: check emits revise_needed -> execute re-enters
graph_add_edge({ graph_id, from: "check", to: "execute", type: "on_signal", signal_filter: ["revise_needed"] })

// Bound the execute<->check cycle; max_traversals is required and engine-enforced
graph_add_loop({ graph_id, id: "revise-cycle", nodes: ["execute", "check"], max_traversals: 3 })

graph_run(graph_id)
// END YOUR TURN — await [GRAPH COMPLETE] / [GRAPH BLOCKED], then
// graph_status(graph_id, include_output=true) to collect node outputs ONCE
```

- `needs_approval: true` on destructive / high-risk nodes pauses them in `blocked` state when the agent emits `signal(need_approval)`; a human resolves via `graph_approve` — the destructive operation is never executed on rejection.
- Results are collected ONCE via `graph_status(include_output=true)` after the `[GRAPH COMPLETE]` reminder — polling is fallback-only.
- Review cycles are bounded by `graph_add_loop` `max_traversals` (required, engine-enforced) — not by prose, not by declarative config.

## Nested Subagent Structure

### First-Level Subagents

Direct children of the orchestrator. They handle domain-level coordination.

```yaml
name: Chancellor
description: "Coordinates architecture and design decisions. Manages drafter, reviewer, and finalizer."
mode: subagent
prompt_file: PROMPT.md
functions:
  - coordinate
  - quality-check
subagents:
  - drafter
  - reviewer
  - finalizer
```

### Second-Level Subagents (Sub-Subagents)

Children of first-level subagents. They do the actual specialized work.

```yaml
name: Drafter
description: "Writes initial drafts of architecture documents and design proposals."
mode: subagent
prompt: |
  You draft architecture documents based on the brief
  provided by the Chancellor. Focus on clarity and
  completeness. Your output goes to the Reviewer.
skills:
  - architecture-drafting
```

### ID Convention for Nested Agents

IDs derive from the full directory path:

| Level | ID Format | Example |
|-------|-----------|---------|
| First-level | `{role}--{subagent}` | `emperor--chancellor` |
| Second-level | `{role}--{subagent}--{sub-subagent}` | `emperor--chancellor--drafter` |
| Third-level | `{role}--{sub}--{subsub}--{subsubsub}` | (rare, avoid if possible) |

## Naming Conventions

| Thing | Convention | Example |
|-------|-----------|---------|
| Role directory | lowercase, hyphens | `emperor` |
| Function file | lowercase, hyphens | `functions/triage.md` |
| Subagent directory | lowercase, hyphens | `subagents/chancellor/` |
| Sub-subagent dir | lowercase, hyphens | `subagents/chancellor/subagents/drafter/` |
| Agent ID | path-derived, double-dash separated | `emperor--chancellor--drafter` |
| Skills | flexible naming, context-dependent | `architecture-drafting` |

## Tool Restrictions

The orchestrator typically restricts its own tools to prevent it from doing work directly:

```yaml
tools:
  Write: false
  Edit: false
  Bash: false
```

This forces all actual work through subagents, keeping the orchestrator purely in a coordination role.

## Graph Engine Concurrency

Concurrency is **engine-managed** — there is no `dispatch:` config to tune. Resource limits ride on the node declaration:

```js
graph_add_node({ graph_id, id: "plan", agent: "emperor--chancellor",
                 prompt: "...", timeout_ms: 300000, max_retries: 1 })
```

- Per-node `timeout_ms` / `max_retries` on `graph_add_node` replace the legacy `dispatch:` block's concurrency knobs (`maxActivePerParent`, `maxConcurrent`).
- Review cycles are bounded by `graph_add_loop` `max_traversals`.
- Stale or abandoned nodes are cancelled with `graph_cancel` — never leave orphaned graph nodes running after the final result is emitted.

## Typical Size Ranges

| Component | Lines |
|-----------|-------|
| Orchestrator role.yaml | 35-50 |
| Orchestrator PROMPT.md | 200-400 |
| Each function file | 50-120 |
| First-level subagent role.yaml | 15-30 |
| Second-level subagent role.yaml | 8-20 |
| Total nesting levels | 2-3 |
| Functions per agent | 2-5 |
| Total subagents (all levels) | 5-15 |

## Key Characteristics

1. **Reactive, not sequential.** Functions observe graph/signal events and inject directives. The agent responds to what's happening.
2. **Auto-activation.** Key functions start active and stay active (`locked: true`). No explicit invocation needed.
3. **Tool-restricted orchestrator.** The top-level agent can't write code or files. It coordinates only.
4. **Deep nesting.** Sub-subagents handle actual work. Each level adds specialization.
5. **Signal-driven state transitions.** Functions activate/deactivate on `signal_observed(answer / revise_needed / need_approval)`, creating emergent workflow.
6. **Lifecycle hooks.** `observe` patterns on `message`, `signal`, `graph_complete`, etc. give the agent awareness of its environment.
7. **Engine-managed concurrency.** The graph engine schedules nodes; per-node `timeout_ms`/`max_retries` and loop `max_traversals` prevent resource exhaustion.

## Comparison with Director-Gated

| Aspect | Director-Gated | Nested State-Machine |
|--------|---------------|---------------------|
| Flow control | Explicit graph edges (`on_signal`) | Reactive transitions |
| Activation | Director authors graph nodes | Auto-activate on events |
| Nesting depth | 1 level (director + subagents) | 2-3 levels |
| Orchestrator tools | May have Read, Grep | Typically all restricted |
| Gate mechanism | Skill-based gate checks | Function frontmatter gates |
| Complexity | Medium | High |
| Best for | Linear review pipelines | Complex adaptive systems |
