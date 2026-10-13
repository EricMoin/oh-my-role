# Nested + State-Machine-Functions Pattern (Graph v3)

The most complex pattern. A top-level declaring orchestrator activates stateful
functions that observe lifecycle events, auto-activate on conditions and
transition between states, while a nested subagent tree carries the specialist
work. Graph execution itself stays on the rolebox Graph v3 outcome protocol: the
orchestrator declares ONE version-3 graph per request and reads accepted outcomes
back. The functions shape the orchestrator's own behaviour; they never build a
graph incrementally and they never settle a node.

The protocol contract is `roles/role-creator/references/graph-protocol.md`.

## When to Use

- Complex multi-agent systems that need stateful orchestration
- The orchestrator must observe and react, not just follow one fixed pipeline
- Auto-activation on lifecycle events (a message arrives, a tool ran, a function
  activated)
- Deep hierarchies where sub-subagents handle specialized domains
- Imperial/governing patterns where one agent manages many teams
- Fine-grained control over what tools each level may access

**Don't use when:** a linear gate pipeline suffices (use director-gated), or the
task is single-domain (use simple). This pattern carries significant complexity
overhead.

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

Nesting goes up to 3 levels deep. Each level can have its own functions, skills
and subagents.

## role.yaml Shape

The orchestrator role.yaml is typically 35-50 lines. It is distinguished by
`locked`, `auto_activate`, the `tools:` declarer split and its function list.
There is **no `graph:` block and no `collaboration:` block**: the loader
recognizes `graph:` only to log that it is not wired into graph resolution (no
runtime effect), and it reads no `collaboration:` key at all.

### Required Fields

| Field | Purpose |
|-------|---------|
| `name` | Human-readable role name |
| `description` | Identity and boundaries |
| `prompt_file` | Points to PROMPT.md |
| `functions` | List of state-machine function names |
| `auto_activate` | Functions active from the start of every session |

### Distinctive Fields

| Field | Purpose |
|-------|---------|
| `locked` | `true` prevents auto-activated functions from being deactivated |
| `tools` | The declarer split (below) plus the levels' `Write`/`Edit`/`Bash` posture |
| `permission` | `allow` list of the tools the session may call |

### Example role.yaml

```yaml
name: Emperor
description: "Supreme orchestrator. Triages requests, declares Graph v3 pipelines, synthesizes accepted outcomes. Never writes code directly."
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
references:
  graph-protocol:
    path: references/graph-protocol.md
    description: The Graph v3 protocol contract this role declares against
tools:
  graph_declare: true
  graph_control: true
  graph_status: true
  graph_audit: true
  graph_submit_outcome: false
  graph_worker_exec: false
  Write: false
  Edit: false
  Bash: false
```

The `tools:` block is the machine-checkable marker of the nested pattern: the
orchestrator declares and controls graphs, its worker subagents submit outcomes,
and neither side holds the other's tools. A worker subagent's `tools` inherits
from its parent unless it declares its own.

## State-Machine Functions

Functions are the core differentiator of this pattern. They are reactive state
machines that observe lifecycle events and trigger behaviour, not simple action
handlers.

### Function File Structure

Each function lives in `functions/{name}.md` with YAML frontmatter. The parsed
`FunctionMetadata` fields (rolebox `src/loader/types.ts`) are: `name`,
`description`, `params`, `phase`, `priority`, `requires`, `produces`, `consumes`,
`gate`, `continue_until`, `requires_evidence`, `observe`, `transitions`,
`state_schema_version`, `continue_max` and `handlers`.

