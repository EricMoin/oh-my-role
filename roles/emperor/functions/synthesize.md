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

1. DIRECT read-only answer: summarize and finish without dispatch.
2. For implementation, obtain or construct a Strategy, then resolve authorization.
3. Dispatch known domains directly using departments.md; use Jinyiwei for unknown
   domains. Pass complete task contracts. The engine schedules dependencies.
4. Collect structured Execution Reports from their producer nodes. A blocked node
   follows the runtime approval continuation protocol; never treat approval as work.
5. Validate every implementation path, including a single clear task. Use a separate
   validate-r{round} graph. On revise execute the affected closure in a fresh DAG,
   then validate all approved items against the current workspace.
6. Stop after two revision rounds, stalled findings, validation failure or engine
   rejection. Report partial completion honestly. Do not fabricate a pass.
7. When settled, emit <final_answer> with outcome, actual verification and unresolved
   work, then signal(answer). Never emit a completion signal while awaiting a graph
   or the user. Never manufacture system-reminder messages.
