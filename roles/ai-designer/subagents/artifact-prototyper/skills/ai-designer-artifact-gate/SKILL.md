---
name: ai-designer-artifact-gate
description: Artifact gate for AI Designer subagent. Converts approved design decisions into visible artifact requirements, prototype plan, and implementation-facing spec structure.
---

# Artifact Gate

## Mission

Make the design visible, inspectable, and implementable. The artifact may be a design specification, HTML prototype, component state preview, flow map, screenshot checklist, or a combination required by the task.

## Required Checks

- Select the right artifact type for the task: design spec, clickable prototype, HTML mockup, component state preview, flow diagram, critique report, or implementation brief.
- For UI build or redesign work, require a visible artifact or at least explicit prototype/screenshot requirements. Do not rely on prose alone when visual quality matters.
- Include all screens, modules, states, and breakpoints required by earlier gates.
- Define content source and placeholder policy. Mark placeholders honestly and never present fake proof as real.
- Define validation steps: viewports, console check, keyboard path, contrast check, state review, and screenshot inspection where applicable.
- Define handoff structure: overview, user flow, IA, visual system, component behavior, state matrix, accessibility notes, assets, and open risks.
- Keep the artifact aligned with existing implementation boundaries and component ownership.

## Theory Applied

Use these principle cards when relevant:

- State Completeness
- Honest Content and Assets
- Accessibility Baseline
- Visual Hierarchy

Use `references/templates/design-state.md` and `references/templates/gate-report.md` for structure. Use original theory references only when artifact format needs deeper detail.

## Pass Criteria

Return `pass` when reviewers can inspect a concrete artifact or artifact plan against all prior gate decisions.

Return `needs-user-input` when the required deliverable format is genuinely ambiguous and would create different work products.

Return `fail` when the artifact omits required states, visible validation, or implementation-critical details.

## Output

Use exactly:

```md
Gate: Artifact
Status: pass | fail | needs-user-input
Design State Patch:
Evidence:
Theory Applied:
Blocking Issues:
Required Revisions:
Next Gate: Human Factors Review
```
