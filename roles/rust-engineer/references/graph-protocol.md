# rolebox review graph protocol

This role reviews Rust engineering work through the rolebox Graph v3 outcome
protocol: `graph_declare`, `graph_submit_outcome`, `graph_control`,
`graph_status` and `graph_audit`. The installed runtime's tool schemas are
authoritative if they differ from this reference. Re-verify protocol changes
against rolebox `docs/graph-outcome-protocol.md` and `src/graph/` whenever the
installed runtime version changes.

The lead is the sole production-code writer and the declaring session: it owns the
plan, the node briefs and every repair. The five specialists are read-only review
nodes. The graph schedules review evidence; it never schedules architectural
decisions, and no specialist writes production code.

## Tools

| Tool | What it does | Who may call it |
| --- | --- | --- |
| `graph_declare({declaration})` | Strict parse, compile, capability preflight, persist and start or resume one graph in a single call; returns the persisted plan and `start.kind` | The declaring lead session |
| `graph_control(command, ...)` | Out-of-band control decisions: `failure`, `cancel`, `retry`, `timeout`, `budget-stop`, `approval-request`, `approve`, `reject` | The declaring lead session |
| `graph_status({...})` | Reads committed state: phase, nodes, attempts, controls, approvals, budget and unsettled effects | The declaring lead session |
| `graph_audit({...})` | Diagnoses storage and recovery blockers without mutating state | The declaring lead session |
| `graph_submit_outcome({graph_id, node_id, outcome_id, credential, data})` | Settles the caller's own attempt with one declared outcome; the host derives attempt, submission and compiled-revision identity | Each worker, for its own node and attempt only |
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
- Declare a node's `tools` only for a host capability that node genuinely needs
  beyond the baseline worker grant; an undeclared tool is refused at call time, and
  a graph-face name in `tools` admits nothing.
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

The declaration below is this role's single source of truth and the catalog of the
five possible gate nodes. The shipped sample declares all five so the contract test
can compile the whole set, but a real batch declares only the gates whose domains
fired: one node for Standard tier, at most three for Deep tier. Keep the pinned node
ids, agents and declared outcomes for every node included, replace `name` with the
request identity, and replace every prompt placeholder with the real brief for the
current snapshot. Matching a batch to its tier cap is a selection over this catalog,
never a change to it, and the five gate nodes are independent roots, so `edges`
stays empty.

