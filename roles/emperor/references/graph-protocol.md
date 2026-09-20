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
Names include request ID, plan_revision, revision_round and continuation_index.
Both counters start at 0. Persist them and the full Strategy in node prompts.
Before execution choose a finite repair_limit (default 2), respecting user/runtime
resource constraints. A different limit needs a task-specific reason, recorded in
the run context; the default is not a reason to truncate known necessary work.
Increment revision_round only for a batch correcting diagnosed execution/acceptance
failures; increment continuation_index when resuming after approval or clarification.
Keep the repair count across plan revisions; a new graph does not reset it.
Never pre-author unknown execution subtasks before planning returns.
Only the graph creator schedules its nodes. A coordinator needing workers creates
its own child graph; it must not wait for completion of a graph containing itself.

Read-only answers need no graph. Clear implementation gets a compact Strategy and
execute → validate: one item per cohesive concern, with separate items for distinct
domains or independently deliverable work. A known multi-file change need not invoke
Chancellor. Unresolved scope, dependencies or design choices need planning.
Known domains bind directly to the dispatch ID in departments.md. Unknown domains
use emperor--jinyiwei. Workers never delegate. Routing does not grant permissions.
Before dispatch, resolve blocking correctness findings in Strategy.notes or exclude
the affected scope and dependents. User permission cannot turn a review veto into
evidence that the proposed implementation is correct.

For each execution graph:
- One node per selected subtask, ID exec-{subtask_id}-r{revision_round}-c{continuation_index}.
- Include the FULL subtask, plan revision, authorized scope, verification checks,
  settled prerequisite reports, and previous report plus correction on revisions.
  Results from dependencies in the same graph arrive via engine upstream context;
  do not invent reports before those workers run. A consumer must check that each
  prerequisite has a valid, complete report before starting dependent work.
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
For actions outside existing authorization or explicit plan mode, create an approval
graph with one emperor--approval node, needs_approval: true, and NO execution descendants.
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

Graph BLOCKED is a runtime state, not proof of a missing permission. rolebox can
normalize blocked/need_clarification dispatch states to need_approval. Inspect the
producer's original signal and output before deciding what is needed. Missing
prerequisites require evidence or a correction; clarification requires an answer to
the actual question, not blanket approval. Preserve any still-needed authorization.
For a resolved non-authorization blocker use the same cancel-descendants, retire-gate,
fresh-continuation mechanics, recording the resolution in the graph decision payload.
Do not approve an unresolved blocker merely to clear its graph state.

## Results across sessions

Read graph_status(graph_id, node_id, include_output=true, stream=true). Use the
producer node's signal_stream events and payload, or its materialized result fence.
Artifacts and signal_observed predicates are session-local. Never expect a child's
capture_payload_as artifact to appear in the parent session. Read the current graph
and current node run only; paginate truncated output before interpreting it.
Validate payloads against schemas.md. Emit structured JSON result fences carrying
the SAME object as the signal payload. Conflicting channels or invalid payloads are
protocol failures, not success. Human summaries are separate from machine payloads.
An engine-inferred answer or COMPLETED status alone is not an Execution Report and
cannot establish acceptance. Inspect and contain any dependent work if an invalid
success signal has already released it. Worker answer means ready for independent
validation, not accepted by the coordinator.

## Validation and revision

After settled execution and any continuations, create a separate validation graph
with a unique validate-r{revision_round}-c{continuation_index} node. Its prompt contains
the Strategy, all latest reports and the union of files changed across rounds.
Supply prior Validator reports and their actual check outputs/input records when
considering evidence reuse; absent those records, rerun checks. Validator checks the
current workspace, including previously passing items and affected integration paths. A partial or
failed worker report is a recovery input, never a successful prerequisite. Diagnose
and repair it before dispatching its consumers; independently validate before final
acceptance. If blocked, report partial outcomes without claiming the request passed.

On revise, compute the transitive dependent closure of failed IDs and add items
whose write scopes or verification targets overlap the changed files. Deduplicate.
Create a fresh execution DAG for this selected set; external prerequisites carry
forward only verified reports. Do not manually retry each dependent. The engine
owns dependency scheduling within that DAG. Pass prior work explicitly: a new node
has no guaranteed previous conversation. Revalidate the whole approved set.

Apply the recorded repair_limit; count rounds from persisted graph/node prompts.
Approval/clarification continuation and waiting consume no repair round. A continuation
that also corrects a diagnosed defect does consume one; renaming it cannot evade the
budget. Stop earlier on repeated identical findings without new evidence or an
unresolved blocker. A Validator infrastructure failure is not an acceptance failure:
apply bounded transient recovery before deciding it is unavailable. These are
orchestrator policy limits, NOT graph_add_loop traversal guarantees. No revision
back-edges are authored. Do not silently extend the limit, reset it on a new plan
revision, or relabel failed repairs as continuations. If it prevents completion,
report the concrete remaining work; a changed user constraint may explicitly revise
the limit while preserving the actual count.

Low-level graph_run(retry=true) is reserved for a transient failed node in a
quiescent graph. It resets the target AND its transitive downstream; do not retry
those descendants again. Never retry blocked/running nodes. Do not assume session
reuse or idempotence: pass the prior report and inspect existing files first.

## Completion

Collect actual results, cancel obsolete active nodes and emit a concise final_answer
with completed, excluded and unresolved items plus verification evidence. Call
signal(answer) with the same summary only when the request is settled. Approval,
missing tools and unavailable verification are not successful execution.
