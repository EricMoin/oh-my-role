---
name: ai-designer-handoff-gate
description: Handoff gate for AI Designer subagent. Assembles the final design specification, visible artifact instructions, validation summary, assumptions, and implementation notes.
---

# Handoff Gate

## Mission

Assemble the final deliverable after all prior gates pass. Do not invent new design decisions. Do not hide unresolved risks. Make the result easy for a builder, stakeholder, or reviewer to use.

## Required Checks

- Confirm prior gates passed or list the exact unresolved gate that blocks handoff.
- Summarize the design read, audience, success criteria, and constraints.
- Include the final IA or flow, visual system, interaction model, state matrix, and accessibility requirements.
- Include asset and content requirements, with honest placeholder policy.
- Include visible artifact instructions: prototype, screenshots, component preview, or validation steps as appropriate.
- Include implementation notes that preserve existing codebase conventions and design system boundaries.
- Include validation summary: viewports, states, console/browser checks, keyboard, contrast, and remaining risks.
- Keep final output concise and useful. Do not dump the internal gate transcript.

## Theory Applied

Use these principle cards when relevant:

- User Goal First
- State Completeness
- Accessibility Baseline
- Honest Content and Assets

Use `references/templates/design-state.md` and `references/templates/gate-report.md` for consistency. Use deeper references only to quote a critical rationale.

## Pass Criteria

Return `pass` when the handoff can be delivered without the implementer making hidden design decisions.

Return `needs-user-input` when a final approval choice is required and cannot be resolved by the passed Design State.

Return `fail` when any required prior gate is missing, failed, or contradicted by the handoff content.

## Output

Use exactly:

```md
Gate: Handoff
Status: pass | fail | needs-user-input
Design State Patch:
Evidence:
Theory Applied:
Blocking Issues:
Required Revisions:
Next Gate: Done
```