```json
{
  "version": 3,
  "name": "rust-review-sample-r0-c0",
  "budget": {
    "max_executions": 7
  },
  "nodes": [
    {
      "id": "safety",
      "agent": "rust-engineer--safety-reviewer",
      "prompt": "Template placeholder - replace with the real review brief for this node: the reviewed snapshot or diff with commit and uncommitted changes, and the readable source roots the reviewer may open - the affected crates, their Cargo.toml files, build.rs, and any C header or bindgen output for an FFI surface; the prompt-embedded Engineering brief fields that pin the review (cargo_workspace, edition, unsafe_surface, msrv, dependencies_affected, verification_plan); the concrete question, for example whether every unsafe block states its safety invariant and whether each extern boundary is unwind-safe; the read-only scope, and the commands the node may run (cargo check, cargo clippy, cargo miri test) without editing source, manifests, lockfiles or git state (build artifacts under `target/` are permitted). Load the rust-safety-gate skill and inspect only. The declared outcomes are pass, revise and escalate: submit pass when no supported blocking issue exists in the assigned scope, revise for concrete blocking issues with stable required_revisions, and escalate when essential evidence or user intent is unavailable. Return the schema_version 1 gate report from references/schemas.md; its status is pass, fail or needs-user-input, and outcome_id records the corresponding pass, revise or escalate decision.",
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
      "id": "async",
      "agent": "rust-engineer--async-auditor",
      "prompt": "Template placeholder - replace with the real review brief for this node: the reviewed snapshot or diff with commit and uncommitted changes, and the readable source roots the reviewer may open - the async crates, their Cargo.toml files, the runtime entrypoints, and the task, channel and lock sites under review; the prompt-embedded Engineering brief fields that pin the review (cargo_workspace, edition, async_runtime, concurrency_model, msrv, verification_plan); the concrete question, for example whether every await point is cancellation-safe, whether each channel is bounded, and whether any lock guard crosses an await; the read-only scope, and the commands the node may run (cargo check, cargo clippy with the await_holding_lock lint, a loom model when one exists) without editing source, manifests, lockfiles or git state (build artifacts under `target/` are permitted). Load the rust-async-gate skill and inspect only. The declared outcomes are pass, revise and escalate: submit pass when no supported blocking issue exists in the assigned scope, revise for concrete blocking issues with stable required_revisions, and escalate when essential evidence or user intent is unavailable. Return the schema_version 1 gate report from references/schemas.md; its status is pass, fail or needs-user-input, and outcome_id records the corresponding pass, revise or escalate decision.",
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
      "id": "api",
      "agent": "rust-engineer--api-reviewer",
      "prompt": "Template placeholder - replace with the real review brief for this node: the reviewed snapshot or diff with commit and uncommitted changes, and the readable source roots the reviewer may open - the published crate lib.rs and module roots, its Cargo.toml features and rust-version, and the rustdoc output for the changed items; the prompt-embedded Engineering brief fields that pin the review (cargo_workspace, edition, public_api_changes, msrv, dependencies_affected, verification_plan); the concrete question, for example whether each new pub item is documented, whether the error enums are non_exhaustive, and what semver impact the changed signatures carry; the read-only scope, and the commands the node may run (cargo semver-checks, cargo doc --no-deps with warnings denied, cargo tree -e features) without editing source, manifests, lockfiles or git state (build artifacts under `target/` are permitted). Load the rust-api-gate skill and inspect only. The declared outcomes are pass, revise and escalate: submit pass when no supported blocking issue exists in the assigned scope, revise for concrete blocking issues with stable required_revisions, and escalate when essential evidence or user intent is unavailable. Return the schema_version 1 gate report from references/schemas.md; its status is pass, fail or needs-user-input, and outcome_id records the corresponding pass, revise or escalate decision.",
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
      "agent": "rust-engineer--perf-profiler",
      "prompt": "Template placeholder - replace with the real review brief for this node: the reviewed snapshot or diff with commit and uncommitted changes, and the readable source roots the reviewer may open - the hot-path modules and their callers, the benchmark harness, the workspace profile settings in Cargo.toml, and any captured criterion, cargo bloat or dhat output; the prompt-embedded Engineering brief fields that pin the review (cargo_workspace, edition, performance_context, dependencies_affected, verification_plan); the concrete question, for example whether a new allocation or clone sits in a measured hot loop and whether the benchmark methodology supports the claimed comparison; the read-only scope, and the commands the node may run (cargo criterion against a named baseline, cargo bloat, an allocation profile) without editing source, manifests, lockfiles or git state (build artifacts under `target/` are permitted). Load the rust-perf-gate skill and inspect only. The declared outcomes are pass, revise and escalate: submit pass when no supported blocking issue exists in the assigned scope, revise for concrete blocking issues with stable required_revisions, and escalate when essential evidence or user intent is unavailable. Return the schema_version 1 gate report from references/schemas.md; its status is pass, fail or needs-user-input, and outcome_id records the corresponding pass, revise or escalate decision.",
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
      "id": "cross-platform",
      "agent": "rust-engineer--cross-platform-checker",
      "prompt": "Template placeholder - replace with the real review brief for this node: the reviewed snapshot or diff with commit and uncommitted changes, and the readable source roots the reviewer may open - every module carrying a cfg attribute, the target-conditioned dependency tables in Cargo.toml, build.rs, and the CI target matrix; the prompt-embedded Engineering brief fields that pin the review (cargo_workspace, edition, cross_platform_context, msrv, dependencies_affected, verification_plan); the concrete question, for example whether every cfg-gated path still compiles on its declared target, whether endian-sensitive parsing uses the to_le and to_be conversions, and whether a pointer-width assumption truncates on a 32-bit target; the read-only scope, and the commands the node may run (cargo check --target for each declared triple, cargo tree -e features per target, clippy) without editing source, manifests, lockfiles or git state (build artifacts under `target/` are permitted). Load the rust-platform-gate skill and inspect only. The declared outcomes are pass, revise and escalate: submit pass when no supported blocking issue exists in the assigned scope, revise for concrete blocking issues with stable required_revisions, and escalate when essential evidence or user intent is unavailable. Return the schema_version 1 gate report from references/schemas.md; its status is pass, fail or needs-user-input, and outcome_id records the corresponding pass, revise or escalate decision.",
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
  "edges": []
}
```

## Topology semantics

- Every declared gate node is an independent root: no node has an inbound edge, no node
  declares `inputs`, no node declares `join`, and the declaration's `edges` array is
  empty. The engine may therefore arm every selected node concurrently in a single
  start.
- Review runs on the implemented snapshot, not on a plan. The lead implements the
  change first, freezes the resulting revision, and only then declares the review
  batch; an early consultation cannot approve unwritten code, and reviewers must
  review a frozen diff. The declaration is immutable and bound to that snapshot, so
  a changed snapshot needs a fresh declaration with a new name and a new batch
  rather than an in-place topology edit.
