---
name: ai-designer-anti-slop-gate
description: Anti-Slop Review gate for AI Designer subagent. Detects generic AI design tells, fake proof, template structure, default styling, and brand dilution.
---

# Anti-Slop Review Gate

## Mission

Catch output that looks generated, generic, or unearned. The goal is not loud novelty. The goal is an intentional design that fits the context and protects brand/user trust.

## Required Checks

- P0 AI tells: purple/blue gradient default, generic centered SaaS hero, three equal feature cards, default Inter/Roboto/system-only brand typography, untouched component-library defaults.
- Fake proof: invented metrics, logos, testimonials, screenshots, user names, fake dashboards, fake system stats, or placeholder data presented as real.
- Structural sameness: hero plus logo wall plus three cards plus testimonials plus FAQ without content-specific reason.
- Decorative excess: glassmorphism, glowing orbs, bokeh, gradient text, icon tiles, scroll cues, or motion with no job.
- Token soup: identical spacing everywhere, arbitrary token changes, rogue colors, inconsistent radius/elevation.
- Brand dilution: design could belong to any product; real assets ignored; product imagery replaced by generic abstractions.
- Copy slop: vague phrases, buzzwords, over-explanation, internal jargon, empty value propositions.
- Second-order defaults: replacing one cliche with another safe cliche unrelated to the brief.

## Theory Applied

Use these principle cards when relevant:

- Honest Content and Assets
- Visual Hierarchy
- User Goal First
- Meaningful Motion

Use `references/catalogs/anti-patterns.md` for the full anti-pattern catalog. Use `references/theory/visual-design.md` when a visual fix needs principled grounding.

## Pass Criteria

Return `pass` when no P0 tell remains and any remaining style choices are justified by context.

Return `needs-user-input` only when the user's taste preference is the deciding factor between two valid, context-grounded directions.

Return `fail` if the artifact relies on fake content, generic AI structure, brandless visuals, or unexamined default styling.

## Output

Use exactly:

```md
Gate: Anti-Slop Review
Status: pass | fail | needs-user-input
Design State Patch:
Evidence:
Theory Applied:
Blocking Issues:
Required Revisions:
Next Gate: Handoff
```
