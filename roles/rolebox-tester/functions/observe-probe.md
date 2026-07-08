---
name: observe-probe
description: Probes observe lifecycle — when_output contains/not_contains guards, sync_todos mirroring, inject reaction, and capture_artifact extraction.
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

  # (c) sync_todos mirrors todowrite args into STATE.__todos
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