- The gates are independent because each one reviews the same frozen snapshot from
  its own domain. Do not add a serial edge, a manufactured join consumer, or an
  evidence node merely to impose a checklist order. This deliberately replaces the
  retired safety-first serial lead, which chained the other gates behind a
  safety report through an `engineering_state_patch`; that ordering cannot hold now
  that every gate reviews the finished snapshot, and the lead reconciles the
  accepted reports itself.
- Declare `inputs` and `join: {strategy: "all"}` only for a real evidence dependency,
  where a gate cannot be reviewed before another gate's accepted result exists. If
  such a dependency is genuine, the consumer names each producer as
  `{from, outcome}` and the edges carry the same outcome; a consumer that reads a
  producer's report without declaring it is invalid, and a missing declared input
  settles `escalate` instead of inventing the predecessor result.
- `revise` and `escalate` are terminal outcomes of a review root: they return
  findings to the lead, who owns the repair. The graph declares no production
  writer node, no engine-managed repair cycle and no approval node.

## Node brief

Every node prompt carries enough context to act without the lead's conversation:

- Goal, expected behavior, the user authorization already given, and the concrete
  question this node answers.
- The reviewed snapshot: commit plus local diff or artifact identifier, including
  uncommitted changes. Never call HEAD the pre-edit baseline when dirty changes
  exist. If no snapshot is available, say so explicitly.
- The prompt-embedded Engineering brief defined in `references/schemas.md`: the
  Rust project facts, the workspace and crate facts, the conditional domain
  context, invariants, risks, the verification plan and any open questions.
- Read-only scope: the readable source roots, manifest paths and versions, and the
  commands the node may run. Reviewers MUST NOT edit source, manifests, lockfiles,
  fixtures or git state; the build artifacts those checks write under `target/` are
  permitted. Include the gate report shape from `references/schemas.md` and the
  domain criteria for pass, revise and escalate.
- For a consumer, the declared inputs it reads. Dispatch inputs are authoritative
  over the prompt snapshot. If a declared input is missing or incomplete, settle
  `escalate` with the exact missing evidence instead of inventing a predecessor
  result.

Node sessions do not share conversation history. Declared inputs and the shared
workspace carry upstream results and artifacts; do not claim a file is
inaccessible merely because the session differs.

## Gate result mapping

The gate report uses `schema_version: 1`. Its status stays closed over `pass`,
`fail` and `needs-user-input`, while `outcome_id` records `pass`, `revise` or
`escalate`; the two must agree with the mapping in `references/schemas.md`.
The runtime supplies declared outcome ids, data-schema references and handoff
mechanics. Node briefs supply review criteria and evidence requirements.

## Recovery

`graph_control` acts on the plan, not on business data:

- `failure` records a failed attempt out of band; it is distinct from the `failed`
  business outcome a worker submits.
- `retry` mints a NEW attempt for a diagnosed transient failure and consumes
  budget; it is not a way around a review finding, and a node retry does not
  guarantee session reuse.
- `cancel` contains obsolete or superseded work. A cancel request is not confirmed
  termination: confirm that the attempt actually ended, and never start overlapping
  work while a worker may still be reading the delivered snapshot.
- `timeout` and `budget-stop` record an exhausted node or run.
- `approval-request`, `approve` and `reject` belong to the engine's control
  vocabulary, but this review topology declares no approval node, so the lead never
  issues them for a gate batch.

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
business success and a settled graph is not acceptance of the reviewed change. Poll
only as recovery for a missing notification, never as a busy loop.

## Parent synthesis and repairs

- The lead synthesizes accepted gate reports. Read every report of the batch; a
  settled node is not a passing review, and a settled graph is not acceptance.
- Reconcile duplicate or conflicting reports with invariants, observed behavior and
  project constraints. Advisory preferences do not compel edits, and proposed fact
  corrections are merged only after the lead checks them.
- Repairs are parent-owned. The lead applies the justified `required_revisions`,
  reruns the affected checks and, when independent re-review is needed, declares a
  fresh review batch for the updated snapshot with a new graph name, the updated
  Engineering brief, the prior issue ids and the prior findings carried in the node
  briefs. There is no writer child in this topology and no reviewer-to-reviewer
  repair route: a reviewer NEVER edits the code under review, and reviewers never
  revise each other.
- Limit substantive repair and re-review rounds to two per gate. After the second
  round, if the same blocker persists, stop: diagnose the cause, report the
  remaining blocker with its evidence, and ask the user instead of resetting
  budgets, re-declaring the same unchanged snapshot or trying a third mechanism. A
  new batch is not a fresh budget.
- Inline review by the lead can recover a tool outage, but it MUST NOT be described
  as independent review.
- The lead owns acceptance, the production writes and any user approval decision.
  Carry unresolved findings into the final answer with the actual check results.
