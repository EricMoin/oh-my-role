---
name: typescript-graph-workflow
description: Execute TypeScript engineering tasks through rolebox Graph Engine v2. Use for repository edits, investigations and reviews to construct nodes, bounded repair loops, evidence joins and correctly separated approval gates.
---

# Graph-native TypeScript workflow

The graph is the execution mechanism. The parent owns scope and technical decisions;
workers own implementation and evidence. Choose the smallest topology that fulfills the
request, retaining engine-managed scheduling, signals and result collection.

## Select the topology

| Work | Graph |
|---|---|
| Comment, formatting or other mechanical edit without a changed contract | One change-applier node with the appropriate fast check |
| Behavior, type contract, feature or refactor | change → review; review → change on revise_needed, bounded loop |
| Multiple independent verification surfaces | change → evidence branches → review with join all; review → change, one shared loop |
| Unsettled API design | Candidate investigations → join-all selection → change/review loop |
| Read-only investigation/review | One verification node, or independent evidence nodes feeding a synthesis node |
| External action whose authorization is unresolved | Verified result → approval proposal → separately executable action |

Default to the two-node change/review loop. Split evidence only when it supplies independent
judgment, a distinct consumer/runtime surface, or useful parallel work. Do not create a
node for each lint/format command. Include every necessary domain, combining related work
when cheaper; do not drop a required check to satisfy an arbitrary node quota.

Use `typescript-engineer--change-applier` for implementation and bounded repairs. Use
`typescript-engineer--verification` with an explicit mode: `review`, `evidence`,
`investigation`, `synthesis` or `approval-proposal`. These are prompt contracts, not extra
engine node types. Skills and functions do not inherit from the parent; each worker has
its own entry skill and links to the shared TypeScript concern skills.

## Build and launch

1. `graph_create({name})`; retain the returned `graph_id`.
2. Add nodes with `graph_add_node({graph_id, id, agent, prompt, ...})`. Give each one the
   brief below. Use `join: {strategy: "all"}` on a required evidence fan-in.
3. Add forward edges with `type: "on_signal", signal_filter: ["answer"]`. For a repair
   cycle, add only the final review's back-edge with `signal_filter: ["revise_needed"]`.
4. Add the loop after its nodes and edges: `graph_add_loop({graph_id, id, nodes,
   max_traversals: 2})`. Include change, all evidence branches and review in the same loop
   so a repair invalidates their old results. Increase the bound only for a concrete task
   reason, not to evade exhaustion. Omit `mode` or use `inherit`; `fresh` is unsupported.
5. For a new/complex topology, call `graph_run({graph_id, dry_run: true})` and address
   structural errors. Then call `graph_run({graph_id})` and END THE TURN. The return is a
   dispatch acknowledgement, not verification evidence.
6. On `[GRAPH COMPLETE]`, `[GRAPH BLOCKED]` or other relevant graph notifications, inspect
   `graph_status({graph_id, include_output: true})`. Read truncated node output with
   `node_id`, `offset` and `max_chars` or export it; do not declare success from a summary.

See [protocol details](references/graph-protocol.md) for approval and signal semantics, and
[graph patterns](references/graph-patterns.json) for structurally tested topology templates.
Replace their schematic prompts with task-specific briefs; they are not ready-made tasks.

## Node brief

Supply enough context to act without the parent conversation:

- Goal, expected behavior, compatibility requirements and user authorization already given.
- Workspace, relevant paths, write scope (or source-read-only scope) and current user edits.
- Input state: actual baseline observation/snapshot when available; never call HEAD the
  pre-edit baseline if it omits dirty changes. Otherwise explicitly say baseline unavailable.
- Compiler/runtime/package-manager support and relevant technical decisions. Include the
  needed guidance or actual readable resource paths; avoid vague "use the parent's skill".
- Commands/configuration already discovered, or permission to derive a focused check from
  local tools when a script is absent. State checks required for this task.
- Mode, required output and expected signal. Name incoming evidence/artifacts to consume.

Node sessions do not share conversation history. Edges pass upstream results and the
workers can read named files in the shared workspace; do not claim files are inaccessible
merely because sessions differ. Pass compact evidence and artifact paths where accessible,
not the whole repository or repetitive logs. Avoid truncating decisive findings.

## Concurrency and repairs

Use one source writer at a time. Evidence nodes may read the same source snapshot, but
commands that write common build outputs, caches or fixtures must be serialized or use
isolated directories. Parallelism is not isolation.

For fan-out, evidence nodes report observations even when those observations reveal a
failed check. `answer` means the evidence task completed, not that the product passed.
The final review waits for all reports, issues one coherent revision list and owns the
only repair back-edge. This prevents one verifier starting a repair while another reads
the old source. A branch unable to produce evidence escalates with its blocker instead
of fabricating a passing result. Missing required evidence cannot converge as success.

If revisions exceed the write scope, let the parent reconcile scope before another run.
After a repair, consume fresh evidence; do not reuse a prior pass against older files.
Use engine loop bounds for code revisions. `max_retries` concerns escalation retries and
is not the repair budget. Do not create another graph or repeatedly call retry to bypass
stuck detection or an exhausted loop.

## Reconcile and finish

Graph termination and quality are separate. Inspect required evidence, review verdict,
errors and limitations even when phase is `complete`. Resolve contradictory reports with
concrete evidence. Do not turn skipped, cancelled or escalated nodes into passes.

Use notifications rather than polling loops. Status reads are appropriate for a missing
notification, diagnosis or new progress. If abandoning/superseding work, cancel its active
nodes/graph and confirm no worker can still modify the delivered result. Do not cancel
successfully completed graphs merely as a cleanup ritual. Report the engineering outcome
and checks in the user's language without dumping graph internals.
