---
name: graph-protocol
description: Canonical staged graph execution, approval, revision and result transport
---
# Graph protocol

This is the sole runtime protocol for Emperor and its coordinating agents.
Functions select stages; skills describe task methods. Do not infer graph behavior
from legacy dispatch terminology. Use the actual graph IDs returned by graph_create.
Topology examples are in graph-examples.json; replace example prompts with real
contracts before execution.

## Stages and ownership

Use separate, named graphs for planning, approval, execution and validation.
Names include request ID, plan_revision and round (initial round 0; at most two
revision rounds). Persist these values and the full Strategy in node prompts.
Never pre-author unknown execution subtasks before planning returns.
Only the graph creator schedules its nodes. A coordinator needing workers creates
its own child graph; it must not wait for completion of a graph containing itself.

Read-only answers need no graph. A clear implementation task gets a one-item
Strategy and execute → validate. Uncertain work goes to Chancellor first.
Known domains bind directly to the dispatch ID in departments.md. Unknown domains
use emperor--jinyiwei. Workers never delegate. Routing does not grant permissions.

For each execution graph:
- One node per selected subtask, ID exec-{subtask_id}-r{round}.
- Include the FULL subtask, plan revision, authorized scope, verification checks,
  prerequisite reports, and previous report plus correction on revisions.
- Set needs_approval: true, timeout_ms: 300000, max_retries: 0.
- Add on_signal(answer) dependency edges and join: {strategy: "all"} for joins.
- Serialize overlapping write_scope paths even without a data dependency. Unknown
  write scope is not evidence of independence; resolve it or serialize the writers.
- Run graph_run(dry_run=true) before the real run. On validation failure repair the
  graph before dispatch; do not bypass it with ad hoc execution.
- graph_run is non-blocking. End the turn and await GRAPH COMPLETE or GRAPH BLOCKED.
  Status polling is fallback-only. Do not emit final_answer while work is pending.

## Approval and authorization

A pending decision is durable graph state, not a remembered chat message.
For a high-risk plan or explicit plan mode, create a separate approval graph with
one emperor--approval node, needs_approval: true, and NO execution descendants.
Its prompt contains the exact Strategy, plan_revision, proposed IDs and action scope.
The gate emits need_approval with that context and performs no mutation.
Recover pending decisions using graph_status (including persisted graphs), then
render the concrete operation for the user. Existing explicit authorization remains
valid within its scope; do not ask again for the same authorized operation.

On approval, call graph_approve with action="approve" and payload containing
plan_revision, approved_ids and authorized_scope. On partial approval remove skipped
IDs and their TRANSITIVE dependents before recording that payload. Build execution
only from this approved set. A changed plan invalidates approval for changed scope.
On rejection call graph_approve(action="reject", reason=...) on the blocked gate,
then cancel remaining runnable work. graph_cancel alone leaves blocked gates intact.
Do not execute the rejected plan.

Runtime discovery: an execution node marked needs_approval may emit need_approval
with completed work, remaining action, scope and affected subtask ID. It stops there.
Before resolving it, cancel ALL transitive descendants in its execution graph so
approval cannot send a partial result to a consumer. Wait for other active branches
to settle; collect their real reports. Present the missing authorization to the user.
Approval marks the old node COMPLETED; it DOES NOT resume its worker session and
is NOT evidence that the remaining action ran. After approval, create a new execution
graph containing a continuation of that item plus its cancelled dependents. Pass
completed work, remaining action and explicit authorization; read files and edit in
place. Do not repeat completed side effects. Rejection resolves the blocked gate with graph_approve(action="reject", reason=...),
then cancels the branch. Cancelling alone does not resolve a blocked gate.
If a fallback router forwards a blocked child, retain the entire graph/node chain.
Retire descendants before resolving gates from deepest child to outer router, and
use one fresh continuation for the actual remaining item. On rejection reject each
blocked gate, then cancel obsolete runnable graphs. Never leave a child gate orphaned.
A malformed/absent approval context is unresolved, never implicit permission.

## Results across sessions

Read graph_status(graph_id, node_id, include_output=true, stream=true). Use the
producer node's signal_stream events and payload, or its materialized result fence.
Artifacts and signal_observed predicates are session-local. Never expect a child's
capture_payload_as artifact to appear in the parent session. Read the current graph
and current node run only; paginate truncated output before interpreting it.
Validate payloads against schemas.md. Emit structured JSON result fences carrying
the SAME object as the signal payload. Conflicting channels or invalid payloads are
protocol failures, not success. Human summaries are separate from machine payloads.

## Validation and revision

After each settled execution round, create a separate validation graph with a unique
validate-r{round} node. Its prompt contains the Strategy, all latest reports and the
union of files changed across rounds. Validator checks the current workspace,
including previously passing items and affected integration paths.

On revise, compute the transitive dependent closure of failed IDs and add items
whose write scopes or verification targets overlap the changed files. Deduplicate.
Create a fresh execution DAG for this selected set; external prerequisites carry
forward only verified reports. Do not manually retry each dependent. The engine
owns dependency scheduling within that DAG. Pass prior work explicitly: a new node
has no guaranteed previous conversation. Revalidate the whole approved set.

At most two revision rounds per request; count rounds from persisted graph/node
prompts, including runtime approval continuations. Stop earlier on repeated identical
findings, validation failure, capacity rejection or missing authorization. These are
orchestrator policy limits, NOT graph_add_loop traversal guarantees. No revision
back-edges are authored. If the cap prevents completion, report remaining work.

Low-level graph_run(retry=true) is reserved for a transient failed node in a
quiescent graph. It resets the target AND its transitive downstream; do not retry
those descendants again. Never retry blocked/running nodes. Do not assume session
reuse or idempotence: pass the prior report and inspect existing files first.

## Completion

Collect actual results, cancel obsolete active nodes and emit a concise final_answer
with completed, excluded and unresolved items plus verification evidence. Call
signal(answer) with the same summary only when the request is settled. Approval,
missing tools and unavailable verification are not successful execution.
