# Director + Gated-Subagents Pattern (Graph v3)

A central declaring director orchestrates specialist subagents through a
gate-based pipeline. Each subagent performs focused work and must settle its gate
outcome before the pipeline advances. The director never does specialist work
itself: it declares ONE Graph v3 graph per request, evaluates the accepted gate
reports, and routes the work by the outcomes each node declares.

The protocol contract is `roles/role-creator/references/graph-protocol.md`.

Select the target host first using `references/graph-protocol.md`. OpenCode, Pi
and dsh workers use authorized native workspace tools and rolebox capabilities. Codex does not support rolebox graph execution, so choose a
non-graph role there. Workspace-only nodes omit `tools` and `toolPresentation`;
extra tools must use names actually registered by the selected host. File-tool
denials do not enforce read-only behavior when a shell remains available.

## When to Use

- Multi-step workflows where each step needs specialist validation
- Architecture design, UX design and code-review pipelines
- Work that must pass quality gates before progressing
- Traceable decisions with clear accountability per stage
- Domains with 3-8 distinct specialist concerns

**Don't use when:** the task is single-domain (use simple pattern), or you need
reactive lifecycle functions and stateful auto-activation (use
nested-statemachine pattern).

## Directory Layout

```
roles/{role-name}/
├── role.yaml                    # Director declaring role
├── PROMPT.md                    # Director orchestration prompt
├── references/                  # Shared knowledge for the director
│   ├── graph-protocol.md        # The v3 protocol contract
│   ├── templates/
│   │   └── {template-name}.md
│   └── {topic}.md
├── skills/                      # Director-level skills (foundational)
│   └── {role}-{domain}/
│       └── SKILL.md
└── subagents/                   # Specialist workers
    ├── {subagent-slug}/
    │   ├── role.yaml            # Minimal worker definition
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

Typically 50-110 lines. The distinguishing feature is the `tools:` block that
declares the director's split. There is **no `graph:` block and no
`collaboration:` block**: the loader recognizes `graph:` only to log that it is
not wired into graph resolution (no runtime effect), and it reads no
`collaboration:` key at all. Flow is declared as one version-3 graph per request.

### Required Fields

| Field | Purpose |
|-------|---------|
| `name` | Human-readable role name |
| `description` | One-line summary |
| `prompt_file` | Points to PROMPT.md (too long for inline) |
| `tools` | The director's declarer split |

### Common Fields

| Field | Purpose |
|-------|---------|
| `version` | SemVer string |
| `mode` | `primary` |
| `skills` | Director-level foundational skills |
| `functions` | Typically `[plan, execute]` |
| `references` | Shared templates and state docs; register `graph-protocol` and this convention |
| `permission` | `allow` list of the tools the director may call |

### The `tools:` declarer split

| Tool | Director | Gate worker |
|------|----------|-------------|
| `graph_declare` | `true` | `false` |
| `graph_control` | `true` | `false` |
| `graph_status` | `true` | `false` |
| `graph_audit` | `true` | `false` |
| `graph_submit_outcome` | `false` | `true` |
| `Write` / `Edit` / `Bash` | per the director's job (a pure director denies `Write`/`Edit`) | per the gate's job (a read-only gate denies `Write`/`Edit`, keeps `Bash` for its checks) |

### Example role.yaml

```yaml
name: Software Architecture
description: Software architecture director coordinating specialist reviewers through declared quality gates.
version: "3.1.0"
mode: primary
prompt_file: PROMPT.md
references:
  graph-protocol:
    path: references/graph-protocol.md
    description: The Graph v3 protocol contract this director declares against
  templates/architecture-state:
    path: references/templates/architecture-state.md
    description: Shared Architecture State template carried in node briefs
  templates/adr:
    path: references/templates/adr.md
    description: Architecture Decision Record template
skills:
  - software-architecture-core
functions:
  - plan
  - execute
tools:
  graph_declare: true
  graph_control: true
  graph_status: true
  graph_audit: true
  graph_submit_outcome: false
  Write: false
  Edit: false
  Bash: true
permission:
  allow:
    - Read
    - Grep
    - Glob
    - Bash
    - graph_declare
    - graph_control
    - graph_status
    - graph_audit
