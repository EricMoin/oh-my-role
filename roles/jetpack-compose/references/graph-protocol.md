# rolebox review graph protocol

This role reviews a Jetpack Compose implementation through the rolebox Graph v3
outcome protocol: `graph_declare`, `graph_submit_outcome`, `graph_control`,
`graph_status` and `graph_audit`. The installed runtime's tool schemas are
authoritative if they differ from this reference. Re-verify protocol changes
against rolebox `docs/graph-outcome-protocol.md` and `src/graph/` whenever the
installed runtime version changes.

The lead is the sole production-code writer and the declaring session: it owns the
plan, the node briefs and every repair. The five specialists are read-only evidence
nodes. The graph schedules evidence gathering and review; it never schedules
architectural decisions, and no specialist writes production code.

## Tools

| Tool | What it does | Who may call it |
| --- | --- | --- |
| `graph_declare({declaration})` | Strict parse, compile, capability preflight, persist and start or resume one graph in a single call; returns the persisted plan and `start.kind` | The declaring lead session |
| `graph_control(command, ...)` | Out-of-band control decisions: `failure`, `cancel`, `retry`, `timeout`, `budget-stop` | The declaring lead session |
| `graph_status({...})` | Reads committed state: phase, nodes, attempts, controls, approvals, budget and unsettled effects | The declaring lead session |
| `graph_audit({...})` | Diagnoses storage and recovery blockers without mutating state | The declaring lead session |
| `graph_submit_outcome({graph_id, node_id, outcome_id, credential, data})` | Settles the caller's own attempt with one declared outcome; the host derives attempt, submission and compiled-revision identity | Each worker, for its own node and attempt only |
| `graph_worker_exec(command)` | Sandboxed workspace commands for reading, editing, checks and tests | Each worker, inside its own scope |

A specialist NEVER declares, controls, queries or audits a graph, never creates a
child graph, never dispatches another worker and never reads another attempt's
credential. Tool availability does not enlarge the role or the node scope.

## Declare and start

`graph_declare` is the only start path. The call performs strict parsing,
compilation and capability preflight, and the registered host entry starts or
resumes execution. There is no separate run tool and no dry-run tool.

Submit the entire object as `graph_declare({declaration: {...}})`:

- `version: 3`, `name` (the name is the graph id; replace the sample identity with
  the request identity), a finite root `budget.max_executions`, `nodes` and `edges`.
- Every node declares `outcomes`, `completion: {mode: "explicit"}` and
  `budget.timeout_ms`. These templates always use explicit submission; natural
  completion would require a host-authorized policy.
- Every edge is `{from, to, outcome}` and binds one outcome its source node
  declares. Only that accepted outcome activates the edge.
- A consumer declares `inputs: [{from, outcome}]` for each upstream result it
  reads. Edges schedule work; declared inputs deliver payloads. An edge alone does
  not insert the producer payload into the consumer prompt, and the consumer MUST
  NOT invent a missing predecessor result.
- Use `join: {strategy: "all"}` when every prerequisite must complete before the
  node starts.
- Do not author `max_retries`; it is rejected even as `0`. Do not author
  `loop_groups`, `acceptance`, `contractRef` or `completion_policy`: this review
  topology declares no engine-managed cycle and the host installs no such
  capability. An uninstalled capability is refused as a non-executable draft.
- Budget: every new attempt spends an execution, including entry nodes and retries.
  There is no refund for a settled or cancelled attempt and no automatic retry
  policy.

Inspect the call result: the persisted plan **and** `start.kind`. `started` and
`resumed` are real dispatch; `saved`, `blocked` and `refused` are not. A saved plan
is not proof of dispatch. Diagnose a refusal before any recovery, and never declare
a duplicate graph because startup looks slow.

## Canonical review declaration

The declaration below is this role's single source of truth. It is a complete
`graph_declare` argument: replace `name` with the request identity and every prompt
placeholder with the real brief for the current snapshot. Keep the pinned node ids,
agents, declared outcomes, edges and join.

