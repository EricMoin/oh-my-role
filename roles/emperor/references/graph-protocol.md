---
name: graph-protocol
description: Graph v3 declarations, accepted outcomes, authorization and bounded recovery
---
# Graph protocol

Emperor uses the current rolebox Graph v3 API: graph_declare,
graph_submit_outcome, graph_control, graph_status and graph_audit. The runtime
source is rolebox's docs/graph-outcome-protocol.md and src/graph/. Examples in
graph-examples.json are topology templates; embed real contracts before dispatch.

## Ownership and stages

Only Emperor, the declaring session, orchestrates. Every dispatched agent is a
worker, including Chancellor and Jinyiwei. Workers may submit their own outcome;
they cannot declare/control graphs, query the global store or create child graphs.
The subagent directory hierarchy is a catalog of agent IDs, not runtime authority.
Emperor dispatches every planning, review, draft, reconciliation and execution
stage directly. Jinyiwei executes unknown-domain work or returns a routing suggestion.

Read-only answers need no graph. Clear changes use a compact Strategy followed by
execution and independent validation. Unresolved scope, dependencies or design
choices go to emperor--chancellor. After receiving its Strategy, Emperor decides
whether independent review is needed for uncertain assumptions, shared invariants,
regression exposure or irreversible effects. Dispatch emperor--chancellor--reviewer
with the actual draft. On veto, dispatch emperor--chancellor--drafter with findings,
then review again. Use emperor--chancellor--finalizer only for reconciliation.
Persist a finite review_limit (default two draft revisions) and its reason. Never
execute through unresolved correctness vetoes merely because permission was granted.

Use separate named graphs for stages whose prompts depend on collected results.
Names include request ID, strategy revision, revision_round and continuation_index.
Both counters start at 0. Persist the full Strategy and counters in node prompts.
Strategy.plan_revision is a business identifier; graph_declare.plan_revision is the
runtime's compiled content digest. Track both; never substitute one for the other.
Changing an immutable declaration requires a new graph name. Re-declaring the same
name and definition is recovery, not a way to restart completed work.

## Declare and start

Submit the entire object through graph_declare({declaration: {...}}):
- version: 3, name, nodes and edges are required.
- Every node declares outcomes and completion: {mode: "explicit"}.
- An edge is {from, to, outcome}; only that accepted outcome activates it.
- A consumer declares inputs: [{from, outcome}] for each report it reads. Edges
  schedule work; they do not automatically provide every upstream payload.
- Use join: {strategy: "all"} when all prerequisites must complete. Route execution
  dependencies only on done. Never route them on blocked, approval_required,
  clarification_required or failed.
- Put timeouts inside node.budget: {timeout_ms: 300000}, adjusting to actual work.
  Do not author max_retries; even zero is rejected. Set a finite run-level
  budget.max_executions covering selected nodes and any explicitly allowed retry.
  Each new attempt spends an execution, including entry nodes and retries. There
  is no refund for a settled/cancelled attempt and no automatic retry policy.

Each execution node carries the FULL subtask, Strategy revision, authorization,
verification plan, prior reports/corrections and settled external prerequisites.
Use exec-{subtask_id}-r{revision_round}-c{continuation_index}. Same-graph prerequisites
arrive through declared inputs; never fabricate them before their producers run.
Serialize overlapping write_scope paths. Unknown scope is not proof of independence.

The declaration call performs strict parsing, compilation and capability preflight,
and the registered host entry starts/resumes execution. There is no separate run
or dry-run tool. Check persisted AND start.kind: started/resumed are distinct from
saved/blocked/refused. A saved plan is not proof of dispatch. Inspect refusals and
status before recovery; do not create a duplicate graph just because startup is slow.
Missing schema, command, completion or approval capabilities cannot be installed by
asserting supported_validators. Preserve required gates and report the missing host
configuration. Natural completion requires a host-authorized policy; use explicit
submission for all Emperor templates.

## Worker results

Pi provides sandboxed native worker tools. dsh graph workers expose only
graph_submit_outcome and graph_worker_exec; use the latter for reading, editing,
checks and commands in the workspace sandbox. Planning/review/approval workers
use read-only commands only; Validator runs authorized checks without edits. Tool
availability does not enlarge role or task scope. If Context7 or other research
tools are unavailable inside this boundary, use available local source/official
evidence or report the missing evidence; never bypass the host execution guard.

Workers read their own host handoff, declared outcomes and materialized inputs.
Submit graph_submit_outcome({graph_id, node_id, outcome_id, credential, data}) using
only that attempt's credential. Never print credentials in reports/fences or read
host state to discover them. The host derives attempt, submission and compiled
revision identities; workers do not supply those as tool arguments.

Business data follows schemas.md. Outcome vocabulary:
- Strategy stages: strategy; independent review: pass or veto.
- Execution: done, failed, blocked, clarification_required, approval_required.
- Independent validation: pass or revise.
- Approval preparation: approval_required (a request, never permission).

Only decision: accepted with verdict: committed or replayed and no refusals settles
a submission. Rejection/refusal leaves no successful result and cannot release a
consumer. Inspect diagnostics and repair the payload or missing evidence; do not
remove a required gate. An identical retry after an uncertain delivery is idempotent;
a conflicting submission cannot overwrite a settled attempt. Once accepted, stop
work on that attempt. signal and result fences do not complete Graph v3 nodes.
Optional result fences mirror data only for readability; accepted results are the
transport authority. Local function evidence tracks the accepted tool response,
not merely a call, signal or fence.

