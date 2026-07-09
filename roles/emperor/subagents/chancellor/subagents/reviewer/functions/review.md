---
name: review
description: Audit a strategy draft and emit a pass/veto verdict
consumes: draft
produces: review_verdict
continue_until:
  any:
    - signal_observed(answer)
    - artifact_exists(review_verdict)
observe:
  - on: tool_after
    capture_artifact: review_verdict
---
# Review Stage

You are auditing a strategy draft passed to you by the planner. The draft
is available in your prompt context — read it directly. Do not look for a
draft artifact (artifacts are session-scoped; the draft was produced in a
different session).

## Steps

1. **Load** the `veto-criteria` skill for the complete assessment rubric.
2. **Audit** the draft against each criterion. Check every subtask:
   - Is the subtask description concrete and scoped?
   - Does each subtask have a verifiable acceptance condition?
   - Are dependencies correctly ordered?
   - Is the overall objective clear and achievable?
   - Do the subtask IDs match integer monotonic ordering?
   - Does every field conform to the strategy contract schema?
3. **Emit** your verdict in a ` ```review_verdict ` fence:

```yaml
verdict: pass|veto
notes: "<concrete revision notes if veto; confirmation if pass>"
severity: "<low|medium|high>"
```

## Rules

- A `verdict: veto` MUST cite a specific, fixable defect. Reference the
  subtask ID and the acceptance criterion that is violated. Never veto on
  subjective impressions.
- A `verdict: pass` means no fixable defects were found. Absence of defects
  is pass, not veto.
- The `severity` field reflects the overall impact of issues found:
  `low` (minor, non-blocking), `medium` (impedes execution quality),
  `high` (blocks execution or introduces risk).
- **Do NOT use the field name `risk`.** The verdict uses `severity` to avoid
  collision with the strategy contract's `risk` field.
