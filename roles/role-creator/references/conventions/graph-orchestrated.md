# Graph-Orchestrated Pattern (Graph v3)

A thin declaring role whose coordination runs on the rolebox Graph v3 outcome
protocol. The role declares **ONE graph per request** as a single v3 declaration
through `graph_declare`, ends its turn, and reads the accepted results back
through `graph_status`. It never writes the specialist artifacts itself; it
declares the nodes, collects accepted outcomes and assembles the deliverable.

The live contract for the protocol is
`roles/role-creator/references/graph-protocol.md`; every claim below is grounded
in the installed rolebox source it cites.

## When to Use

- Multi-stage workflows with specialist stages and review gates
- Pipelines that need bounded revise cycles (generator ↔ validator, design ↔
  review)
- Work that must be routed by a declared outcome rather than by reading a
  successor's output
- You want the whole topology declared as data before any worker starts
- The declarer must never do specialist work — it declares, collects and
  assembles

**Don't use when:** the task is single-domain with no coordination (use simple),
or you need reactive lifecycle functions and stateful auto-activation with no
declared topology (use nested-statemachine).

## Directory Layout

```
roles/{role-name}/
├── role.yaml                    # Thin declaring role (40-80 lines)
├── PROMPT.md                    # Declarer prompt with the declaration recipe
├── references/                  # Shared state templates and contracts
│   ├── graph-protocol.md        # The v3 protocol contract this template teaches
│   └── {topic}.md
├── skills/                      # Declarer-level skills (delegation, recovery)
│   └── {role}-{domain}/
│       └── SKILL.md
└── subagents/                   # Worker agents ({role}--{slug})
    ├── {subagent-slug}/
    │   ├── role.yaml            # Minimal worker definition (8-15 lines)
    │   └── skills/
    │       └── {role}--{subagent-slug}~{skill-name}/
    │           └── SKILL.md
    └── {another-subagent}/
        └── role.yaml
```

No `functions/` directory is required (defaults apply). If present it holds a
small set of declarer-level functions; the coordination logic itself lives in
PROMPT.md and the declaration. Nothing builds a graph incrementally: the
topology is fixed when the declaration compiles.

## role.yaml Shape

Typically 40-80 lines. The distinguishing feature is the `tools:` block that
declares the **declarer split** — the machine-checkable marker of the pattern.

### Required Fields

| Field | Purpose |
|-------|---------|
| `name` | Human-readable role name |
| `description` | One-line summary for discovery and dispatch |
| `prompt_file` | Points to PROMPT.md |
| `tools` | The declarer tool split (below) |

### Common Fields

| Field | Purpose |
|-------|---------|
| `version` | SemVer string |
| `mode` | `primary` |
| `functions` | Optional — defaults apply |
| `skills` | Declarer-level skills |
| `references` | Static docs the declarer reads; register `graph-protocol` and this convention so every declared reference name resolves on disk |
| `permission` | `allow` list of the tools the declaring session may call |

There is **no `graph:` block and no `collaboration:` block**. The loader
recognizes `graph:` and logs that the key is recognized but not wired into graph
resolution (no runtime effect), and it reads no `collaboration:` key at all.
Orchestration lives in the v3 declaration, not in role.yaml.

### The `tools:` declarer split

| Tool | Declaring role | Worker subagent |
|------|----------------|-----------------|
| `graph_declare` | `true` | `false` |
| `graph_control` | `true` | `false` |
| `graph_status` | `true` | `false` |
| `graph_audit` | `true` | `false` |
| `graph_submit_outcome` | `false` | `true` |
| `graph_worker_exec` | `false` | `true` |
| `Write` / `Edit` / `Bash` | per the role's own job (a thin declarer denies all three) | per the worker's job |

A node may also declare extra **host** tools in the declaration's `tools` string
array; a `graph_`-prefixed name there admits nothing, because the graph namespace
is refused before the entries are consulted. Inside a graph the node grant is the
binding boundary, not the worker's own manifest.

### Example role.yaml

