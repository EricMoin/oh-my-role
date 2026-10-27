# rolebox search graph protocol

SuperSearch runs on the rolebox graph v3 outcome protocol: `graph_declare`,
`graph_submit_outcome`, `graph_control`, `graph_status` and `graph_audit`. The
installed runtime's tool schema is authoritative if its version differs from this
reference; re-verify protocol changes against rolebox
`docs/graph-outcome-protocol.md` and `src/graph/`. No shell command substitutes
for calling the engine's graph tools during role execution.

## Ownership

SuperSearch is the declaring session and the sole owner of the plan, synthesis
and acceptance. Each scout and the evidence auditor are read-only graph workers:
they settle their own declared outcome through `graph_submit_outcome` and never
declare, control, query or audit a graph, and never create a child graph.

| Tool | What it does | Who may call it |
|---|---|---|
| `graph_declare({declaration})` | Strict parse, compile, capability preflight, persist and start/resume one graph in a single call; returns the persisted plan and `start.kind` | The declaring SuperSearch session |
| `graph_submit_outcome({graph_id, node_id, outcome_id, credential, data})` | Settles the caller's own attempt with one declared outcome; the host derives attempt, submission and compiled-revision identity | Every worker, for its own node and attempt only |
| `graph_control` | Lifecycle decisions: failure, cancel, timeout, retry, budget-stop, approval-request, approve, reject | The declaring SuperSearch session |
| `graph_status` | Reads committed state: phase, nodes, attempts, controls, approvals, budget, unsettled effects | The declaring SuperSearch session |
| `graph_audit` | Diagnoses storage and recovery blockers without mutating state | The declaring SuperSearch session |

## Declaration shape

`graph_declare` receives the whole object: `version: 3`, `name` (the graph id), a
finite root `budget.max_executions`, `nodes` and `edges`. Every node declares
`outcomes`, `completion: {mode: "explicit"}` and `budget.timeout_ms`; every edge
is `{from, to, outcome}` and binds an outcome its source node declares.

- A consumer declares `inputs: [{from, outcome}]` for each upstream result it
  reads — edges schedule work but do not deliver payloads — and
  `join: {strategy: "all"}` when every prerequisite must complete.
- Route an execution dependency only on the declared success outcome
  (`evidence_ready`); `no_evidence`, `blocked` and `failed` are declared exits and
  never feed a downstream node.
- A bounded cycle exists only inside a `loop_groups` entry carrying
  `max_traversals`, `continuation_outcome` and `exit_outcome`, and every edge
  carrying the continuation outcome stays inside its group. Self-correcting
  research rounds belong there; they are not separate graphs.
- Leave at least one declared outcome unbound so the graph can terminate.
- Author no `max_retries` — it is rejected even as `0`.
- Declare **no** `acceptance` and **no** outcome `data` schema on any node: this
  host registers no validators and no business JSON schemas, so such a
  declaration compiles only as a non-executable draft and is refused. Payload
  shape is a prompt contract documented in
  [schemas.md](schemas.md), carried as inert `data`, not an engine gate.

## Topology templates

Two templates are shipped: the standard multi-channel `channel-fanout`, and the
narrower `single-channel-plus-audit` for a question that needs one channel plus
an independent contradiction pass. Their concrete declarations live in
[graph-examples.json](graph-examples.json); the two blocks below are the same
objects. Replace every prompt placeholder and the graph `name` with the real
brief for the current request; the ids and outcomes stay as declared.

### channel-fanout

Three read-only scouts are independent entry roots, so one start arms local,
web and source search in parallel. The evidence auditor is the `join: all`
consumer of their `evidence_ready` results: it is armed only after every declared
input settled, and it owns the contradiction, source-quality and missing-check
pass. `no_evidence`, `blocked` and `failed` are declared exits, so a scout that
cannot produce evidence settles honestly instead of fabricating one.

