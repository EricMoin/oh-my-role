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
continue_until: "any:[signal_observed(answer), evidence_met]"
requires_evidence:
  - signal_answer_observed
---

# Signal Probe Function

This function exercises the rolebox signal tool lifecycle via function-state observation:

1. **signal_observed condition**: The `continue_until` expression `any:[signal_observed(answer), evidence_met]` tests the dual-channel completion mechanism — the function can terminate when either a `signal(type="answer")` is observed OR when the `signal_answer_observed` evidence tag is set.

2. **when_args filter**: The observe block listens for `tool: signal` calls and uses `when_args: {match: {type: "answer"}}` to only react to `signal(type="answer")` calls, ignoring other signal types (e.g., `type="blocked"`, `type="escalate"`).

3. **capture_payload_as**: When the filtered signal fires, the observe handler captures the signal's payload into the `signal_test_payload` context variable, which can be inspected via `function_state()`.

4. **Signal taxonomy**: Tests 115-116 and 139 verify the basic signal call, payload capture, and evidence tracking. This function provides the observable lifecycle that those tests inspect.

## Execution

Upon activation, the function waits for a `signal(type="answer")` call. After the signal is observed (or the evidence is set), the function completes automatically via the `continue_until` condition. Use `function_state()` to inspect the `signal_answer_observed` evidence and the captured payload.
