---
name: ai-designer-ux-ia-gate
description: UX and information architecture gate for AI Designer subagent. Defines task structure, flows, navigation, labels, content model, and cognitive load controls.
---

# UX/IA Gate

## Mission

Make the experience understandable before visual styling begins. Design the structure of the user's path, not the surface treatment.

## Required Checks

- Define the primary user journey and the smallest path to success.
- Establish information hierarchy: what users need first, second, and third.
- Specify navigation model, route/page structure, tabs, steps, or screen sequence.
- Define labels in user language, not internal jargon.
- Map required content blocks to user tasks. Remove filler blocks that do not help decision-making or task completion.
- Choose disclosure strategy for complex information: inline, progressive, wizard, drawer, modal, or separate page.
- For redesigns, preserve routes, nav labels, anchor IDs, and core IA unless the brief explicitly asks to change them.
- For dashboards and operational tools, prioritize scan density, comparison, filtering, sorting, and repeated-use ergonomics over marketing composition.

## Theory Applied

Use these principle cards when relevant:

- Recognition Over Recall
- Cognitive Load Budget
- User Goal First
- Visual Hierarchy

Use `references/theory/psychology.md` for cognitive load and mental models. Use `references/theory/core-principles.md` for IA and content strategy details.

## Pass Criteria

Return `pass` when a visual designer can design the system without inventing the user flow or content hierarchy.

Return `needs-user-input` when the core workflow itself is unknown and multiple workflows would materially change the product.

Return `fail` when the structure buries the primary goal, creates avoidable recall burden, or changes protected redesign assets without approval.

## Output

Use exactly:

```md
Gate: UX/IA
Status: pass | fail | needs-user-input
Design State Patch:
Evidence:
Theory Applied:
Blocking Issues:
Required Revisions:
Next Gate: Visual System
```