```

## Director Prompt (PROMPT.md)

The director prompt lives in a separate file because it is typically 300-500
lines. Its structure:

1. **Identity statement.** "You are the X director. You coordinate specialists.
   You never act as a lone Y."
2. **Worker roster.** Each node agent (`{role}--{slug}`), its gate criteria and
   the outcomes it may settle.
3. **Declaration recipe.** Which gate nodes to declare, how to bind their
   outcomes, and how to bound the review cycle.
4. **State management.** How each node brief carries the shared state document.
5. **Collection and exit conditions.** How accepted gate reports are read and
   when the workflow is complete.

The director contains no domain expertise. It knows *who* to ask, *when* and
*which outcome routes where*.

## Subagent role.yaml

Worker definitions are minimal (8-15 lines). They reference a gate skill and
defer to it for their domain logic. The runtime supplies the node's outcome/data
contract and execution handoff; keep those mechanics out of the worker prompt.

```yaml
name: Intake Strategist
description: Frames the architecture request, identifies constraints and produces the initial Architecture State.
mode: subagent
prompt: |
  You frame architecture requests. Identify stakeholders, constraints,
  quality attributes and scope boundaries, and produce an Architecture State
  document for downstream nodes. Identify missing inputs and record the evidence
  supporting each conclusion.
tools:
  graph_declare: false
  graph_control: false
  graph_status: false
  graph_audit: false
  graph_submit_outcome: true
  Write: false
  Edit: false
  Bash: true
skills:
  - software-architecture--intake-strategist~architecture-intake-gate
```

## Gate Skill Structure

Gate skills are the core mechanism. Each one defines what "pass" means for a
node's output; the declared outcomes and edges define what happens on each
verdict.

```
skills/{role}--{subagent}~{gate-name}/
└── SKILL.md
```

### SKILL.md Format

```markdown
---
name: architecture-intake-gate
description: Validates that the architecture request is framed with constraints and scope.
---

## Mission
Frame the incoming architecture request into a structured Architecture State.

## Inputs
- The user's architecture question or requirement
- Any existing system context

## Required Checks
1. Stakeholders identified
2. Quality attributes ranked
3. Constraints documented (budget, timeline, team size)
4. Scope boundaries clear (what is in, what is out)

## Pass Criteria
- All four required checks satisfied
- No ambiguous requirements left unresolved
- Architecture State template filled

## Outcome Mapping
- `pass`: all checks satisfied and the state is ready downstream
- `revise`: a concrete, reproducible defect with the fix that resolves it
- `blocked`: a required upstream input or user intent is unavailable

## Output
Populated Architecture State document ready for the next gate.
```

Gate skills run 80-120 lines.

## Declaring the Gated Pipeline

The director declares **ONE Graph v3 graph per request**:

1. **Declare one node per gate.**
   Each node has an `id` (the gate slug), an `agent` (`{role}--{slug}`) and a
   `prompt` carrying the current state and the gate objective; the gate SKILL.md
   supplies the gate logic. Give every node at least its declared outcomes,
   `completion: {mode: "explicit"}` and `budget.timeout_ms`.
2. **Declare the routes.**
   Every edge is `{from, to, outcome}` and binds one outcome its source node
   declares: the `pass` outcome advances the pipeline, and the `revise` outcome
   re-enters the source stage. There is no implicit edge and no condition field;
   a gate's verdict is the outcome its worker settles.
3. **Bound the review cycle.**
   Put the reviewing and revised stages in a `loop_groups` entry with a positive
   `max_traversals`, a `continuation_outcome` (the gate's revise outcome) and an
   `exit_outcome` (the gate's pass outcome). Both must be declared by a member
   node, and every edge carrying the continuation outcome must stay inside the
   group. A cycle no group covers cannot compile.
4. **Set the run ceiling.**
   `budget.max_executions` must cover every selected gate and every loop
   continuation. `max_retries` is refused by name; retries are explicit
   `graph_control` commands with a diagnosed cause.
5. **Declare and start.**
   `graph_declare({declaration: {...}})` parses, compiles, preflights, persists
   and starts or resumes the run in one call. Inspect `persisted` and
   `start.kind`: `started` and `resumed` are real dispatch, `saved`, `blocked`
   and `refused` are not.
6. **Collect accepted results once.**
   After the run notifies the director, read committed state with `graph_status`
   scope `all`, format `json`, `include_output` and `include_history`, and read
   `attempts[].accepted` and `attempts[].result`. Polling is recovery only.

### Edge and Outcome Rules

Gates remain **gate SKILL.md plus declared outcomes**:

- The SKILL.md defines what a passing (or failing) gate output looks like.
- The declaration binds what happens on each verdict: the `pass` outcome's edge
  advances the pipeline; the `revise` outcome's edge re-enters the source stage
  and is the loop group's continuation outcome.
- A gate that cannot proceed settles `blocked`; a gate whose verification cannot
  run settles `failed`. Those outcomes carry no outbound edge and are declared
  exits.
- The director routes accepted outcomes; domain criteria determine which outcome
  the work warrants. Runtime handoff and settlement instructions are injected.

### Example Declaration Shape

```text
nodes:
  intake   -> agent {role}--intake-strategist, outcomes [pass, revise, blocked, failed]
  model    -> agent {role}--system-modeler,    outcomes [pass, revise, blocked, failed]
  review   -> agent {role}--trade-off-analyst, outcomes [pass, revise, blocked, failed]
