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

Check schema, dependencies, write conflicts and verification coverage first. Review
is warranted by uncertain assumptions, competing designs, shared interfaces/data
invariants, broad regression exposure or irreversible effects, even if risk is low.
When those concerns are absent and the work is well understood, return the plan
directly. Record the review decision and its concrete reason in Strategy.notes.
When review is warranted, create a separate one-node reviewer graph with the draft.
Read its current node signal payload/result; no cross-session artifact assumptions.

On veto, create a drafter graph with the draft and concrete review findings, then
review the revised Strategy. Choose and persist a finite review_limit before the
first review (default two draft revisions); justify any task-specific override.
Stop on a pass, unchanged findings without new evidence, or the recorded limit.
Do not silently reset/extend it or wire prompts containing unavailable draft content.
A remaining veto or unavailable review is unresolved: preserve it in notes and set
risk: high. Never silently convert reviewer failure to pass. Unresolved correctness
findings must be addressed or the affected scope excluded before execution; user
authorization by itself does not establish that the plan is correct.

Use finalizer only when conflicting draft/review content needs reconciliation;
otherwise return the reviewed Strategy directly. Finalizer must preserve scope and
surface unresolved findings, never enlarge authorization.

Emit the Strategy object as signal(answer) payload and identical JSON in a result
fence. A final_strategy fence may mirror it for local artifact compatibility.