```markdown
---
name: triage
description: Classifies incoming requests and routes them to the right team.
phase: intake
priority: 100
observe:
  - on: message
    inject: |
      TRIAGE DIRECTIVE: Classify this message and decide which team handles it.
      Declare one Graph v3 pipeline for the request; do not do the work yourself.
  - on: tool_after
    tool: graph_declare
    inject: |
      A pipeline was declared. Record the graph id and the node ids in your
      working state; collect accepted outcomes with graph_status.
transitions:
  - when: "artifact_exists(plan)"
    activate:
      - synthesize
continue_until:
  any:
    - "artifact_exists(final-report)"
    - "turn_count(12)"
gate:
  pass: "The request is routed to at least one declared graph"
  fail: "Ask the user for the missing intent"
---

## Triage Function

You classify incoming work and route it to the right team. Declare the pipeline
before doing anything else, then end your turn and wait for the run to report.

### Routing Rules

- Architecture questions -> the chancellor team
- Implementation tasks -> the jinyiwei team (declare a generator and a validator
  node, and put their revise cycle in one loop group)
- Code review -> the review pipeline
- Research -> a research node with a research brief

### Node Brief Format

When declaring a node, provide:
1. A clear task statement
2. The relevant context from the user's message
3. Success criteria for the worker and the outcomes it may settle
```

### Key Frontmatter Fields

| Field | Purpose |
|-------|---------|
| `observe` | Lifecycle reactions that inject directives |
| `transitions` | State changes triggered by conditions |
| `continue_until` | Loop termination conditions |
| `gate` | Pass/fail criteria for the function |
| `phase` | Logical grouping (intake, execution, synthesis) |
| `priority` | Ordering when several functions are active (higher first) |
| `requires_evidence` / `evidence_met()` | Evidence-gated activation |

`auto_activate` and `locked` are **role-level** fields, not function frontmatter
fields: the role's `auto_activate` list names the functions that start active,
and `locked: true` keeps them from being deactivated.

### Observe Pattern

Functions inject directives when a lifecycle event fires. The built-in events are
`tool_after`, `message` and `activate` (rolebox `BUILTIN_OBSERVE_EVENTS`); a host
extension may register additional observe-event handlers.

```yaml
observe:
  - on: message
    inject: |
      SYNTHESIS CHECK: have all declared nodes settled?
      If yes, compile their accepted results into one response.
  - on: tool_after
    tool: graph_status
    inject: |
      You read committed graph state. Continue only when the required nodes have
      an accepted result.
  - on: activate
    inject: |
      The function is now active. Declare the next pipeline when the current run
      has stopped and its effects are accounted for.
```

Graph progress is **not** observed as a function event. A run that completes,
stops or needs attention notifies the declaring session; the session then reads
accepted results with `graph_status`. Do not invent a lifecycle event for graph
completion — no built-in event provides one, and a node settles only through its
declared outcome.

### Transition Pattern

Transitions change the active function set when a condition holds. Conditions use
the runtime's named-condition vocabulary (`src/function/conditions.ts`):
`user_approval()`, `artifact_exists(name)`, `plan_todos_complete()`,
`evidence_met()`, `tool_observed(name)`, `turn_count(n)`,
`plan_incomplete(name)` and `state_eq(key=value)`, composed with `all`, `any` and
`not`.

```yaml
transitions:
  - when: "tool_observed(graph_declare)"
    activate:
      - synthesize
    deactivate:
      - effort
  - when: "artifact_exists(revision-request)"
    activate:
      - triage
```

### Continue-Until Pattern

Defines when a function's loop terminates. The dual-channel form stops when any
listed condition is met.

```yaml
continue_until:
  any:
    - "artifact_exists(final-report)"
    - "turn_count(12)"
  all:
    - "evidence_met()"
    - "plan_todos_complete()"
```

`any` means stop when any single condition is met; `all` means every condition
must be true. `continue_max` caps the continuation count before a forced stop.

## The Graph v3 Declaration

Stateful orchestration still runs on the outcome protocol. The orchestrator
declares ONE graph per request:

1. Build the whole version-3 declaration object: `version: 3`, a `name` that
   carries the request identity, a finite `budget.max_executions`, one node per
   specialist with its `outcomes`, `completion: {mode: "explicit"}` and
   `budget.timeout_ms`, and one `{from, to, outcome}` edge per route.
2. Put every revise cycle in a `loop_groups` entry with a positive
   `max_traversals`, a `continuation_outcome` declared by a member and an
   `exit_outcome` declared by a member. Continuation edges stay inside the group.
3. Submit it through `graph_declare`. That single call parses, compiles and
   preflights the declaration and starts or resumes the run.
4. End your turn. Read accepted outcomes once with `graph_status` scope `all`,
   format `json`, `include_output` and `include_history`; read
   `attempts[].accepted` and `attempts[].result`.
