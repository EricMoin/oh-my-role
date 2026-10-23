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
| Graph-Orchestrated | Runtime-declared multi-specialist pipeline: one Graph v3 document per request with declared outcomes, review loops and approval gates | Medium |
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

A thin declarer authors **ONE complete Graph v3 document per request** through `graph_declare` and starts it in the same call, ends its turn, and collects the accepted results through `graph_status`. The declarer never does specialist work; it declares, collects, and assembles.

**Pick when:**
- Multi-specialist pipeline needing graph-native scheduling (per-node timeouts, engine-managed concurrency)
- Bounded review loops (drafter ↔ reviewer, design ↔ review) declared as a `loop_groups` entry with `max_traversals`
- Approval gates declared on a node outcome with the `principal-approval@1` acceptance primitive, when the host has installed the policy
- Outcome-routed flow: every edge binds one outcome its source node declares

**Marker:** the role declares no orchestration block in `role.yaml`; the machine-checkable signature is the `tools:` declarer/worker split plus the submitted declaration.

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

**Skip when:** a linear gate pipeline suffices (director-gated), a thin graph-native declarer suffices (graph-orchestrated), or the task is single-domain (simple). This pattern carries significant complexity overhead.

> Full detail: `references/conventions/nested-statemachine.md`

---

## Graph v3 Vocabulary

Graph-orchestrated and director-gated roles run coordination on the rolebox Graph v3 outcome protocol. The incremental graph-authoring API is retired. Function state and the built-in loop function remain separate capabilities; graph cycles use explicit loop groups. Select a host from the graph-protocol capability matrix before generating tool instructions.

| Tool | Purpose |
|------|---------|
| `graph_declare({declaration})` | One declaration per request: strict parse, compile, capability preflight, persist and start or resume in a single call; the only start path |
| `graph_submit_outcome({graph_id, node_id, outcome_id, credential, data?})` | A worker settles its own attempt with one declared outcome; the host derives attempt, submission and compiled-revision identity |
| `graph_control(command, ...)` | Run/attempt lifecycle: `failure`, `timeout`, `cancel`, `budget-stop`, `retry`, `approval-request`, `approve`, `reject` |
| `graph_status({...})` | Read the shared read model once: phase, runs, nodes, attempts, accepted results, loops, approvals, controls, budget, unsettled effects |
| `graph_audit({...})` | Read-only store inventory for storage/recovery blockers; mutates nothing |
| `graph_worker_exec(command)` | dsh-only worker execution; OpenCode/Pi workers use native tools |

**Declarer/worker split:** a declaring role holds `graph_declare`, `graph_control`, `graph_status` and `graph_audit` true and `graph_submit_outcome` false; a worker holds the inverse. Omit the dsh-only `graph_worker_exec` marker in portable manifests. The `tools:` block in `role.yaml` is the machine-checkable marker of the split.

**Declared outcomes:** every node declares its `outcomes` and `completion: {mode: "explicit"}`. Only an accepted submission settles a node: verdict `committed` or `replayed` with no refusals. A refusal writes nothing and leaves the attempt open; a result fence or a control signal never settles a v3 node.

**Outcome-bound edges:** every edge is `{from, to, outcome}` and binds one outcome its source node declares. There is no implicit "any outcome" edge and no predicate field.

**Loop groups:** every cycle sits in a `loop_groups` entry with a required positive `max_traversals`, a `continuation_outcome` that re-enters the loop and an `exit_outcome` that leaves it — no unbounded cycles, no round-count prose.

**Approval gates:** a node outcome declares the `principal-approval@1` acceptance primitive, and the declaring session raises `graph_control(command: "approval-request", ...)` under a host-installed policy. The capability preflight refuses a declaration whose graph and node have no installed approval rule. A control decision records a decision; it never submits a business outcome.

**Engine-managed concurrency:** the engine schedules ready nodes and enforces run and per-node budgets — resource ceilings are owned by the engine, not by declarative config.

Every consumer declares accepted-result `inputs`; an edge alone carries no payload. Revision back-edges use `when: triggered` inputs.

Gate skills still apply: a gate SKILL.md defines what "pass" looks like, and the declarer binds each gate verdict's outcome to an edge.

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

In graph-orchestrated and director-gated roles, the gate verdict routes through the graph: a passing node settles its `pass` outcome and fires the edge that binds it, and a failing review settles `revise`, which re-enters the source stage through the loop group's continuation outcome. The gate skill stays the source of what "pass" means; the edges and the loop group carry the consequence.

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
| role.yaml (declarer) | 40-80 |
| PROMPT.md (declarer) | 150-350 |
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

The `collaboration.flow` field declares directed edges between agents. **Legacy note:** this declarative block is a schema-compat mirror only — it is NOT the execution path. Live coordination runs on the Graph v3 declaration authored per request (`graph_declare` with declared outcomes, outcome-bound edges and a `loop_groups` entry).

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
- `max_iterations` is schema-compat only — it does NOT bound runtime cycles; live loops are bounded by a `loop_groups` entry's required, engine-enforced `max_traversals`

### Concurrency (Engine-Managed)

Concurrency and resource ceilings are owned and enforced by the graph engine — there is no concurrency config to tune. Per-node limits ride on a node's `budget` (`timeout_ms`, `max_input_tokens`, `max_output_tokens`, `max_cost_usd`); `max_retries` is refused by the grammar. Review cycles are bounded by a `loop_groups` entry's required `max_traversals`. The engine schedules ready nodes and enforces budgets; the declarer submits one declaration, ends its turn, and collects accepted outcomes once the run reports completion.
