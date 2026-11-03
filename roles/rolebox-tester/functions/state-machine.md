---
name: state-machine
description: Tests function state machine lifecycle — gate blocking, evidence observation, continuation, transitions, artifact capture, and phase reporting through the host command tool.
phase: test
priority: 5
gate: tool_observed(bash)
continue_until: evidence_met
requires_evidence:
  - bash
observe:
  - "on": tool_after
    tool: bash
    set_evidence: bash
  - "on": tool_after
    tool: bash
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

This function exercises the full rolebox function state machine lifecycle on hosts
where the function system is available (opencode 1.x/2.x, Pi and DSH). The gate,
evidence and observe tool is the **host command tool `bash`**, so the module works
without an LSP server and never depends on a language-server capability.

1. **Gate**: `tool_observed(bash)` — the gate blocks activation until the `bash` tool
   has been observed. The function starts with phase `gated` and its gate unsatisfied.
2. **Evidence**: `requires_evidence: [bash]` — the function requires the `bash`
   evidence tag to be set.
3. **Observation**: When `bash` is called, the observe handler sets the `bash` evidence
   tag and captures the `state-machine-report` artifact from the assistant's output.
4. **Continuation**: `continue_until: evidence_met` — the function auto-continues until
   the `bash` evidence tag is set. `continue_max: 3` limits auto-continuation to three
   rounds.
5. **Transitions**: When `evidence_met` is true, the transition activates `test-all` and
   deactivates `transform`.

## Execution

Upon activation with `|state-machine|`, the function is gated. Call the host command
tool (`bash`) to satisfy the gate and trigger evidence observation, continuation
completion and transitions. The current state surface is the markdown
`## Function state: state-machine` heading (the `function_state` block name the runtime
recognizes); inspect it where the host renders function-state injection to observe
phase, gate satisfied, evidence, todos remaining and continuation count. If the live
host renders only `## Active functions`, record the function-state surface as absent
for that sub-check instead of inventing state. There is no `function_state` tool, and
the state is a markdown heading rather than an angle-bracket block.
