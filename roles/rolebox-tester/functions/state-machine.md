---
name: state-machine
description: Tests function state machine lifecycle — gate blocking, evidence observation, continuation, transitions, artifact capture, and phase reporting via function_state tool.
phase: test
priority: 5
gate: tool_observed(lsp_servers)
continue_until: evidence_met
requires_evidence:
  - lsp_servers
observe:
  - "on": tool_after
    tool: lsp_servers
    set_evidence: lsp_servers
  - "on": tool_after
    tool: lsp_servers
    capture_artifact: state-machine-report
transitions:
  - when: evidence_met
    activate:
      - test-all
    deactivate:
      - transform
continue_max: 3
state_schema_version: 1
---

# State Machine Function

This function exercises the full rolebox function state machine lifecycle:

1. **Gate**: `tool_observed(lsp_servers)` — the gate blocks activation until the `lsp_servers` tool has been observed. The function starts with phase `gated` and gate showing ❌.
2. **Evidence**: `requires_evidence: [lsp_servers]` — the function requires the `lsp_servers` evidence tag to be set.
3. **Observation**: When `lsp_servers` is called, the observe handler sets `set_evidence: lsp_servers` and captures the `state-machine-report` artifact from the assistant's output.
4. **Continuation**: `continue_until: evidence_met` — the function auto-continues until the `lsp_servers` evidence tag is set. `continue_max: 3` limits auto-continuation to 3 rounds.
5. **Transitions**: When `evidence_met` is true, the transition activates `test-all` and deactivates `transform`.

## Execution

Upon activation, the function is gated. The caller must call `lsp_servers()` to satisfy the gate and trigger evidence observation, continuation completion, and transitions. Use `function_state()` to observe each lifecycle stage.
