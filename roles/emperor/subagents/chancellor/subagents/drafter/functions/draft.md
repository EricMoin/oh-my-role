---
name: draft
description: Research the codebase and produce a structured strategy draft
produces: draft
continue_until:
  any:
    - signal_observed(answer)
    - artifact_exists(draft)
observe:
  - on: tool_after
    capture_artifact: draft
---

Read the initial Strategy, repository context and reviewer findings. Revise the
Strategy from references/schemas.md, preserving accepted requirements. Investigate
uncertain facts with read-only tools. Include domain, write_scope, authorized_scope
and verification per item. Increment plan_revision when scope changes. Explain
unresolved uncertainty in notes; never silently discard veto findings.
Return the complete Strategy as identical signal(answer) payload and JSON result
fence. A draft fence may mirror the object for same-session artifact compatibility.