```json
{
  "version": 3,
  "name": "channel-fanout",
  "budget": { "max_executions": 8 },
  "nodes": [
    {
      "id": "supersearch--local-scout",
      "agent": "supersearch--local-scout",
      "prompt": "Template placeholder - replace with the real node brief: objective, freshness and acceptance criteria, the accepted input attempts to consume, the local channel scope, the read-only workspace rules, the .rolebox/scratch/ exception, the schema_version 1 scout-report shape.",
      "completion": { "mode": "explicit" },
      "budget": { "timeout_ms": 300000 },
      "outcomes": [
        { "id": "evidence_ready" },
        { "id": "no_evidence" },
        { "id": "blocked" },
        { "id": "failed" }
      ]
    },
    {
      "id": "supersearch--web-scout",
      "agent": "supersearch--web-scout",
      "prompt": "Template placeholder - replace with the real node brief: objective, freshness and acceptance criteria, the accepted input attempts to consume, the web channel scope, the anti-crawl engine order, the read-only workspace rules, the .rolebox/scratch/ exception, figure-candidate extraction, the schema_version 1 scout-report shape.",
      "completion": { "mode": "explicit" },
      "budget": { "timeout_ms": 300000 },
      "outcomes": [
        { "id": "evidence_ready" },
        { "id": "no_evidence" },
        { "id": "blocked" },
        { "id": "failed" }
      ]
    },
    {
      "id": "supersearch--source-scout",
      "agent": "supersearch--source-scout",
      "prompt": "Template placeholder - replace with the real node brief: objective, freshness and acceptance criteria, the accepted input attempts to consume, the source channel scope (GitHub, repositories, issues, releases, package metadata, official docs), the read-only workspace rules, the .rolebox/scratch/ exception for API pagination scripts, figure-candidate extraction, the schema_version 1 scout-report shape.",
      "completion": { "mode": "explicit" },
      "budget": { "timeout_ms": 300000 },
      "outcomes": [
        { "id": "evidence_ready" },
        { "id": "no_evidence" },
        { "id": "blocked" },
        { "id": "failed" }
      ]
    },
    {
      "id": "supersearch--evidence-auditor",
      "agent": "supersearch--evidence-auditor",
      "prompt": "Template placeholder - replace with the real node brief: the objective, the three accepted evidence_ready results to consume and their attempt bindings, the audit-only scope, the html report path when a report was requested, the schema_version 1 audit-report shape.",
      "completion": { "mode": "explicit" },
      "budget": { "timeout_ms": 420000 },
      "outcomes": [
        { "id": "audit_ready" },
        { "id": "blocked" },
        { "id": "failed" }
      ],
      "join": { "strategy": "all" },
      "inputs": [
        { "from": "supersearch--local-scout", "outcome": "evidence_ready" },
        { "from": "supersearch--web-scout", "outcome": "evidence_ready" },
        { "from": "supersearch--source-scout", "outcome": "evidence_ready" }
      ]
    }
  ],
  "edges": [
    {
      "from": "supersearch--local-scout",
      "to": "supersearch--evidence-auditor",
      "outcome": "evidence_ready"
    },
    {
      "from": "supersearch--web-scout",
      "to": "supersearch--evidence-auditor",
      "outcome": "evidence_ready"
    },
    {
      "from": "supersearch--source-scout",
      "to": "supersearch--evidence-auditor",
      "outcome": "evidence_ready"
    }
  ]
}
```

### single-channel-plus-audit

The narrower shape for a single-channel question that still needs an independent
audit: one scout root plus the `join: all` auditor. It keeps the same outcome
vocabulary and the same declared exits.

```json
{
  "version": 3,
  "name": "single-channel-plus-audit",
  "budget": { "max_executions": 5 },
  "nodes": [
    {
      "id": "supersearch--web-scout",
      "agent": "supersearch--web-scout",
      "prompt": "Template placeholder - replace with the real node brief: objective, freshness and acceptance criteria, the web channel scope, the anti-crawl engine order, the read-only workspace rules, the .rolebox/scratch/ exception, figure-candidate extraction, the schema_version 1 scout-report shape.",
      "completion": { "mode": "explicit" },
      "budget": { "timeout_ms": 300000 },
      "outcomes": [
        { "id": "evidence_ready" },
        { "id": "no_evidence" },
        { "id": "blocked" },
        { "id": "failed" }
      ]
    },
    {
      "id": "supersearch--evidence-auditor",
      "agent": "supersearch--evidence-auditor",
      "prompt": "Template placeholder - replace with the real node brief: the objective, the accepted evidence_ready result to consume and its attempt binding, the audit-only scope, the html report path when a report was requested, the schema_version 1 audit-report shape.",
      "completion": { "mode": "explicit" },
      "budget": { "timeout_ms": 420000 },
      "outcomes": [
        { "id": "audit_ready" },
        { "id": "blocked" },
        { "id": "failed" }
      ],
      "join": { "strategy": "all" },
      "inputs": [
        { "from": "supersearch--web-scout", "outcome": "evidence_ready" }
      ]
    }
  ],
  "edges": [
    {
      "from": "supersearch--web-scout",
      "to": "supersearch--evidence-auditor",
      "outcome": "evidence_ready"
    }
  ]
}
```

