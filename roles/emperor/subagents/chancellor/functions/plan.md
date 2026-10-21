---
name: plan
description: Investigate and construct a versioned Strategy for Emperor
priority: 20
requires_evidence: [outcome_accepted]
observe:
  - on: tool_after
    tool: graph_submit_outcome
    when_output:
      contains: '"decision": "accepted"'
    set_evidence: outcome_accepted
  - on: tool_after
    tool: graph_submit_outcome
    when_output:
      contains: '"decision":"accepted"'
    set_evidence: outcome_accepted
continue_until: evidence_met()
---

Investigate with read-only tools and produce the Strategy from references/schemas.md.
Read repository instructions before proposing commands. Include domain, write_scope,
authorized_scope, applicable verification commands and research_required per item.
Keep each item's verification array proportional to the changed behavior and affected
consumers. Prefer case/file/package selections; a full suite needs an explicit
repository gate, user request or concrete broad-impact reason. Assign each shared
check once. Add a Test item for missing regression coverage or meaningful integration
testing, with test-file ownership and real implementation dependencies; do not add a
Test session to every trivial change or require upstream done to wait for downstream
Test. Keep cohesive implementation and tests together when a single worker can own them.
Use a stable plan_revision, changing it when scope or authorization changes.

Split independently deliverable concerns, not arbitrary file counts or check counts.
One cohesive change can span files and have several checks. Extract shared types or
configuration first. Record real dependencies and serialize overlapping writes.
Do not put scheduling mechanics inside task descriptions.

Risk describes actual effects. Ordinary reversible edits are low risk; irreversible
or externally consequential work outside existing authorization needs an explicit
gate. Preserve the user's already-authorized operations in authorized_scope.

Finalize the Strategy using the orchestrate function's schema and review-decision
checks, then submit strategy as data. Both functions are active; do not wait for a
fence capture or a local artifact transition. Emperor schedules independent review.
