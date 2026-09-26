# rolebox review graph protocol

This role reviews a Dart and Flutter implementation through the rolebox Graph v3
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
agents and declared outcomes. The five nodes are independent roots, so `edges` stays
empty.

```json
{
  "version": 3,
  "name": "dart-flutter-review-sample-r0-c0",
  "budget": {
    "max_executions": 7
  },
  "nodes": [
    {
      "id": "architecture",
      "agent": "dart-flutter--architecture-reviewer",
      "prompt": "Template placeholder - replace with the real review brief for this node: the Engineering State (engineering brief) defined in references/schemas.md, carrying the goal, the scope and explicit non-goals, the reviewed snapshot with commit and uncommitted changes, project facts and SDK or package constraints, the invariants to preserve, state and resource ownership, the design decision under review with its alternatives, risks, the verification plan and any open questions; the artifact paths and callers the reviewed snapshot touches; the feature-structure, state-ownership, dependency-injection and data-boundary rules to check; the concrete review question; and the read-only scope. Reviewers never write, edit or delete workspace files, never run a mutating command and never write shared caches. Load the dart-flutter-architecture-gate skill and inspect only. The declared outcomes are pass, revise and escalate: submit pass when no supported blocking issue exists in the assigned scope, revise for concrete blocking issues with stable required_revisions, and escalate when essential evidence or user intent is unavailable. Carry the gate report of references/schemas.md as the schema_version 1 data argument of graph_submit_outcome: its status stays closed over pass, fail or needs-user-input while the settled outcome id is submitted separately. Submit with the attempt credential this dispatch carried, never print that credential and never reuse it in another node. Only an accepted decision, verdict committed or replayed with no refusals, settles this node; a refusal writes nothing, so repair the payload or the missing evidence and resubmit. Use graph_worker_exec for every read and check and do not create child graphs.",
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
      "id": "ui-layout",
      "agent": "dart-flutter--ui-layout-reviewer",
      "prompt": "Template placeholder - replace with the real review brief for this node: the Engineering State (engineering brief) defined in references/schemas.md, carrying the goal, the scope and explicit non-goals, the reviewed snapshot with commit and uncommitted changes, project facts and SDK or package constraints, the invariants to preserve, target platforms and form factors, risks, the verification plan and any open questions; the screen, widget and layout artifact paths the reviewed snapshot touches; the widget-composition, layout-constraint, adaptive-behavior, semantics, focus, text-scaling and form-interaction rules to check; the concrete review question; and the read-only scope. Reviewers never write, edit or delete workspace files, never run a mutating command and never write shared caches. Load the dart-flutter-ui-layout-gate skill and inspect only. The declared outcomes are pass, revise and escalate: submit pass when no supported blocking issue exists in the assigned scope, revise for concrete blocking issues with stable required_revisions, and escalate when essential evidence or user intent is unavailable. Carry the gate report of references/schemas.md as the schema_version 1 data argument of graph_submit_outcome: its status stays closed over pass, fail or needs-user-input while the settled outcome id is submitted separately. Submit with the attempt credential this dispatch carried, never print that credential and never reuse it in another node. Only an accepted decision, verdict committed or replayed with no refusals, settles this node; a refusal writes nothing, so repair the payload or the missing evidence and resubmit. Use graph_worker_exec for every read and check and do not create child graphs.",
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
      "agent": "dart-flutter--test-quality-reviewer",
      "prompt": "Template placeholder - replace with the real review brief for this node: the Engineering State (engineering brief) defined in references/schemas.md, carrying the goal, the scope and explicit non-goals, the reviewed snapshot with commit and uncommitted changes, project facts and SDK or package constraints, the invariants to preserve, the testing conventions, risks, the verification plan with its commands and any open questions; the changed behavior, the test artifact paths and the checks already run; the test-level, regression-coverage, WidgetTester pump-and-settle, fake-and-mock boundary, golden determinism, coverage and CI-command rules to check; the concrete review question; and the read-only scope. Reviewers never write, edit or delete workspace files, never run a mutating command and never write shared caches. Load the dart-flutter-test-quality-gate skill and inspect only. The declared outcomes are pass, revise and escalate: submit pass when no supported blocking issue exists in the assigned scope, revise for concrete blocking issues with stable required_revisions, and escalate when essential evidence or user intent is unavailable. Carry the gate report of references/schemas.md as the schema_version 1 data argument of graph_submit_outcome: its status stays closed over pass, fail or needs-user-input while the settled outcome id is submitted separately. Submit with the attempt credential this dispatch carried, never print that credential and never reuse it in another node. Only an accepted decision, verdict committed or replayed with no refusals, settles this node; a refusal writes nothing, so repair the payload or the missing evidence and resubmit. Use graph_worker_exec for every read and check and do not create child graphs.",
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
      "id": "performance-platform",
      "agent": "dart-flutter--performance-platform-reviewer",
      "prompt": "Template placeholder - replace with the real review brief for this node: the Engineering State (engineering brief) defined in references/schemas.md, carrying the goal, the scope and explicit non-goals, the reviewed snapshot with commit and uncommitted changes, project facts with SDK, Flutter and plugin versions, target platforms and build modes, the invariants to preserve, risks, the verification plan and any open questions; the artifact paths, profiling or diagnostic evidence and reproduction steps for the symptom under review; the rebuild-scope, list-and-image, memory, isolate, plugin, platform-API, build-configuration and target-platform-compatibility rules to check; the concrete review question; and the read-only scope. Reviewers never write, edit or delete workspace files, never run a mutating command and never write shared caches. Load the dart-flutter-performance-platform-gate skill and inspect only. The declared outcomes are pass, revise and escalate: submit pass when no supported blocking issue exists in the assigned scope, revise for concrete blocking issues with stable required_revisions, and escalate when essential evidence or user intent is unavailable. Carry the gate report of references/schemas.md as the schema_version 1 data argument of graph_submit_outcome: its status stays closed over pass, fail or needs-user-input while the settled outcome id is submitted separately. Submit with the attempt credential this dispatch carried, never print that credential and never reuse it in another node. Only an accepted decision, verdict committed or replayed with no refusals, settles this node; a refusal writes nothing, so repair the payload or the missing evidence and resubmit. Use graph_worker_exec for every read and check and do not create child graphs.",
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
      "id": "release",
      "agent": "dart-flutter--release-engineer",
      "prompt": "Template placeholder - replace with the real review brief for this node: the Engineering State (engineering brief) defined in references/schemas.md, carrying the goal, the scope and explicit non-goals, the reviewed snapshot with commit and uncommitted changes, project facts with platform targets and distribution channels, the invariants to preserve, risks, the verification plan and any open questions; the platform configuration, manifest, signing and CI artifact paths the reviewed snapshot touches; the platform-target, permission, entitlement, signing, flavor, packaging, store-metadata and version-number rules to check; the concrete review question; and the read-only scope. Reviewers never write, edit or delete workspace files, never run a mutating command and never write shared caches. Load the dart-flutter-release-gate skill and inspect only. The declared outcomes are pass, revise and escalate: submit pass when no supported blocking issue exists in the assigned scope, revise for concrete blocking issues with stable required_revisions, and escalate when essential evidence or user intent is unavailable. Carry the gate report of references/schemas.md as the schema_version 1 data argument of graph_submit_outcome: its status stays closed over pass, fail or needs-user-input while the settled outcome id is submitted separately. Submit with the attempt credential this dispatch carried, never print that credential and never reuse it in another node. Only an accepted decision, verdict committed or replayed with no refusals, settles this node; a refusal writes nothing, so repair the payload or the missing evidence and resubmit. Use graph_worker_exec for every read and check and do not create child graphs.",
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

- The five gate nodes are independent roots: no node has an inbound edge, no node
  declares `inputs`, no node declares `join`, and the declaration's `edges` array is
  empty. The engine may therefore arm all five concurrently in a single start.
- The contract is independent gates run in parallel, not a checklist sequence.
  Every gate reviews the snapshot named in its own prompt against the same
  Engineering State, and each settles `pass`, `revise` or `escalate` on its own
  evidence. Do not add a serial edge or a manufactured join consumer merely to
  impose ordering; the lead reconciles the five accepted reports.
- Declare `inputs` and `join: {strategy: "all"}` only for a real evidence dependency,
  where a gate cannot be reviewed before another gate's accepted result exists. If
  such a dependency is genuine, the consumer names each producer as
  `{from, outcome}` and the edges carry the same outcome; a consumer that reads a
  producer's report without declaring it is invalid, and a missing declared input
  settles `escalate` instead of inventing the predecessor result.
- `revise` and `escalate` are terminal outcomes of a review root: they return
  findings to the lead, who owns the repair. The graph declares no production
  writer node, no engine-managed repair cycle and no approval node.
- The declaration is immutable and bound to one snapshot. A changed snapshot needs
  a fresh declaration with a new name, not an in-place topology edit.

## Node brief

Every node prompt carries enough context to act without the lead's conversation:

- Goal, expected behavior, the user authorization already given, and the concrete
  question this node answers.
- The reviewed snapshot: commit plus local diff or artifact identifier, including
  uncommitted changes. Never call HEAD the pre-edit baseline when dirty changes
  exist. If no snapshot is available, say so explicitly.
- The prompt-embedded Engineering State defined in `references/schemas.md`: project
  facts, SDK and package constraints, target platforms, established architecture,
  invariants, risks, the verification plan and any open questions.
- Read-only scope: the readable source roots, artifact paths and versions, and the
  commands the node may run. Reviewers MUST NOT edit the workspace, run mutating
  builds or write shared caches.
- The declared outcome ids the node may submit, the gate report shape from
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

1. Finish the read-only assessment and write the gate report first.
2. Call `graph_submit_outcome({graph_id, node_id, outcome_id, credential, data})`
   with the node's declared `outcome_id`, the attempt credential this dispatch
   carried, and the schema_version 1 gate report as `data`. Use only your own
   attempt credential: never print it, never write it into a file or report, and
   never use another attempt's credential.
3. Never supply attempt, submission or compiled-revision identity; the host derives
   them from its own state.
4. The report status stays closed over `pass`, `fail` and `needs-user-input`, while
   the settled outcome id is `pass`, `revise` or `escalate` — the two are separate
   fields and must agree with the mapping in `references/schemas.md`.
5. The only settling decision is `accepted` with verdict `committed` or `replayed`
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
  budget; it is not a way around a review finding, and a node retry does not
  guarantee session reuse.
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
business success and a settled graph is not acceptance of the reviewed design. Poll
only as recovery for a missing notification, never as a busy loop.

## Parent synthesis and repairs

- The lead synthesizes accepted gate reports. Read every report of the batch; a
  settled node is not a passing review, and a settled graph is not acceptance.
- Reconcile duplicate or conflicting reports with invariants, observed behavior and
  project constraints. Advisory preferences do not compel edits, and proposed fact
  corrections are merged only after the lead checks them.
- Repairs are parent-owned. The lead applies the justified revisions, reruns the
  affected checks and, when independent re-review is needed, declares a FRESH
  review batch for the updated snapshot — a new graph name, the updated Engineering
  State, the prior issue ids and the prior findings carried in the node briefs.
  There is no writer child in this topology and no reviewer-to-reviewer repair
  route: a reviewer NEVER edits the code under review, and reviewers never revise
  each other.
- Limit substantive repair and re-review rounds to two per design. After the second
  round, if the same blocker persists, stop: diagnose the cause, report the
  remaining blocker with its evidence, and ask the user instead of resetting
  budgets, re-declaring the same unchanged snapshot or trying a third mechanism. A
  new batch is not a fresh budget.
- Inline review by the lead can recover a tool outage, but it MUST NOT be described
  as independent review.
- The lead owns acceptance, the production writes and any user approval decision.
  Carry unresolved findings into the final answer with the actual check results.
