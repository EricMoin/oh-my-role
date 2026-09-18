---
name: orchestrate
description: Finalize a strategy with optional independent review and bounded draft revision
phase: planning
priority: 10
produces: final_strategy
continue_until:
  any:
    - signal_observed(answer)
    - artifact_exists(final_strategy)
observe:
  - on: tool_after
    capture_artifact: final_strategy
  - on: tool_after
    tool: signal
    when_args:
      match:
        type: answer
    set_evidence: signal_answer
continue_max: 8
---

Follow references/graph-protocol.md and schemas.md. The plan function supplies an
initial Strategy. Do not draft it a second time by default.

For low-risk, well-understood work, return the plan as final_strategy after checking
schema, dependencies, write conflicts and verification coverage. For high-risk or
uncertain work, create a separate one-node reviewer graph with the complete draft.
Read its current node signal payload/result; no cross-session artifact assumptions.

On veto, create a drafter graph with the draft and concrete review findings, then
review the revised Strategy. At most two draft revisions; persist the round in
node prompts. Do not wire speculative prompts containing unavailable draft content.
A remaining veto or unavailable review is unresolved: preserve it in notes and set
risk: high. Never silently convert reviewer failure to pass.

Use finalizer only when conflicting draft/review content needs reconciliation;
otherwise return the reviewed Strategy directly. Finalizer must preserve scope and
surface unresolved findings, never enlarge authorization.

Emit the Strategy object as signal(answer) payload and identical JSON in a result
fence. A final_strategy fence may mirror it for local artifact compatibility.
