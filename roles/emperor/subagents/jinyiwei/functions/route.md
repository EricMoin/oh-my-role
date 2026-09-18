---
name: route
description: Route subtasks by domain to specialist department workers via background dispatch, collect results, and format for orchestrator handoff
priority: 15
continue_until:
  any:
    - signal_observed(answer)
    - artifact_exists(result)
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

If the child blocks for approval, preserve its graph/node IDs and forward the
approval context with signal(need_approval); do not perform the operation inline.
The Emperor resolves the blocked branch using the continuation protocol. Do not
convert a blocked/partial child into an answer indicating success.

On a genuine capacity rejection before a child started, execute inline only if the
operation is authorized and tools are available. Never duplicate a live child.
Return the canonical Execution Report unchanged, or honestly record failure.
Both signal(answer) and the JSON result fence carry the same report object.
