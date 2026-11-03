---
name: observe-probe
description: Probes the observe lifecycle — bash-based when_output contains/not_contains guards, inject reaction and capture_artifact extraction, plus the opencode-only sync_todos mirror of todowrite.
phase: test
priority: 5
observe:
  # (a) when_output.contains fires when bash output contains PROBE_CONTAINS_OK
  - "on": tool_after
    tool: bash
    when_output:
      contains: PROBE_CONTAINS_OK
    set_evidence: probe_contains_fired

  # (b) when_output.not_contains suppresses when bash output contains PROBE_EXCLUDED
  - "on": tool_after
    tool: bash
    when_output:
      not_contains: PROBE_EXCLUDED
    set_evidence: probe_not_contains_would_fire

  # (c) sync_todos mirrors todowrite args into STATE.__todos — opencode 1.x/2.x only
  - "on": tool_after
    tool: todowrite
    sync_todos: true
    set_evidence: probe_todos_synced

  # (d) inject text into next system prompt when condition is met
  - "on": message
    when: tool_observed(bash)
    set_evidence: probe_inject_triggered
    inject: "OBSERVE_PROBE_INJECT_TRIGGERED"

  # (e) capture_artifact extracts a fenced block named probe_result
  - "on": tool_after
    tool: bash
    when_output:
      contains: PROBE_ARTIFACT_TRIGGER
    set_evidence: probe_artifact_captured
    capture_artifact: probe_result
---

# Observe Probe Function

This function exercises the rolebox observe lifecycle through function-state
observation. It declares no gate or transitions — all five handlers are always-on
observe specs whose firing is proven by the evidence tags they set, visible in the
markdown `## Function state: observe-probe` heading.

Four probes are **bash-based** and work wherever the host command tool is registered:

1. **when_output.contains** — the `bash` observe spec fires only when the tool output
   contains `PROBE_CONTAINS_OK`, setting `probe_contains_fired`.
2. **when_output.not_contains** — the `bash` observe spec is suppressed when the output
   contains `PROBE_EXCLUDED`, so `probe_not_contains_would_fire` never fires.
3. **inject** — once `bash` has been observed, the `on: message` observe spec injects
   the marker `OBSERVE_PROBE_INJECT_TRIGGERED` into the next system prompt and sets
   `probe_inject_triggered`.
4. **capture_artifact** — when the output contains `PROBE_ARTIFACT_TRIGGER`, the
   assistant's `probe_result` fenced block is extracted into the artifact store and
   `probe_artifact_captured` is set.

The fifth probe is **opencode 1.x/2.x only**:

5. **sync_todos** — the `todowrite` observe spec mirrors the latest todo state into the
   function's `STATE.__todos` key and sets `probe_todos_synced`. Only opencode 1.x/2.x
   register a tool named `todowrite`; DSH registers `todo_write` and other hosts differ.
   On a host without `todowrite` the spec is inert, so test 93 is **SKIP** with
   `capability_absent:todowrite` rather than FAIL. Do not rename or add a second spec at
   runtime.

## Execution

Activate with `|observe-probe|`, then drive each handler: run `bash` with the trigger
strings, call the host's todo tool where it is registered as `todowrite`, and emit a
`probe_result` fenced block. Inspect the `## Function state: observe-probe` markdown
heading where the host renders function-state injection to confirm each evidence tag
fired. If the host renders only `## Active functions`, the observe evidence has no
in-session surface: report the affected sub-checks SKIP
`capability_absent:function_state` rather than FAIL. There is no `function_state` tool,
and the state is a markdown heading rather than an angle-bracket block.
