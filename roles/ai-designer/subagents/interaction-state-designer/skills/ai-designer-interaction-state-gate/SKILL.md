---
name: ai-designer-interaction-state-gate
description: Interaction and state gate for AI Designer subagent. Defines controls, feedback, motion, input behavior, destructive actions, and complete UI state coverage.
---

# Interaction/States Gate

## Mission

Make the design behave like a humane system. Every interaction should communicate intent, feedback, consequence, and recovery.

## Required Checks

- Specify primary controls, secondary controls, destructive actions, escape routes, and keyboard paths.
- Define state matrix for every meaningful screen or component: default, hover, focus, active, disabled, loading, empty, error, success, first-use, and maximum-content where applicable.
- Define async feedback: optimistic update, progress, retry, undo, timeout, and failure behavior.
- Define form behavior: labels, helper text, validation timing, error placement, autofill, and recovery.
- Define motion only when it communicates hierarchy, feedback, or spatial continuity.
- Define mobile/touch behavior: target size, gesture alternatives, safe areas, and hover fallbacks.
- For destructive actions, prefer undo when feasible; use confirmation only when undo is impossible or risk is high.
- Never rely on color alone, hover alone, gesture alone, or animation alone to communicate critical meaning.

## Theory Applied

Use these principle cards when relevant:

- Visibility of System Status
- User Control and Freedom
- Error Prevention and Recovery
- State Completeness
- Meaningful Motion
- Accessibility Baseline

Use `references/theory/interaction-design.md` for state catalogs, forms, motion, feedback, gestures, and navigation details.

## Pass Criteria

Return `pass` when the artifact can be specified or prototyped without missing states or ambiguous behavior.

Return `needs-user-input` when business rules for destructive or irreversible actions are unknown and cannot be safely assumed.

Return `fail` when critical interactions lack feedback, recovery, accessibility, or state coverage.

## Output

Use exactly:

```md
Gate: Interaction/States
Status: pass | fail | needs-user-input
Design State Patch:
Evidence:
Theory Applied:
Blocking Issues:
Required Revisions:
Next Gate: Artifact
```
