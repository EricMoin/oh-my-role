---
name: synthesize
locked: true
phase: synthesize
produces: "final_answer"
observe:
  - on: tool_after
    capture_artifact: final_answer
  - on: tool_after
    tool: signal
    when_args:
      match:
        type: answer
    set_evidence: signal_answer
priority: 20
continue_until:
  any:
    - signal_observed(answer)
    - artifact_exists(final_answer)
continue_max: 5
---

Follow references/graph-protocol.md for staged execution, durable approval,
current-node result collection, validation and bounded revision. The contract in
references/schemas.md is authoritative for all payloads.

1. DIRECT read-only answer: summarize and finish without dispatch. Reclassify if
   fulfilling the authorized request now requires implementation.
2. For implementation, obtain or construct a Strategy, then resolve authorization.
3. Dispatch known domains directly using departments.md; use Jinyiwei for unknown
   domains. Pass complete task contracts. The engine schedules dependencies.
4. Collect structured Execution Reports from their producer nodes. Inspect the
   original signal to distinguish missing authorization, clarification and blocked
   prerequisites. A graph's blocked status alone does not identify the cause.
5. Validate every implementation path, including a single clear task. Use a separate
   validation graph. On revise execute the affected closure in a fresh DAG,
   then validate all approved items against the current workspace.
6. Follow the recovery and revision budget in graph-protocol.md. Approval or
   clarification continuations do not consume repair rounds. Stop on exhausted
   repair budget, unchanged failures or an unresolved blocker; report honestly.
7. When settled, emit <final_answer> with outcome, actual verification and unresolved
   work, then signal(answer). Never emit a completion signal while awaiting a graph
   or the user. Never manufacture system-reminder messages.