edges:
  {from: intake, to: model,  outcome: pass}
  {from: model,  to: review, outcome: pass}
  {from: review, to: model,  outcome: revise}
loop_groups:
  {id: model-review, nodes: [model, review], max_traversals: 3,
   continuation_outcome: revise, exit_outcome: pass}
```

## Approval Gates in the v3 Vocabulary

Approval is declared, not messaged:

- A gate outcome declares the `principal-approval@1` acceptance primitive, and
  the host must have installed an approval rule for that exact graph and node;
  the capability preflight refuses the declaration otherwise.
- The director raises `graph_control(command: "approval-request", graph_id,
  node_id, attempt_id, reason, approver_session_id, expires_at)` for an in-flight
  attempt. Only the policy-authorized session issues `approve` or `reject`, and
  the decision is recorded as a control decision, not as a business outcome.
- A rejected or obsolete run is contained with `graph_control` `cancel` once its
  external effects are accounted for.
- Never present an approval request as permission, and never fabricate consent.

## Recovery

`graph_control` acts on the plan:

- `retry` mints a NEW attempt for a diagnosed transient failure and spends
  budget; a run-scoped `retry` re-executes a terminal run as a successor run.
- `cancel` contains obsolete work; a cancel request is not confirmed
  termination.
- `failure`, `timeout` and `budget-stop` record an attempt or run that failed,
  exceeded its time or exhausted its ceiling.
- `graph_audit` diagnoses storage and recovery blockers; never delete or
  recreate an unreadable store.

No control command converts an incomplete report into an accepted outcome.

## Naming Conventions

| Thing | Convention | Example |
|-------|-----------|---------|
| Role directory | lowercase, hyphens | `software-architecture` |
| Subagent directory | lowercase, hyphens (slug) | `intake-strategist` |
| Node agent | `{role}--{subagent-slug}` | `software-architecture--intake-strategist` |
| Director skill | `{role}-{domain}` | `software-architecture-core` |
| Gate skill dir | `{role}--{subagent}~{skill-name}` | `software-architecture--intake-strategist~architecture-intake-gate` |
| Loop group `id` | stage pair | `model-review` |
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

1. **Director never does specialist work.** It declares the gate nodes and
   evaluates accepted gate reports.
2. **Gates enforce quality.** Each gate must settle its `pass` outcome before
   the pipeline advances.
3. **Acyclic flow with one bounded cycle.** The declared routes are directed and
   the review cycle is contained in a loop group.
4. **Shared state.** Workers communicate through the state carried in node
   briefs and the accepted results the director reads back, not through direct
   messages.
5. **Engine-enforced review bounds.** The loop group's required
   `max_traversals` prevents unbounded cycling on repeated gate failures.
6. **Declared, not built.** One immutable version-3 declaration per request; a
   changed topology needs a new graph name.
7. **Traceable decisions.** Each gate produces an auditable accepted report
   explaining pass, revise, blocked or failed.
