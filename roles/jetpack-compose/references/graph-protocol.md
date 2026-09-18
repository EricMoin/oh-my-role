# rolebox review graph protocol

Verified against rolebox `src/graph/tools/index.ts`, `graph-tools.ts`, and the graph
engine. Live tool schemas take precedence. The lead writes code; all five children are
read-only. The graph schedules evidence gathering, not architectural decisions.

## Review a stable implementation

Create a graph with `graph_create({name})`. For each selected specialist, call
`graph_add_node({graph_id, id, agent: "jetpack-compose--<reviewer>", prompt})`.
The prompt includes the brief, snapshot/diff, concrete question, read-only scope, and
report/signal contract from `references/schemas.md`.

Independent reviews are root nodes with no edges: the engine can run them concurrently.
Do not add serial edges merely to impose a checklist order. If a source investigation
must inform a review, add an `on_signal` edge with `signal_filter: ["answer"]` from the
source node to that reviewer. Pass explicit evidence in the signal payload. Include the
graph/source node IDs and artifact paths in the consumer prompt so it can retrieve the
upstream report with graph_status (including output/stream as needed). Do not assume the
upstream payload is inserted into the worker prompt: the engine records upstreamResults
separately. If the consumer cannot access required evidence, use parent-mediated batches
and embed the retrieved evidence in the next prompt. Edges propagate payload data; they do not merge
`engineering_state_patch` into prompts or mutate a canonical brief.

Use `graph_run({graph_id, dry_run: true})` to validate a constructed topology, then
`graph_run({graph_id})` to launch. Launch is non-blocking. Yield the turn, resume on
`[GRAPH COMPLETE]` or `[GRAPH BLOCKED]`, and read `graph_status({graph_id,
include_output: true, max_chars: 30000})`. Poll only as recovery when notifications are missing; read
additional pages if output is truncated. Inspect every relevant output and error.
A completed graph can contain failed assessments or escalations.

## Data and control

A reviewer writes a single result-fenced YAML report then emits explicit `answer` with
`assessment` and `observations`, including negative findings. `answer` means the read-only
assessment finished; the lead decides whether it supports acceptance. Never discard
failures because the engine node completed. If assessment cannot be performed, emit
`escalate` with the missing input/environment and recovery suggestion.

Do not emit `revise_needed` with no repair destination. Do not create loops among
read-only reviewers. `graph_add_loop` only bounds actual cycles whose writer can repair
code; this role intentionally uses parent-owned repairs. In a future writer topology,
use explicit `revise_needed` back-edges and bounded `max_traversals`; top-level nonempty
`items`, `findings`, or `unresolved` in an answer payload are interpreted by loop convergence
as unresolved work. Do not hide defects to force convergence.

## Parent synthesis and repair

Wait for the relevant review batch before modifying its files. Reconcile duplicate or
conflicting reports using invariants, observed behavior, and project constraints.
Advisory pattern preferences do not compel edits. Merge proposed fact corrections only
after checking them. Apply justified repairs, rerun affected checks, and, if independent
re-review is needed, create a new review batch for the updated snapshot with stable issue
IDs and previous findings. Carry unresolved issues forward. Limit substantive repair/
re-review rounds to two for a design; if the same blocker persists, diagnose and report
it instead of resetting budgets or blindly trying a third mechanism. A new batch is not
a fresh budget.

Use `graph_run({graph_id, node_id, retry: true, modify_prompt})` only for a recoverable
execution failure after its cause is addressed, not to bypass design findings or loop
exhaustion. Do not change running topology or silently replace active work; cancel stale
nodes with `graph_cancel` before replacing a superseded batch. Inline review can recover
a tool outage but must not be described as independent review.

## Human approval

Ordinary local implementation and review do not need an approval node. For an action
that genuinely needs a user decision, first prepare a concrete proposal. A read-only
proposal node declared `needs_approval: true` emits `need_approval`; approval completes
that node and releases downstream answer edges, it does not resume that worker to act.
`graph_approve` requires the applicable user decision. These reviewer children cannot
perform the downstream write/action; the parent handles it within its authorization.