5. Recover with `graph_control`: `retry` a diagnosed transient failure, `cancel`
   obsolete work, `budget-stop` an exhausted run and raise approval requests
   under the host-installed policy.

- Only an accepted decision with `verdict` `committed` or `replayed` and no
  refusals settles a node; a refusal writes nothing, and no result fence settles
  a node.
- Review cycles are bounded by the loop group's required `max_traversals`, not by
  prose and not by declarative config.
- Concurrency is engine-managed: a run's ceiling is `budget.max_executions`,
  a node's ceiling is `budget.timeout_ms`, and `max_retries` is refused by name.

## Nested Subagent Structure

### First-Level Subagents

Direct children of the orchestrator. They handle domain-level coordination.

```yaml
name: Chancellor
description: "Coordinates architecture and design decisions. Manages drafter, reviewer and finalizer workers."
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

Children of first-level subagents. They do the specialized work and settle their
node's declared outcomes through `graph_submit_outcome`.

```yaml
name: Drafter
description: "Drafts architecture documents and design proposals."
mode: subagent
prompt: |
  You draft architecture documents from the brief the Chancellor supplies.
  Focus on clarity and completeness. When the declared outcome is reached,
  submit it with graph_submit_outcome using the credential this dispatch
  carried, and never print that credential.
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

The node `agent` value is exactly this ID.

## Tool Restrictions

The orchestrator typically restricts its own tools so it cannot do the work
directly, and holds only the declarer split:

```yaml
tools:
  graph_declare: true
  graph_control: true
  graph_status: true
  graph_audit: true
  graph_submit_outcome: false
  graph_worker_exec: false
  Write: false
  Edit: false
  Bash: false
```

A worker subagent holds the inverse (`graph_submit_outcome` and
`graph_worker_exec` `true`, the four declarer tools `false`) plus `Bash: true`
for its checks. Inside a graph the node grant is the binding boundary; a declared
node `tools` list names extra **host** tools only, and a graph-face name in it
admits nothing.

## Graph v3 Concurrency

Concurrency is **engine-managed** — there is no dispatch-concurrency knob to
tune under the outcome protocol. Resource ceilings ride on the declaration:

- `budget.max_executions` at the root caps how many dispatches the run may start;
  each entry dispatch, armed successor and minted retry spends one, and a
  reserved execution is never refunded.
- Per-node `budget.timeout_ms` caps one attempt's wall-clock time.
- Each revise cycle is bounded by its loop group's `max_traversals`.
- Obsolete work is contained with `graph_control` `cancel`; confirm the attempt
  actually ended before starting overlapping work.

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

1. **Reactive, not sequential.** Functions observe lifecycle events and inject
   directives; the agent responds to what is happening.
2. **Auto-activation.** Key functions start active and stay active
   (`locked: true`); the role's `auto_activate` list names them.
3. **Tool-split orchestrator.** The top level holds the declarer tools and cannot
   write files; workers hold `graph_submit_outcome` and `graph_worker_exec`.
4. **Deep nesting.** Sub-subagents handle the actual work; each level adds
   specialization.
5. **Declared topology.** The graph is one immutable version-3 declaration per
   request, not an incrementally built structure.
6. **Lifecycle hooks.** `observe` reactions on `message`, `tool_after` and
   `activate` give the agent awareness of its own session.
7. **Engine-managed resources.** The run's `budget.max_executions`, each node's
   `budget.timeout_ms` and each loop's `max_traversals` bound consumption.

## Comparison with Director-Gated

| Aspect | Director-Gated | Nested State-Machine |
|--------|---------------|---------------------|
| Flow control | Declared edges binding gate outcomes | Declared edges plus reactive function transitions |
| Activation | The declarer builds the node set per request | Auto-activated functions shape the declarer's behaviour |
| Nesting depth | 1 level (director + subagents) | 2-3 levels |
| Orchestrator tools | Declarer split, may read | Declarer split, typically all writing denied |
| Gate mechanism | Skill-based gate checks plus declared outcomes | Function frontmatter gates plus declared outcomes |
| Complexity | Medium | High |
| Best for | Linear review pipelines | Complex adaptive systems |