## Declared outcome vocabulary

| Node | Declared outcomes | Meaning |
|---|---|---|
| Scout (local, web, source) | `evidence_ready` | The channel search completed and a `schema_version: 1` scout report is recorded, including a failing or empty observation |
| Scout (local, web, source) | `no_evidence` | The channel was searched honestly and produced nothing usable for the objective |
| Scout (local, web, source) | `blocked` | A concrete prerequisite is missing, such as unavailable credentials, tooling or source access |
| Scout (local, web, source) | `failed` | The node could not complete its channel work; never a passing report |
| Evidence auditor | `audit_ready` | The requested audit completed and the audit report is recorded |
| Evidence auditor | `blocked`, `failed` | The audit could not run or could not be completed; never a passing audit |

## Node brief

Supply enough context to search without the declaring conversation:

- Objective, freshness requirement, likely source types and acceptance criteria.
- The exact channel scope and expected evidence type; read-only workspace rules
  and the `.rolebox/scratch/` / `.rolebox/reports/` write exceptions.
- The report shape from [schemas.md](schemas.md) and the figure-candidate rule.
- For the auditor: the accepted `evidence_ready` inputs, their attempt bindings,
  the html report path when one was produced, and the audit scope.

## Acceptance semantics

- Routing follows accepted outcome ids, not payload keys: fields in submitted
  `data` are inert and the engine never inspects them.
- A consumer is released only by the accepted results its declared `inputs` name.
  Node exit and graph phase prove neither.

## Read and wait

After `graph_declare`, inspect the result: a persisted plan **and** `start.kind`.
`started`/`resumed` are real dispatch; `saved`/`blocked`/`refused` are not, and a
saved plan is not proof of dispatch. Then END THE TURN and yield for the real
`[GRAPH COMPLETE]` / `[GRAPH BLOCKED]` notification; never busy-poll.

Read accepted results once with `graph_status({graph_id, scope: "all",
format: "json", include_output: true, include_history: true})`, bounded by
`run_id`/`node_id`. Read `attempts[].accepted` for the outcome identity and
`attempts[].result` for the accepted data. JSON output is not paginated by
offset/max_chars. A complete run may still carry `no_evidence`, `blocked` or
`failed` results and unsettled effects, so graph phase is not research success.

## Controls

`graph_control` commands act on the plan, not on business data. `failure` records
a failed attempt out of band, distinct from the `failed` business outcome a
worker submits. `retry` mints a NEW attempt for a diagnosed transient failure and
consumes budget. `cancel` contains obsolete work and is not confirmed termination
until state says so. `timeout` and `budget-stop` record an exhausted node or run.
A control command is never an outcome and never confirms research quality.

## Validation and recovery

A `no_evidence`, `blocked` or `failed` result is a declared exit, not a passing
prerequisite. Reconcile it against the other settled channels, state the missing
evidence in the answer, and only declare a fresh focused graph when the objective
still needs the channel that failed, with a new graph name and its own budget. If
revisions exceed the declared scope, reconcile scope first. A new revision is a
new graph, not an in-place topology edit, and workers never create child graphs.

## Source locations for maintenance

In a rolebox checkout, verify protocol changes against:

- `src/graph/tools/graph-tools.ts` and `src/graph/tools/submit-outcome.ts`: tool
  schemas and the submission path for declare, submit, control, status and audit.
- `src/graph/compiler/parse-declaration-v3.ts` and `src/graph/compiler/compile.ts`:
  declaration grammar, compile rules, terminals and loop-group validation.
- `src/graph/outcome/runtime.ts` and `src/graph/outcome/acceptance.ts`:
  acceptance decisions, verdicts, refusals, attempt credentials and budget.
- `src/graph/query/render.ts`: status and audit rendering, including JSON output.
- `src/loader/role-loader.ts` and `src/resolver/skill-resolver.ts`: child
  discovery, prompt loading and skill resolution.
