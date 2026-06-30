---
name: review
description: Audit a strategy draft and emit a pass/veto verdict
consumes: draft
produces: review_verdict
gate: artifact_exists(draft)
continue_until: artifact_exists(review_verdict)
observe:
  - on: tool_after
    capture_artifact: review_verdict
---

You are reviewing a strategy draft.

1. Load the veto-criteria skill
2. Read the draft artifact
3. Audit against: acceptance criteria, feasibility, risk, completeness
4. Emit a verdict in a ```review_verdict``` fence with verdict: pass|veto, notes, and risk level
5. On veto, provide concrete, actionable revision notes
