---
name: route
description: Route subtasks by domain to specialist department workers via background dispatch, collect results, and format for orchestrator handoff
priority: 15
continue_until:
  any:
    - signal_observed(answer)
    - signal_observed(need_approval)
    - signal_observed(blocked)
    - signal_observed(need_clarification)
    - signal_observed(escalate)
continue_max: 10
---

Load domain-routing for the canonical department registry. Prefer inline execution
for unknown domains; known domains ordinarily arrive directly at the specialist.
If asked to route, select exactly one department and create a SEPARATE child graph.
Follow references/graph-protocol.md; never add a child to the graph waiting on you.

Forward the entire subtask contract, plan_revision, authorization, prerequisite
reports, research_required, verification checks and any previous report/correction.
Set needs_approval: true, timeout_ms: 300000 and max_retries: 0 on the child node.
Validate with graph_run(dry_run=true), run, yield, and read the child's current node
output/signal stream. Do not infer cross-session artifacts.

If the child pauses, preserve its original signal, full payload and graph_chain
using schemas.md. Distinguish approval from prerequisite/clarification pauses even
when the graph normalizes them to need_approval. Do not perform the operation inline.
The Emperor resolves the blocked branch using the continuation protocol. Do not
convert a blocked/partial child into an answer indicating success.

On a genuine capacity rejection before a child started, execute inline only if the
operation is authorized and tools are available. Never duplicate a live child.
Forward successful reports unchanged; forward failure with its original non-success
signal and payload. Invalid or incomplete success reports become escalate, not
answer. Emit the JSON result fence before the matching explicit signal. On repeated
infrastructure failure, escalate with the child graph state so Emperor can apply
bounded recovery. Settle obsolete runnable children; preserve pending gates with
their graph_chain so the coordinator can resolve them without orphaning a child.