```json
{
  "version": 3,
  "name": "compose-review-sample-r0-c0",
  "budget": {
    "max_executions": 7
  },
  "nodes": [
    {
      "id": "source-behavior",
      "agent": "jetpack-compose--source-tracer",
      "prompt": "Template placeholder - replace with the real evidence brief for this node: the goal and the concrete source question, for example how the named Compose runtime, Material 3 or AndroidX API actually resolves a state read at the reviewed version; the snapshot or diff under review with commit and uncommitted changes; the readable source roots and module versions; the exact file:line or command evidence to collect; and the read-only scope. Do not edit files, run mutating builds or write shared caches. Submit exactly the declared outcome id report through graph_submit_outcome with the attempt credential this dispatch carried, as schema_version 1 data following references/schemas.md. A report means the assessment completed, including negative findings, and is never a product verdict. Only an accepted decision, verdict committed or replayed with no refusals, settles this node; a refusal writes nothing, so repair the payload or the missing evidence and resubmit. Use graph_worker_exec for every workspace command.",
      "completion": {
        "mode": "explicit"
      },
      "budget": {
        "timeout_ms": 300000
      },
      "outcomes": [
        {
          "id": "report"
        }
      ]
    },
    {
      "id": "source-versions",
      "agent": "jetpack-compose--source-tracer",
      "prompt": "Template placeholder - replace with the real evidence brief for this node: the concrete dependency question, for example which AndroidX, Compose BOM, Kotlin or Gradle versions the reviewed snapshot actually resolves and which API surface they expose; the snapshot or diff under review with commit and uncommitted changes; the build files, version catalogs and lock files to read; the exact resolution command or file:line evidence to collect; and the read-only scope. Do not edit files, run mutating builds or write shared caches. Submit exactly the declared outcome id report through graph_submit_outcome with the attempt credential this dispatch carried, as schema_version 1 data following references/schemas.md. A report means the assessment completed, including negative findings, and is never a product verdict. Only an accepted decision, verdict committed or replayed with no refusals, settles this node; a refusal writes nothing, so repair the payload or the missing evidence and resubmit. Use graph_worker_exec for every workspace command.",
      "completion": {
        "mode": "explicit"
      },
      "budget": {
        "timeout_ms": 300000
      },
      "outcomes": [
        {
          "id": "report"
        }
      ]
    },
    {
      "id": "architecture",
      "agent": "jetpack-compose--architecture-reviewer",
      "prompt": "Template placeholder - replace with the real review brief for this node: the reviewed snapshot or diff with artifact paths, the architecture invariants, ownership and dependency rules to check, the concrete question, the read-only scope, and the two declared inputs source-behavior:report and source-versions:report that this dispatch carries. Consume those accepted reports as evidence, never as verdicts, and load the architecture gate skill for this review. Submit exactly one declared outcome through graph_submit_outcome with the attempt credential this dispatch carried and the gate report from references/schemas.md as schema_version 1 data: pass when no supported blocking issue exists in the assigned scope, revise for concrete blocking issues with stable required_revisions, or escalate when essential evidence or user intent is unavailable. Only an accepted decision, verdict committed or replayed with no refusals, settles this node; a refusal writes nothing, so repair the payload and resubmit. Use graph_worker_exec for read-only inspection commands.",
      "completion": {
        "mode": "explicit"
      },
      "budget": {
        "timeout_ms": 300000
      },
      "outcomes": [
        {
          "id": "pass"
        },
        {
          "id": "revise"
        },
        {
          "id": "escalate"
        }
      ],
      "join": {
        "strategy": "all"
      },
      "inputs": [
        {
          "from": "source-behavior",
          "outcome": "report"
        },
        {
          "from": "source-versions",
          "outcome": "report"
        }
      ]
    },
    {
      "id": "ui-layout",
      "agent": "jetpack-compose--ui-layout-reviewer",
      "prompt": "Template placeholder - replace with the real review brief for this node: the reviewed snapshot or diff with artifact paths, the layout, modifier, Material 3 and accessibility invariants to check, the concrete question, the read-only scope, and the declared inputs, which are none. Load the ui-layout gate skill and inspect only. Submit exactly one declared outcome through graph_submit_outcome with the attempt credential this dispatch carried and the gate report from references/schemas.md as schema_version 1 data: pass when no supported blocking issue exists in the assigned scope, revise for concrete blocking issues with stable required_revisions, or escalate when essential evidence or user intent is unavailable. Only an accepted decision, verdict committed or replayed with no refusals, settles this node; a refusal writes nothing, so repair the payload and resubmit. Use graph_worker_exec for read-only inspection commands.",
      "completion": {
        "mode": "explicit"
      },
      "budget": {
        "timeout_ms": 300000
      },
      "outcomes": [
        {
          "id": "pass"
        },
        {
          "id": "revise"
        },
        {
          "id": "escalate"
        }
      ]
    },
    {
      "id": "test-quality",
      "agent": "jetpack-compose--test-quality-reviewer",
      "prompt": "Template placeholder - replace with the real review brief for this node: the reviewed snapshot or diff with artifact paths, the test-pyramid, composeTestRule, determinism, coverage and preview invariants to check, the concrete question, the read-only scope, and the declared inputs, which are none. Load the test-quality gate skill and inspect only. Submit exactly one declared outcome through graph_submit_outcome with the attempt credential this dispatch carried and the gate report from references/schemas.md as schema_version 1 data: pass when no supported blocking issue exists in the assigned scope, revise for concrete blocking issues with stable required_revisions, or escalate when essential evidence or user intent is unavailable. Only an accepted decision, verdict committed or replayed with no refusals, settles this node; a refusal writes nothing, so repair the payload and resubmit. Use graph_worker_exec for read-only inspection commands.",
      "completion": {
        "mode": "explicit"
      },
      "budget": {
        "timeout_ms": 300000
      },
      "outcomes": [
        {
          "id": "pass"
        },
        {
          "id": "revise"
        },
        {
          "id": "escalate"
        }
      ]
    },
    {
      "id": "performance",
      "agent": "jetpack-compose--performance-reviewer",
      "prompt": "Template placeholder - replace with the real review brief for this node: the reviewed snapshot or diff with artifact paths, the recomposition, stability, allocation, Macrobenchmark and Baseline Profile invariants to check, the concrete question, the read-only scope, and the declared inputs, which are none. Load the performance gate skill and inspect only. Submit exactly one declared outcome through graph_submit_outcome with the attempt credential this dispatch carried and the gate report from references/schemas.md as schema_version 1 data: pass when no supported blocking issue exists in the assigned scope, revise for concrete blocking issues with stable required_revisions, or escalate when essential evidence or user intent is unavailable. Only an accepted decision, verdict committed or replayed with no refusals, settles this node; a refusal writes nothing, so repair the payload and resubmit. Use graph_worker_exec for read-only inspection commands.",
      "completion": {
        "mode": "explicit"
      },
      "budget": {
        "timeout_ms": 300000
      },
      "outcomes": [
        {
          "id": "pass"
        },
        {
          "id": "revise"
        },
        {
          "id": "escalate"
        }
      ]
    }
  ],
  "edges": [
    {
      "from": "source-behavior",
      "to": "architecture",
      "outcome": "report"
    },
    {
      "from": "source-versions",
      "to": "architecture",
      "outcome": "report"
    }
  ]
}
```

