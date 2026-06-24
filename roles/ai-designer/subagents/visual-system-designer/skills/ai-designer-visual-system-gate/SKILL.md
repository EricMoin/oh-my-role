---
name: ai-designer-visual-system-gate
description: Visual System gate for AI Designer subagent. Establishes design direction, density, typography, color, spacing, layout, surfaces, and component language.
---

# Visual System Gate

## Mission

Translate the approved context and UX structure into a coherent visual system. Visual decisions must be deliberate, reusable, accessible, and connected to the product's audience.

## Required Checks

- State the design read: product type, audience, tone, density, and visual family.
- Set direction dials: `DESIGN_VARIANCE`, `MOTION_INTENSITY`, and `VISUAL_DENSITY`, with one-sentence rationale.
- If the brief is vague and no strong context exists, propose three differentiated visual directions rather than one safe default.
- Define typography roles, not just font names: display, body, labels, numbers, code, and fallback.
- Define color roles: surface, text, primary action, secondary action, semantic states, focus, borders, and data categories if needed.
- Define spacing, radius, shadow/elevation, icon, imagery, and responsive layout rules.
- Prefer existing project tokens and brand assets. Use default design system references only to fill gaps.
- Ensure visual hierarchy answers: what is seen first, second, and third.
- Avoid one-note palettes, generic AI-purple styling, and arbitrary token changes.

## Theory Applied

Use these principle cards when relevant:

- Visual Hierarchy
- Accessibility Baseline
- Honest Content and Assets
- Cognitive Load Budget

Use `references/theory/visual-design.md` for hierarchy, typography, color, grid, and whitespace. Use `references/theory/default-design-system.md` for fallback tokens only when no project system exists.

## Pass Criteria

Return `pass` when interaction and artifact specialists can use the system without inventing new tokens or visual language.

Return `needs-user-input` when a brand direction conflict cannot be resolved from evidence.

Return `fail` when visual polish conflicts with accessibility, brand truth, hierarchy, or task clarity.

## Output

Use exactly:

```md
Gate: Visual System
Status: pass | fail | needs-user-input
Design State Patch:
Evidence:
Theory Applied:
Blocking Issues:
Required Revisions:
Next Gate: Interaction/States
```
