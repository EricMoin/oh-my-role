---
name: plan
description: Decompose the task into dependency-ordered subtasks and emit a structured strategy
priority: 20
produces: plan
observe:
  - on: tool_after
    capture_artifact: plan
transitions:
  - when: "artifact_exists(plan)"
    activate: ["orchestrate"]
    deactivate: ["plan"]
---

Investigate with read-only tools and produce the Strategy from references/schemas.md.
Read repository instructions before proposing commands. Include domain, write_scope,
authorized_scope, applicable verification commands and research_required per item.
Use a stable plan_revision, changing it when scope or authorization changes.

Split independently deliverable concerns, not arbitrary file counts or check counts.
One cohesive change can span files and have several checks. Extract shared types or
configuration first. Record real dependencies and serialize overlapping writes.
Do not put scheduling mechanics inside task descriptions.

Risk describes actual effects. Ordinary reversible edits are low risk; irreversible
or externally consequential work outside existing authorization needs an explicit
gate. Preserve the user's already-authorized operations in authorized_scope.

Emit a plan fence containing the complete Strategy JSON. The orchestrate function
then chooses direct finalization or independent review based on risk and uncertainty.