## Topology semantics

- `source-behavior` and `source-versions` are independent evidence roots: neither
  has an inbound edge, so the engine may run them concurrently, and each settles
  only `report`. They answer different questions, the runtime behavior of the API
  under review and the resolved dependency or module versions, so one cannot
  substitute for the other.
- `ui-layout`, `test-quality` and `performance` are independent review roots. They
  declare no inputs: each reviews the snapshot named in its own prompt and settles
  `pass`, `revise` or `escalate`. Do not add serial edges merely to impose a
  checklist order.
- `architecture` is the join node. Its declared inputs are the two accepted `report`
  results, and `join: {strategy: "all"}` releases it only after both producers
  settle `report`. Both edges carry `report` into that same consumer.
- The graph declares no production writer node, no engine-managed repair cycle and
  no approval node. `revise` and `escalate` are terminal outcomes of a review root:
  they return findings to the lead, who owns the repair.
- The declaration is immutable and bound to one snapshot. A changed snapshot needs
  a new declaration with a new name, not an in-place topology edit.

## Node brief

Every node prompt carries enough context to act without the lead's conversation:

- Goal, expected behavior, the user authorization already given, and the concrete
  question this node answers.
- The reviewed snapshot: commit plus local diff or artifact identifier, including
  uncommitted changes. Never call HEAD the pre-edit baseline when dirty changes
  exist. If no snapshot is available, say so explicitly.
