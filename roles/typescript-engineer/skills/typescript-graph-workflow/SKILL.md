---
name: typescript-graph-workflow
description: Execute TypeScript engineering tasks through the rolebox graph v3 outcome protocol. Use for repository edits, investigations and reviews to declare outcome nodes, bounded repair loop groups, evidence joins and correctly separated approval gates.
---

# Graph-native TypeScript workflow

The declaration is the execution mechanism. The parent owns scope and technical decisions;
workers own implementation and evidence and settle their own nodes. Choose the smallest
topology that fulfills the request, retaining declared outcomes, engine-managed scheduling
and accepted-result collection.

## Select the topology

| Work | Declared plan |
|---|---|
| Comment, formatting or other mechanical edit without a changed contract | One change-applier node declaring `done` with the appropriate fast check |
| Behavior, type contract, feature or refactor | change --`done`--> review; review --`revise`--> change, one bounded loop group with `revise` continuing and `pass` leaving |
| Multiple independent verification surfaces | change --`done`--> evidence branches --`report`--> review with `join: {strategy: "all"}`; review --`revise`--> change, one shared loop group |
| Unsettled API design | Candidate investigations --`report`--> join-all synthesis --`selected`--> change/review loop |
| Read-only investigation/review | One verification node declaring `report`, or independent evidence nodes feeding a synthesis node |
| External action whose authorization is unresolved | Verified result --`pass`--> approval proposal --`approval_required`--> separately executable action |

Default to the two-node change/review loop. Split evidence only when it supplies independent
judgment, a distinct consumer/runtime surface, or useful parallel work. Do not declare a
node for each lint/format command. Include every necessary domain, combining related work
when cheaper; do not drop a required check to satisfy an arbitrary node quota.

Use `typescript-engineer--change-applier` for implementation and bounded repairs. Use
`typescript-engineer--verification` with an explicit mode: `review`, `evidence`,
`investigation`, `synthesis` or `approval-proposal`. The mode maps to the node's declared
outcome ids; it is a prompt contract, not an extra engine node type. Skills and functions do
not inherit from the parent; each worker has its own entry skill and links to the shared
TypeScript concern skills.

## Declare and launch

1. Build the complete declaration object: `version: 3` and `name` (the name **is** the graph
   id), a finite root `budget.max_executions`, `nodes` with their `outcomes`, `completion:
   {mode: "explicit"}` and `budget.timeout_ms`, and `edges` of `{from, to, outcome}`.
2. Bind every edge to an outcome its source node declares. Give each consumer
   `inputs: [{from, outcome}]` for the upstream results it reads — edges schedule work but do
   not deliver payloads — and `join: {strategy: "all"}` where every prerequisite must
   complete. An input must be bindable when the node first runs, so an entry node never
   consumes the loop back-edge.
3. Put a cycle only inside a declared loop group with `max_traversals`, `continuation_outcome`
   and `exit_outcome`; every edge carrying the continuation outcome stays inside the group. A
   cycle outside a declared loop group cannot compile.
4. Leave at least one declared outcome unbound so the graph can terminate. Change nodes also
   declare `failed`, `blocked` and `clarification_required` for work they cannot finish. An
   execution dependency routes on the declared success outcome (`done`) and never on
   `failed`, `blocked` or `clarification_required`, while a separately executable action node
   is released by its gate's own accepted outcome (such as `approval_required`) — a gate, not
   an execution dependency.
5. Author no `max_retries` — it is rejected, even as `0` — and add no `acceptance`,
   `contractRef` or `completion_policy` unless the host installs that capability; an
   uninstalled capability is refused as a non-executable draft.
6. Submit the whole object in one `graph_declare({declaration})` call and END THE TURN. There
   is no separate run or dry-run tool. Inspect the result: a persisted plan **and**
   `start.kind` — `started`/`resumed` are distinct from `saved`/`blocked`/`refused`, and a
   saved plan is not proof of dispatch.
7. On `[GRAPH COMPLETE]`, `[GRAPH BLOCKED]` or another relevant notification, read accepted
   results with `graph_status({graph_id, scope: "all", format: "json", include_output: true,
   include_history: true})`, bounded by `run_id`/`node_id`; never declare success from a
   truncated summary.

See [protocol details](references/graph-protocol.md) for outcome, control and acceptance
semantics, and [graph patterns](references/graph-patterns.json) for structurally complete
topology templates. Replace their schematic prompts with task-specific briefs; they are not
ready-made tasks.

## Node brief

Supply enough context to act without the parent conversation:

- Goal, expected behavior, compatibility requirements and user authorization already given.
- Workspace, relevant paths, write scope (or source-read-only scope) and current user edits.
- Baseline state: the actual baseline observation/snapshot when available; never call HEAD the
  pre-edit baseline if it omits dirty changes. Otherwise explicitly say baseline unavailable.
- Compiler/runtime/package-manager support and relevant technical decisions. Include the
  needed guidance or actual readable resource paths; avoid vague "use the parent's skill".
- Commands/configuration already discovered, or permission to derive a focused check from
  local tools when a script is absent. State the checks required for this task.
- The exact outcome ids the node may submit, the attempt credential carried by its dispatch,
  and the `graph_submit_outcome` discipline: only an accepted decision settles the node and a
  refusal writes nothing. State that workspace commands use `graph_worker_exec`.
- Mode, required report shape, and the upstream inputs it consumes.

Node sessions do not share conversation history. Declared inputs and the shared workspace
carry upstream results and artifacts; do not claim files are inaccessible merely because
sessions differ. Pass compact evidence and artifact paths where accessible, not the whole
repository or repetitive logs. Avoid truncating decisive findings.

## Concurrency and repairs

Use one source writer at a time. Evidence nodes may read the same source snapshot, but
commands that write common build outputs, caches or fixtures must be serialized or use
isolated directories. Parallelism is not isolation.

For fan-out, evidence nodes report observations even when those observations reveal a failed
check: a `report` outcome means the evidence task completed, not that the product passed. The
final review waits for all declared inputs, issues one coherent revision list and owns the
only repair route. This prevents one verifier starting a repair while another reads the old
source. A branch unable to produce evidence still submits its `report` outcome with the
missing evidence recorded as a limitation, never a fabricated pass. Missing required evidence
cannot converge as success.

If revisions exceed the write scope, reconcile scope before declaring another plan. After a
repair, consume fresh evidence; do not reuse a prior pass against older files. The loop
group's `max_traversals` is the repair budget. `graph_control` retry mints a NEW attempt and
consumes budget; it is not a way around an exhausted loop. A new revision is a new graph, not
an in-place topology edit.

## Reconcile and finish

Graph termination and quality are separate. Read accepted results, not node presence: inspect
required evidence, the review verdict, errors and limitations even when the phase is
`complete`, and account for exhausted loop groups and unsettled effects. Resolve
contradictory reports with concrete evidence. Do not turn skipped, cancelled or escalated
nodes into passes.

Use notifications rather than polling loops. Status reads are appropriate for a missing
notification, diagnosis or new progress. If abandoning or superseding work, cancel its active
work with `graph_control` and confirm no worker can still modify the delivered result. Do not
cancel successfully completed graphs merely as a cleanup ritual. Report the engineering
outcome and checks in the user's language without dumping graph internals.