```yaml
name: Design Director
description: "Thin declaring role. Declares ONE Graph v3 pipeline per request, collects accepted outcomes and assembles the deliverable. Never writes code."
version: "3.2.0"
mode: primary
prompt_file: PROMPT.md
functions:
  - orchestrate
references:
  graph-protocol:
    path: references/graph-protocol.md
    description: The Graph v3 protocol contract this role declares against
  conventions/graph-orchestrated:
    path: references/conventions/graph-orchestrated.md
    description: This template's topology and declaration recipe
skills:
  - design-director-core
# The declarer split: this session declares, controls, reads and audits graphs.
# It does not submit outcomes and does not run worker commands.
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

## Declarer Prompt (PROMPT.md)

The PROMPT.md is the heart of the pattern, typically 150-350 lines. Structure:

1. **Identity statement.** "You declare ONE graph per request; you never do the
   specialist work."
2. **Worker roster.** Each node agent (`{role}--{slug}`) with its purpose and
   its declared outcomes.
3. **Declaration recipe.** How to build the whole declaration object (below).
4. **Collection and assembly.** Read accepted results once with `graph_status`;
   reconcile accepted outcomes into the deliverable.
5. **Recovery.** How to use `graph_control` for a diagnosed failure, an obsolete
   run, an approval gate or a stopped run.

The declarer contains no domain expertise. It knows *who* to ask, *when*, and
*which outcome routes where*.

## Declaration Recipe

Author the whole topology as **one declaration object**, one per request:

1. **Set the identity and the run ceiling.**
   `version: 3`, `name: "<request identity>"` (the name is the graph id), and
   `budget: {max_executions: N}` covering every selected node and every loop
   continuation.
2. **Declare one node per specialist stage.**
   Each node has an `id`, an `agent` (`<role>--<slug>`) and a `prompt` carrying
   every input the worker needs — node sessions share no conversation history.
   Declare the node's `outcomes`, `completion: {mode: "explicit"}` and
   `budget.timeout_ms`; declare `tools` only for an extra host capability the
   node genuinely needs.
3. **Declare the routes.**
   Every edge is `{from, to, outcome}` and binds one outcome its source node
   declares. There is no implicit edge and no predicate field. A consumer that
   reads an upstream result additionally declares `inputs: [{from, outcome}]`
   and, when it must wait for every prerequisite, `join: {strategy: "all"}`.
4. **Bound every cycle.**
   A cycle must sit inside a `loop_groups` entry with a positive
   `max_traversals`, a `continuation_outcome` that re-enters the loop and an
   `exit_outcome` that leaves it. Both route outcomes must be declared by a
   member node, and every edge carrying the continuation outcome must stay
   inside the group. A cycle no group covers cannot compile.
5. **Declare the graph.**
   Submit the entire object as `graph_declare({declaration: {...}})` — the only
   start path. The call parses, compiles, preflights capabilities, persists the
   plan and starts or resumes the run. There is no separate run tool and no
   dry-run tool.
6. **Inspect the start decision, then end the turn.**
   The result reports `persisted` and `start.kind`. `started` and `resumed` are
   real dispatch; `saved`, `blocked` and `refused` are not. A saved plan is not
   proof of dispatch; diagnose a refusal before any recovery and never declare a
   duplicate graph because startup looks slow.

Only after the declaration is accepted and started does the ready node set run.
Between turns the declaring session is notified when the run completes, stops or
needs attention. A notification identifies the graph, the run and a stable
notification id and carries no business payload; it never drives execution and
its delivery is at least once, so duplicates do not authorize duplicate work.

## Collect Accepted Results

Collect **once**, from committed state, with:

```text
graph_status({graph_id, scope: "all", format: "json", include_output: true, include_history: true})
```

Read `attempts[].accepted` for the outcome identity and `attempts[].result` for
the accepted data, together with the loops, controls, approvals, budget and
unsettled effects. Select the intended producer with `run_id` and `node_id`; JSON
output is not paginated by offset or max_chars, so narrow by identity when the
host display truncates it.

Only an **accepted** decision whose `verdict` is `committed` or `replayed` and
whose `refusals` are empty settles a node. A rejection leaves the attempt open; a
refusal writes nothing and returns structured repair diagnostics. A result fence
or a signal never settles a v3 node. A complete graph can still hold a failed or
blocked business outcome and unsettled effects, so graph phase is not business
success and a settled node is not a passing result. Poll `graph_status` only as
recovery for a missing notification, never as a busy loop.

## Bounded Revise Cycles with `loop_groups`

Revise/review cycles are declared as a loop group, and the engine enforces the
bound:

```json
"loop_groups": [
  {
    "id": "generate-validate",
    "nodes": ["{role}--generator", "{role}--validator"],
    "max_traversals": 3,
    "continuation_outcome": "revise",
    "exit_outcome": "pass"
  }
]
```

- `max_traversals` is a hard positive cap; the run stops with `loop-exhausted`
  when it is reached.
- The continuation outcome must be declared by a member and its edge must stay
  inside the group; an edge carrying it out of the group is a structural defect.
- The exit outcome must be declared by a member and carries the work onward.
- Members are a set; declaration order carries no meaning.
- A loop may also declare an optional `progress` policy
  (`{evaluator, version, subject, max_unchanged}`) that stops a run when
  consecutive rounds compare unchanged.
- When the bound is reached with an unresolved failure, surface the limitation
  honestly in the deliverable rather than re-declaring the same graph.

## Approval Gates in the v3 Vocabulary

Approval is a declarative gate, not a message:

- The declaration's node outcome declares the `principal-approval@1` acceptance
  primitive, and the host must have installed an approval rule for that exact
  graph and node — the capability preflight refuses the declaration otherwise.
- The declaring session raises `graph_control(command: "approval-request", ...)`
  for an in-flight attempt, naming the approver session and an epoch-millisecond
  deadline. Only the policy-authorized session issues `approve` or `reject`.
- A decision records a control decision; it does not submit a business outcome
  and does not perform the remaining action. Reject the request and contain the
  obsolete run with `graph_control` `cancel` where work remains.

Never present an approval request as permission, and never fabricate user
consent.

## Recovery

`graph_control` acts on the plan, not on business data:

- `failure` and `timeout` record an attempt that failed or exceeded its declared
  time out of band; they are distinct from the `failed` business outcome a worker
  submits.
- `retry` mints a NEW attempt for a diagnosed transient failure and spends
  budget; a run-scoped `retry` re-executes a terminal run as a successor run with
  the same immutable plan. Neither guarantees session reuse, and a node-scoped
  retry on a stopped run is refused.
- `cancel` contains obsolete or superseded work; a cancel request is not
  confirmed termination, so never start overlapping work while a worker may
  still be reading the delivered snapshot.
- `budget-stop` records an exhausted run.
- Use `graph_audit` to diagnose storage or recovery blockers; never delete or
  recreate an unreadable store.

No control command converts an incomplete report into an accepted outcome.

## Naming Conventions

| Thing | Convention | Example |
|-------|-----------|---------|
| Role directory | lowercase, hyphens | `design-director` |
| Subagent directory | lowercase, hyphens (slug) | `subagents/review/` |
| Node agent | `{role}--{slug}` | `design-director--review` |
| Node `id` | short stage name, stable | `intake`, `design`, `review` |
| Loop group `id` | stage pair | `design-review` |
| Subagent skill dir | `{role}--{slug}~{skill-name}` | `design-director--review~review-gate` |
| PROMPT file | Always `PROMPT.md` at role root | `roles/design-director/PROMPT.md` |

## Typical Size Ranges

| Component | Lines |
|-----------|-------|
| role.yaml (declarer) | 40-80 |
| PROMPT.md (declarer) | 150-350 |
| Subagent role.yaml | 8-15 |
| Subagent PROMPT.md / SKILL.md | 50-150 |
| Reference templates | 50-150 |
| Total subagents | 2-8 |

## Key Characteristics

1. **Thin declarer.** It declares the topology, collects accepted outcomes and
   assembles; it never does the specialist work.
2. **One declaration per request.** The whole topology is one version-3 document
   submitted to `graph_declare`; there is no incremental construction tool.
3. **Declared, not imperative.** The compiled plan is the only topology
   authority, and a declaration is immutable — a changed topology needs a new
   graph name.
4. **Outcome-routed edges.** Every edge binds one outcome its source node
   declares; there is no implicit "any outcome" edge.
5. **Engine-enforced loop bounds.** Every cycle sits in a `loop_groups` entry
   with a required `max_traversals` — no unbounded cycles and no round-count
   prose.
6. **Accepted-outcome transport.** Only an accepted submission with `committed`
   or `replayed` and no refusals settles a node; the declaring session reads
   `attempts[].accepted` and `attempts[].result`.
7. **Declarative approval gates.** A node outcome declares
   `principal-approval@1`; the declaring session raises and resolves the request
   through `graph_control` under a host-installed policy.
8. **Bounded recovery.** `graph_control` retries a diagnosed transient failure,
   cancels obsolete work and stops an exhausted run; no control command settles
   a business outcome.
9. **Tool-split marker.** The `tools:` declarer split, plus the submitted
   declaration, is the machine-checkable signature of this pattern.

## Comparison with Director-Gated

| Aspect | Graph-Orchestrated | Director-Gated |
|--------|--------------------|----------------|
| Topology | Declared as one v3 document per request | Declared as one v3 document per request |
| Declarer role.yaml marker | `tools:` declarer split plus the submitted declaration | `tools:` declarer split plus the submitted declaration |
| Loop bounding | `loop_groups` `max_traversals` — required, engine-enforced | `loop_groups` `max_traversals` — required, engine-enforced |
| Routing | Edges bind declared outcomes on every node | Gate outcomes bind edges at each stage |
| Result collection | `graph_status` accepted results, read once | `graph_status` accepted results, read once |
| Approval path | `graph_control` under a host-installed policy | `graph_control` under a host-installed policy |
| Best for | Runtime-shaped pipelines with dynamic stages | Fixed specialist review pipelines |