- Read-only scope: the readable source roots, artifact paths and versions, and the
  commands the node may run. Reviewers and source tracers MUST NOT edit the
  workspace, run mutating builds or write shared caches.
- Project facts and constraints: relevant versions, established architecture, build
  and test conventions, invariants, and the design decision under review.
- The declared outcome ids the node may submit, the report shape from
  `references/schemas.md`, the attempt credential carried by the dispatch, and the
  submission discipline below.
- For a consumer, the declared inputs it reads. Dispatch inputs are authoritative
  over the prompt snapshot. If a declared input is missing or incomplete, settle
  `escalate` with the exact missing evidence instead of inventing a predecessor
  result.

Node sessions do not share conversation history. Declared inputs and the shared
workspace carry upstream results and artifacts; do not claim a file is
inaccessible merely because the session differs.

## Worker submission

Submitting an outcome is the only way a node settles:

1. Finish the read-only assessment and write the report first.
2. Call `graph_submit_outcome({graph_id, node_id, outcome_id, credential, data})`
   with the node's declared `outcome_id`, the attempt credential this dispatch
   carried, and the schema_version 1 payload as `data`. Use only your own attempt
   credential: never print it, never write it into a file or report, and never use
   another attempt's credential.
3. Never supply attempt, submission or compiled-revision identity; the host derives
   them from its own state.
4. The only settling decision is `accepted` with verdict `committed` or `replayed`
   and no refusals. A rejection or refusal writes nothing and leaves the attempt
   open: read the refusal diagnostics, repair the payload or the missing evidence,
   and resubmit. An identical retry after an uncertain delivery is idempotent; a
   conflicting submission cannot overwrite a settled attempt. Once accepted, stop
   work on that attempt.

## Recovery

`graph_control` acts on the plan, not on business data:

- `failure` records a failed attempt out of band; it is distinct from the `failed`
  business outcome a worker submits.
- `retry` mints a NEW attempt for a diagnosed transient failure and consumes
  budget; it is not a way around a review finding.
- `cancel` contains obsolete or superseded work. A cancel request is not confirmed
  termination: confirm that the attempt actually ended, and never start overlapping
  work while a worker may still be modifying the delivered result.
- `timeout` and `budget-stop` record an exhausted node or run.

Never delete or recreate an unreadable store; use `graph_audit` to diagnose storage
or recovery blockers. No control command converts an incomplete report into an
accepted outcome, and no control decision replaces a declared review gate.

## Read state

After a confirmed start, yield for the real GRAPH COMPLETE or GRAPH BLOCKED
notification. Notifications identify the graph and run and carry a stable
notification ID; they are not business reports, and delivery is at least once.
Read accepted results with
`graph_status({graph_id, scope: "all", format: "json", include_output: true, include_history: true})`
and select the intended producer with `run_id` and `node_id`. Read
`attempts[].accepted` for the outcome identity and `attempts[].result` for the
accepted data, together with controls, approvals, budget and unsettled effects.
JSON output is not paginated by offset or max_chars; narrow it by `run_id` or
`node_id` when the host display truncates it. A complete graph can still contain a
failed, escalated or cancelled node and unsettled effects, so graph phase is not
business success. Poll only as recovery for a missing notification, never as a busy
loop.

## Parent synthesis and repairs

- The lead synthesizes accepted reports. Read every required report; a settled node
  is not a passing review, and a settled graph is not acceptance.
- Reconcile duplicate or conflicting reports with invariants, observed behavior and
  project constraints. Advisory preferences do not compel edits, and proposed fact
  corrections are merged only after the lead checks them.
- Repairs are parent-owned. The lead applies justified edits, reruns the affected
  checks and, when independent re-review is needed, declares a fresh review batch
  for the updated snapshot with stable issue IDs and the prior findings. There is no
  writer child in this topology and no reviewer-to-reviewer repair route: a reviewer
  NEVER edits the code under review, and reviewers never revise each other.
- Limit substantive repair and re-review rounds to two for a design. If the same
  blocker persists, diagnose and report it instead of resetting budgets or trying a
  third mechanism. A new batch is not a fresh budget.
- Inline review by the lead can recover a tool outage, but it MUST NOT be described
  as independent review.
- The lead owns acceptance, the production writes and any user approval decision.
  Carry unresolved findings into the final answer with the actual check results.