These templates do not register business JSON schemas or trusted command validators.
Their structural acceptance is not independent verification of an Execution Report.
Consumers must check schemas.md and prerequisite completeness before working;
Emperor still requires Validator. If installed host contracts/gates are required,
reference their exact identities; never invent a schema or policy capability.

## Read and wait

After confirmed start, yield for real GRAPH COMPLETE / GRAPH BLOCKED notifications.
They identify graph/run and carry a stable notification ID, not business reports.
Delivery is at least once: duplicates do not authorize duplicate dispatch. Query
committed state before acting. Status polling is fallback-only, never a busy loop.

Read graph_status with graph_id, scope: "all", format: "json", include_output: true
and include_history: true; use run_id and node_id to select the intended producer.
Read attempts[].accepted (outcome identity) and attempts[].result (accepted data),
controls, approvals, budget and unsettled_effects. JSON output is not paginated by offset/max_chars; narrow by run_id/node_id
if the host display truncates it. Those pagination fields apply to non-JSON output. No signal_stream or stream argument is used.
Never confuse historical attempts with the current result. A complete graph may
contain a failed/blocked business outcome and may still have unsettled effects.
Inspect every required report; neither graph phase nor worker exit proves success.

## Authorization and approval

Honor existing explicit authorization. Ordinary reversible edits do not require a
new permission gate. Explicit plan mode or genuinely unauthorized consequential
work must wait for the user's decision on a concrete Strategy and action scope.
An optional read-only emperor--approval node prepares and persists an Approval
Request as approval_required, with no execution descendants. This accepted request
is a durable context record, NOT a host approval or successful execution. Recover
it from accepted data; ask about the exact revision. A question is not consent.
Record the actual Decision and request graph/run/node identity in the next stage's
immutable prompt. Partial approval excludes skipped IDs and all transitive dependents.
A scope change requires matching authorization. Do not fabricate user consent.

Host-enforced approval is a separate control plane. If the task/host requires it,
use a declared outcome with principal-approval@1 and the installed approval policy;
an informational approval_required outcome or chat message cannot replace that gate.
The declaring session raises graph_control(command: "approval-request", graph_id,
node_id, attempt_id, reason, approver_session_id, expires_at) for an IN-FLIGHT attempt.
The deadline is epoch milliseconds; the installed policy must authorize the named
approver. A settled informational request cannot be paused retroactively. The
reason binds the exact Strategy revision, proposed IDs and concrete action scope.
Only the policy-authorized approver session issues approve/reject with reason.
Independent review forbids self-approval; operator-confirmation must be explicitly
installed and still requires real user authorization. A session identity does not
prove a human action. Missing policy/authority is a blocker, never a reason to
choose another session or remove principal-approval. Do not impersonate the approver.

Approve/reject records a control decision; it neither submits a business outcome nor
performs the remaining action. Do not invent an approval payload parameter. Check
the recorded decision and attempt state. Do not assume approval resumes an ended
worker. Reject/cancel obsolete runs through authorized controls and verify effects.

For runtime discovery, the worker stops before the action and submits
approval_required with completed/remaining work. Missing prerequisites use blocked;
actual user choices use clarification_required. These are distinct accepted business
outcomes with no done edge, not normalized signals or automatic control requests.
Collect settled sibling work and contain the obsolete run with graph_control cancel
where work remains. Confirm external effects before starting overlapping work.
After the actual blocker/authorization is resolved, create a fresh continuation
with the remaining item and its unperformed dependents, carrying the original
request and resolution. Inspect existing files and never repeat completed effects.
No control approval can convert a partial worker report into done.

## Validation and recovery

After execution and continuations settle, dispatch a separate Validator with every
approved item, latest reports, cumulative changed paths and prior independent check
records. Validate the current workspace, including previously passing items and
affected integrations. Missing evidence cannot be treated as a prior passing check.
On revise, select failed IDs, their transitive dependents and overlapping write or
verification scopes. Execute that closure in a fresh DAG, then revalidate the whole
approved set. Partial reports are recovery inputs, never successful prerequisites.

Choose a finite repair_limit before execution (default 2); persist overrides with a
task-specific reason. Preserve the actual repair count across graphs and plan
revisions. Waiting and pure approval/clarification continuation do not spend repair
rounds; a continuation correcting a diagnosed defect does. Stop on unchanged failures
without new evidence, exhausted budget or unresolved blockers; report remaining work.

Use graph_control retry only for a diagnosed transient failure after confirming
external execution/effects. A node retry mints a NEW attempt and consumes budget;
it does not reset every descendant. A run retry creates a NEW run with the SAME
immutable plan only after terminal state and accounted effects. Neither guarantees
session reuse or side-effect idempotence. Inspect and explicitly supply prior work.
A cancellation request or timeout is not confirmed termination. Never duplicate an
unknown live execution. Use graph_audit for storage/recovery blockers; never delete
or recreate an unreadable store, decode old state yourself, or treat state loss as
permission to rerun. Recover consistent host state or report the concrete blocker.

## Completion

Collect accepted results and independent verification. Settle/cancel obsolete work,
check unconfirmed external effects, then emit final_answer with completed, excluded
and unresolved items and actual checks. Do not claim success while required work or
verification is missing. Approval and graph completion alone are not task completion.
