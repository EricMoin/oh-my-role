---
name: signal-probe
description: "Probes signal tool lifecycle — signal_observed condition, when_args filter, capture_payload_as, dual-channel completion, and signal taxonomy validation."
phase: test
priority: 5
observe:
  - "on": tool_after
    tool: signal
    when_args:
      match:
        type: "answer"
    set_evidence: signal_answer_observed
    capture_payload_as: signal_test_payload
continue_until:
  any:
    - signal_observed(answer)
    - evidence_met
requires_evidence:
  - signal_answer_observed
---

# Signal Probe Function

This function exercises the rolebox signal tool lifecycle through function-state
observation:

1. **signal_observed condition**: The `continue_until` condition
   (`any: [signal_observed(answer), evidence_met]`) tests the dual-channel completion
   mechanism — the function can terminate when either a `signal(type="answer")` is
   observed OR when the `signal_answer_observed` evidence tag is set.

2. **when_args filter**: The observe block listens for `tool: signal` calls and uses
   `when_args: {match: {type: "answer"}}` to only react to `signal(type="answer")`
   calls, ignoring other signal types (for example `type="blocked"` and
   `type="escalate"`).

3. **capture_payload_as**: When the filtered signal fires, the observe handler captures
   the signal's payload into the `signal_test_payload` context variable, which can be
   inspected through the markdown `## Function state: signal-probe` heading.

4. **Signal taxonomy**: Tests 115, 116 and 139 verify the basic signal call, payload
   capture and evidence tracking. The `signal` tool is a function-lifecycle channel
   only: a **graph v3 signal never settles a node**. A v3 node settles exclusively
   through `graph_submit_outcome`, and no signal, severity or free-form payload routes
   a declared graph.

## Execution

Upon activation with `|signal-probe|`, the function waits for a `signal(type="answer")`
call. After the signal is observed (or the evidence is set), the function completes
automatically via the `continue_until` condition. Inspect the markdown
`## Function state: signal-probe` heading where the host renders function-state
injection to see the `signal_answer_observed` evidence and the captured payload. If
the live host renders only `## Active functions`, report the state-surface sub-check
SKIP `capability_absent:function_state` rather than FAIL. There is no `function_state`
tool, and the state is a markdown heading rather than an angle-bracket block.
